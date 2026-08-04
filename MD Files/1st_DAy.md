# DAY_1_PLAN.md: Project Setup, Local Storage & FastAPI Architecture

## Objective
Set up the core local development environment, project directory structure, Dockerized infrastructure (PostgreSQL + Redis), FastAPI core server with static local file storage, and initial upload endpoint.

---

## Task 1: Initialize Project Directory Hierarchy

Create the following folder structure on the host machine:

```bash
mkdir -p backend/app/api
mkdir -p backend/app/core
mkdir -p backend/app/db
mkdir -p backend/app/models
mkdir -p backend/app/schemas
mkdir -p backend/app/storage
mkdir -p storage_data/uploads/raw
mkdir -p storage_data/uploads/preprocessed
mkdir -p storage_data/catalogue/textures
mkdir -p storage_data/catalogue/thumbnails