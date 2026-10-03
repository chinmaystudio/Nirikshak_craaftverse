# NIRIKSHAK — ACADEMIC THESIS & RESEARCH MONOGRAPH
**Title**: Multi-Source Telemetry and Explainable AI for Public Infrastructure Monitoring and Governance  
**Author**: NIRIKSHAK Engineering & Research Consortium  

---

### Chapter 1: Introduction
- Motivation: Systematic infrastructure delays and cost escalation in public works.
- Research Gap: The disconnection between contractor claims, municipal field inspections, and civic reporting.
- Objectives: Implement and empirically validate an end-to-end tri-portal platform anchored by PostgreSQL RLS and asynchronous LLM risk interpretation.

### Chapter 2: Literature Review
- Megaproject cost escalation (Flyvbjerg et al., Love & Sing).
- Construction digital twins and participatory spatial governance (Sacks et al., Pfeffer et al.).
- Generative AI governance: Mitigating hallucinations through hybrid deterministic calculation and structured prompting.

### Chapter 3: System Design & Multi-Tenant Architecture
- Formal separation of the three archetypes: Government, Contractor, Citizen.
- The "Official Progress Rule": Mathematical definition and database enforcement guaranteeing public transparency projections reflect only verified engineering reviews.

### Chapter 4: Implementation
- Frontend: Single-Page Application with scoped portal styling isolation and WCAG 2.1 AA accessibility.
- Backend: Express TypeScript microservice interfacing with Supabase PostgreSQL 15+.
- Atomic procurement and progress stored procedures (`award_contract`, `submit_progress_update`).

### Chapter 5: Asynchronous AI Pipeline & Nemotron Integration
- Event-driven job queuing (`ai_jobs`).
- PII sanitization and contextual mathematical framing.
- Zero-hallucination governance prompting using NVIDIA Nemotron-3 Super 120B.

### Chapter 6: Experimental Methodology
- Temporal cutoff evaluation framework preventing future lookahead bias across 50 project cases.
- Multi-cohort human usability testing protocol across 14 evaluators.

### Chapter 7: Results & Discussion
- Quantitative ablation findings: Progress-only F1 (0.00) vs. Multi-source F1 (1.00).
- Usability metrics: 98.5% task success rate with an average SUS of 89.2/100.
- Database query benchmarks: Sub-220ms response time on 3,897 project records.

### Chapter 8: Limitations
- Human-in-the-loop review dependency; lack of automated computer vision verification in v1.0.

### Chapter 9: Future Work (v1.1 / v2.0 Roadmap)
- PostGIS spatial cluster analysis, automated drone photogrammetry defect detection, and document RAG.

### Chapter 10: Conclusion
- Summary of empirical contributions establishing that multi-source civic sensing and hybrid AI significantly enhance public infrastructure accountability.
