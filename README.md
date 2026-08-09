# DevSecOps Compliance Hub

A full-stack platform that automatically scans container images, dependencies, and source code for security vulnerabilities on every push, enforces a zero-critical-CVE policy before code moves forward, and tracks every finding through a remediation lifecycle on a real-time compliance dashboard.

**Live demo:** https://devsecops-hub.vercel.app

### Pipeline status

[![DevSecOps Pipeline](https://github.com/pasupathy188/devsecops-hub/actions/workflows/trivy-scan.yml/badge.svg)](https://github.com/pasupathy188/devsecops-hub/actions/workflows/trivy-scan.yml)
[![Secrets Scan](https://github.com/pasupathy188/devsecops-hub/actions/workflows/secrets-scan.yml/badge.svg)](https://github.com/pasupathy188/devsecops-hub/actions/workflows/secrets-scan.yml)

### Built with

[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Trivy](https://img.shields.io/badge/Trivy-1904DA?logo=aquasecurity&logoColor=white)](https://trivy.dev/)
[![Semgrep](https://img.shields.io/badge/Semgrep-0B5394?logo=semgrep&logoColor=white)](https://semgrep.dev/)
[![Gitleaks](https://img.shields.io/badge/Gitleaks-FBBF24?logo=git&logoColor=black)](https://github.com/gitleaks/gitleaks)
[![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=white)](https://grafana.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

---

## What it does

Most CI pipelines run a scanner and print a report — this one **enforces a policy**. Every push triggers a pipeline that scans code, dependencies, and the built container, blocks the build if it finds an unresolved Critical or High severity issue, and feeds every finding into a MongoDB-backed dashboard where it's tracked from `Open` through `In Progress`, `Resolved`, and `Verified`.

## Architecture

```
┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend    │─────▶│   Backend     │─────▶│  MongoDB    │
│ React (Vercel)│ API  │ Express (Render)│      │  Atlas      │
└──────────────┘      └──────────────┘      └─────────────┘
                              ▲
                              │ POST scan/finding results (API key auth)
                    ┌──────────────────┐
                    │ GitHub Actions     │
                    │ DevSecOps Pipeline │
                    └──────────────────┘
                              │
        ┌───────────┬────────┼────────┬──────────────┐
        ▼           ▼        ▼        ▼              ▼
   npm audit     Semgrep   Docker   Trivy          SBOM
  (dependencies) (SAST)    build   (container)  (CycloneDX)
```

## Pipeline stages (on every push to `main`)

1. **Dependency audit** — `npm audit` on both `backend/` and `frontend/`
2. **Static code analysis** — Semgrep, `p/security-audit` ruleset
3. **Secrets scanning** — gitleaks, runs as a separate workflow on every push/PR
4. **Container build** — Docker image built from the backend
5. **Container vulnerability scan** — Trivy, `severity: CRITICAL,HIGH`, `exit-code: 1` (build fails on unresolved findings)
6. **SBOM generation** — CycloneDX format, uploaded as a build artifact
7. **Result ingestion** — raw scan + parsed findings POSTed to the backend, deduplicated and linked to their source scan

False positives (e.g. CVEs in npm's own bundled CLI tooling inside the base image, verified via `npm ls` to not be part of the actual dependency tree) are explicitly documented and excluded via `backend/.trivyignore` — see [`SECURITY.md`](./SECURITY.md) for the full reasoning.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Real-time updates | Socket.io |
| Containerization | Docker (non-root, multi-stage builds) |
| CI/CD | GitHub Actions |
| Vulnerability scanning | Trivy |
| Static analysis (SAST) | Semgrep |
| Secrets scanning | gitleaks |
| Observability | Prometheus + Grafana |
| Deployment | Render (API), Vercel (frontend), MongoDB Atlas (DB) |

## Security features

- API key authentication on all write routes (`POST`/`PUT`/`DELETE`)
- Rate limiting (`express-rate-limit`) and security headers (`helmet`)
- Non-root Docker containers, `.dockerignore` on all images (no secrets baked into image layers)
- Server-enforced consistency — `remediated` status is always derived server-side from `status`, never trusted from client input
- Deduplicated findings — re-scanning the same target doesn't flood the database with repeat entries for an already-open finding

## Data model

- **`Scan`** — one record per pipeline run: image name, timestamp, severity counts, full raw report
- **`Finding`** — one vulnerability: CVE ID, description, severity, status, source (`trivy` / `semgrep` / `npm-audit`), linked back to the `Scan` that found it
- **`Settings`** — alert thresholds and Slack/email destinations for the alerting system

## Running locally

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in your own MONGO_URI, API_KEY, etc.
node index.js

# Frontend
cd frontend
npm install
npm start
```

Or with Docker Compose:
```bash
docker compose up --build
```

## Known limitations

- Single shared API key rather than per-user authentication — sufficient for a single-maintainer project, not a production multi-user system
- `k8s-manifests/` demonstrates Kubernetes orchestration knowledge but is not the live deployment path (Render/Vercel is)
- Frontend build tooling (Create React App) has some unfixable `npm audit` findings in its own unmaintained build dependencies — documented in `SECURITY.md`, not shipped to production users

See [`SECURITY.md`](./SECURITY.md) for the full, honest breakdown of accepted risks and their justification.

## What I built this to demonstrate

A real shift-left security pattern: scan early, scan often, enforce a standard before merge, and keep a compliance-grade audit trail (SBOM, scan history, remediation status) — not just a vulnerability list nobody reads.