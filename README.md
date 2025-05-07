# Project Setup Guide

## Environment Setup

Before running the services, you need to set up a virtual environment in both the `ai-model` and `backend` directories.

### 1. Set Up Virtual Environments

#### For the AI Service

```bash
cd ai-model
python -m venv .venv
.venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

#### For the Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

---

## How to Run the Project

### 1. Start OpenSearch

Make sure Docker is running (Docker needs to be installed[Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/)), then from the project root:

```bash
docker-compose up -d
```

This will start OpenSearch in detached mode. You can check if it’s running with:

```bash
docker ps
```

---

### 2. Start the AI Service

In a new terminal (PowerShell or command prompt):

```bash
cd ai-model
.venv\Scripts\activate
python main.py
```

---

### 3. Start the Backend Service

In another new terminal:

```bash
cd backend
.venv\Scripts\activate
python run.py
```

---

### 🧾 Logs

- Both the **AI service** and the **backend** will print logs directly in the terminals where you launched them.
- To view OpenSearch logs, use:

```bash
docker logs -f <container_id_or_name>
```

You can get the container name using:

```bash
docker ps
```
