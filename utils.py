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


def highlight_search_fields(text: str) -> str:
    """
    Find JSON fields like search_query, search_mode, etc. and wrap their values 
    in Rich markup to make them stand out.
    """

    # Match entire JSON object that contains one of our target fields
    # Handles both single-field and multi-field objects
    field_pattern = r'(?:,\s*)?\{[^}]*"(search_query|search_mode|search_[^"]+|query)"[^}]*\}'

    def replace_field(match):
        # Extract the entire matched JSON object
        full_match = match.group(0)
        # Remove leading comma and whitespace if present
        json_obj = full_match.lstrip(', ')

        # Wrap the entire JSON object in a markdown code block
        return f'```json\n{json_obj}\n```\n\n'

    return re.sub(field_pattern, replace_field, text)
