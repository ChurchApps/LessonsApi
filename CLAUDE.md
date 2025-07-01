# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the LessonsApi - a Node.js/TypeScript API providing the backend for Lessons.church. It's built with Express.js, uses dependency injection via Inversify, and deploys to AWS Lambda via Serverless Framework.

## Common Commands

### Development
```bash
npm run dev              # Start development server with auto-reload
npm run dev:start        # Build and start once
npm start                # Start production server
```

### Building & Linting
```bash
npm run build            # Clean, lint, and compile TypeScript
npm run clean            # Remove dist directory
npm run lint             # Run TSLint with auto-fix
npm run tsc              # Compile TypeScript only
```

### Database
```bash
npm run initdb           # Initialize database tables from tools/dbScripts/
```

### Deployment
```bash
npm run deploy-staging   # Build and deploy to staging environment
npm run deploy-prod      # Build and deploy to production environment
npm run serverless-local # Test Lambda function locally
```

## Architecture

### Core Structure
- **Models** (`src/models/`): TypeScript classes representing database entities and feed objects
- **Controllers** (`src/controllers/`): Express route handlers extending LessonsBaseController
- **Repositories** (`src/repositories/`): Data access layer for database operations
- **Helpers** (`src/helpers/`): Utility classes for external services, permissions, and business logic

### Dependency Injection
Uses Inversify for dependency injection. Controllers are automatically registered via decorators and the `src/inversify.config.ts` bindings.

### Base Classes
- All controllers extend `LessonsBaseController` which provides access to repositories
- Uses `@churchapps/apihelper` for common functionality like authentication and database pooling

### Environment Configuration
- Environment-specific configs in `config/` directory (dev.json, staging.json, prod.json)
- `Environment.ts` loads configuration and AWS parameters based on APP_ENV
- Uses dotenv for local development environment variables

### AWS Integration
- Deploys as Lambda functions via Serverless Framework
- Uses AWS S3, Elastic Transcoder, and Parameter Store
- Configured for VPC deployment in production

### Database
- MySQL database with connection pooling via @churchapps/apihelper
- Database initialization scripts in `tools/dbScripts/`
- Repository pattern for data access

## Development Setup

1. Create MySQL database named `lessons`
2. Copy `dotenv.sample.txt` to `.env` and configure database connection
3. Run `npm install`
4. Initialize database with `npm run initdb` 
5. Start development server with `npm run dev`

## Key Dependencies

- **Express.js**: Web framework
- **Inversify**: Dependency injection container
- **@churchapps/apihelper**: Shared utilities for authentication, database, and AWS
- **TypeScript**: Primary language
- **Serverless Framework**: Deployment and AWS Lambda configuration
- **TSLint**: Code linting (note: using legacy TSLint, not ESLint)

## Testing

No test framework is currently configured. The test script outputs an error message.