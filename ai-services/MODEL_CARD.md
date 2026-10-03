# NIRIKSHAK AI Model Card

**Version:** 1.0.0  
**Training rows:** 3,891  
**Training source:** NIRIKSHAK India Infrastructure Audit Workbook

## Purpose
Prioritize unusual infrastructure projects for review, detect live operational drift,
and learn which advisory interventions tend to be useful after verified outcomes.

## Historical models
- Isolation Forest
- Local Outlier Factor
- Truncated SVD
- MiniBatch K-Means
- Robust sector/subsector cost anomaly

## Continuous learner
Incremental StandardScaler + MiniBatchKMeans trained only on verified live snapshots.

## Reinforcement-learning layer
Seeded LinUCB contextual bandit. It ranks advisory actions and learns from Government
feedback plus later verified outcomes.

## Prohibited autonomous use
This model must not autonomously:
- award or reject tenders
- select contractors
- approve progress
- release payments
- impose penalties
- make legal determinations

All such actions require authorized human decision-making.
