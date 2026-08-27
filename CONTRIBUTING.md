# Contributing to SARIF Security Report Viewer

Thank you for your interest in contributing to **SARIF Security Report Viewer**! We welcome bug reports, feature suggestions, documentation improvements, and code contributions.

---

## 🔒 Core Privacy Principle

**Shift-Left Privacy & Zero Exfiltration**:
All parsing, filtering, triage, and data exports must execute **strictly inside browser memory**. Under no circumstances should user report data, source code snippets, or findings telemetry be transmitted to external servers or remote endpoints.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v20.x or v22.x+
- **npm**: v10.x+
- **Docker** (optional, for container workflows): v24.x+
- **Make** (optional, for CLI shortcuts)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/angelcamposm/sarif-viewer.git
   cd sarif-viewer
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   # or
   make install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   # or
   make dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Available Scripts & Testing

Before submitting a Pull Request, verify that all checks pass cleanly:

| Command | Action |
| :--- | :--- |
| `npm run lint` / `make lint` | Runs `oxlint` on all TypeScript and TSX files |
| `npm run test` / `make test` | Runs unit tests via `vitest` |
| `npm run typecheck` / `make typecheck` | Validates TypeScript types (`tsc --noEmit`) |
| `npm run build` / `make build` | Compiles the production bundle into `dist/` |
| `make verify` | Runs all verification checks in sequence (`lint` ➔ `test` ➔ `typecheck` ➔ `build`) |

---

## 🏗️ Architecture Overview

```
src/
├── components/          # Reusable UI components & dialogs
│   ├── ui/              # Atom components (Badge, TagChip, etc.)
│   ├── DetailsPanel.tsx # Side panel for finding breakdown & context
│   ├── EmptyState.tsx   # Welcome landing screen & drag-drop zone
│   ├── FilterBar.tsx    # Faceted search & Radix UI combobox popovers
│   ├── FindingsTable.tsx# Interactive sortable & paginated findings table
│   ├── Header.tsx       # Top bar, export menu, theme switch & about modal
│   ├── MetricsBar.tsx   # Full-width responsive metrics summary
│   ├── MuteModal.tsx    # Individual finding suppression form
│   ├── MuteManagerDialog.tsx # Persistent browser suppression manager
│   └── RawSarifModal.tsx# Syntax-highlighted raw JSON code inspector
├── services/            # Pure domain services & business logic
│   ├── criticalityEngine.ts # Tag-based severity override calculator
│   ├── exportService.ts     # Multi-format exporter (CSV, SARIF, Markdown)
│   ├── muteStorage.ts       # Browser localStorage persistence provider
│   └── sarifParser.ts       # OASIS SARIF 2.1.0 JSON parser & normalizer
├── utils/               # Sanitization & highlighting helpers
│   ├── jsonHighlighter.ts   # Tokenizer & syntax highlighter for JSON
│   └── sanitize.ts          # DOMPurify wrapper for safe Markdown
└── types/               # TypeScript interfaces & SARIF schema definitions
```

---

## 🌿 Git & Pull Request Guidelines

1. **Branch Naming**:
   - Features: `feat/feature-name`
   - Bug fixes: `fix/bug-description`
   - Refactor / Docs: `refactor/scope` or `docs/update-readme`

2. **Commit Messages**:
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add rule categorization in filter popover`
   - `fix: prevent horizontal scroll overflow in raw JSON viewer`
   - `docs: update deployment pipeline guide`

3. **Submitting a PR**:
   - Create a Pull Request against the `main` branch.
   - Describe the changes made and link any associated GitHub issues.
   - Ensure the automated GitHub Actions CI pipeline passes with 0 warnings.
