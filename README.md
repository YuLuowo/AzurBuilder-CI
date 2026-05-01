# AzurBuilder CI

Automated data pipeline system for processing and transforming raw Azur Lane game data into structured database-ready content.

This project downloads raw game JSON files, processes and transforms the data through custom pipelines, then stores optimized structured data into a Prisma-powered database for API consumption.

---

## Features

* Automated weekly data updates via GitHub Actions
* Raw JSON data synchronization from AzurLaneData repository
* Structured ETL-style data pipelines
* Data transformation and normalization
* Processed JSON generation
* Database synchronization with Prisma
* Optimized API-ready datasets
* Batch database insertion
* Type-safe pipelines using TypeScript
* Incremental pipeline architecture for future expansion

---

## Project Structure

```txt
AzurBuilder-CI
├── .github/workflows/
│   └── workflow.yml
│
├── commands/
│   ├── ship.ts
│   ├── equip.ts
│   └── main.ts
│
├── data/
│   ├── raw/
│   └── processed/
│
├── pipelines/
│   ├── ship.pipeline.ts
│   ├── equip.pipeline.ts
│   └── main.pipeline.ts
│
├── prisma/
│   └── schema.prisma
│
├── scripts/
│   ├── ship.ts
│   ├── equip.ts
│   └── main.ts
│
├── services/
│   └── database.ts
│
├── types/
│
├── utils/
│
└── package.json
```

---

## Data Flow

```txt
  AzurLaneData Repository
            ↓
    Raw JSON Download
            ↓
    Pipeline Transform
            ↓
    Processed JSON Data
            ↓
      Prisma Database
            ↓
           API
```

---

## Pipeline Architecture

Each pipeline follows a consistent structure:

```txt
runPipeline()
 ├── fetchAndSaveData()
 └── saveToDatabase()
```

This architecture allows:

* Easy maintenance
* Independent pipeline execution
* Better scalability
* Easier debugging
* Faster future expansion

---

## CI/CD Workflow

Automated workflow includes:

1. Download latest game JSON files
2. Detect changed files
3. Run transformation pipelines
4. Generate processed datasets
5. Synchronize database
6. Commit updated data automatically

Scheduled updates run weekly through GitHub Actions.

---

## Tech Stack

* TypeScript
* Prisma
* PostgreSQL
* pnpm
* GitHub Actions

---

## Purpose

This project focuses on building a scalable and maintainable game-data processing platform rather than serving raw static files directly.

The goal is to provide clean, optimized, API-ready structured data for future applications and services.
