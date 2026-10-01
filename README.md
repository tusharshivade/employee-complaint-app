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

```
