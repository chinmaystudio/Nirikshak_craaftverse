# Nirikshak — Frontend Monorepo Structure

This directory organizes the Nirikshak platform into three independently deployable applications as specified in `Nirikshak_3_frontend_structure.md`.

## Directory Structure

```text
frontend/
├── user/              # Unified Citizen Frontend (Landing page + Citizen Portal interface)
├── government/        # Government officer monitoring & accountability portal
└── contractor/        # Contractor portal & bidding intelligence
```

---

## Applications & Quickstart

### 1. User Frontend (`user`)
Unifies the public Pragati landing page and the Nirikshan citizen interface in a single responsive web application:
- `/` $\rightarrow$ Public Pragati landing page (with 266-frame video scroll canvas, 10-stage lifecycle, AI framework)
- `#/home` or `/app` $\rightarrow$ Citizen / User Portal interface (Projects explorer, Vision AI scanner, complaints/grievance reporting, community issues, safety alerts)

- **Directory**: `frontend/user`
- **Commands**:
  ```bash
  cd user
  npm run dev          # Runs Vite dev server (unified landing + citizen portal)
  npm run typecheck    # Strict TypeScript verification
  npm run build        # Production bundle build
  ```

---

### 2. Government Frontend (`government`)
- **Directory**: `frontend/government`
- **Commands**:
  ```bash
  cd government
  npm install
  npm run dev          # Runs Vite dev server (http://localhost:5173)
  npm run build        # Typecheck (tsc) + production build
  ```

---

### 3. Contractor Frontend (`contractor`)
- **Directory**: `frontend/contractor`
- **Commands**:
  ```bash
  cd contractor
  npm install
  npm run dev          # Runs Vite dev server (http://localhost:3000)
  npm run build        # Production bundle build
  ```

---

## Independent Deployability

Each of the 3 frontend applications (`user`, `government`, `contractor`) is completely self-contained with its own `package.json`, Vite configuration, TypeScript settings, and styling pipeline. No backend or database connections are modified or coupled across boundaries.
