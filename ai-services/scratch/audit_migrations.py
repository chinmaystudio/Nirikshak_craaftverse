import os, glob, re

migrations = sorted(glob.glob('backend/supabase/migrations/*.sql'))
print(f"Total migration files: {len(migrations)}")

tables = {}
views = set()
functions = {}
triggers = set()
policies = []
enums = set()
storage_buckets = set()
realtime_tables = set()

for m in migrations:
    name = os.path.basename(m)
    with open(m, 'r', encoding='utf-8') as f:
        sql = f.read()

    # Tables & columns
    t_matches = re.finditer(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\((.*?)\);', sql, re.IGNORECASE | re.DOTALL)
    for tm in t_matches:
        tname = tm.group(1).lower()
        if tname not in tables:
            tables[tname] = {'migration': name, 'raw': tm.group(2)}

    # Alter table adds
    alter_matches = re.finditer(r'ALTER\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+([^,;]+)', sql, re.IGNORECASE)
    for am in alter_matches:
        tname = am.group(1).lower()
        col = am.group(2)
        typ = am.group(3).strip()
        if tname in tables:
            tables[tname].setdefault('added_cols', []).append((col, typ, name))

    # Views
    v_matches = re.findall(r'CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)', sql, re.IGNORECASE)
    for v in v_matches:
        views.add(v.lower())

    # Functions
    f_matches = re.finditer(r'CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\((.*?)\)\s*RETURNS\s+([a-zA-Z0-9_\[\]]+|TABLE\s*\(.*?\)|SETOF\s+[a-zA-Z0-9_]+|TRIGGER|VOID)', sql, re.IGNORECASE | re.DOTALL)
    for fm in f_matches:
        fname = fm.group(1).lower()
        functions[fname] = {'args': re.sub(r'\s+', ' ', fm.group(2).strip()), 'ret': fm.group(3).strip(), 'migration': name}

    # Triggers
    tr_matches = re.finditer(r'CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s+(BEFORE|AFTER)\s+([a-zA-Z0-9_\sOR]+)\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)', sql, re.IGNORECASE)
    for tr in tr_matches:
        triggers.add(f"{tr.group(4).lower()}: {tr.group(1)}")

    # Policies
    p_matches = re.finditer(r'CREATE\s+POLICY\s+"?([^"\n]+)"?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)\s+(?:FOR\s+([A-Z]+))?', sql, re.IGNORECASE)
    for p in p_matches:
        action = p.group(3) or 'ALL'
        policies.append({'table': p.group(2).lower(), 'name': p.group(1).strip(), 'action': action, 'migration': name})

    # Enums
    e_matches = re.findall(r'CREATE\s+TYPE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+AS\s+ENUM\s*\((.*?)\);', sql, re.IGNORECASE | re.DOTALL)
    for e in e_matches:
        enums.add(e[0].lower())

    # Storage buckets
    sb_matches = re.findall(r"INSERT\s+INTO\s+storage\.buckets\s+.*?'([a-zA-Z0-9_\-]+)'", sql, re.IGNORECASE)
    for sb in sb_matches:
        storage_buckets.add(sb)

    # Realtime
    rt_matches = re.findall(r"ALTER\s+PUBLICATION\s+supabase_realtime\s+ADD\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)", sql, re.IGNORECASE)
    for rt in rt_matches:
        realtime_tables.add(rt.lower())

print("\n=== EXISTING TABLES ===")
for t, d in sorted(tables.items()):
    added = len(d.get('added_cols', []))
    print(f"  {t} (defined in {d['migration']}, +{added} added cols)")

print(f"\nTotal tables: {len(tables)}")

print("\n=== EXISTING VIEWS ===")
for v in sorted(views):
    print(f"  {v}")
print(f"Total views: {len(views)}")

print("\n=== EXISTING FUNCTIONS / RPCS ===")
for fn, d in sorted(functions.items()):
    print(f"  {fn}({d['args'][:40]}...) -> {d['ret']} [{d['migration']}]")
print(f"Total functions: {len(functions)}")

print(f"\nTotal triggers: {len(triggers)}")
print(f"Total policies: {len(policies)}")
print(f"Total enums: {len(enums)} -> {enums}")
print(f"Total storage buckets: {len(storage_buckets)} -> {storage_buckets}")
print(f"Total realtime tables: {len(realtime_tables)} -> {realtime_tables}")
