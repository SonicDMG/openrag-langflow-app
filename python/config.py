"""
Centralized configuration management for OpenRAG application.

This module provides a single source of truth for all configuration values,
loading them from environment variables with validation and sensible defaults.

Usage:
    from config import config
    
    # Access configuration values
    api_key = config.OPENRAG_API_KEY
    url = config.OPENRAG_URL
    
    # Validate configuration (optional, done automatically on import)
    config.validate()
"""
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv


class Config:
    """
    Application configuration loaded from environment variables.
    
    This class centralizes all configuration management, providing:
    - Automatic .env file loading from project root
    - Type-safe access to configuration values
    - Validation of required settings
    - Sensible defaults for optional settings
    """
    
    def __init__(self):
        """Initialize configuration by loading environment variables."""
        # Load .env from project root (parent of python directory)
        env_path = Path(__file__).parent.parent / '.env'
        if env_path.exists():
            load_dotenv(env_path)
        else:
            # Fallback: try loading from current directory
            load_dotenv()
    
    # OpenRAG Configuration
    @property
    def OPENRAG_URL(self) -> str:
        """OpenRAG API base URL. Defaults to localhost:3000."""
        return os.getenv('OPENRAG_URL', 'http://localhost:3000')
    
    @property
    def OPENRAG_API_KEY(self) -> Optional[str]:
        """OpenRAG API key. Required for API access."""
        return os.getenv('OPENRAG_API_KEY')
    
    # EverArt Configuration
    @property
    def EVERART_API_KEY(self) -> Optional[str]:
        """EverArt API key for image generation (optional)."""
        return os.getenv('EVERART_API_KEY')
    
    # Astra DB Configuration
    @property
    def ASTRA_DB_ENDPOINT(self) -> Optional[str]:
        """Astra DB endpoint URL (optional)."""
        return os.getenv('ASTRA_DB_ENDPOINT')
    
    @property
    def ASTRA_DB_APPLICATION_TOKEN(self) -> Optional[str]:
        """Astra DB application token (optional)."""
        return os.getenv('ASTRA_DB_APPLICATION_TOKEN')
    
    def validate(self, require_api_key: bool = False) -> None:
        """
        Validate that required configuration is present.
        
        Args:
            require_api_key: If True, raises error if OPENRAG_API_KEY is not set.
                           If False, allows missing API key (will be created on first use).
        
        Raises:
            ValueError: If required configuration is missing or invalid.
        """
        if not self.OPENRAG_URL:
            raise ValueError("OPENRAG_URL must be set in environment or .env file")
        
        if require_api_key and not self.OPENRAG_API_KEY:
            raise ValueError(
                "OPENRAG_API_KEY must be set in environment or .env file. "
                "Run the application once to auto-generate an API key."
            )
    
    def get_env_path(self) -> Path:
        """
        Get the path to the .env file.
        
        Returns:
            Path: Path to the .env file in the project root.
        """
        return Path(__file__).parent.parent / '.env'
    
    def __repr__(self) -> str:
        """Return a string representation of the configuration (hiding sensitive values)."""
        return (
            f"Config(\n"
            f"  OPENRAG_URL={self.OPENRAG_URL},\n"
            f"  OPENRAG_API_KEY={'***' if self.OPENRAG_API_KEY else 'NOT SET'},\n"
            f"  EVERART_API_KEY={'***' if self.EVERART_API_KEY else 'NOT SET'},\n"
            f"  ASTRA_DB_ENDPOINT={'***' if self.ASTRA_DB_ENDPOINT else 'NOT SET'},\n"
            f"  ASTRA_DB_APPLICATION_TOKEN={'***' if self.ASTRA_DB_APPLICATION_TOKEN else 'NOT SET'}\n"
            f")"
        )


# Create singleton instance
config = Config()

# Validate on import (but don't require API key - it can be auto-generated)
config.validate(require_api_key=False)


# Made with Bob