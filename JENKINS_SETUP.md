# Jenkins CI/CD Setup Guide

## 📋 Overview
This guide provides step-by-step instructions to set up Jenkins CI/CD pipeline for the Donate Books application.

## 🏗️ Pipeline Features

### ✅ What the Pipeline Does:
- **Code Quality**: Linting, security audit, syntax validation
- **Testing**: Runs tests (when configured) and basic syntax checks
- **Docker**: Builds, tests, and pushes Docker images to registry
- **Kubernetes**: Deploys to Kubernetes cluster with health checks
- **Monitoring**: Post-deployment verification and rollback capability
- **Notifications**: Success/failure notifications (configurable)
- **Cleanup**: Automatic cleanup of resources and old images

### 🌊 Pipeline Flow:
```
Checkout → Setup → Dependencies → Quality & Security → Tests 
    ↓
Docker Build → Docker Test → Push Registry → K8s Deploy → Post-Deploy Tests
```

---

## 🔧 Prerequisites

### Jenkins Requirements:
- **Jenkins Version**: 2.400+ recommended
- **Required Plugins**:
  - Pipeline plugin
  - Docker plugin
  - Docker Pipeline plugin
  - Kubernetes plugin
  - NodeJS plugin
  - Kubernetes Continuous Deploy plugin
  - Slack Notification plugin (optional)

### Infrastructure Requirements:
- **Docker**: Docker Engine 20.10+
- **Kubernetes**: Cluster with kubectl access
- **Docker Registry**: DockerHub or private registry access
- **Git**: Repository access (GitHub, GitLab, Bitbucket)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Required Jenkins Plugins

Navigate to **Manage Jenkins → Manage Plugins → Available** and install:

```
- Pipeline
- Docker Pipeline
- NodeJS
- Kubernetes
- Kubernetes Continuous Deploy
- Slack Notification (optional)
```

### Step 2: Configure Global Tools

#### Configure Node.js:
1. Go to **Manage Jenkins → Global Tool Configuration**
2. Under **NodeJS installations**, click **Add NodeJS**
3. Set:
   - **Name**: `18` (matches pipeline configuration)
   - **Version**: `NodeJS 18.x.x`
   - Check **Install automatically**

#### Configure Docker:
1. Under **Docker installations**, click **Add Docker**
2. Set:
   - **Name**: `docker`
   - Check **Install automatically**
   - **Version**: Latest

### Step 3: Create Jenkins Credentials

Create the following credentials in **Manage Jenkins → Manage Credentials → System → Global credentials**:

#### DockerHub Credentials:
- **Kind**: Username with password
- **ID**: `dockerhub-credentials`
- **Username**: Your DockerHub username
- **Password**: Your DockerHub password or access token
- **Description**: DockerHub Registry Access

#### Kubernetes Config:
- **Kind**: Secret file
- **ID**: `kubeconfig-credentials`
- **File**: Upload your kubeconfig file
- **Description**: Kubernetes Cluster Access

### Step 4: Create Jenkins Pipeline Job

1. **New Item → Pipeline** 
2. **Job Name**: `donate-books-pipeline`
3. **Pipeline Configuration**:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: Your Git repository URL
   - **Credentials**: Your Git credentials (if private repo)
   - **Branch Specifier**: `*/main` (or your main branch)
   - **Script Path**: `Jenkinsfile`

### Step 5: Configure Branch-based Deployment

#### Multi-branch Pipeline (Recommended):
1. **New Item → Multibranch Pipeline**
2. **Branch Sources → Add source → Git**
3. **Project Repository**: Your repository URL
4. **Credentials**: Git credentials
5. **Behaviors**: 
   - Discover branches
   - Discover tags
6. **Build Configuration**:
   - **Mode**: by Jenkinsfile
   - **Script Path**: `Jenkinsfile`

---

## 🔐 Security Configuration

### Environment Variables (Optional):
Add these in **Pipeline → Environment Variables** or Jenkins global properties:

```bash
# Docker Registry Configuration
DOCKER_REGISTRY=docker.io
DOCKER_NAMESPACE=bhavanagm15

# Kubernetes Configuration  
KUBE_NAMESPACE=default
KUBE_CONTEXT=your-cluster-context

# Application Configuration
APP_ENVIRONMENT=production
```

### Secrets Management:
```bash
# Add these as Jenkins credentials (not environment variables)
- dockerhub-credentials (Username/Password)
- kubeconfig-credentials (Secret file)
- slack-webhook-url (Secret text) - optional
```

---

## 🔧 Pipeline Customization

### Environment Variables in Jenkinsfile:
You can modify these variables in the pipeline to match your setup:

```groovy
environment {
    // Update with your DockerHub username/organization
    DOCKER_IMAGE = 'your-username/donatebooks-app'
    
    // Update with your Kubernetes namespace
    NAMESPACE = 'your-namespace'
    
    // Update Node.js version if needed
    NODE_VERSION = '18'
}
```

### Branch Strategy:
The pipeline deploys only on:
- `main` branch
- `master` branch

To change this, modify the `when` conditions:
```groovy
when {
    anyOf {
        branch 'main'
        branch 'production'
        branch 'release/*'
    }
}
```

### Deployment Strategy:
Current strategy: **Rolling Update**
- Kubernetes handles zero-downtime deployment
- Automatic rollback on failure
- Health checks ensure service availability

---

## 🧪 Testing the Pipeline

### Initial Test Run:
1. **Trigger Build**: Push code or manually trigger
2. **Monitor Progress**: Check Jenkins console output
3. **Verify Stages**: Ensure all stages pass
4. **Check Deployment**: Verify application is accessible

### Debug Common Issues:

#### Docker Build Fails:
```bash
# Check Docker daemon
sudo systemctl status docker

# Verify Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

#### Kubernetes Access Issues:
```bash
# Test kubectl from Jenkins node
kubectl cluster-info
kubectl get nodes

# Check kubeconfig file permissions
chmod 600 ~/.kube/config
```

#### Node.js Issues:
```bash
# Verify Node.js installation
node --version
npm --version

# Clear npm cache if needed
npm cache clean --force
```

---

## 📊 Monitoring & Notifications

### Console Output:
Monitor build progress in Jenkins console:
- 🔄 In Progress stages
- ✅ Successful stages  
- ❌ Failed stages
- ⚠️ Warnings

### Slack Integration (Optional):
1. **Install Slack Plugin**
2. **Configure Slack Workspace**:
   - Create Slack App
   - Get Webhook URL
   - Add as Jenkins credential: `slack-webhook-url`

3. **Uncomment Slack blocks** in Jenkinsfile:
```groovy
slackSend(
    color: 'good',
    message: message,
    channel: '#deployments'
)
```

### Email Notifications:
Add to `post` section:
```groovy
failure {
    emailext(
        subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
        body: "Build failed. Check: ${env.BUILD_URL}",
        to: "team@example.com"
    )
}
```

---

## 🚨 Troubleshooting

### Common Pipeline Failures:

#### 1. **Docker Permission Denied**
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

#### 2. **Kubectl Not Found**
```bash
# Install kubectl on Jenkins node
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

#### 3. **Node.js Version Issues**
```bash
# Verify Node.js tool configuration
# Go to Manage Jenkins → Global Tool Configuration → NodeJS
# Ensure version matches pipeline requirements
```

#### 4. **Kubernetes Connection Timeout**
```bash
# Check network connectivity
kubectl cluster-info --kubeconfig=/path/to/kubeconfig

# Verify kubeconfig file format
kubectl config view --kubeconfig=/path/to/kubeconfig
```

#### 5. **Docker Push Fails**
```bash
# Test Docker login manually
docker login
docker push bhavanagm15/donatebooks-app:test
```

### Debug Commands:
```bash
# Jenkins node information
cat /etc/os-release
docker info
kubectl version --client
node --version
npm --version

# Check Jenkins logs
sudo journalctl -u jenkins -f

# Docker logs
docker logs <container-name>

# Kubernetes logs
kubectl logs -f deployment/donate-books-app
```

---

## 🔄 Pipeline Maintenance

### Regular Tasks:
1. **Update Dependencies**: Keep Node.js and Docker versions current
2. **Security Updates**: Regular dependency audits and updates
3. **Clean Old Images**: Pipeline automatically cleans old Docker images
4. **Monitor Disk Space**: Jenkins workspace and Docker images
5. **Review Logs**: Regular log analysis for optimization

### Performance Optimization:
```groovy
// Add to pipeline for faster builds
agent {
    docker {
        image 'node:18-alpine'
        args '-v /var/run/docker.sock:/var/run/docker.sock'
    }
}

// Cache npm dependencies
options {
    // Keep builds for 30 days
    buildDiscarder(logRotator(daysToKeepStr: '30', numToKeepStr: '50'))
    
    // Timeout after 20 minutes
    timeout(time: 20, unit: 'MINUTES')
}
```

---

## ✅ Validation Checklist

### Pre-Production:
- [ ] Jenkins plugins installed and configured
- [ ] Node.js tool configured (version 18)
- [ ] Docker credentials working
- [ ] Kubernetes credentials working
- [ ] Git repository accessible
- [ ] Pipeline syntax validated
- [ ] Test build successful

### Post-Production:
- [ ] Application accessible via LoadBalancer IP
- [ ] Database connection working
- [ ] Health checks passing
- [ ] Logs showing no errors
- [ ] Resource utilization acceptable
- [ ] Monitoring alerts configured

---

## 📞 Support & Resources

### Documentation Links:
- [Jenkins Pipeline Documentation](https://jenkins.io/doc/book/pipeline/)
- [Docker Plugin Guide](https://plugins.jenkins.io/docker-workflow/)
- [Kubernetes Plugin Guide](https://plugins.jenkins.io/kubernetes/)
- [Node.js Plugin Guide](https://plugins.jenkins.io/nodejs/)

### Best Practices:
1. **Version Control**: Keep Jenkinsfile in version control
2. **Security**: Use Jenkins credentials, avoid hardcoding secrets
3. **Testing**: Test pipeline changes in feature branches
4. **Monitoring**: Set up proper logging and monitoring
5. **Backup**: Regular backup of Jenkins configuration

---

## 🎯 Success Criteria

Your pipeline is successful when:
- ✅ All stages complete without errors
- ✅ Docker image builds and pushes successfully  
- ✅ Kubernetes deployment completes
- ✅ Application is accessible and healthy
- ✅ Database connectivity is working
- ✅ Rollback works if deployment fails

---

**Need Help?** Check the Jenkins console output first, then refer to the troubleshooting section above. Most issues are related to credentials, permissions, or network connectivity.
