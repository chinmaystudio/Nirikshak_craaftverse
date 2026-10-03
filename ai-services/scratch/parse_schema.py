import json, re

with open('frontend/src/lib/supabase/database.types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse Tables in database.types.ts
table_matches = re.finditer(r'([a-zA-Z0-9_]+):\s*{\s*Row:\s*{(.*?)}\s*Insert:', content, re.DOTALL)
schema_info = {}

for tm in table_matches:
    tname = tm.group(1)
    row_content = tm.group(2)
    cols = {}
    for line in row_content.strip().split('\n'):
        line = line.strip()
        if not line or ':' not in line:
            continue
        parts = line.split(':', 1)
        cname = parts[0].strip()
        ctype = parts[1].strip()
        cols[cname] = ctype
    schema_info[tname] = cols

with open('ai-services/scratch/current_schema.json', 'w', encoding='utf-8') as f:
    json.dump(schema_info, f, indent=2)

print(f"Extracted {len(schema_info)} tables from database.types.ts:")
for t in sorted(schema_info.keys()):
    print(f"  {t}: {len(schema_info[t])} columns")
