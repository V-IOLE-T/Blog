# AGENTS.md

Instructions for AI coding agents working with this codebase.

## Handoff Discipline

`HANDOFF.md` is the canonical continuity file for this repo.

### Start Of Work

- At the start of any resumed or takeover session, read `HANDOFF.md` first before making assumptions.
- Treat the newest section in `HANDOFF.md` as the freshest source of operational context when it conflicts with older notes.

### Before Context Compression Or Session Handoff

- Before any likely context compression, long-thread checkpoint, or session handoff, update `HANDOFF.md`.
- The update must be concrete enough that the next agent can continue by reading only `HANDOFF.md`.
- Always include:
  - current goal
  - what was tried
  - what worked
  - what did not work or was misleading
  - current environment / deployment state
  - exact next recommended actions
  - any commands, file paths, URLs, image IDs, container IDs, or timestamps that materially reduce re-discovery work

### Writing Style For HANDOFF.md

- Prefer append-only updates with a dated section rather than rewriting history aggressively.
- If older conclusions are stale, explicitly mark the newer section as authoritative.
- Write for a cold-start agent: assume they have no fresh memory beyond this file.

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->
