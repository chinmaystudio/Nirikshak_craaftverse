-- Batch record
INSERT INTO public.import_batches (id, file_name, sha256, rows_total, rows_success, rows_failed)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'NIRIKSHAK_India_Infrastructure_Audit_Workbook_Pune_2000_to_2026.xlsx',
    '92d88406837524d5cc895b00f8388b875a3524901b5ad1861bfc6588e77f74ce',
    3933,
    3891,
    0
) ON CONFLICT (id) DO NOTHING;

-- Key Infrastructure Organizations
INSERT INTO public.organizations (id, name, type, department, state, district, verified) VALUES
('11111111-1111-1111-1111-111111111111', 'Pune Municipal Corporation (PMC)', 'ULB', 'Urban Development', 'Maharashtra', 'Pune', TRUE),
('22222222-2222-2222-2222-222222222222', 'Maharashtra Metro Rail Corporation Limited (Maha Metro)', 'government', 'Metro Rail', 'Maharashtra', 'Pune', TRUE),
('33333333-3333-3333-3333-333333333333', 'Pune Metropolitan Region Development Authority (PMRDA)', 'authority', 'Regional Planning', 'Maharashtra', 'Pune', TRUE),
('44444444-4444-4444-4444-444444444444', 'Maharashtra State Road Development Corporation (MSRDC)', 'authority', 'Highways & Expressways', 'Maharashtra', 'Mumbai/Pune', TRUE),
('55555555-5555-5555-5555-555555555555', 'Tata Projects Limited', 'contractor', 'Infrastructure Engineering', 'Maharashtra', 'Pune', TRUE),
('66666666-6666-6666-6666-666666666666', 'Larsen & Toubro Infrastructure (L&T)', 'contractor', 'Heavy Civil Infrastructure', 'Maharashtra', 'Pune', TRUE),
('77777777-7777-7777-7777-777777777777', 'J Kumar Infraprojects Limited', 'contractor', 'Metro & Flyovers', 'Maharashtra', 'Pune', TRUE)
ON CONFLICT (name) DO UPDATE SET verified = TRUE;
