"""
Utility functions for the OpenRAG app.

This module contains helper functions for UI rendering, formatting, and chat loop management.
The main.py file focuses on the core OpenRAG SDK integration.
"""
import re

from openrag_sdk import OpenRAGClient
from rich.console import Console
from rich.live import Live
from rich.markdown import Markdown
from rich.panel import Panel
from rich.spinner import Spinner


def render_streaming_response(accumulated_text: str):
    """
    Render streaming response text with Rich formatting and markdown.
    
    This handles the UI presentation layer - formatting, markdown rendering,
    and clickable links. The actual streaming happens in main.py.
    
    Args:
        accumulated_text: The accumulated text to render
        
    Returns:
        Markdown: Rich Markdown object for rendering
    """
    # Apply formatting and render as markdown
    styled_text = highlight_search_fields(accumulated_text)
    clickable_markdown = make_links_clickable(styled_text)
    return Markdown(clickable_markdown)


async def run_chat_session(client: OpenRAGClient, stream_func, render_func):
    """
    Run an interactive chat session with OpenRAG.
    
    Handles user input, conversation state, error handling, and UI presentation.
    
    Args:
        client: OpenRAG client instance
        stream_func: Async function to call for streaming responses (stream_response from main.py)
        render_func: Function to render the accumulated text (render_streaming_response)
    """
    console = Console()
    chat_id = None

    # Display welcome message
    console.print(Panel.fit(
        "[bold green]Chat Session Started[/bold green]\n\n"
        "[dim]Type 'exit', 'quit', or 'q' to end the session[/dim]",
        title="OpenRAG Chat",
        border_style="green"
    ))
    console.print()

    # Main chat loop
    while True:
        try:
            # Get user input
            user_input = console.input("[bold cyan]You:[/bold cyan] ").strip()
            console.print()

            # Check for exit commands
            if user_input.lower() in ['exit', 'quit', 'q']:
                console.print("\n[dim]Ending chat session. Goodbye![/dim]")
                break

            # Skip empty inputs
            if not user_input:
                continue

            # Set up real-time streaming rendering
            spinner = Spinner("dots", text="[dim]RAGging...[/dim]")

            # Use Live to render markdown as it streams
            with Live(Markdown(""), console=console, refresh_per_second=10) as live:
                live.update(spinner)

                # Callback function to update the live display as chunks arrive
                def on_chunk(accumulated_text):
                    rendered = render_func(accumulated_text)
                    live.update(rendered)

                # Stream the response using the OpenRAG SDK
                chat_id, _ = await stream_func(
                    client, user_input, chat_id, on_chunk
                )

            console.print()  # Blank line for readability

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


def make_links_clickable(markdown_text: str) -> str:
    """
    Convert markdown links [text](url) to Rich clickable link markup.
    This preserves all other markdown formatting while making links clickable.
    """
    link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'

    def replace_link(match):
        text = match.group(1)
        url = match.group(2)
        return f'[link={url}]{text}[/link]'

    return re.sub(link_pattern, replace_link, markdown_text)


def highlight_search_fields(text: str) -> str:
    """
    Find JSON fields like search_query, search_mode, etc. and wrap their values 
    in Rich markup to make them stand out.
    """
    field_pattern = r'(?:,\s*)?\{[^}]*"(input_value|search_query|search_mode|search_[^"]+|query)"[^}]*\}'

    def replace_field(match):
        full_match = match.group(0)
        json_obj = full_match.lstrip(', ')
        return f'```json\n{json_obj}\n```\n\n'

    return re.sub(field_pattern, replace_field, text)

# Made with Bob
