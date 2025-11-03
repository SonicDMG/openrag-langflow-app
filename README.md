# OpenRAG Langflow Chat Application

A lightweight terminal chat interface for interacting with Langflow flows using the OpenAI Python SDK as the client transport. It supports live streaming of model output, rich Markdown rendering (including clickable links) via the Rich library, and maintains conversation continuity across turns.

## Overview

This app connects to a running Langflow server and forwards your prompts to a configured flow. Responses are streamed back token-by-token and rendered in the terminal with Markdown styling. The app tracks conversation state so you can continue a dialogue over multiple turns without losing context.

## Key Features

- **Streaming responses**: see tokens as they arrive for a responsive chat experience
- **Rich Markdown output**: headings, code blocks, and clickable links via the Rich library (on supported terminals)
- **Conversation continuity**: preserves conversation context across turns
- **Simple setup**: point the app at your Langflow server and provide an API key

## Prerequisites

- Python 3.13 or newer
- A running Langflow server you can reach from this machine
- A Langflow API key with access to your flow(s)

## Installation

You can use uv (recommended) or pip.

### Using uv

Ensure uv is installed (see https://docs.astral.sh/uv/). From the project root:

```bash
uv sync
```

This will create a virtual environment and install dependencies from `pyproject.toml` (and `uv.lock` if present).

### Using pip

Create and activate a virtual environment:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -e .
```

## Configuration

Set the following environment variables. You can place them in a `.env` file in the project root (note: `.env` is git-ignored):

```
LANGFLOW_SERVER_URL=http://localhost:7860
LANGFLOW_API_KEY=your_langflow_api_key
```

- `LANGFLOW_SERVER_URL`: Base URL of your Langflow server
- `LANGFLOW_API_KEY`: Your Langflow API token

## Usage

Activate your environment (if not already active), ensure variables are set or `.env` exists.

Using uv:

```bash
uv run python main.py
```

Using Python directly:

```bash
python main.py
```

Type your prompt and press Enter. Type `exit`, `quit`, or `q` to end the session, or use Ctrl+C to exit.

## Project Structure

```
openrag-langflow-app/
├─ main.py             # CLI entrypoint for the chat app
├─ utils.py            # Helpers for streaming, formatting, and conversation tracking
├─ pyproject.toml      # Project metadata and dependencies
├─ uv.lock             # uv's lockfile (if present)
├─ .python-version     # Pinned Python version (if present)
├─ .gitignore          # Ensures .env and other files are not committed
├─ README.md           # This documentation
└─ .env                # Environment variables (not committed)
```

## Notes

- Clickable links in the terminal depend on terminal support (iTerm2, Windows Terminal, etc.)
- An OpenAI API key is not required unless your Langflow flow itself calls OpenAI models
- Keep your `.env` file private and never commit it