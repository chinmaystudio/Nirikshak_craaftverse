
from __future__ import annotations
from pathlib import Path
import json, os
import numpy as np

ACTIONS = [
    "MONITOR_ONLY",
    "REQUEST_CONTRACTOR_EVIDENCE",
    "SCHEDULE_SITE_INSPECTION",
    "REVIEW_MILESTONE_PLAN",
    "REVIEW_RESOURCE_PLAN",
    "REVIEW_COST_VARIANCE",
    "EXPEDITE_PENDING_APPROVAL",
    "ESCALATE_GRIEVANCE_REVIEW",
]

FEATURES = [
    "structural_anomaly",
    "cost_anomaly",
    "cluster_distance",
    "contractor_progress",
    "government_progress",
    "progress_gap_abs",
    "planned_gap",
    "schedule_variance",
    "cost_variance_abs",
    "complaint_pressure",
    "resource_shortage",
    "inspection_defects",
    "approval_delay",
    "evidence_sufficiency",
]

# Safe seeded priors make recommendations useful before enough RL feedback exists.
PRIOR = {
    "MONITOR_ONLY":                 [-0.4,-0.3,-0.3, 0.2, 0.2,-0.5,-0.5,-0.6,-0.5,-0.4,-0.5,-0.5,-0.4, 0.3],
    "REQUEST_CONTRACTOR_EVIDENCE":  [ 0.2, 0.1, 0.2, 0.2, 0.1, 0.8, 0.4, 0.3, 0.2, 0.2, 0.2, 0.3, 0.1,-0.9],
    "SCHEDULE_SITE_INSPECTION":     [ 0.7, 0.2, 0.7, 0.1, 0.1, 0.7, 0.4, 0.5, 0.2, 0.5, 0.4, 1.0, 0.2, 0.1],
    "REVIEW_MILESTONE_PLAN":        [ 0.2, 0.1, 0.2, 0.1, 0.1, 0.4, 1.0, 1.0, 0.3, 0.2, 0.5, 0.2, 0.4, 0.1],
    "REVIEW_RESOURCE_PLAN":         [ 0.2, 0.1, 0.2, 0.1, 0.1, 0.3, 0.6, 0.7, 0.3, 0.2, 1.2, 0.3, 0.2, 0.1],
    "REVIEW_COST_VARIANCE":         [ 0.2, 0.9, 0.2, 0.1, 0.1, 0.2, 0.2, 0.3, 1.2, 0.1, 0.3, 0.2, 0.2, 0.1],
    "EXPEDITE_PENDING_APPROVAL":    [ 0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 0.3, 0.6, 0.1, 0.1, 0.2, 0.0, 1.4, 0.0],
    "ESCALATE_GRIEVANCE_REVIEW":    [ 0.1, 0.0, 0.1, 0.0, 0.0, 0.2, 0.1, 0.2, 0.1, 1.4, 0.1, 0.3, 0.1, 0.0],
}

class LinUCBPolicy:
    def __init__(self, state_path: str | Path, seed_path: str | Path | None = None, alpha: float = 0.45):
        self.state_path = Path(state_path)
        self.seed_path = Path(seed_path) if seed_path else self.state_path.parent.parent / "models" / "rl_policy_seed.json"
        self.alpha = alpha
        self.d = len(FEATURES)
        self.A = {a: np.eye(self.d) for a in ACTIONS}
        self.b = {a: np.asarray(PRIOR[a], dtype=float).copy() for a in ACTIONS}
        self.updates = 0
        if self.state_path.exists():
            self._load(self.state_path)
        elif self.seed_path.exists():
            self._load(self.seed_path)

    def context(self, p: dict, unsup: dict) -> np.ndarray:
        def f(k):
            try: return float(p.get(k, 0.0) or 0.0)
            except Exception: return 0.0
        contractor = f("contractor_reported_progress_pct")
        government = f("government_verified_progress_pct")
        planned = f("planned_progress_pct")
        evidence = f("evidence_count")
        return np.asarray([
            float(unsup.get("structural_anomaly_score", 0))/100,
            float(unsup.get("cost_anomaly_score", 0))/100,
            float(unsup.get("cluster_distance_score", 0))/100,
            contractor/100,
            government/100,
            abs(contractor-government)/100,
            abs(planned-government)/100,
            np.clip(max(f("schedule_variance_days"), 0)/90, 0, 2),
            np.clip(abs(f("cost_variance_pct"))/50, 0, 2),
            np.clip(f("high_severity_complaints")/10, 0, 2),
            np.clip(f("resource_shortage_ratio"), 0, 1),
            np.clip(f("inspection_defects")/10, 0, 2),
            np.clip(f("pending_approval_days")/60, 0, 2),
            np.clip(evidence/10, 0, 1),
        ], dtype=float)

    def rank(self, x: np.ndarray, top_k: int = 3) -> list[dict]:
        out = []
        for action in ACTIONS:
            inv = np.linalg.inv(self.A[action])
            theta = inv @ self.b[action]
            mean = float(theta @ x)
            uncertainty = float(self.alpha * np.sqrt(max(x @ inv @ x, 0.0)))
            out.append({
                "action": action,
                "score": round(mean + uncertainty, 6),
                "learned_mean_reward": round(mean, 6),
                "uncertainty_bonus": round(uncertainty, 6),
            })
        out.sort(key=lambda v: v["score"], reverse=True)
        return out[:top_k]

    def update(self, action: str, x: np.ndarray, reward: float):
        if action not in self.A:
            raise ValueError(f"Unknown action: {action}")
        reward = float(np.clip(reward, -1, 1))
        self.A[action] += np.outer(x, x)
        self.b[action] += reward*x
        self.updates += 1
        self._save()

    def _save(self):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "alpha": self.alpha,
            "updates": self.updates,
            "A": {k:v.tolist() for k,v in self.A.items()},
            "b": {k:v.tolist() for k,v in self.b.items()},
        }
        tmp = self.state_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload), encoding="utf-8")
        os.replace(tmp, self.state_path)

    def _load(self, path: Path | None = None):
        target = path or self.state_path
        p = json.loads(target.read_text(encoding="utf-8"))
        self.alpha = float(p.get("alpha", self.alpha))
        self.updates = int(p.get("updates", 0))
        self.A = {k: np.asarray(v, dtype=float) for k, v in p["A"].items()}
        self.b = {k: np.asarray(v, dtype=float) for k, v in p["b"].items()}

def outcome_reward(previous: dict, current: dict, government_feedback: str) -> float:
    def f(d,k):
        try:return float(d.get(k,0) or 0)
        except Exception:return 0.0

    feedback = {
        "accepted": 0.8,
        "useful": 1.0,
        "neutral": 0.0,
        "rejected": -0.6,
        "harmful": -1.0,
    }.get(str(government_feedback).lower(), 0.0)

    delay = np.clip((f(previous,"schedule_variance_days")-f(current,"schedule_variance_days"))/30,-1,1)
    cost = np.clip((abs(f(previous,"cost_variance_pct"))-abs(f(current,"cost_variance_pct")))/20,-1,1)
    prev_gap = abs(f(previous,"contractor_reported_progress_pct")-f(previous,"government_verified_progress_pct"))
    curr_gap = abs(f(current,"contractor_reported_progress_pct")-f(current,"government_verified_progress_pct"))
    gap = np.clip((prev_gap-curr_gap)/15,-1,1)
    complaints = np.clip((f(previous,"high_severity_complaints")-f(current,"high_severity_complaints"))/5,-1,1)
    resources = np.clip(f(previous,"resource_shortage_ratio")-f(current,"resource_shortage_ratio"),-1,1)
    defects = np.clip((f(previous,"inspection_defects")-f(current,"inspection_defects"))/5,-1,1)

    reward = (
        0.28*feedback +
        0.22*delay +
        0.18*gap +
        0.14*cost +
        0.07*complaints +
        0.06*resources +
        0.05*defects
    )
    return float(np.clip(reward,-1,1))
