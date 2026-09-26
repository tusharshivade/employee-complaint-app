# Employee Complaint Management Application

A two-tier web application built with **Python (Flask)** and **MySQL**, designed to record and manage employee complaints through a clean, responsive form.

---

## 📁 Project Structure

```text
employee-complaint-app/
├── app.py                 # Flask backend with MySQL integration
├── schema.sql             # MySQL schema and complaints table
├── requirements.txt       # Python dependencies (Flask, PyMySQL, etc.)
├── Dockerfile             # Container configuration for backend
├── templates/
│   └── index.html         # Responsive complaint form matching the UI design
└── README.md              # Project documentation & guides
```

---

## 🗄️ Database Schema (`schema.sql`)

The application connects to a MySQL database and stores records in the `complaints` table:

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

> **Note**: The application (`app.py`) also includes automatic table initialization on startup if the database exists.

---

## ⚙️ Environment Variables

The backend dynamically reads the following environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MYSQL_HOST` | `localhost` | MySQL hostname or container service name |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | `root` | MySQL username |
| `MYSQL_PASSWORD` | `admin` | MySQL password |
| `MYSQL_DB` | `employee_db` | Database name |
| `SECRET_KEY` | `employee-complaint-secret-key` | Flask session secret key |

---

## 🐳 Building and Running with Docker (`Dockerfile`)

### 1. Build the Docker Image
```bash
docker build -t employee-complaint-app:latest .
```

### 2. Run the Container
Connect the container to an existing MySQL instance or network:
```bash
docker run -d \
  -p 5000:5000 \
  -e MYSQL_HOST=your-mysql-host \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=admin \
  -e MYSQL_DB=employee_db \
  --name complaint-backend \
  employee-complaint-app:latest
```

---

## 💡 Concept & Guide: How to Write `docker-compose.yml`

Docker Compose allows you to define and run multi-container Docker applications. For this project, you need two services:
1. **`db` (MySQL)**
2. **`backend` (Flask Application)**

Here is how you can structure your own `docker-compose.yml` file step-by-step:

### 1. Define Services
- **Database Service (`db`)**:
  - **Image**: Use an official MySQL image (e.g. `mysql:8.0` or `mysql:5.7`).
  - **Environment Variables**: Configure:
    - `MYSQL_ROOT_PASSWORD`: Root password.
    - `MYSQL_DATABASE`: Set to `employee_db`.
    - `MYSQL_USER` & `MYSQL_PASSWORD`: Dedicated database user.
  - **Ports**: Expose `3306:3306` if you need external access from your host machine.
  - **Volumes**:
    - Mount `./schema.sql` into `/docker-entrypoint-initdb.d/schema.sql` so the table is created automatically when MySQL starts for the first time.
    - Mount a named volume (e.g., `mysql-data:/var/lib/mysql`) to ensure data persists across container restarts.

- **Backend Service (`backend`)**:
  - **Build**: Set `build: .` to build the image from the local `Dockerfile`.
  - **Ports**: Map port `5000:5000` to access the web form in your browser (`http://localhost:5000`).
  - **Environment**:
    - Set `MYSQL_HOST: db` (in Docker Compose, services communicate using their service names as hostnames!).
    - Set `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DB` matching the database service credentials.
  - **Depends On**:
    - Add `depends_on: [db]` so the database container starts before the backend container.

### 2. Define Named Volumes
- At the bottom of the file, declare the named volume:
  ```yaml
  volumes:
    mysql-data:
  ```

---

## 🚀 Concept & Guide: Writing a CI/CD Pipeline (GitHub Actions)

When you are ready to automate testing and deployment, create `.github/workflows/complaint-ci-cd.yml` with the following workflow stages:

1. **Trigger**:
   - Run on `push` to `main` branch or pull requests.
2. **Stage 1 - Test / Lint**:
   - Checkout code with `actions/checkout@v4`.
   - Setup Python with `actions/setup-python@v5`.
   - Install dependencies (`pip install -r requirements.txt`).
   - Run syntax checking (`python -m py_compile app.py`).
3. **Stage 2 - Build & Push Docker Image**:
   - Authenticate with Docker Hub using `docker/login-action@v3` and GitHub repository secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).
   - Build and push the image tagged with `latest` and `${{ github.sha }}`.
4. **Stage 3 - Deploy**:
   - On your deployment target (or self-hosted runner), pull the latest Docker image and run `docker compose up -d`.
