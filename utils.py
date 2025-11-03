"""
This module contains utility functions for the OpenRAG Langflow app.
"""
import re

def make_links_clickable(markdown_text: str) -> str:
    """
    Convert markdown links [text](url) to Rich clickable link markup.
    This preserves all other markdown formatting while making links clickable.
    """
    # Pattern to match markdown links: [text](url)
    link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'

    def replace_link(match):
        text = match.group(1)
        url = match.group(2)
        # Convert to Rich link markup format
        return f'[link={url}]{text}[/link]'

    return re.sub(link_pattern, replace_link, markdown_text)
