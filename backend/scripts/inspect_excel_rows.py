import openpyxl

wb_path = r"E:\Nirikshak\NIRIKSHAK_India_Infrastructure_Audit_Workbook_Pune_2000_to_2026.xlsx"
wb = openpyxl.load_workbook(wb_path, read_only=True)

for name in ['Projects', 'Source Registry', 'Data Dictionary', 'Pune Deep Research']:
    sheet = wb[name]
    print(f"\n==================== Sheet: {name} ====================")
    row_idx = 0
    for row in sheet.iter_rows(values_only=True):
        row_idx += 1
        vals = [c for c in row if c is not None]
        if vals:
            print(f"Row {row_idx}: {row[:10]}")
        if row_idx >= 5:
            break
