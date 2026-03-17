<!--
  Sync Impact Report
  ==================
  Version change: (none) → 1.0.0 (initial ratification)

  Added principles:
    - I. Clean Code & Functional Design (SOLID)
    - II. Test-Driven Development (NON-NEGOTIABLE)
    - III. Vercel-Ready Deployment
    - IV. Developer Experience First
    - V. Literate Programming

  Added sections:
    - Technology & Deployment Constraints
    - Development Workflow

  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — no changes needed
       (Constitution Check section is dynamic, filled at plan time)
    ✅ .specify/templates/spec-template.md — no changes needed
       (user story structure already compatible)
    ✅ .specify/templates/tasks-template.md — no changes needed
       (test-first ordering already present in template)

  Follow-up TODOs: none
-->

# Map Probability Constitution

## Core Principles

### I. Clean Code & Functional Design (SOLID)

- All code MUST follow Clean Code principles: meaningful names,
  small focused functions, no side effects where avoidable.
- Prefer pure functions and immutable data. State mutations MUST be
  isolated at system boundaries (event handlers, API routes, stores).
- SOLID principles apply at module level:
  - **Single Responsibility**: each module/file owns one concern.
  - **Open/Closed**: extend via composition, not modification.
  - **Liskov Substitution**: shared interfaces MUST be
    substitutable without behavioral surprises.
  - **Interface Segregation**: consumers MUST NOT depend on
    methods they do not use.
  - **Dependency Inversion**: high-level logic MUST NOT import
    low-level implementation details directly; use abstractions.
- Functions MUST be ≤ 30 lines. Files MUST be ≤ 300 lines.
  Exceptions require a justification comment at the top.

### II. Test-Driven Development (NON-NEGOTIABLE)

- Every feature MUST follow Red-Green-Refactor:
  1. Write failing tests that express the requirement.
  2. Implement the minimum code to make tests pass.
  3. Refactor while keeping tests green.
- Test files MUST live alongside source files or in a mirrored
  `__tests__/` directory.
- Unit test coverage MUST reach ≥ 80% for all new modules.
- Integration tests MUST cover every user-facing workflow
  (API route, UI interaction, data pipeline).
- Tests MUST be deterministic — no network calls, no timing
  dependencies. Use mocks/stubs for external services.

### III. Vercel-Ready Deployment

- The project MUST be deployable on Vercel with zero custom
  build scripts beyond what `vercel.json` and framework
  conventions provide.
- All environment-specific configuration MUST use environment
  variables. No hardcoded URLs, keys, or stage identifiers.
- Serverless function constraints MUST be respected:
  cold-start budget ≤ 5 s, bundle size minimized, no long-lived
  connections unless using Vercel-supported primitives.
- Every PR MUST be preview-deployable. Builds that fail on
  Vercel preview MUST be treated as CI failures.
- Edge/middleware functions MUST use only the Web-standard API
  surface supported by the Vercel Edge Runtime.

### IV. Developer Experience First

- `npm install && npm run dev` (or equivalent) MUST produce a
  working local environment within 60 seconds on a fresh clone.
- All scripts MUST be documented in `package.json` with clear
  names (`dev`, `build`, `test`, `lint`, `typecheck`).
- TypeScript strict mode MUST be enabled. No `any` types unless
  explicitly justified with a `// eslint-disable` + comment.
- Linting (ESLint) and formatting (Prettier) MUST run on
  pre-commit. CI MUST reject commits that fail these checks.
- Error messages surfaced to developers MUST include actionable
  context (what failed, where, and suggested fix).

### V. Literate Programming

- Every module MUST have a companion `.md` file (or a header
  doc block ≥ 10 lines) explaining its purpose, design
  decisions, and public API.
- Architecture documentation MUST include MermaidJS diagrams
  for: system overview, data flow, and state transitions.
- A top-level `docs/` directory MUST contain:
  - `architecture.md` with at least one MermaidJS system diagram.
  - `data-model.md` with entity-relationship MermaidJS diagrams.
  - Per-feature docs linked from a `docs/index.md` table of
    contents.
- Documentation MUST be updated in the same PR as code changes.
  Stale docs are treated as bugs.
- MermaidJS diagrams MUST be used over static images wherever
  the diagram represents structure or flow (prefer text-as-code
  over binary assets).

## Technology & Deployment Constraints

- **Runtime**: Node.js (LTS). Framework determined per feature
  but MUST be Vercel-compatible (Next.js, SvelteKit, Astro,
  or similar).
- **Language**: TypeScript (strict mode). JavaScript files are
  NOT permitted in `src/`.
- **Package Manager**: npm or pnpm. Lock files MUST be committed.
- **CI/CD**: Vercel Git integration. Preview deploys on every PR;
  production deploys from `main` branch only.
- **Secrets**: MUST use Vercel Environment Variables or a
  `.env.local` file (git-ignored). No secrets in code or config
  files.

## Development Workflow

- **Branching**: Feature branches from `main`. Branch names MUST
  follow `<type>/<short-description>` (e.g., `feat/map-layer`).
- **Commits**: Conventional Commits format
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- **Pull Requests**: Every PR MUST include:
  1. Passing tests (unit + integration).
  2. Updated documentation (if behavior changes).
  3. Successful Vercel preview deployment.
- **Code Review**: At least one approval required before merge.
  Reviewers MUST verify constitution compliance.
- **Quality Gates**: PRs MUST pass linting, type-checking, test
  suite, and Vercel build before merge.

## Governance

- This constitution supersedes all other development practices
  for the Map Probability project.
- Amendments MUST be documented with a version bump, rationale,
  and migration plan for any breaking changes.
- Version increments follow semantic versioning:
  - **MAJOR**: Principle removal or incompatible redefinition.
  - **MINOR**: New principle or materially expanded guidance.
  - **PATCH**: Clarification, wording, or typo fix.
- All PRs and code reviews MUST verify compliance with these
  principles. Non-compliance MUST be flagged and resolved before
  merge.
- Complexity beyond what these principles prescribe MUST be
  justified in the PR description with a rationale for why the
  simpler approach is insufficient.

**Version**: 1.0.0 | **Ratified**: 2026-03-17 | **Last Amended**: 2026-03-17
