import os
import asyncio
import logging

from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    WorkerType,
    cli,
    llm,
    multimodal,
)
from livekit.plugins import openai
import PyPDF2

logger = logging.getLogger("realtime-agent")
logger.setLevel(logging.INFO)

load_dotenv()

# Define the data and cache directory for document processing.
DATA_DIR = "./data"
CACHE_DIR = "./cache"

if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

def get_system_prompt() -> str:
    """
    Extracts text from a PDF document and appends it to the base instructions.
    The resulting prompt is cached locally in 'system_prompt_cache.txt' to avoid reprocessing.
    """
    cache_file = os.path.join(CACHE_DIR, "system_prompt_cache.txt")
    if os.path.exists(cache_file):
        with open(cache_file, "r", encoding="utf-8") as f:
            return f.read()

    # Extract text from the PDF document.
    # Iterate over all PDF files in the data directory
    pdf_texts = []
    if os.path.exists(DATA_DIR) and os.path.isdir(DATA_DIR):
        for filename in os.listdir(DATA_DIR):
            if filename.lower().endswith(".pdf"):
                pdf_file_path = os.path.join(DATA_DIR, filename)
                extracted_text = ""
                try:
                    with open(pdf_file_path, "rb") as f:
                        reader = PyPDF2.PdfReader(f)
                        for page in reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                extracted_text += page_text + "\n"
                    pdf_texts.append(f"--- Begin {filename} ---\n{extracted_text}\n--- End {filename} ---\n")
                except Exception as e:
                    logger.error(f"Error reading {filename}: {e}")
    else:
        pdf_texts.append("No PDF documents found in the data directory.")

    base_instructions = (
        "You are a realtime voice agent powered by Azure OpenAI's realtime API. \n"
        "Your primary focus is to answer questions related to health insurance, using the provided function calls to fetch accurate data. \n"
        "Follow these guidelines:\n"
        "Scope:\n"
        "Answer only questions regarding health insurance.\n"
        "Politely inform users that you can answer only about health insurance if they ask about unrelated or general topics.\n"
        "Politeness & Clarity:\n"
        "Always be polite and courteous.\n"
        "If you do not have a clear or sufficient answer, say “I'm sorry, I don't know” rather than speculating.\n"
        "Function Calls:\n"
        "Use the provided function calls to fetch and relay health insurance details.\n"
        "Ensure the function calls are appropriately integrated into your responses.\n"
        "Restrictions:\n"
        "Do not answer questions on general subjects or topics outside health insurance.\n"
        "If a question falls outside your domain, clearly state: “I can only provide information on health insurance.”\n"
        "Keep your responses clear, precise, and strictly within the defined scope."
    )

    # Combine the base instructions with the extracted PDF text.
    full_prompt = base_instructions + "\n\nAdditional Document Information:\n" + extracted_text

    # Cache the full prompt.
    with open(cache_file, "w", encoding="utf-8") as f:
        f.write(full_prompt)

    return full_prompt

async def entrypoint(ctx: JobContext):
    # Use the cached system prompt that now includes the extracted PDF text.
    instructions = get_system_prompt()

    logger.info(f"connecting to room {ctx.room.name}")
    
    # Connect to the room and wait for a participant.
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()

    # Create a chat context with chat history, these will be synchronized with the server
    # upon session establishment
    chat_ctx = llm.ChatContext()

    # Create a function context. (If you need additional function calls, define them here.)
    fnc_ctx = llm.FunctionContext()

    # Use the Azure OpenAI realtime model with large context support (GPT‑40).
    agent = multimodal.MultimodalAgent(
        model=openai.realtime.RealtimeModel.with_azure(
            azure_endpoint=os.getenv("AZURE_OPENAI_REALTIME_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_deployment="gpt-4o-mini-realtime-preview",
            api_version="2024-10-01-preview",
            voice="alloy",
            temperature=0.8,
            instructions=instructions,
            turn_detection=openai.realtime.ServerVadOptions(
                threshold=0.6, prefix_padding_ms=200, silence_duration_ms=500, create_response=True,
            )
        ),
        fnc_ctx=fnc_ctx,
        chat_ctx=chat_ctx,
    )

    agent.start(ctx.room, participant)
    agent.generate_reply()

    @agent.on("agent_speech_committed")
    @agent.on("agent_speech_interrupted")
    def _on_agent_speech_created(msg: llm.ChatMessage):
        # example of truncating the chat context
        max_ctx_len = 10
        chat_ctx = agent.chat_ctx_copy()
        if len(chat_ctx.messages) > max_ctx_len:
            chat_ctx.messages = chat_ctx.messages[-max_ctx_len:]
            # NOTE: The `set_chat_ctx` function will attempt to synchronize changes made
            # to the local chat context with the server instead of completely replacing it,
            # provided that the message IDs are consistent.
            asyncio.create_task(agent.set_chat_ctx(chat_ctx))


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM))