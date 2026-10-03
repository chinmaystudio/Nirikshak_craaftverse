import openpyxl
import json
import hashlib
import os

wb_path = r"E:\Nirikshak\NIRIKSHAK_India_Infrastructure_Audit_Workbook_Pune_2000_to_2026.xlsx"
wb = openpyxl.load_workbook(wb_path, read_only=True)

# 1. Source Registry
sheet_src = wb['Source Registry']
sources = []
for r_i, r in enumerate(sheet_src.iter_rows(values_only=True), 1):
    if r_i <= 3:
        continue
    if not r or not r[0] or not str(r[0]).strip().startswith('SRC-'):
        continue
    
    src_id = str(r[0]).strip()
    name = str(r[1]).strip() if r[1] else src_id
    publisher = str(r[2]).strip() if len(r) > 2 and r[2] else None
    exact_url = str(r[3]).strip() if len(r) > 3 and r[3] else None
    years = str(r[5]).strip() if len(r) > 5 and r[5] else None
    geography = str(r[8]).strip() if len(r) > 8 and r[8] else None
    evidence_qual = str(r[13]).strip() if len(r) > 13 and r[13] else 'Official'
    verified = True if (len(r) > 14 and str(r[14]).strip().lower() in ['yes', 'true', '1']) else False
    
    sources.append({
        'source_code': src_id,
        'source_name': name,
        'publisher': publisher,
        'exact_url': exact_url,
        'years_covered': years,
        'geography': geography,
        'evidence_quality': evidence_qual,
        'verified': verified
    })

print(f"Parsed {len(sources)} sources from Source Registry")

# Write out SQL for sources
sql_lines = ["INSERT INTO public.sources (source_code, source_name, publisher, exact_url, years_covered, geography, evidence_quality, verified) VALUES"]
val_clauses = []
for s in sources:
    def esc(val):
        if val is None:
            return "NULL"
        v = str(val).replace("'", "''")
        return f"'{v}'"
    
    val_clauses.append(f"({esc(s['source_code'])}, {esc(s['source_name'])}, {esc(s['publisher'])}, {esc(s['exact_url'])}, {esc(s['years_covered'])}, {esc(s['geography'])}, {esc(s['evidence_quality'])}, {'TRUE' if s['verified'] else 'FALSE'})")

sql = "INSERT INTO public.sources (source_code, source_name, publisher, exact_url, years_covered, geography, evidence_quality, verified) VALUES\n" + ",\n".join(val_clauses) + "\nON CONFLICT (source_code) DO UPDATE SET\n source_name = EXCLUDED.source_name, publisher = EXCLUDED.publisher, exact_url = EXCLUDED.exact_url, verified = EXCLUDED.verified;"

with open("seed_sources.sql", "w", encoding="utf-8") as f:
    f.write(sql)
print("Wrote seed_sources.sql")
