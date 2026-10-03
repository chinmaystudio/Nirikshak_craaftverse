with open(r"E:\Nirikshak\frontend\seed_chunks\chunk_00.sql", "r", encoding="utf-8") as f:
    lines = f.readlines()

header = lines[0] # INSERT INTO ...
data = lines[1:51] # 50 rows
# Remove trailing comma on last row if present
data[-1] = data[-1].rstrip().rstrip(',') + '\n'
footer = "".join(lines[151:]) # ON CONFLICT ...

test_sql = header + "".join(data) + footer
with open(r"E:\Nirikshak\frontend\seed_chunks\test_50.sql", "w", encoding="utf-8") as f:
    f.write(test_sql)

print("Wrote test_50.sql, length:", len(test_sql))
