"""
History Manager
Stores and retrieves past detection results using a JSON file.
"""

import json
import os
import time
from pathlib import Path
from typing import List, Optional, Dict, Any


class HistoryManager:
    """Manages prediction history with JSON-based persistence."""

    def __init__(self, history_file: str = "history.json"):
        self.history_file = Path(history_file)
        self._records: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        """Load history from disk."""
        if self.history_file.exists():
            try:
                with open(self.history_file, "r") as f:
                    self._records = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._records = []
        else:
            self._records = []

    def _save(self):
        """Persist history to disk."""
        try:
            with open(self.history_file, "w") as f:
                json.dump(self._records, f, indent=2)
        except IOError as e:
            print(f"[HistoryManager] Could not save history: {e}")

    def add(self, result: Dict[str, Any]) -> None:
        """Add a new detection result."""
        self._records.insert(0, result)
        
        # Keep only last 500 records
        if len(self._records) > 500:
            self._records = self._records[:500]
        
        self._save()

    def get_all(self) -> List[Dict[str, Any]]:
        """Return all records, newest first."""
        return self._records.copy()

    def get_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Find a specific record by ID."""
        for record in self._records:
            if record.get("id") == record_id:
                return record
        return None

    def delete(self, record_id: str) -> bool:
        """Delete a record by ID."""
        original_len = len(self._records)
        self._records = [r for r in self._records if r.get("id") != record_id]
        
        if len(self._records) < original_len:
            self._save()
            return True
        return False

    def clear(self) -> None:
        """Clear all records."""
        self._records = []
        self._save()

    def get_stats(self) -> Dict[str, Any]:
        """Return summary statistics."""
        total = len(self._records)
        if total == 0:
            return {"total": 0, "deepfakes": 0, "real": 0, "avg_confidence": 0}
        
        deepfakes = sum(1 for r in self._records if r.get("prediction") == "Deepfake")
        avg_conf = sum(r.get("confidence", 0) for r in self._records) / total
        
        return {
            "total": total,
            "deepfakes": deepfakes,
            "real": total - deepfakes,
            "avg_confidence": round(avg_conf, 4)
        }
