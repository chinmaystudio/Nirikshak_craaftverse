import os

# Let's inspect the existing chunk_00.sql and test with 100 rows first
with open(r"E:\Nirikshak\frontend\seed_chunks\chunk_00.sql", "r", encoding="utf-8") as f:
    text = f.read()

# Let's see how many values lines are in chunk_00.sql
lines = text.splitlines()
print(f"Total lines in chunk_00.sql: {len(lines)}")
# Row 0 is INSERT INTO ... VALUES
# Last 19 lines are ON CONFLICT ...
header = lines[0]
footer = "\n".join(lines[-20:])
data_rows = lines[1:-20]

print(f"Header: {header[:60]}...")
print(f"Data rows count: {len(data_rows)}")
print(f"Footer: {footer[:60]}...")
