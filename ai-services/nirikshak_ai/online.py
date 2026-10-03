
from __future__ import annotations
from pathlib import Path
import os, tempfile, joblib
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import MiniBatchKMeans

LIVE_FEATURES = [
    "contractor_reported_progress_pct",
    "government_verified_progress_pct",
    "planned_progress_pct",
    "schedule_variance_days",
    "cost_variance_pct",
    "open_complaints",
    "high_severity_complaints",
    "inspection_defects",
    "resource_shortage_ratio",
    "pending_approval_days",
    "payment_delay_days",
    "evidence_count",
]

class OnlineDriftLearner:
    def __init__(self, state_path: str | Path, n_clusters: int = 6, bootstrap_samples: int = 30):
        self.state_path = Path(state_path)
        self.n_clusters = n_clusters
        self.bootstrap_samples = bootstrap_samples
        self.scaler = StandardScaler()
        self.clusterer = MiniBatchKMeans(
            n_clusters=n_clusters, random_state=42, batch_size=64, n_init="auto"
        )
        self.seen = 0
        self.buffer = []
        self.fitted = False
        self.distance_history = []
        if self.state_path.exists():
            self._load()

    def vectorize(self, s: dict) -> np.ndarray:
        def f(k, default_val=0.0):
            val = s.get(k)
            if val is None or val == "":
                return default_val
            try:
                return float(val)
            except Exception:
                return default_val

        contractor = f("contractor_reported_progress_pct", 0.0)
        government = f("government_verified_progress_pct", contractor)
        # If planned progress schedule is missing, align with government progress so missing schedule doesn't fake a massive delay
        planned = f("planned_progress_pct", government)

        x = np.array([
            contractor / 100.0,
            government / 100.0,
            planned / 100.0,
            np.clip(f("schedule_variance_days", 0.0) / 90.0, -2, 2),
            np.clip(f("cost_variance_pct", 0.0) / 50.0, -2, 2),
            np.clip(f("open_complaints", 0.0) / 20.0, 0, 2),
            np.clip(f("high_severity_complaints", 0.0) / 10.0, 0, 2),
            np.clip(f("inspection_defects", 0.0) / 10.0, 0, 2),
            # Missing resource shortage is not zero shortage; treat as baseline neutral
            np.clip(f("resource_shortage_ratio", 0.05), 0, 1),
            np.clip(f("pending_approval_days", 0.0) / 60.0, 0, 2),
            np.clip(f("payment_delay_days", 0.0) / 60.0, 0, 2),
            np.clip(f("evidence_count", 0.0) / 20.0, 0, 2),
        ], dtype=float)
        return x

    def learn(self, snapshot: dict, verified: bool) -> dict:
        if not verified:
            return {"learned": False, "reason": "Snapshot is not Government-verified. Unverified contractor submissions cannot train the model."}
        
        gov_progress = snapshot.get("government_verified_progress_pct")
        if gov_progress is None:
            return {
                "learned": False,
                "reason": "Missing required government_verified_progress_pct. Verified progress is mandatory for learning.",
            }

        x = self.vectorize(snapshot)
        self.buffer.append(x)
        self.seen += 1

        if not self.fitted and len(self.buffer) >= self.bootstrap_samples:
            batch = np.vstack(self.buffer)
            self.scaler.fit(batch)
            z = self.scaler.transform(batch)
            self.clusterer.fit(z)
            self.fitted = True
            self.distance_history.extend(
                np.linalg.norm(z - self.clusterer.cluster_centers_[self.clusterer.labels_], axis=1).tolist()
            )
            self.buffer.clear()
        elif self.fitted:
            batch = np.vstack(self.buffer)
            self.scaler.partial_fit(batch)
            z = self.scaler.transform(batch)
            self.clusterer.partial_fit(z)
            labels = self.clusterer.predict(z)
            self.distance_history.extend(
                np.linalg.norm(z - self.clusterer.cluster_centers_[labels], axis=1).tolist()
            )
            self.distance_history = self.distance_history[-5000:]
            self.buffer.clear()

        self._save()
        return {
            "learned": True,
            "seen_verified_snapshots": self.seen,
            "online_model_active": self.fitted,
        }

    def score(self, snapshot: dict) -> dict:
        if not self.fitted:
            return {
                "available": False,
                "seen_verified_snapshots": self.seen,
                "required_verified_snapshots": self.bootstrap_samples,
            }
        x = self.vectorize(snapshot).reshape(1, -1)
        z = self.scaler.transform(x)
        cluster = int(self.clusterer.predict(z)[0])
        distance = float(np.linalg.norm(z[0] - self.clusterer.cluster_centers_[cluster]))
        percentile = None
        if self.distance_history:
            arr = np.sort(np.asarray(self.distance_history, dtype=float))
            percentile = float(100*np.searchsorted(arr, distance, side="right")/len(arr))
        return {
            "available": True,
            "live_cluster": cluster,
            "raw_drift_distance": round(distance, 4),
            "drift_percentile": None if percentile is None else round(percentile, 2),
        }

    def _save(self):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "scaler": self.scaler,
            "clusterer": self.clusterer,
            "seen": self.seen,
            "buffer": self.buffer,
            "fitted": self.fitted,
            "distance_history": self.distance_history,
            "n_clusters": self.n_clusters,
            "bootstrap_samples": self.bootstrap_samples,
        }
        tmp = self.state_path.with_suffix(".tmp")
        joblib.dump(payload, tmp)
        os.replace(tmp, self.state_path)

    def _load(self):
        p = joblib.load(self.state_path)
        self.scaler = p["scaler"]
        self.clusterer = p["clusterer"]
        self.seen = p["seen"]
        self.buffer = p["buffer"]
        self.fitted = p["fitted"]
        self.distance_history = p.get("distance_history", [])
        self.n_clusters = p["n_clusters"]
        self.bootstrap_samples = p["bootstrap_samples"]
