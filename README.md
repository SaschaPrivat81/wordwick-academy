# Wordwick Academy

Wordwick Academy is a magical English learning app for children. The current codebase is a cleaned-up starting point from the original prototype and will evolve into a role-based learning world with quests, vocabulary practice, irregular verb training, parent-managed content, and rewards.

## Current Stack

- React + Vite frontend
- Express backend
- SQLite via `better-sqlite3`
- Tailwind CSS

## Local Development

```bash
npm install
npm run dev
```

The frontend runs through Vite. The API server can be started separately:

```bash
npm run dev:server
```

For production-style serving, build first and then start the server:

```bash
npm run build
npm run server
```

## Environment

Copy `.env.example` to `.env` and set production values when deploying:

```bash
PORT=3000
DATABASE_PATH=wordwick-academy.db
SESSION_SECRET=change-this-for-production
```

## Repository Hygiene

The repository should include source code, configuration, and lockfiles. It should not include:

- `node_modules`
- `dist`
- local SQLite database files
- `.env` secrets

## Near-Term Product Direction

- Rename and restyle the app fully around Wordwick Academy
- Replace the current simple map with a magical school world map
- Add a mascot guide and stronger game feedback
- Move quests and level definitions out of hardcoded frontend arrays
- Add proper user roles for child and parent/admin
- Expand task types beyond flashcards
- Build a parent dashboard for vocabulary, levels, rewards, and progress
