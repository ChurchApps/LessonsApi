# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LessonsApi is the Node.js/TypeScript backend for Lessons.church. Express.js with Inversify dependency injection, Kysely over MySQL, deployed to AWS Lambda via the Serverless Framework. Uses Yarn (Berry) — npm/pnpm installs are blocked by a preinstall check.

## Common Commands

### Development
```bash
yarn dev                 # Start development server with auto-reload (nodemon + tsx, port 8090)
yarn dev:start           # Build and start once
yarn start               # Start production server from dist/
```

### Building & Linting
```bash
yarn build               # Clean, lint, compile TypeScript, fix ESM imports
yarn build-fast          # Same without lint
yarn lint                # ESLint with auto-fix
yarn lint:check          # ESLint check only
```

### Testing
```bash
yarn test                # Jest unit tests with coverage
yarn test:watch          # Jest watch mode
```
Tests live in `__tests__/` folders next to the code (`src/**/__tests__/*.test.ts`), mirroring the main Api's conventions: repositories/controllers are tested with a mocked `getDb()` / hand-built doubles — no real database.

### Database
```bash
yarn initdb              # Create tables (migrations) and load demo data
yarn migrate:status      # Migration status (also migrate:up / migrate:down / migrate:create)
yarn reset-demo          # Drop + recreate the lessons DB and reload demo data (refuses non-local hosts)
```

### Deployment
```bash
yarn deploy-staging      # Build and deploy to staging
yarn deploy-prod         # Build and deploy to production
```

## Architecture

- **Models** (`src/models/`): interfaces for database entities and feed objects
- **Controllers** (`src/controllers/`): Express route handlers extending `LessonsBaseController`
- **Repositories** (`src/repositories/`): Kysely data access; `Repositories.getCurrent()` is the singleton registry
- **Helpers** (`src/helpers/`): external services (Vimeo, HubSpot, S3/transcoding), permissions, feed/playlist logic
- **DB** (`src/db/`): `getDb()` Kysely instance and `DatabaseTypes.ts` table typings

### Conventions
- Mutating routes check `au.checkAccess(Permissions.lessons.edit)` (or `Permissions.schedules.edit`) and scope every repository call by `au.churchId`.
- Anonymous read routes live under `/public/...` paths and use `actionWrapperAnon`; they must only serve `live` content or church-scoped display data.
- Repository `update`/`delete` always include a `churchId` where-clause so one church can't touch another's rows.

### Environment Configuration
- Environment-specific configs in `config/` (dev/demo/staging/prod/selfhost.json), loaded by `src/helpers/Environment.ts` based on `APP_ENV`
- Local secrets in `.env` (`CONNECTION_STRING`, `JWT_SECRET`, ...); AWS Parameter Store in deployed environments

### AWS Integration
- Lambda via Serverless Framework (`serverless.yml`); the `zipBundles` scheduled function runs every 5 minutes via `lambda.zipBundles` (not the HTTP route)
- S3 for file storage, Elastic Transcoder for webm generation

## Development Setup

1. Create MySQL database named `lessons`
2. Copy `dotenvsample.txt` to `.env` and configure the connection string
3. `yarn install`
4. `yarn initdb`
5. `yarn dev`
