## Deploy LiveKit Server

Install LiveKit Server

```sh
brew update && brew install livekit
```

You can start LiveKit in development mode by running:

```sh
livekit-server --dev
```

This will start an instance using the following API key/secret pair:

```sh
API key: devkey
API secret: secret
```

To customize your setup for production, refer to our deployment guides.


` Tip
` By default LiveKit's signal server binds to 127.0.0.1:7880. If you'd like to access it from other devices on your network, pass in --bind 0.0.0.0

## Deploy LiveKit Agent

Install dependencies and start livekit agent:

```sh
cd <agent_dir>

python3 -m venv .venv --copies
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

Set up the environment by copying `.env.example` to `.env.local` and filling in the required values:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

- `OPENAI_MODEL`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_VERSION`
- `AZURE_OPENAI_API_KEY`
`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `AZURE_STT_HOST`
- `AZURE_TTS_HOST`

` Tip
` You can edit the `agent.py` file to customize the system prompt and other aspects of your agent.


Start livekit agent:

```sh
python3 agent.py dev
```

## Deploy LiveKit Fronend

Install dependencies and start your frontend application:

```sh
cd <frontend_dir>

pnpm install
pnpm dev
```

Launch your app and talk to your agent

1. Visit your locally-running application (by default, http://localhost:3000).

2. Select Connect and start a conversation with your agent.