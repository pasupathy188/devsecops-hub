# Security

## Known Accepted Risks

Frontend `npm audit` reports vulnerabilities in `react-scripts`'s internal
build tooling (Jest, webpack-dev-server, PostCSS, SVGO, serialize-javascript,
underscore via jsonpath/bfj, uuid via sockjs).

These packages are development/build-time dependencies only — they do not
ship in the production bundle served to users and have no runtime attack
surface. This is a widely known limitation of Create React App, whose
dependency tree has not been actively maintained by the upstream project.

**Verification method:** `npm ls <package>` for each flagged dependency
confirms all resolve exclusively through `react-scripts`'s build chain
(e.g. `react-scripts -> postcss -> nanoid`), never through application
code that ships to users.

**Mitigation path:** migrate the frontend build tool from Create React App
to Vite, which has a significantly smaller and more actively maintained
dependency footprint. Tracked as a future improvement, out of scope for
the current project phase.

## Backend Dependencies

Backend dependencies (`backend/package.json`) are actively kept clean —
`npm audit` reports 0 vulnerabilities as of the last check. Mongoose was
upgraded from 6.12.0 to 9.9.1 after a Critical CVE (CVE-2025-23061) was
identified via container scanning.

## Container Scanning

Container images are scanned on every push via Trivy, with a small number
of confirmed false positives excluded via `backend/.trivyignore` — these
are vulnerabilities in npm's own bundled CLI tooling shipped inside the
`node:22-alpine` base image, verified via `npm ls` to not be part of the
application's actual dependency tree.

## Reporting

This is a portfolio/learning project. If you notice something concerning,
open an issue on the repository.

## Verified Pipeline Behavior

The CI/CD security gate was manually tested by intentionally reintroducing a
known-vulnerable dependency (mongoose 6.12.0, containing CVE-2025-23061 and
related CVEs). The pipeline correctly:
- Detected the vulnerability via both Trivy (container scan) and npm audit
- Blocked the build (exit-code: 1) instead of allowing it to pass
- Populated the finding in the compliance dashboard with correct severity and source

The dependency was then restored to a patched version and the pipeline
confirmed green again, validating the full scan-gate-report loop end to end.
