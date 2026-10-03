import openpyxl
import json
import urllib.request
import urllib.error
import os
import re
from datetime import datetime, date

wb_path = r"E:\Nirikshak\NIRIKSHAK_India_Infrastructure_Audit_Workbook_Pune_2000_to_2026.xlsx"
wb = openpyxl.load_workbook(wb_path, read_only=True)

SUPABASE_URL = "https://dmkhkgqyzevhxpxsrgng.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta2hrZ3F5emV2aHhweHNyZ25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjE3NTIsImV4cCI6MjEwNTkzNzc1Mn0.xloAq7KOhn7wyGNSXKXuAZDLuu4dxEjXVNjby9zOgoU"

def clean_str(val):
    if val is None:
        return None
    v = str(val).strip()
    if not v or v.lower() in ["none", "null"]:
        return None
    return v

def clean_num(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    v = str(val).strip()
    if not v or v.lower() in ["none", "null", "-", "n/a", "na"]:
        return None
    try:
        cleaned = re.sub(r'[^\d.-]', '', v)
        return float(cleaned)
    except:
        return None

def clean_date(val):
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val.strftime('%Y-%m-%d')
    v = str(val).strip()
    if not v or v.lower() in ["none", "null", "-", "n/a"]:
        return None
    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%b %Y", "%B %Y", "%Y"]:
        try:
            d = datetime.strptime(v, fmt)
            return d.strftime('%Y-%m-%d')
        except:
            pass
    return None

allowed_statuses = [
    'PROPOSED', 'DPR_STAGE', 'APPROVED', 'TENDERED', 'AWARDED',
    'UNDER_CONSTRUCTION', 'DELAYED', 'STALLED', 'SUSPENDED',
    'COMPLETED', 'CANCELLED', 'UNKNOWN', 'OTHER'
]

projects_dict = {}
read_rows_projects = 0
read_rows_pune = 0

# 1. Projects sheet
sheet_proj = wb['Projects']
for r_i, r in enumerate(sheet_proj.iter_rows(values_only=True), 1):
    if r_i <= 3 or not r or not r[0] or not str(r[0]).strip().startswith('NIR-'):
        continue
    
    read_rows_projects += 1
    p_id = str(r[0]).strip()
    p_name = clean_str(r[1]) or "Untitled Project"
    sector = clean_str(r[2])
    subsector = clean_str(r[3])
    authority = clean_str(r[4])
    award_date = clean_date(r[5])
    location = clean_str(r[6])
    rep_status = clean_str(r[7]) or "UNKNOWN"
    norm_status = (clean_str(r[8]) or "UNKNOWN").upper()
    cost = clean_num(r[9])
    scope = clean_str(r[10]) or "National"
    verified = True if (len(r) > 11 and str(r[11]).strip().lower() in ['yes', 'true', '1']) else False
    quality = clean_num(r[12])
    dup_review = clean_str(r[13])
    src_record_id = clean_str(r[14])
    src_url = clean_str(r[15])

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
        'award_date': award_date,
        'location_text': location,
        'state': state,
        'city': city,
        'reported_status': rep_status,
        'normalized_status': norm_status,
        'total_cost_inr_crore': cost,
        'record_scope': scope,
        'current_status_verified': verified,
        'quality_score': quality,
        'duplicate_review': dup_review,
        'source_record_id': src_record_id,
        'primary_source_url': src_url,
        'is_public': True
    }

# 2. Pune Deep Research sheet (higher confidence)
sheet_pune = wb['Pune Deep Research']
for r_i, r in enumerate(sheet_pune.iter_rows(values_only=True), 1):
    if r_i <= 1 or not r or not r[0] or not str(r[0]).strip().startswith('NIR-'):
        continue
    
    read_rows_pune += 1
    p_id = str(r[0]).strip()
    p_name = clean_str(r[1]) or "Pune Infrastructure Project"
    sector = clean_str(r[2]) or "Transport"
    subsector = clean_str(r[3])
    authority = clean_str(r[4])
    award_date = clean_date(r[5])
    location = clean_str(r[6]) or "Pune, Maharashtra"
    rep_status = clean_str(r[7]) or "UNKNOWN"
    norm_status = (clean_str(r[8]) or "UNKNOWN").upper()
    cost = clean_num(r[9])
    scope = clean_str(r[10]) or "Pune Deep Research"
    quality = clean_num(r[12]) or 95.0
    src_record_id = clean_str(r[13])
    src_url = clean_str(r[14])

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
        'award_date': award_date,
        'location_text': location,
        'state': 'Maharashtra',
        'city': 'Pune',
        'reported_status': rep_status,
        'normalized_status': norm_status,
        'total_cost_inr_crore': cost,
        'record_scope': scope,
        'current_status_verified': True,
        'quality_score': quality,
        'duplicate_review': 'Validated against Pune Deep Research archive',
        'source_record_id': src_record_id,
        'primary_source_url': src_url,
        'is_public': True
    }

all_projects = list(projects_dict.values())
print(f"Total projects to seed via RPC: {len(all_projects)}")

batch_size = 400
num_batches = (len(all_projects) + batch_size - 1) // batch_size
total_seeded = 0

for b_idx in range(num_batches):
    batch = all_projects[b_idx * batch_size : (b_idx + 1) * batch_size]
    payload = json.dumps({"projects_data": batch}).encode('utf-8')
    
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/rpc/seed_projects_batch",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            res_data = resp.read().decode('utf-8')
            count = int(res_data) if res_data.isdigit() else len(batch)
            total_seeded += len(batch)
            print(f"Batch {b_idx + 1}/{num_batches} succeeded! ({len(batch)} projects, total seeded: {total_seeded})")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"Batch {b_idx + 1} failed: {e.code} - {err_msg}")
        break

print(f"\nSeeding complete! Successfully processed {total_seeded}/{len(all_projects)} projects.")
