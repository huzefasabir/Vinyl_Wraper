"""
VinylWrap AI Studio — Backend Structured Logger
================================================
WHERE TO SEE LOGS:
  • Run the FastAPI server: python main.py
  • All output appears in the SAME terminal window.
  • Each line is prefixed with a timestamp + module tag, e.g.:
      [VW:volka   ] 14:32:01.456  JOB abc123 QUEUED   prompt='Kitchen Cabinets'
  • You can tail a log file too — set LOG_FILE=./logs/backend.log in .env

COLOUR CODES (ANSI, works on PowerShell & most terminals):
  INFO  → cyan
  OK    → green
  WARN  → yellow
  ERROR → red
  HF    → magenta  (Hugging Face / Volka specific events)
  POLL  → grey     (polling ticks)
"""

import os
import sys
import time
import logging
from datetime import datetime
from pathlib import Path

# ── ANSI colours ──────────────────────────────────────────────────────────────
_RESET  = "\033[0m"
_CYAN   = "\033[36m"
_GREEN  = "\033[32m"
_YELLOW = "\033[33m"
_RED    = "\033[31m"
_MAGENTA= "\033[35m"
_GREY   = "\033[90m"
_BOLD   = "\033[1m"

_LEVEL_COLORS = {
    "INFO" : _CYAN,
    "OK"   : _GREEN,
    "WARN" : _YELLOW,
    "ERROR": _RED,
    "HF"   : _MAGENTA,
    "POLL" : _GREY,
}

# ── optional file sink ────────────────────────────────────────────────────────
_log_file_path = os.getenv("LOG_FILE", "")
_file_handle = None
if _log_file_path:
    Path(_log_file_path).parent.mkdir(parents=True, exist_ok=True)
    _file_handle = open(_log_file_path, "a", encoding="utf-8")  # noqa: WPS515


def _emit(level: str, module: str, message: str) -> None:
    ts  = datetime.now().strftime("%H:%M:%S.%f")[:12]
    col = _LEVEL_COLORS.get(level, "")
    tag = f"{_BOLD}[VW:{module:<8}]{_RESET}"
    lvl = f"{col}{_BOLD}{level:<5}{_RESET}"
    line = f"{tag} {ts}  {lvl}  {message}"
    print(line, flush=True)
    if _file_handle:
        plain = f"[VW:{module:<8}] {ts}  {level:<5}  {message}\n"
        _file_handle.write(plain)
        _file_handle.flush()


class VWLogger:
    """Thin logger bound to a module name."""

    def __init__(self, module: str):
        self._m = module

    def info (self, msg: str) -> None: _emit("INFO",  self._m, msg)
    def ok   (self, msg: str) -> None: _emit("OK",    self._m, msg)
    def warn (self, msg: str) -> None: _emit("WARN",  self._m, msg)
    def error(self, msg: str) -> None: _emit("ERROR", self._m, msg)
    def hf   (self, msg: str) -> None: _emit("HF",    self._m, msg)
    def poll (self, msg: str) -> None: _emit("POLL",  self._m, msg)


def get_logger(module: str) -> VWLogger:
    return VWLogger(module)
