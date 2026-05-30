# Running Migrations

## First time setup
```bash
cd backend
docker compose up postgres -d          # start DB
alembic upgrade head                   # run all migrations (0001 → latest)
```

## After pulling new code
```bash
alembic upgrade head
```

## Create a new migration
```bash
alembic revision --autogenerate -m "describe_the_change"
# Review the generated file in alembic/versions/ before running
alembic upgrade head
```

## Current migration chain
- 0001: initial schema (users, patients, documents, medical_events, share_tokens)
- 0002: add is_active to patients
- 0003: add ai_summary to documents
