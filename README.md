<div align="center">

# 🛡️ SARIF Security Report Viewer

**A fast, modern, privacy-first SARIF 2.1.0 static analysis report viewer.**
Inspect, triage, search, filter, and suppress security findings in your browser with zero data exfiltration.

[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/angelcamposm/sarif-viewer/ci.yml?branch=main&label=CI&logo=github)](https://github.com/angelcamposm/sarif-viewer/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker Rootless](https://img.shields.io/badge/Docker-Rootless_8080-2496ed?logo=docker&logoColor=white)](Dockerfile)
[![Shift-Left Privacy](https://img.shields.io/badge/Privacy-100%25_In--Browser-10b981?logo=shield&logoColor=white)](#-privacy--security-first)

[Live Demo](https://angelcamposm.github.io/sarif-viewer/) • [Features](#-key-features) • [Quick Start](#-quick-start) • [Docker](#-docker-deployment) • [Contributing](CONTRIBUTING.md)

</div>

---

## 🌟 Why SARIF Security Report Viewer?

Modern DevSecOps workflows generate OASIS SARIF 2.1.0 reports from diverse SAST and SCA tools (such as **GitHub CodeQL**, **Semgrep**, **Trivy**, **Snyk**, **ESLint**, **Bandit**, **Checkov**, and **Gitleaks**). 

This viewer delivers an intuitive, shift-left triage interface directly in the browser—eliminating the need to upload proprietary source code or vulnerability reports to external cloud services.

---

## ✨ Key Features

### 🔒 Privacy & Security First
- **100% Client-Side Execution**: Parsing, filtering, sorting, and reporting occur strictly in your browser memory.
- **Zero Remote Telemetry**: No tracking, analytics, or external API calls. Your security findings never leave your machine.

### 🎯 Full OASIS SARIF 2.1.0 Compliance
- Seamlessly aggregates and normalizes multi-run SARIF reports with tools, rules, source code snippets, help URIs, and artifact locations.

### 🏷️ Dynamic Criticality Tag Overrides
- Automatically identifies custom priority tags (such as `CRITICAL`, `BLOCKER`, `HIGH`, `P0`, `P1`) in rule properties or result tags.
- Elevates severity levels dynamically per your organization's custom AppSec policy.

### 🔕 In-Browser Alert Muting & Suppressions
- Mute false positives or accepted risks locally in browser `localStorage`.
- Record suppression reasons (`False Positive`, `Accepted Risk`, `Compensating Control`, `Fix Pending`) with audit justifications.
- Import and export compliant SARIF suppressions for CI/CD audit logs.

### 📊 Interactive Findings Table
- **Interactive Multi-Column Sorting**: Sort findings by **Rule ID**, **Severity Level**, **Message**, or **File Path**.
- **Client-Side Pagination**: Configure 10, 25, 50, 100, or All findings per page with quick jump controls.
- **Keyboard Navigation**: Use <kbd>↑</kbd> and <kbd>↓</kbd> arrow keys to navigate rows seamlessly.
- **Smart Wrapping**: 500px constrained message column with multiline wrapping.

### 🔍 Deep Finding Breakdown & Context Panel
- Displays the loaded **Report File Name**, tool driver version, deduplicated tags, Markdown messages, and source code snippet previews.
- 1-click file path copying with visual feedback.

### 💻 Syntax-Highlighted Raw SARIF Inspector
- Embedded IDE code view highlighting JSON keys, strings, numbers, booleans, and nulls.
- Features line numbering, 1-click JSON copy, and direct `.json` finding download with a clean, unified horizontal scrollbar.

### 📤 Multi-Format Exporting
- Export filtered or full report results to:
  - 📊 **CSV Spreadsheet** (for spreadsheet reporting and triage tracking)
  - 📝 **Executive Markdown Report** (ready for GitHub Issues and PR comments)
  - 🛡️ **Clean SARIF 2.1.0 JSON** (normalized and sanitized)

### 🎨 Neutral Zinc & True Black Theme
- Sleek **Zinc-950** (`#09090b`) dark palette free from blue tint.
- Fully preserved high-contrast Light Theme.
- Automatic OS theme detection with persistent `localStorage` preference toggle.

---

## 🚀 Quick Start

### Option 1: Running Locally (Node.js)

#### Prerequisites
- Node.js `v20.x` or `v22.x+`
- npm `v10.x+`

```bash
# 1. Clone the repository
git clone https://github.com/angelcamposm/sarif-viewer.git
cd sarif-viewer

# 2. Install dependencies
npm ci

# 3. Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option 2: Running with Docker (Rootless)

Run the production-ready rootless container listening on port `8080`:

```bash
# Build the Docker image
docker build -t sarif-viewer .

# Run the container
docker run --rm -p 8080:8080 --name sarif-viewer sarif-viewer
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

### Option 3: Running with Docker Compose

```bash
# Start container in detached mode
docker compose up -d

# View live logs
docker compose logs -f

# Stop container
docker compose down
```

---

## 🛠️ Makefile Commands

A complete `Makefile` is included to streamline common developer workflows:

| Command | Description |
| :--- | :--- |
| `make help` | Displays all available make targets |
| `make install` | Cleanly installs dependencies (`npm ci`) |
| `make dev` | Starts Vite local development server (`http://localhost:5173`) |
| `make build` | Compiles the production bundle into `dist/` |
| `make preview` | Previews the production bundle locally |
| `make lint` | Runs the fast linter (`oxlint`) |
| `make test` | Runs the unit test suite (`vitest`) |
| `make typecheck` | Validates TypeScript compiler types (`tsc --noEmit`) |
| `make verify` | Runs the full verification pipeline (`lint` ➔ `test` ➔ `typecheck` ➔ `build`) |
| `make clean` | Removes build outputs (`dist/`, `coverage/`, `.zip`) |
| `make docker-build` | Builds the rootless production Docker image |
| `make docker-run` | Runs the container locally on `http://localhost:8080` |
| `make docker-compose-up` | Starts Docker Compose in background mode |
| `make docker-compose-down`| Tears down Docker Compose services |

---

## 🏗️ Project Architecture

```
sarif-viewer/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Automated lint, test, typecheck, and docker smoke test
│       ├── deploy.yml      # Automated GitHub Pages static deployment
│       └── release.yml     # Automated GitHub Release packaging & GHCR Docker publish
├── public/                 # Static assets & web icons
├── src/
│   ├── components/         # React UI components (Radix UI + Lucide)
│   │   ├── ui/             # Atomic badge & tag chip components
│   │   ├── DetailsPanel.tsx# Context breakdown, tags, snippets, rules
│   │   ├── EmptyState.tsx  # Welcome landing screen & drop zone
│   │   ├── FilterBar.tsx   # Search & faceted combobox popovers
│   │   ├── FindingsTable.tsx# Sortable, paginated table
│   │   ├── Footer.tsx      # Status bar and finding counters
│   │   ├── Header.tsx      # Navigation, exports, theme switch, about modal
│   │   ├── MetricsBar.tsx  # Space-filling metric cards
│   │   ├── MuteModal.tsx   # Alert suppression form dialog
│   │   ├── MuteManagerDialog.tsx # Browser localStorage suppression manager
│   │   └── RawSarifModal.tsx# Syntax-highlighted JSON inspector
│   ├── data/               # Built-in sample SARIF reports
│   ├── services/           # Domain business logic & parsing
│   │   ├── criticalityEngine.ts # Priority tag override evaluator
│   │   ├── exportService.ts     # Multi-format report exporter
│   │   ├── muteStorage.ts       # Browser localStorage provider
│   │   └── sarifParser.ts       # OASIS SARIF 2.1.0 normalizer
│   ├── types/              # TypeScript interfaces & SARIF schema types
│   ├── utils/              # Tokenizers, sanitizers, and formatters
│   ├── App.tsx             # Root coordinator & state manager
│   ├── index.css           # Tailwind CSS v4 rootless & dark theme variables
│   └── main.tsx            # Application entry point
├── Dockerfile              # Multi-stage rootless Alpine Nginx container
├── docker-compose.yml      # Docker Compose definition
├── nginx.conf              # Hardened master Nginx SPA configuration
├── Makefile                # Developer task automation
├── CONTRIBUTING.md         # Contribution guidelines
├── CHANGELOG.md            # Release log (Keep a Changelog standard)
└── LICENSE                 # MIT License
```

---

## 🔄 CI/CD & Automated Pipelines

This repository is configured with 3 GitHub Actions workflows:

1. **Continuous Integration ([`ci.yml`](.github/workflows/ci.yml))**:
   - Runs automatically on every pull request and push to `main`/`master`.
   - Executes `oxlint`, `vitest` unit tests, `tsc` type checks, and validates the Docker build.
2. **GitHub Pages Deployment ([`deploy.yml`](.github/workflows/deploy.yml))**:
   - Automatically builds and deploys the production web client to GitHub Pages upon merge to `main`.
3. **Release Pipeline ([`release.yml`](.github/workflows/release.yml))**:
   - Triggers on version tags (`v*`, e.g. `v1.0.0`).
   - Generates a GitHub Release with attached `sarif-viewer-vX.Y.Z.zip` bundle and auto-generated release notes.
   - Builds and publishes multi-architecture container images (`linux/amd64`, `linux/arm64`) to **GitHub Container Registry** (`ghcr.io`).

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CONTRIBUTING.md) before submitting pull requests.

```bash
# Run the test suite before submitting a PR
make verify
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
