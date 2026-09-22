"""
SmartSense IoT - Custom Console Logger
Provides clean, timestamped console logs matching the required project specification.
"""

import sys
import logging
from datetime import datetime


class TimestampFormatter(logging.Formatter):
    """Custom logging formatter that produces [HH:MM:SS] format."""

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")
        prefix = f"[{timestamp}]"
        if record.levelno >= logging.ERROR:
            return f"{prefix} [ERROR] {record.getMessage()}"
        elif record.levelno >= logging.WARNING:
            return f"{prefix} [WARN]  {record.getMessage()}"
        return f"{prefix} {record.getMessage()}"


def setup_logger(name: str = "smartsense-pi", level: int = logging.INFO) -> logging.Logger:
    """Configures and returns the central logger instance."""
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid duplicate handlers if already configured
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(TimestampFormatter())
        logger.addHandler(handler)

    return logger


# Pre-configured default logger instance
logger = setup_logger()
