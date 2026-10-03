import openpyxl
import os
from datetime import datetime, date

wb_path = r"E:\Nirikshak\NIRIKSHAK_India_Infrastructure_Audit_Workbook_Pune_2000_to_2026.xlsx"
wb = openpyxl.load_workbook(wb_path, read_only=True)

def esc(val):
    if val is None:
        return "NULL"
    if isinstance(val, (datetime, date)):
        return f"'{val.strftime('%Y-%m-%d')}'"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    v = str(val).replace("'", "''").strip()
    if v == "" or v.lower() == "none" or v.lower() == "null":
        return "NULL"
    return f"'{v}'"

def esc_num(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    v = str(val).strip()
    if not v or v.lower() in ["none", "null", "-", "n/a", "na"]:
        return "NULL"
    try:
        import re
        cleaned = re.sub(r'[^\d.-]', '', v)
        return str(float(cleaned))
    except:
        return "NULL"

def parse_date(val):
    if val is None:
        return "NULL"
    if isinstance(val, (datetime, date)):
        return f"'{val.strftime('%Y-%m-%d')}'"
    v = str(val).strip()
    if not v or v.lower() in ["none", "null", "-", "n/a"]:
        return "NULL"
    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%b %Y", "%B %Y", "%Y"]:
        try:
            d = datetime.strptime(v, fmt)
            return f"'{d.strftime('%Y-%m-%d')}'"
        except:
            pass
    return "NULL"

allowed_statuses = [
    'PROPOSED', 'DPR_STAGE', 'APPROVED', 'TENDERED', 'AWARDED',
    'UNDER_CONSTRUCTION', 'DELAYED', 'STALLED', 'SUSPENDED',
    'COMPLETED', 'CANCELLED', 'UNKNOWN', 'OTHER'
]

projects_dict = {}

sheet_proj = wb['Projects']
for r_i, r in enumerate(sheet_proj.iter_rows(values_only=True), 1):
    if r_i <= 3 or not r or not r[0] or not str(r[0]).strip().startswith('NIR-'):
        continue
    
    p_id = str(r[0]).strip()
    p_name = str(r[1]).strip() if len(r) > 1 and r[1] else "Untitled Project"
    sector = str(r[2]).strip() if len(r) > 2 and r[2] else None
    subsector = str(r[3]).strip() if len(r) > 3 and r[3] else None
    authority = str(r[4]).strip() if len(r) > 4 and r[4] else None
    award_date = r[5] if len(r) > 5 else None
    location = str(r[6]).strip() if len(r) > 6 and r[6] else None
    rep_status = str(r[7]).strip() if len(r) > 7 and r[7] else "UNKNOWN"
    norm_status = str(r[8]).strip().upper() if len(r) > 8 and r[8] else "UNKNOWN"
    cost = r[9] if len(r) > 9 else None
    scope = str(r[10]).strip() if len(r) > 10 and r[10] else "National"
    verified = True if (len(r) > 11 and str(r[11]).strip().lower() in ['yes', 'true', '1']) else False
    quality = r[12] if len(r) > 12 else None
    dup_review = str(r[13]).strip() if len(r) > 13 and r[13] else None
    src_record_id = str(r[14]).strip() if len(r) > 14 and r[14] else None
    src_url = str(r[15]).strip() if len(r) > 15 and r[15] else None

    state = location
    city = None
    if location and ('pune' in location.lower() or 'pcmc' in location.lower() or 'pimpri' in location.lower()):
        city = 'Pune'
        state = 'Maharashtra'
    
    if norm_status not in allowed_statuses:
        if 'COMPLET' in norm_status or 'OPERATIONAL' in norm_status:
            norm_status = 'COMPLETED'
        elif 'CONSTRUCTION' in norm_status or 'PROGRESS' in norm_status:
            norm_status = 'UNDER_CONSTRUCTION'
        elif 'DELAY' in norm_status:
            norm_status = 'DELAYED'
        else:
            norm_status = 'OTHER'

    projects_dict[p_id] = {
        'nirikshak_project_id': p_id,
        'project_name': p_name,
        'sector': sector,
        'subsector': subsector,
        'project_authority': authority,
        'award_date': parse_date(award_date),
        'location_text': location,
        'state': state,
        'city': city,
        'reported_status': rep_status,
        'normalized_status': norm_status,
        'total_cost_inr_crore': esc_num(cost),
        'record_scope': scope,
        'current_status_verified': verified,
        'quality_score': esc_num(quality),
        'duplicate_review': dup_review,
        'source_record_id': src_record_id,
        'primary_source_url': src_url,
        'is_public': True
    }

out_dir = r"E:\Nirikshak\frontend\seed_chunks_500"
os.makedirs(out_dir, exist_ok=True)

all_projects = list(projects_dict.values())
chunk_size = 500
num_chunks = (len(all_projects) + chunk_size - 1) // chunk_size

cols = [
    "nirikshak_project_id", "project_name", "sector", "subsector",
    "project_authority", "award_date", "location_text", "state", "city",
    "reported_status", "normalized_status", "total_cost_inr_crore", "record_scope",
    "current_status_verified", "quality_score", "duplicate_review", "source_record_id",
    "primary_source_url", "is_public"
]

for c_idx in range(num_chunks):
    chunk = all_projects[c_idx * chunk_size : (c_idx + 1) * chunk_size]
    vals = []
    for p in chunk:
        row_str = f"({esc(p['nirikshak_project_id'])}, {esc(p['project_name'])}, {esc(p['sector'])}, {esc(p['subsector'])}, {esc(p['project_authority'])}, {p['award_date']}, {esc(p['location_text'])}, {esc(p['state'])}, {esc(p['city'])}, {esc(p['reported_status'])}, {esc(p['normalized_status'])}, {p['total_cost_inr_crore']}, {esc(p['record_scope'])}, {'TRUE' if p['current_status_verified'] else 'FALSE'}, {p['quality_score']}, {esc(p['duplicate_review'])}, {esc(p['source_record_id'])}, {esc(p['primary_source_url'])}, {'TRUE' if p['is_public'] else 'FALSE'})"
        vals.append(row_str)
    
    val_block = ",\n".join(vals)
    sql = f"""INSERT INTO public.projects ({", ".join(cols)}) VALUES
{val_block}
ON CONFLICT (nirikshak_project_id) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  sector = EXCLUDED.sector,
  subsector = EXCLUDED.subsector,
  project_authority = EXCLUDED.project_authority,
  award_date = EXCLUDED.award_date,
  location_text = EXCLUDED.location_text,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  reported_status = EXCLUDED.reported_status,
  normalized_status = EXCLUDED.normalized_status,
  total_cost_inr_crore = EXCLUDED.total_cost_inr_crore,
  current_status_verified = EXCLUDED.current_status_verified,
  quality_score = EXCLUDED.quality_score,
  duplicate_review = EXCLUDED.duplicate_review,
  source_record_id = EXCLUDED.source_record_id,
  primary_source_url = EXCLUDED.primary_source_url;
"""
    chunk_file = os.path.join(out_dir, f"batch_{c_idx:02d}.sql")
    with open(chunk_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    print(f"Generated {chunk_file} ({len(chunk)} projects, {len(sql)} chars)")
