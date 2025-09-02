# 🔍 Troubleshooting Guide for 404 Error

## Step-by-Step Debugging Process

### Step 1: Check if the Server is Running
```bash
kubectl get pods -l app=donate-books-app
kubectl logs -l app=donate-books-app --tail=50
```

### Step 2: Test Debug Endpoint
Try accessing: `http://<your-load-balancer>/debug-files`

This should return JSON with file status information.

### Step 3: Test Basic Routes
Test these URLs one by one:
- `http://<your-load-balancer>/` (should show home page)
- `http://<your-load-balancer>/login` (should show login page)
- `http://<your-load-balancer>/api/current-user` (should return 401 or user info)

### Step 4: Check Exact Error
In browser DevTools:
1. Open Network tab
2. Try to access `/pickup-request`
3. Check the exact error response

### Step 5: Verify Docker Image
```bash
# Test locally first
docker run -p 3000:3000 bhavanagm15/donatebooks-app:latest

# Then test the route
curl http://localhost:3000/pickup-request
curl http://localhost:3000/debug-files
```

### Step 6: Check Container File System
```bash
# Access running container
kubectl exec -it deployment/donate-books-app -- sh

# Check if files exist
ls -la /app/views/
cat /app/views/pickup.html | head -10
```

### Step 7: Rebuild and Redeploy
```bash
# Build new image
docker build -t bhavanagm15/donatebooks-app:latest .

# Push to registry
docker push bhavanagm15/donatebooks-app:latest

# Force update deployment
kubectl rollout restart deployment/donate-books-app
kubectl rollout status deployment/donate-books-app
```

## Common Issues & Solutions

### Issue 1: Files Not Copied to Container
**Symptom**: `/debug-files` shows `exists: false`
**Solution**: Check Dockerfile COPY command, rebuild image

### Issue 2: Wrong Working Directory
**Symptom**: Server starts but can't find files
**Solution**: Ensure WORKDIR is set correctly in Dockerfile

### Issue 3: Permissions Issue
**Symptom**: Files exist but can't be read
**Solution**: Check file permissions in container

### Issue 4: Cache Issue
**Symptom**: Old version still running
**Solution**: Use specific image tags instead of :latest

### Issue 5: Load Balancer Routing
**Symptom**: Some routes work, others don't
**Solution**: Check AWS Load Balancer configuration

## Quick Fix Commands

```bash
# Quick deployment restart
kubectl delete pod -l app=donate-books-app

# Check all resources
kubectl get all

# View detailed pod info
kubectl describe pod -l app=donate-books-app

# Check service endpoints
kubectl get endpoints
```

## Emergency Fix: Direct Route Test

Add this temporary route to server.js for testing:

```javascript
app.get('/test-pickup', (req, res) => {
  res.send(`
    <h1>Test Route Works!</h1>
    <p>Working directory: ${__dirname}</p>
    <p>Time: ${new Date().toISOString()}</p>
    <a href="/pickup-request">Go to Pickup Request</a>
  `);
});
```
