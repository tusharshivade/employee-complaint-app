# Kubernetes Deployment — Employee Complaint Management App

This directory contains the Kubernetes manifests required to deploy the **Employee Complaint Management App** on a local Kubernetes cluster (**kind**).

The application is a two-tier microservice architecture:
1. **Frontend / Application Tier:** Flask Python web application (2 replicas)
2. **Backend / Database Tier:** MySQL 5.7 database with PersistentVolumeClaim (1 replica)

---

## 🏗️ Architecture & Traffic Flow

```
+-----------------------------------------------------------------------+
|  User / Web Browser (Fedora)                                         |
|  http://localhost:5000 (via kubectl port-forward)                     |
|  or http://localhost:30005 (via kind NodePort mapping)               |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|  Kubernetes Service: employee-service (NodePort 30005 / Port 5000)    |
|  Namespace: employee-app                                              |
+-------------------+-------------------------------+-------------------+
                    |                               |
                    v (Load balanced)               v
       +-------------------------+     +-------------------------+
       | Flask Pod: employee-app |     | Flask Pod: employee-app |
       | Port: 5000              |     | Port: 5000              |
       | Image: shivadetushar/   |     | Image: shivadetushar/   |
       | employee-comlaint-app   |     | employee-comlaint-app   |
       +------------+------------+     +------------+------------+
                    |                               |
                    +---------------+---------------+
                                    |
                                    v (Internal Cluster Traffic: mysql-service:3306)
+-----------------------------------+-----------------------------------+
|  Kubernetes Service: mysql-service (ClusterIP: 3306)                   |
|  Namespace: employee-app                                              |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|  MySQL Pod: mysql (Port 3306)                                         |
|  Namespace: employee-app                                              |
|  Secret: mysql-secret (root password: admin)                          |
+-----------------------------------+-----------------------------------+
                                    |
                                    v (Persistent Storage)
+-----------------------------------+-----------------------------------+
|  PersistentVolumeClaim: mysql-pvc (1Gi, ReadWriteOnce)                |
|  Mounted at: /var/lib/mysql                                           |
+-----------------------------------------------------------------------+
```

---

## 📁 Kubernetes Manifests

| File | Kind | Description |
| :--- | :--- | :--- |
| `namespace.yml` | `Namespace` | Creates isolated namespace `employee-app` |
| `mysql-secret.yml` | `Secret` | Stores `MYSQL_ROOT_PASSWORD` securely |
| `mysql-pvc.yml` | `PersistentVolumeClaim` | Requests 1Gi persistent storage for MySQL data |
| `mysql-deployment.yml` | `Deployment` | Runs MySQL 5.7 with memory limit (1Gi) to prevent OOMKilled |
| `mysql-service.yml` | `Service` | Internal `ClusterIP` exposing MySQL on port 3306 (`mysql-service`) |
| `employee-deployment.yml` | `Deployment` | Runs Flask web app (2 replicas) connecting to `mysql-service:3306` |
| `employee-service.yml` | `Service` | `NodePort` (port 5000, nodePort 30005) exposing Flask |

---

## 🚀 Step-by-Step Deployment Instructions

### Prerequisites
- Running **kind** cluster (`kind get clusters`)
- `kubectl` configured to your kind cluster (`kubectl config current-context`)
- Docker image built locally or available on Docker Hub:
  `shivadetushar/employee-comlaint-app:latest`

> **Note for kind:** If you have the image built locally in Docker and have not pushed to Docker Hub, load it directly into kind:
> ```bash
> kind load docker-image shivadetushar/employee-comlaint-app:latest
> ```

---

### Step 1: Create Namespace
```bash
kubectl apply -f k8s/namespace.yml
```
Verify:
```bash
kubectl get namespaces
```

---

### Step 2: Deploy Database Prerequisites (Secret & PVC)
```bash
kubectl apply -f k8s/mysql-secret.yml
kubectl apply -f k8s/mysql-pvc.yml
```
Verify PVC status is `Bound`:
```bash
kubectl get pvc -n employee-app
```

---

### Step 3: Deploy MySQL Deployment & Service
```bash
kubectl apply -f k8s/mysql-deployment.yml
kubectl apply -f k8s/mysql-service.yml
```
Verify MySQL pod is `1/1 Running`:
```bash
kubectl get pods -n employee-app -l app=mysql -w
```
Verify MySQL service:
```bash
kubectl get svc -n employee-app mysql-service
```

---

### Step 4: Deploy Flask Application & Service
```bash
kubectl apply -f k8s/employee-deployment.yml
kubectl apply -f k8s/employee-service.yml
```
Verify Flask pods (should show 2 replicas running):
```bash
kubectl get pods -n employee-app -l app=employee-app -w
```
Verify all resources in the namespace:
```bash
kubectl get all -n employee-app
```

---

## 🌐 Accessing the Application from Fedora Browser

### Recommended Method: kubectl port-forward
This method works consistently across any kind cluster without requiring special kind cluster node port mappings:

```bash
kubectl port-forward -n employee-app svc/employee-service 5000:5000
```

Keep this command running in your terminal, and open your Fedora browser:
👉 **[http://localhost:5000](http://localhost:5000)**

### Alternative Method: NodePort
If your kind cluster was created with `extraPortMappings` mapping host port `30005` to container port `30005`:
👉 **[http://localhost:30005](http://localhost:30005)**

---

## 🔍 Verification & Testing

### 1. Check Flask Pod Logs
Verify that Flask started properly and connected to MySQL:
```bash
kubectl logs -n employee-app -l app=employee-app --tail=50
```

### 2. Submit a Complaint
1. Open **[http://localhost:5000](http://localhost:5000)** in your browser.
2. Fill out and submit the complaint form.
3. You should see the success flash message: *"Thank you! Your complaint has been submitted successfully."*

### 3. Verify Data in MySQL Database Pod
Query the MySQL database directly to confirm the submission persisted:
```bash
kubectl exec -it -n employee-app deploy/mysql -- mysql -u root -padmin employee_db -e "SELECT id, first_name, last_name, employee_id, nature_of_complaint, submitted_at FROM complaints;"
```

---

## 🛠️ Troubleshooting Guide

### 1. MySQL Pod OOMKilled (Exit Code 137)
- **Symptom:** Pod status shows `CrashLoopBackOff` or `OOMKilled`. In `kubectl describe pod -n employee-app <mysql-pod-name>`, the Last State shows `OOMKilled: true` with Exit Code `137`.
- **Cause:** MySQL 5.7 allocates memory for InnoDB buffer pools, threads, and internal caches on startup. A memory limit of `512Mi` or lower is too restrictive and triggers the Linux kernel cgroup OOM killer.
- **Solution:** 
  In `k8s/mysql-deployment.yml`, memory limits are configured as:
  ```yaml
  resources:
    requests:
      cpu: 250m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 1Gi
  ```
  Apply the updated manifest:
  ```bash
  kubectl apply -f k8s/mysql-deployment.yml
  ```
  > **Data Safety:** The PVC (`mysql-pvc`) is decoupled from the Deployment. Updating the Deployment pod template preserves all data stored on the persistent volume.

### 2. Flask Pods in `ImagePullBackOff` or `ErrImagePull`
- **Symptom:** Pod fails to pull image `shivadetushar/employee-comlaint-app:latest`.
- **Check image name:** Confirm the spelling: `employee-comlaint-app` (no 'p').
- **If image is only on local host (kind cluster):**
  Load the local image into the kind cluster nodes:
  ```bash
  kind load docker-image shivadetushar/employee-comlaint-app:latest
  ```

### 3. Database Connection Errors in Flask (`OperationalError 2003 / 1045`)
- **Check MySQL Service:** Ensure `mysql-service` exists in the `employee-app` namespace:
  ```bash
  kubectl get svc -n employee-app mysql-service
  ```
- **Check DNS resolution from inside a Flask pod:**
  ```bash
  kubectl exec -it -n employee-app deploy/employee-app -- python -c "import socket; print(socket.gethostbyname('mysql-service'))"
  ```
- **Check MySQL Secret:** Verify password in secret matches `admin`:
  ```bash
  kubectl get secret -n employee-app mysql-secret -o jsonpath="{.data.MYSQL_ROOT_PASSWORD}" | base64 -d
  ```

### 4. General Pod Diagnostic Commands
```bash
# View pod status and restart counts
kubectl get pods -n employee-app

# Inspect detailed pod events and conditions
kubectl describe pod -n employee-app <pod-name>

# View live container logs
kubectl logs -n employee-app <pod-name> -f

# View previous container logs if pod restarted
kubectl logs -n employee-app <pod-name> --previous
```
