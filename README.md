# Employee Complaint Management App

A two-tier web application built with **Python (Flask)** and **MySQL** to record and manage employee complaints.

---

## 🚀 Quick Start (Docker Compose)

The easiest and recommended way to run the application:

```bash
# Start Flask app and MySQL database
docker compose up -d --build
```

- **Application URL:** [http://localhost:5000](http://localhost:5000)
- **Stop containers:**
  ```bash
  docker compose down
  ```

---

## 💻 Local Setup (Without Docker)

### 1. Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Application
Ensure MySQL is running on port `3306`, then start the server:
```bash
python app.py
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `MYSQL_HOST` | `localhost` (`db` in Docker) | MySQL host |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | `root` | Database username |
| `MYSQL_PASSWORD` | `admin` | Database password |
| `MYSQL_DB` | `employee_db` | Database name |

---

## 🔍 View Submitted Complaints

View stored records directly from the database container:
```bash
docker exec -it mysql-db mysql -u root -padmin employee_db -e "SELECT * FROM complaints;"
```



# Kubernetes Deployment — Employee Complaint Management App

This directory contains the Kubernetes manifests required to deploy the
Employee Complaint Management App on a Kubernetes cluster.

The application consists of:

- Flask application
- MySQL database
- Persistent storage
- Kubernetes Services
- Kubernetes Secrets
- Kubernetes Deployments

This project is currently designed for learning and local Kubernetes
deployment using **kind**.

---

## 📁 Kubernetes Directory Structure

```text
k8s/
│
├── README.md
│
├── namespace.yml
│
├── mysql-secret.yml
├── mysql-pvc.yml
├── mysql-deployment.yml
├── mysql-service.yml
│
├── employee-deployment.yml
└── employee-service.yml