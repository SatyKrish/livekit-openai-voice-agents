import logging
import os

from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    metrics,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import openai, silero, azure, turn_detector


load_dotenv()

logger = logging.getLogger("voice-agent")
logger.setLevel(logging.INFO)

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a voice and text assistant created by LiveKit. "
            "Provide concise, helpful responses. "
            "You can communicate through both voice and text."
        ),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    logger.info(f"starting voice assistant for participant {participant.identity}")

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=azure.STT(
            speech_region=os.getenv("AZURE_SPEECH_REGION"),
            speech_key=os.getenv("AZURE_SPEECH_KEY")
        ),
        # stt=openai.STT.with_azure(
        #     azure_endpoint=os.getenv("AZURE_ENDPOINT"),
        #     azure_deployment=os.getenv("AZURE_STT_DEPLOYMENT"),
        #     api_version=os.getenv("AZURE_API_VERSION"),
        #     api_key=os.getenv("AZURE_API_KEY")
        # ),
        llm=openai.LLM.with_azure(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY")
        ),
        # tts=openai.TTS.with_azure(
        #     azure_endpoint=os.getenv("AZURE_ENDPOINT"),
        #     azure_deployment=os.getenv("AZURE_TTS_DEPLOYMENT"),
        #     api_version=os.getenv("AZURE_API_VERSION"),
        #     api_key=os.getenv("AZURE_API_KEY")
        # ),
        tts=azure.TTS(
            speech_region=os.getenv("AZURE_SPEECH_REGION"),
            speech_key=os.getenv("AZURE_SPEECH_KEY")
        ),
        turn_detector=turn_detector.EOUModel(),
        chat_ctx=initial_ctx,
    )

    @ctx.room.on("data_received")
    def on_data_received(data: bytes, participant):
        async def process_data():
            try:
                text_message = data.decode('utf-8')
                # Update chat context with incoming text
                agent.chat_ctx = agent.chat_ctx.append(
                    role="user", 
                    text=text_message
                )
                
                # Generate LLM response
                response = await agent.chat_ctx.generate()
                
                # Update context with agent's response
                agent.chat_ctx = agent.chat_ctx.append(
                    role="assistant", 
                    text=response
                )
                
                # Publish response back to room
                await ctx.room.local_participant.publish_data(
                    response.encode('utf-8'), 
                    reliability="reliable"
                )
            except Exception as e:
                logger.error(f"Error processing text message: {e}")
        
        import asyncio
        asyncio.create_task(process_data())

    agent.start(ctx.room, participant)
    await agent.say("Hey, how can I help you today?", allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )