"""SQLite state store for persisting NIRIKSHAK AI analyses, feedback, and outcomes."""
from __future__ import annotations
import sqlite3
import json
import threading
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

class StateStore:
    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=30.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            conn.execute("PRAGMA journal_mode = WAL")
        except Exception:
            pass
        return conn

    def _init_db(self) -> None:
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS analyses (
                        analysis_id TEXT PRIMARY KEY,
                        project_id TEXT,
                        timestamp TEXT NOT NULL,
                        model_version TEXT NOT NULL,
                        snapshot_json TEXT NOT NULL,
                        historical_result_json TEXT NOT NULL,
                        drift_result_json TEXT NOT NULL,
                        actions_json TEXT NOT NULL,
                        llm_json TEXT NOT NULL
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS feedback (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        analysis_id TEXT NOT NULL,
                        action TEXT NOT NULL DEFAULT 'MONITOR_ONLY',
                        feedback TEXT NOT NULL,
                        note TEXT,
                        timestamp TEXT NOT NULL,
                        FOREIGN KEY (analysis_id) REFERENCES analyses(analysis_id)
                    )
                """)
                # Handle schema migration if action was missing
                try:
                    cursor.execute("ALTER TABLE feedback ADD COLUMN action TEXT NOT NULL DEFAULT 'MONITOR_ONLY'")
                except sqlite3.OperationalError:
                    pass

                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS outcomes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        analysis_id TEXT NOT NULL,
                        action TEXT NOT NULL,
                        reward REAL NOT NULL,
                        timestamp TEXT NOT NULL,
                        outcome_snapshot_json TEXT NOT NULL,
                        FOREIGN KEY (analysis_id) REFERENCES analyses(analysis_id)
                    )
                """)
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_analyses_project ON analyses(project_id)")
                cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_analysis_action ON feedback(analysis_id, action)")
                cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_outcomes_analysis_action ON outcomes(analysis_id, action)")
                conn.commit()

    def save_analysis(
        self,
        analysis_id: str,
        project_id: str | None,
        model_version: str,
        snapshot: dict[str, Any],
        historical_result: dict[str, Any],
        drift_result: dict[str, Any],
        actions: list[dict[str, Any]],
        llm: dict[str, Any],
    ) -> None:
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO analyses (
                        analysis_id, project_id, timestamp, model_version,
                        snapshot_json, historical_result_json, drift_result_json,
                        actions_json, llm_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        analysis_id,
                        project_id,
                        now,
                        model_version,
                        json.dumps(snapshot, default=str),
                        json.dumps(historical_result, default=str),
                        json.dumps(drift_result, default=str),
                        json.dumps(actions, default=str),
                        json.dumps(llm, default=str),
                    ),
                )
                conn.commit()

    def get_analysis(self, analysis_id: str) -> dict[str, Any] | None:
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM analyses WHERE analysis_id = ?",
                    (analysis_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return None
                return {
                    "analysis_id": row["analysis_id"],
                    "project_id": row["project_id"],
                    "timestamp": row["timestamp"],
                    "model_version": row["model_version"],
                    "snapshot": json.loads(row["snapshot_json"]),
                    "historical_result": json.loads(row["historical_result_json"]),
                    "drift_result": json.loads(row["drift_result_json"]),
                    "actions": json.loads(row["actions_json"]),
                    "llm": json.loads(row["llm_json"]),
                }

    def has_feedback_for_action(self, analysis_id: str, action: str) -> bool:
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id FROM feedback WHERE analysis_id = ? AND action = ?",
                    (analysis_id, action),
                )
                return cursor.fetchone() is not None

    def record_feedback(
        self,
        analysis_id: str,
        action: str,
        feedback: str,
        note: str | None = None,
    ) -> bool:
        """Records feedback; returns True if newly recorded, False if duplicate."""
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now(timezone.utc).isoformat()
                try:
                    cursor.execute(
                        "INSERT INTO feedback (analysis_id, action, feedback, note, timestamp) VALUES (?, ?, ?, ?, ?)",
                        (analysis_id, action, feedback, note, now),
                    )
                    conn.commit()
                    return True
                except sqlite3.IntegrityError:
                    return False

    def has_outcome_for_action(self, analysis_id: str, action: str) -> bool:
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id FROM outcomes WHERE analysis_id = ? AND action = ?",
                    (analysis_id, action),
                )
                return cursor.fetchone() is not None

    def record_outcome(
        self,
        analysis_id: str,
        action: str,
        reward: float,
        outcome_snapshot: dict[str, Any],
    ) -> bool:
        """Records outcome; returns True if newly recorded, False if duplicate."""
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now(timezone.utc).isoformat()
                try:
                    cursor.execute(
                        """
                        INSERT INTO outcomes (analysis_id, action, reward, timestamp, outcome_snapshot_json)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (analysis_id, action, reward, now, json.dumps(outcome_snapshot, default=str)),
                    )
                    conn.commit()
                    return True
                except sqlite3.IntegrityError:
                    return False

    def get_project_history(self, project_id: str, limit: int = 10) -> list[dict[str, Any]]:
        with self.lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT analysis_id, timestamp, model_version, historical_result_json, actions_json "
                    "FROM analyses WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?",
                    (project_id, limit),
                )
                rows = cursor.fetchall()
                return [
                    {
                        "analysis_id": r["analysis_id"],
                        "timestamp": r["timestamp"],
                        "model_version": r["model_version"],
                        "historical_result": json.loads(r["historical_result_json"]),
                        "actions": json.loads(r["actions_json"]),
                    }
                    for r in rows
                ]
