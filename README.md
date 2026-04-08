# Normandale Schedule AI

Normandale Schedule AI is a Normandale-only planning website that helps students upload a Normandale academic record PDF, upload a few semester subject PDFs, add practical schedule constraints, and receive ranked semester schedule options.

## What is implemented

- Next.js App Router scaffold for a hosted web app
- Normandale-specific upload APIs:
  - `POST /api/uploads/transcript`
  - `POST /api/uploads/pathway`
  - `POST /api/uploads/course-search`
  - `POST /api/plan/generate`
  - `GET /api/plan/:id`
- Specialized parsers for:
  - Normandale academic record PDFs
  - Normandale Student e-Services course search PDFs
  - Normandale Computer Science Transfer Pathway PDF validation
- CS Transfer Pathway requirement catalog focused on the high-signal core CS pathway requirements for v1
- Schedule generator that ranks plans by requirement progress, manageable credit load, and time fit
- ADHD-friendly one-page planner UI with short steps and fast feedback
- Prisma schema for the future PostgreSQL-backed storage layer
- Vitest tests for transcript parsing and schedule generation logic

## Current storage model

The code currently uses a small file-backed repository in `.data/` so uploads survive local dev refreshes and recompiles. The Prisma schema is included so the app can be wired to PostgreSQL next without changing the public API shape.

## Go-live next step

The fastest path to production is:

1. Deploy the Next.js app to Vercel.
2. Replace the local `.data/` repository with real persistent storage:
   - PostgreSQL for plans and parsed metadata
   - object storage for uploaded PDFs
3. Seed the built-in Fall 2026 catalog on the server:
   - easiest option: generate a JSON catalog locally and point `FALL_2026_CATALOG_PATH` at it
   - fallback option: require users to upload subject PDFs instead of relying on a built-in catalog

## Production notes

- `FALL_2026_CATALOG_PATH` can point to a checked-in or mounted JSON file containing parsed Fall 2026 offerings.
- If no built-in catalog is available in production, the app now warns the user instead of silently assuming it exists.
- The current file-backed `.data/` repository is good for local work but not for a public deployment, because serverless or ephemeral hosts may clear local disk.
- The app is already building cleanly for production with `npm run build`.

## Local setup

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Run tests:

```bash
npm test
```

## Notes

- The parser is intentionally Normandale-specific and should fail clearly on non-Normandale exports.
- The current requirement profile is CS Transfer Pathway-first and designed so more Normandale programs can be added as structured configs later.
- The uploaded pathway PDF is validated and stored, while runtime planning currently uses the built-in structured requirement profile rather than reparsing the PDF every time.
