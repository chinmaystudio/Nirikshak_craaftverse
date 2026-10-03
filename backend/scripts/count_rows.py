import openpyxl

wb_path = r"E:\Nirikshak\NIRIKSHAK_India_Infrastructure_Audit_Workbook_Pune_2000_to_2026.xlsx"
wb = openpyxl.load_workbook(wb_path, read_only=True)

for name in ['Projects', 'Source Registry', 'Pune Deep Research']:
    sheet = wb[name]
    count = 0
    header_seen = False
    for row in sheet.iter_rows(values_only=True):
        if not any(row):
            continue
        first_cell = str(row[0]).strip() if row[0] is not None else ''
        if first_cell.startswith('NIR-') or first_cell.startswith('SRC-'):
            count += 1
    print(f"Sheet {name}: found {count} data rows starting with ID prefix")
