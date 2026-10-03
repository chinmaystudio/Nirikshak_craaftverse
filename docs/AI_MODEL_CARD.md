# NIRIKSHAK AI Model Card — Model v1.0.0

**Model ID:** `nirikshak-ai-v1.0.0`  
**Target Environment:** Public Infrastructure Monitoring & Oversight  
**Maintainer:** NIRIKSHAK Engineering & MLOps Team  
**Date Released:** 2026-10-03  

---

## 1. Overview & Operational Intent

The NIRIKSHAK AI system is a decision-support platform designed to assist Government project authorities in identifying anomalies, tracking operational drift, and ranking advisory interventions across public works projects.

### What the Scores Mean
- **Review Priority Score (0–100):** Indicates how unusual a project appears compared to the historical baseline of 3,891 public infrastructure projects. It is a calibrated percentile ranking.
- **Review Bands:**
  - `TYPICAL` (0–49): Normal project dynamics matching standard sector patterns.
  - `WATCHLIST` (50–74): Moderate deviation across cost, timeline, or structural indicators.
  - `HIGH_PRIORITY` (75–89): Significant deviation warranting administrative inspection.
  - `VERY_UNUSUAL` (90–100): Highly atypical profile; priority scheduling recommended.

### Critical Semantic Guardrail
The **Review Priority Score is NOT:**
- A probability of delay
- A probability of corruption or fraud
- A prediction of contractor failure
- An automated penalty score

Officials and system interfaces must never label this score as a probability of failure or corruption.

---

## 2. Model Architecture & Components

| Component | Artifact | Technique | Purpose |
|---|---|---|---|
| **Structural Anomaly** | `isolation_forest.joblib` | Isolation Forest (`n_estimators=100`, `contamination=0.08`) | Global outlier detection across multi-dimensional feature space |
| **Neighborhood Outlier** | `local_outlier_factor.joblib` | Local Outlier Factor (`novelty=True`, `n_neighbors=20`) | Local density deviations within structural peer groups |
| **Dimensionality Reduction** | `preprocessor.joblib` | One-Hot Encoding + TF-IDF Vectorizer + TruncatedSVD | Projects categorical sector, authority, and description into dense space |
| **Project Archetypes** | `project_archetypes.joblib` | MiniBatch K-Means ($k=6$) | Categorizes projects into baseline archetypes (e.g. Mega Transport, Rural Water, Urban EPC) |
| **Cost Anomaly** | `cost_cohort_stats.json` | Median & Median Absolute Deviation (MAD) | Non-parametric cost anomaly per crore within sector cohorts |
| **Online Drift Learner** | Memory + Incremental Fit | `StandardScaler.partial_fit()`, `MiniBatchKMeans.partial_fit()` | Adapts to changing operational environments from verified monthly records |
| **Contextual Bandit** | `LinUCBPolicy` | Disjoint Linear Upper Confidence Bound ($\alpha=0.5$) | Ranks advisory actions based on project feature context and learns from officer feedback |
| **Reasoning Layer** | OpenRouter Client | NVIDIA Nemotron 340B Instruct | Generates human-readable explanations and audit notes with strict Pydantic validation |

---

## 3. Training & Validation Baseline

- **Dataset:** 3,891 curated historical public infrastructure projects across Maharashtra, PMGSY, and Central sector programs.
- **Preprocessing:** Log-transformation on monetary values; robust scaling on progress and variance metrics; zero-leakage pipeline design.
- **Score Calibration:** Reference score distribution stored in `score_reference.npz` ensuring monotonic percentile scaling across all operational domains.

---

## 4. Limitations & Ethical Guardrails

1. **Strictly Advisory:** Model recommendations and anomaly scores are strictly advisory. The system is prohibited from autonomously executing financial, contractual, or legal determinations.
2. **Missing Field Robustness:** Models gracefully impute missing physical progress or expenditure data, falling back to sector cohort baselines with explicit uncertainty disclosures.
3. **Data Contamination Prevention:** Contractor self-reported updates remain labeled `CONTRACTOR_REPORTED` and are excluded from online model retraining until explicitly verified by an Executive Engineer.
