# NIRIKSHAK AI — Final Model Package

This ZIP is directly runnable.

## 1. Install

Python 3.11+ recommended.

```bash
python -m pip install -r requirements.txt
```

## 2. Run as API

```bash
python run_api.py
```

Open:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

Main endpoints:

- `POST /analyze`
- `POST /learn/snapshot`
- `POST /learn/outcome`
- `GET /model-info`

## 3. Run from CLI

```bash
python -m nirikshak_ai.cli examples/project_input.json
```

## 4. Python usage

```python
from pathlib import Path
from nirikshak_ai import NirikshakAI

ai = NirikshakAI(Path("."))
result = ai.analyze(project_dict)
```

## 5. Continuous learning

### Verified project snapshots

Call:

```python
ai.learn_verified_snapshot(snapshot, verified=True)
```

Only verified snapshots are learned.

Contractor data should first remain `CONTRACTOR_REPORTED`.
Once Government verifies it, use the resulting verified snapshot for learning.

### RL feedback

After a recommendation has been used/reviewed and a later verified snapshot exists:

```python
ai.learn_action_outcome(
    action="REVIEW_RESOURCE_PLAN",
    previous_project=old_snapshot,
    current_project=new_snapshot,
    previous_analysis=old_analysis,
    government_feedback="useful",
    current_snapshot_verified=True,
)
```

Valid feedback examples:

- `useful`
- `accepted`
- `neutral`
- `rejected`
- `harmful`

The contextual bandit updates itself and persists state under `state/`.

## 6. Retrain historical baseline

The package includes the extracted training CSV.

```bash
python retrain.py
```

This retrains the historical unsupervised model artifacts.

## 7. NIRIKSHAK integration

Recommended Express/Supabase flow:

```text
Government + Contractor DB records
              |
              v
      Build project snapshot
              |
              v
       POST Python /analyze
              |
              v
       Store AI analysis
              |
              v
      Government review
              |
              v
Future verified project snapshot
              |
      +-------+--------+
      |                |
      v                v
/learn/snapshot   /learn/outcome
```

## Important interpretation

`review_priority_score` means:

> How unusual the project looks compared with the historical training baseline.

It is **not** a calibrated probability of fraud, delay, or cost overrun.

As NIRIKSHAK collects verified weekly/monthly observations, you can later add:
- supervised delay prediction
- cost-overrun prediction
- completion-date forecasting
- contractor-performance forecasting
- offline RL from accumulated intervention trajectories
