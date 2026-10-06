# Kubernetes Deployment — Employee Complaint App

Quick guide to run the two-tier Employee Complaint Management App (Flask + MySQL) on Kubernetes (**kind**).

---

## 📁 Manifests Overview

| File | Purpose |
| :--- | :--- |
| `namespace.yml` | Namespace `employee-app` |
| `mysql-secret.yml` | Database root password (`admin`) |
| `mysql-pvc.yml` | 1Gi persistent volume claim |
| `mysql-deployment.yml` | MySQL 5.7 deployment (1Gi memory limit to avoid OOMKilled) |
| `mysql-service.yml` | ClusterIP service on port 3306 (`mysql-service`) |
| `employee-deployment.yml` | Flask app deployment (2 replicas, image: `shivadetushar/employee-comlaint-app:latest`) |
| `employee-service.yml` | NodePort service (port 5000, nodePort 30005) |

---

## 🚀 Quick Start Deployment

### 1. (Optional) Load Image into kind
If running offline without Docker Hub pulling:
```bash
# 1. Check your kind cluster name
kind get clusters

# 2. Load image (default cluster name 'kind')
kind load docker-image shivadetushar/employee-comlaint-app:latest

# If your cluster has a custom name:
# kind load docker-image shivadetushar/employee-comlaint-app:latest --name <cluster-name>
```
*(Note: If the image is on Docker Hub, Kubernetes pulls it automatically if connected to the internet).*

### 2. Apply Manifests
```bash
# Create namespace
kubectl apply -f k8s/namespace.yml

# Deploy all resources (MySQL & Flask)
kubectl apply -f k8s/
```

### 3. Check Pod Status
```bash
kubectl get pods -n employee-app -w
```
Wait until all pods show `1/1 Running`:
- `mysql-...` (1/1 Running)
- `employee-app-...` (1/1 Running - replica 1)
- `employee-app-...` (1/1 Running - replica 2)

---

## 🌐 Access Application

Run port forwarding to access from your browser:
```bash
kubectl port-forward -n employee-app svc/employee-service 5000:5000
```
Open in browser:
👉 **http://localhost:5000**

---

## 🔍 Verify Database Storage

After submitting a complaint in the browser, check records inside MySQL:
```bash
kubectl exec -it -n employee-app deploy/mysql -- mysql -u root -padmin employee_db -e "SELECT * FROM complaints;"
```

---

## 🛠️ Essential Troubleshooting

- **Check logs:**
  ```bash
  kubectl logs -n employee-app -l app=employee-app --tail=50 -f
  kubectl logs -n employee-app -l app=mysql --tail=50
  ```
- **Inspect pod issues (CrashLoopBackOff, ImagePullBackOff):**
  ```bash
  kubectl describe pod -n employee-app <pod-name>
  ```
- **MySQL OOMKilled (Exit Code 137):**
  Resolved with `1Gi` limit in `k8s/mysql-deployment.yml`. PVC data remains intact.
- **Restart deployment:**
  ```bash
  kubectl rollout restart deployment/employee-app -n employee-app
  ```
- **Clean up resources:**
  ```bash
  kubectl delete -f k8s/
  ```
