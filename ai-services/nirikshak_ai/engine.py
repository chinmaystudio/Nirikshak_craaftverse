
from __future__ import annotations
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime
import json, math
import joblib
import numpy as np
from scipy import sparse

def _percentile(value: float, sorted_reference: np.ndarray) -> float:
    if len(sorted_reference) == 0:
        return 0.0
    return float(100.0 * np.searchsorted(sorted_reference, value, side="right") / len(sorted_reference))

def _year(value):
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)) and 1900 <= int(value) <= 2200:
        return int(value)
    s = str(value)
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y", "%Y"):
        try:
            return datetime.strptime(s[:10], fmt).year
        except Exception:
            pass
    return None

@dataclass
class Assessment:
    project_id: str | None
    archetype_cluster: int
    structural_anomaly_score: float
    neighborhood_anomaly_score: float
    cluster_distance_score: float
    cost_anomaly_score: float
    review_priority_score: float
    review_band: str
    signals: list[str]
    limitations: list[str]

class HistoricalUnsupervisedEngine:
    def __init__(self, model_dir: str | Path):
        model_dir = Path(model_dir)
        self.pre = joblib.load(model_dir / "preprocessor.joblib")
        self.iso = joblib.load(model_dir / "isolation_forest.joblib")
        self.lof = joblib.load(model_dir / "local_outlier_factor.joblib")
        self.kmeans = joblib.load(model_dir / "project_archetypes.joblib")
        self.refs = np.load(model_dir / "score_reference.npz")
        self.cost_stats = json.loads((model_dir / "cost_cohort_stats.json").read_text(encoding="utf-8"))

    def _transform(self, p: dict) -> tuple[np.ndarray, list[str]]:
        med = self.pre["medians"]
        imputed = []
        cost_val = p.get("total_cost_inr_crore")
        if cost_val is None or cost_val == "":
            cost = float(med["cost"])
            imputed.append("total_cost_inr_crore")
        else:
            try:
                cost = float(cost_val)
            except Exception:
                cost = float(med["cost"])
                imputed.append("total_cost_inr_crore")

        q_val = p.get("quality_score")
        if q_val is None or q_val == "":
            quality = float(med["quality"])
            imputed.append("quality_score")
        else:
            try:
                quality = float(q_val)
            except Exception:
                quality = float(med["quality"])
                imputed.append("quality_score")

        award_val = p.get("award_date")
        year = _year(award_val)
        if year is None:
            year = float(med["year"])
            imputed.append("award_date")

        num = np.array([[math.log1p(max(cost, 0.0)), float(year), quality]], dtype=float)
        X_num = self.pre["numeric_scaler"].transform(num)
        cat = np.asarray([[
            str(p.get("sector") or "UNKNOWN"),
            str(p.get("subsector") or "UNKNOWN"),
            str(p.get("normalized_status") or "UNKNOWN"),
            str(p.get("record_scope") or "UNKNOWN"),
        ]], dtype=object)
        X_cat = self.pre["categorical_encoder"].transform(cat)
        X_name = self.pre["name_vectorizer"].transform([str(p.get("project_name") or "")])
        auth_val = str(p.get("project_authority") or p.get("authority") or "")
        X_auth = self.pre["authority_vectorizer"].transform([auth_val])
        X_status = self.pre["status_vectorizer"].transform([str(p.get("reported_status") or "")])

        X = sparse.hstack(
            [sparse.csr_matrix(X_num), X_cat, X_name, X_auth, X_status],
            format="csr"
        )
        return self.pre["svd"].transform(X), imputed

    def _cost_z(self, p: dict) -> float:
        try:
            cost = float(p.get("total_cost_inr_crore"))
        except Exception:
            return 0.0
        if cost <= 0:
            return 0.0
        sub = str(p.get("subsector") or "UNKNOWN")
        sec = str(p.get("sector") or "UNKNOWN")
        stats = self.cost_stats["subsector"].get(sub) or self.cost_stats["sector"].get(sec) or self.cost_stats["global"]
        return 0.6745 * ((math.log1p(cost) - stats["median_log_cost"]) / stats["mad_log_cost"])

    def assess(self, p: dict) -> dict:
        z, imputed = self._transform(p)
        cluster = int(self.kmeans.predict(z)[0])
        iso_raw = float(-self.iso.score_samples(z)[0])
        lof_raw = float(-self.lof.score_samples(z)[0])
        distance = float(np.linalg.norm(z[0] - self.kmeans.cluster_centers_[cluster]))
        cost_abs_z = abs(self._cost_z(p))

        structural = _percentile(iso_raw, self.refs["iso"])
        neighborhood = _percentile(lof_raw, self.refs["lof"])
        cluster_score = _percentile(distance, self.refs["cluster_distance"])
        cost_score = _percentile(cost_abs_z, self.refs["cost_abs_z"])

        review = 0.45*structural + 0.20*neighborhood + 0.20*cluster_score + 0.15*cost_score
        band = "VERY_UNUSUAL" if review >= 90 else "UNUSUAL" if review >= 75 else "MODERATE" if review >= 50 else "TYPICAL"

        signals = []
        if structural >= 90:
            signals.append("Project differs strongly from historical infrastructure archetypes.")
        if cost_score >= 90:
            signals.append("Project cost is unusual for comparable historical sector/subsector projects.")
        if cluster_score >= 90:
            signals.append("Project lies far from the center of its nearest historical project cluster.")
        if not signals:
            signals.append("No extreme structural anomaly was detected against the historical baseline.")

        limitations = [
            "This is an unsupervised review-priority signal, not a calibrated probability of delay, fraud, or cost overrun.",
            "Government verification remains authoritative."
        ]
        if "quality_score" in imputed:
            limitations.append("Quality score was not provided; baseline historical median was used internally for archetype alignment.")

        res = asdict(Assessment(
            project_id=p.get("project_id"),
            archetype_cluster=cluster,
            structural_anomaly_score=round(structural, 2),
            neighborhood_anomaly_score=round(neighborhood, 2),
            cluster_distance_score=round(cluster_score, 2),
            cost_anomaly_score=round(cost_score, 2),
            review_priority_score=round(review, 2),
            review_band=band,
            signals=signals,
            limitations=limitations,
        ))
        res["imputed_fields"] = imputed
        return res
