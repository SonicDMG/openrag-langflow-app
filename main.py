"""
This script is used to test the Langflow API.
"""
import os
from openai import OpenAI
from dotenv import load_dotenv
from rich.console import Console
from rich.markdown import Markdown
from rich.live import Live
from rich.panel import Panel
from utils import make_links_clickable

load_dotenv()

LANGFLOW_SERVER_URL = os.getenv("LANGFLOW_SERVER_URL")
LANGFLOW_API_KEY = os.getenv("LANGFLOW_API_KEY")


def process_question(client, model_id, user_input, console, previous_response_id=None):
    """
    Process a single question and stream the response.
    
    Args:
        client: OpenAI client configured for Langflow
        model_id: The Langflow model/flow ID
        user_input: The user's question
        console: Rich console for output
        previous_response_id: Optional response ID from previous message to continue conversation
        
    Returns:
        str: The response ID from this request, or None if not available
    """
    # Build request parameters
    request_params = {
        "model": model_id,
        "input": user_input,
        "stream": True,
    }

    # Add previous_response_id if provided
    if previous_response_id:
        request_params["extra_body"] = {"previous_response_id": previous_response_id}

    # Send request and iterate the streaming response
    stream = client.responses.create(**request_params)

    accumulated = ""
    response_id = None

    # Use Live to render markdown as it streams
    with Live(Markdown(""), console=console, refresh_per_second=10) as live:
        for chunk in stream:
            # Extract response ID from chunk (top-level id field)
            if response_id is None:
                response_id = getattr(chunk, "id", None)

            # chunk is something like { "delta": { "content": "..." }, ... }
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
                # Convert markdown links to clickable Rich links, then render markdown
                clickable_markdown = make_links_clickable(accumulated)
                live.update(Markdown(clickable_markdown))

            if getattr(chunk, "status", None) == "completed":
                # Ensure we have the response ID from completed chunk
                if response_id is None:
                    response_id = getattr(chunk, "id", None)
                break

    # Print a blank line after response for readability
    console.print()

    return response_id


def main():
    """ 
    Run a chat session that allows multiple questions in a single session.
    """
    console = Console()

    # Initialize the OpenAI client
    client = OpenAI(
        base_url=f"{LANGFLOW_SERVER_URL}/api/v1/",
        default_headers={"x-api-key": LANGFLOW_API_KEY},
        api_key="dummy-api-key" # Required by OpenAI SDK but not used by Langflow
    )

    model_id = "b513f6bb-7c10-485e-8edf-ed0fe373a632"

    # Track the previous response ID to maintain conversation continuity
    previous_response_id = None

    # Display welcome message
    console.print(Panel.fit(
        "[bold green]Chat Session Started[/bold green]\n\n"
        "[dim]Type 'exit', 'quit', or 'q' to end the session[/dim]",
        title="OpenRAG Langflow Chat",
        border_style="green"
    ))
    console.print()

    # Main chat loop
    while True:
        try:
            # Get user input
            user_input = input("You: ").strip()

            # Check for exit commands
            if user_input.lower() in ['exit', 'quit', 'q']:
                console.print("\n[dim]Ending chat session. Goodbye![/dim]")
                break

            # Skip empty inputs
            if not user_input:
                continue

            # Process the question and get the response ID for the next request
            response_id = process_question(
                client, model_id, user_input, console, previous_response_id
            )

            # Update previous_response_id for the next message
            if response_id:
                previous_response_id = response_id

        except KeyboardInterrupt:
            console.print("\n\n[dim]Session interrupted. Goodbye![/dim]")
            break
        except (ConnectionError, TimeoutError) as e:
            console.print(f"\n[bold red]Connection Error:[/bold red] {str(e)}\n")
            console.print("[dim]Please check your connection and try again.[/dim]\n")
        except Exception as e:  # noqa: BLE001
            # Catch-all for unexpected errors to keep the chat session alive
            console.print(f"\n[bold red]Error:[/bold red] {str(e)}\n")
            console.print("[dim]Please try again or type 'exit' to quit.[/dim]\n")


if __name__ == "__main__":
    main()
