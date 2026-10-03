
from __future__ import annotations
from pathlib import Path
from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter
import csv, json, math, statistics
import numpy as np, joblib
from scipy import sparse
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.ensemble import IsolationForest
from sklearn.cluster import MiniBatchKMeans
from sklearn.neighbors import LocalOutlierFactor

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "data" / "training_projects.csv"
MODEL_DIR = ROOT / "models"

def fl(v, default=np.nan):
    try:
        if v is None or str(v).strip()=="":
            return default
        return float(v)
    except Exception:
        return default

def yr(v):
    try:
        fv=float(v)
        if 1900<=fv<=2200:return int(fv)
        if fv>20000:return (datetime(1899,12,30)+timedelta(days=fv)).year
    except Exception:pass
    s=str(v or "")
    for fmt in ("%Y-%m-%d","%Y/%m/%d","%d-%m-%Y","%d/%m/%Y","%Y"):
        try:return datetime.strptime(s[:10],fmt).year
        except Exception:pass
    return None

with CSV_PATH.open("r",encoding="utf-8",newline="") as f:
    rows=list(csv.DictReader(f))

costs=np.array([fl(r.get("Total cost (INR crore)")) for r in rows],float)
years=np.array([yr(r.get("Award date")) or np.nan for r in rows],float)
qs=np.array([fl(r.get("Quality score")) for r in rows],float)
mc,my,mq=float(np.nanmedian(costs)),float(np.nanmedian(years)),float(np.nanmedian(qs))

num=[];cat=[];names=[];auth=[];statuses=[]
for r in rows:
    c=fl(r.get("Total cost (INR crore)"),mc)
    y=yr(r.get("Award date")) or my
    q=fl(r.get("Quality score"),mq)
    num.append([math.log1p(max(c,0)),float(y),float(q)])
    cat.append([str(r.get("Sector") or "UNKNOWN"),str(r.get("Subsector") or "UNKNOWN"),
                str(r.get("Normalized status") or "UNKNOWN"),str(r.get("Record scope") or "UNKNOWN")])
    names.append(str(r.get("Project name") or ""))
    auth.append(str(r.get("Project authority") or ""))
    statuses.append(str(r.get("Reported status") or ""))

sc=StandardScaler(); Xn=sc.fit_transform(np.asarray(num,float))
enc=OneHotEncoder(handle_unknown="ignore",sparse_output=True,min_frequency=2)
Xc=enc.fit_transform(np.asarray(cat,object))
nv=TfidfVectorizer(max_features=320,ngram_range=(1,2),min_df=2,stop_words="english")
av=TfidfVectorizer(max_features=192,ngram_range=(1,2),min_df=2,stop_words="english")
sv=TfidfVectorizer(max_features=192,ngram_range=(1,2),min_df=2,stop_words="english")
X=sparse.hstack([sparse.csr_matrix(Xn),Xc,nv.fit_transform(names),av.fit_transform(auth),sv.fit_transform(statuses)],format="csr")
nc=min(48,max(8,min(X.shape[0]-1,X.shape[1]-1)))
svd=TruncatedSVD(n_components=nc,random_state=42); Z=svd.fit_transform(X)

iso=IsolationForest(n_estimators=500,contamination="auto",random_state=42,n_jobs=-1).fit(Z)
lof=LocalOutlierFactor(n_neighbors=35,novelty=True,contamination="auto").fit(Z)
km=MiniBatchKMeans(n_clusters=12,batch_size=256,random_state=42,n_init="auto").fit(Z)
labels=km.predict(Z)

sub=defaultdict(list);sec=defaultdict(list);glob=[]
for r in rows:
    c=fl(r.get("Total cost (INR crore)"))
    if np.isfinite(c) and c>0:
        lc=math.log1p(c);glob.append(lc)
        sub[str(r.get("Subsector") or "UNKNOWN")].append(lc)
        sec[str(r.get("Sector") or "UNKNOWN")].append(lc)
def mm(v):
    m=statistics.median(v);d=statistics.median(abs(x-m) for x in v) or 1e-9
    return {"median_log_cost":float(m),"mad_log_cost":float(d),"n":len(v)}
stats={"global":mm(glob),"sector":{k:mm(v) for k,v in sec.items() if len(v)>=10},
       "subsector":{k:mm(v) for k,v in sub.items() if len(v)>=10}}
def cz(r):
    c=fl(r.get("Total cost (INR crore)"))
    if not np.isfinite(c) or c<=0:return 0.
    st=stats["subsector"].get(str(r.get("Subsector") or "UNKNOWN")) or stats["sector"].get(str(r.get("Sector") or "UNKNOWN")) or stats["global"]
    return abs(.6745*((math.log1p(c)-st["median_log_cost"])/st["mad_log_cost"]))

MODEL_DIR.mkdir(parents=True,exist_ok=True)
joblib.dump({"numeric_scaler":sc,"categorical_encoder":enc,"name_vectorizer":nv,
             "authority_vectorizer":av,"status_vectorizer":sv,"svd":svd,
             "medians":{"cost":mc,"year":my,"quality":mq},"feature_schema_version":"1.0"},
            MODEL_DIR/"preprocessor.joblib")
joblib.dump(iso,MODEL_DIR/"isolation_forest.joblib")
joblib.dump(lof,MODEL_DIR/"local_outlier_factor.joblib")
joblib.dump(km,MODEL_DIR/"project_archetypes.joblib")
np.savez_compressed(MODEL_DIR/"score_reference.npz",
                    iso=np.sort(-iso.score_samples(Z)),
                    lof=np.sort(-lof.score_samples(Z)),
                    cluster_distance=np.sort(np.linalg.norm(Z-km.cluster_centers_[labels],axis=1)),
                    cost_abs_z=np.sort(np.array([cz(r) for r in rows],float)))
(MODEL_DIR/"cost_cohort_stats.json").write_text(json.dumps(stats,indent=2),encoding="utf-8")
info={"model_version":"nirikshak-ai-v1.0.0","trained_at":datetime.now(timezone.utc).isoformat(),
      "training_rows":len(rows),"svd_components":nc,"svd_explained_variance":float(svd.explained_variance_ratio_.sum())}
(MODEL_DIR/"model_info.json").write_text(json.dumps(info,indent=2),encoding="utf-8")
print(json.dumps(info,indent=2))
