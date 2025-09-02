# Kubernetes Deployment Guide

## 🚀 Deploy to Amazon Linux Kubernetes Cluster

### **Step 1: Deploy MongoDB**
```bash
# Apply MongoDB deployment
kubectl apply -f mongodb-deployment.yaml

# Check MongoDB status
kubectl get pods -l app=mongodb
kubectl logs -l app=mongodb
```

### **Step 2: Verify MongoDB is Running**
```bash
# Check MongoDB status
kubectl get pods -l app=mongodb
kubectl logs -l app=mongodb

# Test MongoDB connection
kubectl exec -it deployment/mongodb -- mongosh --eval "show dbs"
```

### **Step 3: Deploy Application**
```bash
# Apply application deployment
kubectl apply -f app-deployment.yaml

# Check application status
kubectl get pods -l app=donate-books-app
kubectl logs -l app=donate-books-app
```

### **Step 4: Get Application URL**
```bash
# Get LoadBalancer external IP
kubectl get services donate-books-service

# If using NodePort instead
kubectl get services donate-books-service -o wide
```

## 🔍 **Troubleshooting**

### Check MongoDB Connection
```bash
# Connect to MongoDB pod directly
kubectl exec -it deployment/mongodb -- mongosh -u admin -p password123

# Test database connection from app pod
kubectl exec -it deployment/donate-books-app -- node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://admin:password123@mongodb-service:27017/donatebooks?authSource=admin')
.then(() => console.log('✅ Connected'))
.catch(err => console.log('❌ Error:', err.message));
"
```

### Check Application Logs
```bash
# View real-time logs
kubectl logs -f deployment/donate-books-app

# Check specific pod logs
kubectl get pods
kubectl logs <pod-name>
```

### Database Status
```bash
# Check database collections
kubectl exec -it deployment/mongodb -- mongosh -u admin -p password123 --eval "
use donatebooks;
show collections;
db.stats();
"
```

## 📋 **MongoDB Configuration**

- **Username**: `admin`
- **Password**: `password123`
- **Database**: `donatebooks`
- **Connection String**: `mongodb://admin:password123@mongodb-service:27017/donatebooks?authSource=admin`

## 🔧 **Configuration Details**

### MongoDB Features:
- ✅ **Persistent Storage**: 10Gi PVC
- ✅ **Authentication**: Username/password enabled
- ✅ **Health Checks**: Liveness and readiness probes
- ✅ **Security**: Non-root user, proper permissions
- ✅ **Performance**: Optimized indexes for all collections

### Application Features:
- ✅ **Load Balancing**: 2 replicas
- ✅ **Environment Variables**: Production configuration
- ✅ **Database Connection**: Authenticated MongoDB connection
- ✅ **Health Checks**: Application health endpoints

### Collections Created:
- `users` - User accounts and profiles
- `books` - Book catalog and metadata
- `swaps` - Book exchange transactions
- `achievements` - User achievements and badges
- `messages` - User-to-user messaging
- `notifications` - System notifications
- `pickups` - Book pickup requests
- `ratings` - Book ratings and reviews
- `genres` - Book categories

## ⚠️ **Important Notes**

1. **Change passwords** in production:
   - Update MongoDB credentials in `mongodb-deployment.yaml`
   - Update connection string in `app-deployment.yaml`

2. **Storage Class**: The deployment uses default storage class. If you need specific storage class:
   ```yaml
   storageClassName: "gp2"  # or your preferred storage class
   ```

3. **Resource Limits**: Adjust based on your cluster capacity:
   ```yaml
   resources:
     requests:
       memory: "512Mi"
       cpu: "250m"
     limits:
       memory: "2Gi"
       cpu: "1000m"
   ```

## 🧪 **Testing the Deployment**

1. **Check database connection**:
   ```bash
   curl http://<EXTERNAL-IP>/api/db-test
   ```

2. **Create test user**:
   ```bash
   curl -X POST http://<EXTERNAL-IP>/api/create-test-user
   ```

3. **Access application**:
   ```bash
   curl http://<EXTERNAL-IP>/
   ```
