# Changelog

All notable changes to the **SARIF Security Report Viewer** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-27

### Added
- **OASIS SARIF 2.1.0 Compliance**: Complete client-side parsing, schema normalization, and multi-run report aggregation for industry-standard SAST tools (CodeQL, Semgrep, Trivy, Snyk, ESLint, Bandit, etc.).
- **Shift-Left Privacy Engine**: 100% in-browser processing with zero telemetry or remote network data exfiltration.
- **Dynamic Criticality Tag Overrides**: Automatic calculation and triage promotion based on priority tags (e.g. `CRITICAL`, `HIGH`, `P0`, `BLOCKER`).
- **In-Browser Alert Muting & Suppression Manager**:
  - Suppress false positives or accepted risks directly in `localStorage` with justification audit notes.
  - Export suppressions as standard SARIF JSON or import external suppression lists.
- **Interactive Findings Table**:
  - Multi-column interactive sorting (Rule, Level, Message, File).
  - Client-side pagination with selectable page sizes (10, 25, 50, 100, or All) and page jump navigation.
  - Multiline message wrapping with fixed max-width constraint.
  - Keyboard arrow navigation (`ArrowUp` / `ArrowDown`).
- **Comprehensive Finding Details Side Panel**:
  - Context section displaying the loaded report file name and tool driver.
  - Baseline level and overwrite level display with Markdown message rendering.
  - Case-insensitive tag deduplication.
  - Code snippet preview with line numbers and 1-click file path copying.
- **Syntax-Highlighted Raw SARIF Modal**:
  - Tokenized color coding for keys, strings, numbers, booleans, and null values.
  - IDE-style line numbering, 1-click JSON copy, and `.json` file download.
  - Single bottom horizontal scrollbar.
- **Faceted Filter Bar**: Radix UI popovers for categorized severity levels, searchable rule IDs, searchable tags, and mute status filters.
- **Space-Filling Metrics Bar**: 100% full-width auto-fractional grid cards with left-aligned icons and click-to-filter capability.
- **Multi-Format Export**: Export filtered or full findings to **CSV**, **Markdown Report**, or clean **SARIF 2.1.0 JSON**.
- **Neutral Zinc & Black Dark Theme**:
  - Neutral `#09090b` (Zinc-950) dark theme with system preference auto-detection.
  - Header & welcome landing theme switchers with `localStorage` persistence.
  - 100% style preservation for light mode.
- **Rootless Containerization**:
  - Multi-stage Dockerfile running unprivileged `USER nginx` on IPv4 port `8080`.
  - Hardened master Nginx configuration with SPA routing fallback, gzip compression, and security headers.
  - Docker Compose configuration for one-command local execution.
- **CI/CD & Automation**:
  - GitHub Actions CI pipeline for automated linting, testing, type checking, and Docker build smoke testing.
  - GitHub Actions Release pipeline for automated GitHub Releases, zipped artifact packaging, and GHCR multi-arch Docker image publishing.
  - GitHub Actions Deployment pipeline for automated GitHub Pages hosting.
  - Comprehensive `Makefile` for developer tasks and testing.
