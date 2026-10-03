
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

def outcome_reward_components(
    previous: dict,
    current: dict,
    government_feedback: str | None = None,
) -> tuple[float, dict[str, float]]:
    """
    Calculates LinUCB reward components normalized by the sum of available weights.
    Only includes a component if both before and after values exist (or feedback is provided).
    Does NOT treat missing data as zero improvement.
    """
    def to_float(d: dict, k: str) -> float | None:
        val = d.get(k)
        if val is None or val == "":
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    components: dict[str, float] = {}
    weights: dict[str, float] = {}

    # 1. Human feedback (weight 0.28)
    if government_feedback is not None and str(government_feedback).strip() != "":
        fb_val = {
            "accepted": 0.8,
            "useful": 1.0,
            "neutral": 0.0,
            "reviewed": 0.5,
            "rejected": -0.6,
            "harmful": -1.0,
        }.get(str(government_feedback).lower().strip())
        if fb_val is not None:
            components["human_feedback"] = fb_val
            weights["human_feedback"] = 0.28

    # 2. Schedule improvement (weight 0.22)
    prev_sched = to_float(previous, "schedule_variance_days")
    curr_sched = to_float(current, "schedule_variance_days")
    if prev_sched is not None and curr_sched is not None:
        sched_imp = float(np.clip((prev_sched - curr_sched) / 30.0, -1.0, 1.0))
        components["schedule_improvement"] = sched_imp
        weights["schedule_improvement"] = 0.22

    # 3. Progress gap improvement (weight 0.18)
    prev_c_prog = to_float(previous, "contractor_reported_progress_pct")
    prev_g_prog = to_float(previous, "government_verified_progress_pct")
    curr_c_prog = to_float(current, "contractor_reported_progress_pct")
    curr_g_prog = to_float(current, "government_verified_progress_pct")
    if prev_c_prog is not None and prev_g_prog is not None and curr_c_prog is not None and curr_g_prog is not None:
        prev_gap = abs(prev_c_prog - prev_g_prog)
        curr_gap = abs(curr_c_prog - curr_g_prog)
        gap_imp = float(np.clip((prev_gap - curr_gap) / 15.0, -1.0, 1.0))
        components["progress_gap_improvement"] = gap_imp
        weights["progress_gap_improvement"] = 0.18

    # 4. Cost variance improvement (weight 0.14)
    prev_cost = to_float(previous, "cost_variance_pct")
    curr_cost = to_float(current, "cost_variance_pct")
    if prev_cost is not None and curr_cost is not None:
        cost_imp = float(np.clip((abs(prev_cost) - abs(curr_cost)) / 20.0, -1.0, 1.0))
        components["cost_variance_improvement"] = cost_imp
        weights["cost_variance_improvement"] = 0.14

    # 5. High-severity complaints improvement (weight 0.07)
    prev_comp = to_float(previous, "high_severity_complaints")
    curr_comp = to_float(current, "high_severity_complaints")
    if prev_comp is not None and curr_comp is not None:
        comp_imp = float(np.clip((prev_comp - curr_comp) / 5.0, -1.0, 1.0))
        components["high_severity_complaint_improvement"] = comp_imp
        weights["high_severity_complaint_improvement"] = 0.07

    # 6. Resource shortage improvement (weight 0.06)
    prev_res = to_float(previous, "resource_shortage_ratio")
    curr_res = to_float(current, "resource_shortage_ratio")
    if prev_res is not None and curr_res is not None:
        res_imp = float(np.clip(prev_res - curr_res, -1.0, 1.0))
        components["resource_shortage_improvement"] = res_imp
        weights["resource_shortage_improvement"] = 0.06

    # 7. Inspection defect improvement (weight 0.05)
    prev_def = to_float(previous, "inspection_defects")
    curr_def = to_float(current, "inspection_defects")
    if prev_def is not None and curr_def is not None:
        def_imp = float(np.clip((prev_def - curr_def) / 5.0, -1.0, 1.0))
        components["inspection_defect_improvement"] = def_imp
        weights["inspection_defect_improvement"] = 0.05

    total_weight = sum(weights.values())
    if total_weight > 0:
        weighted_sum = sum(components[k] * weights[k] for k in components)
        normalized_reward = float(np.clip(weighted_sum / total_weight, -1.0, 1.0))
    else:
        normalized_reward = 0.0

    return round(normalized_reward, 4), components

def outcome_reward(previous: dict, current: dict, government_feedback: str | None = None) -> float:
    reward, _ = outcome_reward_components(previous, current, government_feedback)
    return reward
