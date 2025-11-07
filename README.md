# OpenRAG Langflow Application

A monorepo containing both a Python CLI chat interface and a Next.js TypeScript web application for interacting with Langflow flows using the OpenAI Responses API.

## Project Structure

This is a monorepo with two main components:

```
openrag-langflow-app/
├── python/              # Python CLI chat application
│   ├── main.py          # CLI entrypoint for the chat app
│   ├── utils.py         # Helpers for streaming, formatting, and conversation tracking
│   ├── pyproject.toml   # Python project metadata and dependencies
│   └── uv.lock          # uv's lockfile
├── typescript/          # Next.js TypeScript web application
│   ├── app/             # Next.js app directory
│   ├── package.json     # Node.js dependencies
│   └── ...              # Next.js configuration files
└── README.md            # This file
```

## Python CLI Application

A lightweight terminal chat interface for interacting with Langflow flows using the OpenAI Python SDK as the client transport. It supports live streaming of model output, rich Markdown rendering (including clickable links) via the Rich library, and maintains conversation continuity across turns.

### Features

- **Streaming responses**: see tokens as they arrive for a responsive chat experience
- **Rich Markdown output**: headings, code blocks, and clickable links via the Rich library (on supported terminals)
- **Conversation continuity**: preserves conversation context across turns
- **Simple setup**: point the app at your Langflow server and provide an API key

### Prerequisites

- Python 3.13 or newer
- A running Langflow server you can reach from this machine
- A Langflow API key with access to your flow(s)

### Installation

Navigate to the `python/` directory:

```bash
cd python
```

You can use uv (recommended) or pip.

#### Using uv

Ensure uv is installed (see https://docs.astral.sh/uv/). From the `python/` directory:

```bash
uv sync
```

This will create a virtual environment and install dependencies from `pyproject.toml` (and `uv.lock` if present).

#### Using pip

Create and activate a virtual environment:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -e .
```

### Configuration

Set the following environment variables. You can place them in a `.env` file in the `python/` directory (note: `.env` is git-ignored):

```
LANGFLOW_SERVER_URL=http://localhost:7860
LANGFLOW_API_KEY=your_langflow_api_key
```

- `LANGFLOW_SERVER_URL`: Base URL of your Langflow server
- `LANGFLOW_API_KEY`: Your Langflow API token

### Usage

From the `python/` directory:

Using uv:
```bash
uv run python main.py
```

Using Python directly:
```bash
python main.py
```

Type your prompt and press Enter. Type `exit`, `quit`, or `q` to end the session, or use Ctrl+C to exit.

## TypeScript Web Application

A Next.js TypeScript web application for interacting with Langflow flows. (Documentation to be added as the application is developed.)

### Installation

Navigate to the `typescript/` directory:

```bash
cd typescript
```

Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

Build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Running Production Build

Start the production server:

```bash
npm start
```

This starts the Next.js production server. Note: You must run `npm run build` first before starting the production server.

The start script will automatically detect if port 3000 is already in use and will use the next available port (3001, 3002, etc.) instead. The script will display which port it's using when it starts.

## Notes

- Clickable links in the terminal depend on terminal support (iTerm2, Windows Terminal, etc.)
- An OpenAI API key is not required unless your Langflow flow itself calls OpenAI models
- Keep your `.env` files private and never commit them
