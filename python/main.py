"""
OpenRAG Langflow App - OpenAI Responses API Integration

This module demonstrates the core usage of the OpenAI Responses API to connect
to Langflow and stream responses. The Responses API is the primary mechanism
for communicating with Langflow flows.
"""
import os
from openai import OpenAI
from dotenv import load_dotenv
from utils import (
    render_streaming_response,
    run_chat_session
)

# Load environment variables for Langflow configuration
load_dotenv()

# Langflow configuration - part of the OpenAI Responses API setup
LANGFLOW_SERVER_URL = os.getenv("LANGFLOW_SERVER_URL")
LANGFLOW_API_KEY = os.getenv("LANGFLOW_API_KEY")
MODEL_ID = "1098eea1-6649-4e1d-aed1-b77249fb8dd0"


def stream_response(client: OpenAI, model_id: str, user_input: str,
                   previous_response_id: str | None = None, on_chunk=None):
    """
    Stream a response from Langflow using the OpenAI Responses API.
    
    This is the core Responses API usage:
    - client.responses.create() with streaming enabled
    - Iterating through response chunks
    - Extracting response IDs for conversation continuity
    
    Args:
        client: OpenAI client configured for Langflow
        model_id: The Langflow model/flow ID
        user_input: The user's question
        previous_response_id: Optional response ID from previous message to continue conversation
        on_chunk: Optional callback function(text) called for each chunk of text
        
    Returns:
        tuple: (response_id, accumulated_text)
    """
    # Build request parameters for the Responses API
    request_params = {
        "model": model_id,
        "input": user_input,
        "stream": True,
    }

    # Add previous_response_id if provided (for conversation continuity)
    if previous_response_id:
        request_params["extra_body"] = {"previous_response_id": previous_response_id}

    # Use the OpenAI Responses API to stream the response
    stream = client.responses.create(**request_params)

    accumulated = ""
    response_id = None

    # Process the streaming response chunks
    for chunk in stream:
        # Extract response ID from chunk (for conversation continuity)
        if response_id is None:
            response_id = getattr(chunk, "id", None)

        # Extract content delta from chunk
        delta = getattr(chunk, "delta", None)
        if delta is None:
            continue

        # Handle both dict and string formats
        if isinstance(delta, dict):
            text = delta.get("content", "")
        elif isinstance(delta, str):
            text = delta
        else:
            text = ""

        if text:
            accumulated += text
            # Call the callback if provided (for real-time rendering)
            if on_chunk:
                on_chunk(accumulated)

        # Check for completion status
        if getattr(chunk, "status", None) == "completed":
            if response_id is None:
                response_id = getattr(chunk, "id", None)
            break

    return response_id, accumulated


def main():
    """
    Main entry point demonstrating the OpenAI Responses API integration with Langflow.
    
    This showcases the core connection pattern:
    1. Configure Langflow server URL, API key, and model ID
    2. Initialize OpenAI client configured for Langflow
    3. Use client.responses.create() to stream responses
    4. Handle conversation continuity via response IDs
    """
    # Initialize the OpenAI client for Langflow
    client = OpenAI(
        base_url=f"{LANGFLOW_SERVER_URL}/api/v1/",
        default_headers={"x-api-key": LANGFLOW_API_KEY},
        api_key="dummy-api-key"  # Required by OpenAI SDK but not used by Langflow
    )

    # Run the interactive chat session
    run_chat_session(client, MODEL_ID, stream_response, render_streaming_response)


if __name__ == "__main__":
    main()
