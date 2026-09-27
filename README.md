# Employee Complaint Management Application

A modern two-tier web application built with **Python (Flask)** and **MySQL**, designed to record and manage employee complaints through a clean, responsive web interface.

---

## 🏗️ Architecture Overview

The application follows a classic **Two-Tier Architecture**:

```
+--------------------------------------------------------+
|                      Client Browser                    |
|                http://localhost:5000                   |
+---------------------------+----------------------------+
                            | HTTP GET / POST
                            v
+--------------------------------------------------------+
|             Tier 1: Web Application (Flask)            |
|                     Container / Host                   |
|                   Port: 5000 (Python)                  |
+---------------------------+----------------------------+
                            | TCP Port 3306 (PyMySQL)
                            v
+--------------------------------------------------------+
|                 Tier 2: Database (MySQL)               |
|                     Container / Host                   |
|                   Database: employee_db                |
|                    Table: complaints                   |
+--------------------------------------------------------+
```

---

## 📁 Project Structure

```text
employee-complaint-app/
├── app.py                 # Flask backend with automatic MySQL table initialization
├── schema.sql             # SQL schema for database and complaints table
├── requirements.txt       # Python dependencies (Flask, PyMySQL, etc.)
├── Dockerfile             # Multi-stage production container configuration
├── templates/
│   └── index.html         # Responsive complaint form matching UI styling
└── README.md              # Comprehensive setup, run, and deployment guide
```

---

## 🗄️ Database Schema (`schema.sql`)

The application connects to MySQL and persists records into the `complaints` table:

```sql
CREATE DATABASE IF NOT EXISTS employee_db;
USE employee_db;

CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    incident_date DATE NOT NULL,
    nature_of_complaint VARCHAR(100) NOT NULL,
    incident_description TEXT NOT NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> **Automatic Setup**: `app.py` automatically initializes `employee_db` and the `complaints` table upon starting up if they do not already exist.

---

## ⚙️ Environment Variables

The backend dynamically configures database connections using environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MYSQL_HOST` | `localhost` | MySQL hostname (`localhost`, container IP, or Docker service name `mysql`) |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | `root` | Database username |
| `MYSQL_PASSWORD` | `admin` | Database password *(with automatic fallback to blank `''` for passwordless local setups)* |
| `MYSQL_DB` | `employee_db` | Target database name |
| `SECRET_KEY` | `employee-complaint-secret-key` | Flask session secret key |

---

## 💻 Method 1: Running Locally with Python

### 1. Prerequisites
- Python 3.10+
- A running MySQL instance (local service or MySQL Docker container on port `3306`)

### 2. Set Up Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
# If your MySQL password is 'admin' (default for the container):
python app.py

# Or if you use custom MySQL credentials:
MYSQL_HOST=localhost MYSQL_USER=root MYSQL_PASSWORD=your_password python app.py
```

### 5. Access the Web Form
Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🐳 Method 2: Running with Docker (Two-Tier Architecture)

To run both the application and the database in isolated Docker containers:

### 1. Create a Dedicated Docker Network
```bash
docker network create twotier
```

### 2. Start the MySQL Container
```bash
docker run -d \
  --name mysql \
  --network twotier \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=admin \
  -e MYSQL_DATABASE=employee_db \
  -v mysql-data:/var/lib/mysql \
  mysql:5.7
```

### 3. Build the Flask Application Docker Image
```bash
docker build -t two-tier-flask-app:latest .
```

### 4. Run the Flask Application Container
```bash
docker run -d \
  --name flaskapp \
  --network twotier \
  -p 5000:5000 \
  -e MYSQL_HOST=mysql \
  -e MYSQL_USER=root \
  -e MYSQL_PASSWORD=admin \
  -e MYSQL_DB=employee_db \
  two-tier-flask-app:latest
```

Open [http://localhost:5000](http://localhost:5000) to submit complaints.

---

## 📦 Method 3: Running with Docker Compose (Recommended)

You can define both tiers in a single `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  db:
    image: mysql:5.7
    container_name: mysql-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: admin
      MYSQL_DATABASE: employee_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - twotier-net

  web:
    build: .
    container_name: flask-web
    restart: always
    ports:
      - "5000:5000"
    environment:
      MYSQL_HOST: db
      MYSQL_USER: root
      MYSQL_PASSWORD: admin
      MYSQL_DB: employee_db
      SECRET_KEY: employee-complaint-secret-key
    depends_on:
      - db
    networks:
      - twotier-net

volumes:
  mysql_data:

networks:
  twotier-net:
    driver: bridge
```

### Start Services:
```bash
docker compose up -d
```

### Stop Services:
```bash
docker compose down
```

---

## 🔍 How to View and Verify Submitted Complaints

Once a form is submitted through [http://localhost:5000](http://localhost:5000), verify the stored complaints directly:

### Inside the Docker Container:
```bash
docker exec -it mysql mysql -u root -padmin employee_db -e "SELECT * FROM complaints;"
```

### From Local MySQL CLI:
```bash
mysql -h 127.0.0.1 -u root -padmin employee_db -e "SELECT * FROM complaints;"
```

---

## 🛠️ Troubleshooting & Common Errors

### 1. `Access denied for user 'root'@'172.21.0.1' (using password: NO)`
- **Reason**: The application is connecting over TCP port 3306 to a Docker MySQL container that requires password `admin`, but was provided with an empty password.
- **Solution**: Set `MYSQL_PASSWORD=admin` or rely on `app.py`'s built-in automatic fallback.

### 2. `Can't connect to MySQL server on 'localhost' ([Errno 111] Connection refused)`
- **Reason**: The MySQL service or Docker container is stopped, or port 3306 is not mapped.
- **Solution**: Check running containers with `docker ps`. If stopped, start it with `docker start mysql`.

### 3. Port 3306 Already in Use
- **Reason**: A host MySQL server (`mysqld` or `mariadb`) and a Docker container are both trying to bind to port `3306`.
- **Solution**: Stop one of the services using `sudo systemctl stop mysqld` or map the container to another port like `-p 3307:3306` and set `MYSQL_PORT=3307`.

---

## 🚀 CI/CD Pipeline Guide (GitHub Actions)

To automate tests and Docker image delivery, create `.github/workflows/ci-cd.yml`:

```yaml
name: Two-Tier App CI/CD

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Syntax Check
        run: |
          python -m py_compile app.py

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker Image
        run: |
          docker build -t two-tier-flask-app:${{ github.sha }} .
```
