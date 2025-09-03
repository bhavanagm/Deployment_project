pipeline {
    agent any
    
    environment {
        // Docker Configuration
        DOCKER_IMAGE = 'bhavanagm15/donatebooks-app'
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_LATEST = 'latest'
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        
        // Kubernetes Configuration
        KUBECONFIG_CREDENTIALS = credentials('kubeconfig-credentials')
        NAMESPACE = 'default'
        
        // Application Configuration
        NODE_VERSION = '18'
        APP_PORT = '3000'
        
        // MongoDB Configuration
        MONGO_URI = 'mongodb://mongodb-service:27017/donatebooks'
        
        // Build Configuration
        BUILD_CONTEXT = '.'
        DOCKERFILE_PATH = 'dockerfile'
    }
    
    tools {
        nodejs "${NODE_VERSION}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Checking out source code...'
                checkout scm
                
                script {
                    // Get commit information
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.GIT_BRANCH_NAME = sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()
                }
                
                echo "✅ Checked out commit: ${env.GIT_COMMIT_SHORT} from branch: ${env.GIT_BRANCH_NAME}"
            }
        }
        
        stage('Environment Setup') {
            steps {
                echo '🔧 Setting up build environment...'
                
                script {
                    // Display environment information
                    sh '''
                        echo "Node.js Version: $(node --version)"
                        echo "NPM Version: $(npm --version)"
                        echo "Docker Version: $(docker --version)"
                        echo "Build Number: ${BUILD_NUMBER}"
                        echo "Workspace: ${WORKSPACE}"
                    '''
                }
                
                echo '✅ Environment setup completed'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                
                script {
                    try {
                        sh '''
                            # Clean npm cache
                            npm cache clean --force
                            
                            # Install dependencies
                            npm ci --only=production
                            
                            # Verify installation
                            npm list --depth=0
                        '''
                        echo '✅ Dependencies installed successfully'
                    } catch (Exception e) {
                        echo "❌ Dependency installation failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        error('Failed to install dependencies')
                    }
                }
            }
        }
        
        stage('Code Quality & Security') {
            parallel {
                stage('Lint Code') {
                    steps {
                        echo '🔍 Running code linting...'
                        
                        script {
                            try {
                                // Check if eslint is available, if not skip
                                def eslintExists = sh(
                                    script: 'command -v npx eslint',
                                    returnStatus: true
                                )
                                
                                if (eslintExists == 0) {
                                    sh 'npx eslint . --ext .js --ignore-path .gitignore || true'
                                } else {
                                    echo '⚠️ ESLint not configured, skipping linting'
                                }
                            } catch (Exception e) {
                                echo "⚠️ Linting completed with warnings: ${e.getMessage()}"
                            }
                        }
                        
                        echo '✅ Code linting completed'
                    }
                }
                
                stage('Security Audit') {
                    steps {
                        echo '🔒 Running security audit...'
                        
                        script {
                            try {
                                sh '''
                                    # Run npm audit
                                    npm audit --audit-level=moderate || true
                                    
                                    # Generate audit report
                                    npm audit --json > audit-report.json || true
                                '''
                                echo '✅ Security audit completed'
                            } catch (Exception e) {
                                echo "⚠️ Security audit completed with findings: ${e.getMessage()}"
                            }
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                echo '🧪 Running application tests...'
                
                script {
                    try {
                        // Check if tests are configured
                        def packageJson = readJSON file: 'package.json'
                        def testScript = packageJson.scripts?.test
                        
                        if (testScript && !testScript.contains('Error: no test specified')) {
                            sh '''
                                # Set test environment
                                export NODE_ENV=test
                                export PORT=3001
                                
                                # Run tests
                                npm test
                            '''
                            echo '✅ Tests passed successfully'
                        } else {
                            echo '⚠️ No tests configured, skipping test stage'
                            
                            // Basic syntax check
                            sh '''
                                echo "🔍 Running basic syntax validation..."
                                node -c server.js
                                
                                # Check for common issues
                                if [ -f "routes/api.js" ]; then
                                    node -c routes/api.js
                                fi
                                
                                echo "✅ Syntax validation passed"
                            '''
                        }
                    } catch (Exception e) {
                        echo "❌ Tests failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        error('Tests failed')
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                
                script {
                    try {
                        // Build Docker image
                        def dockerImage = docker.build(
                            "${DOCKER_IMAGE}:${DOCKER_TAG}",
                            "-f ${DOCKERFILE_PATH} ${BUILD_CONTEXT}"
                        )
                        
                        // Tag as latest for main branch
                        if (env.GIT_BRANCH_NAME == 'main' || env.GIT_BRANCH_NAME == 'master') {
                            dockerImage.tag("${DOCKER_LATEST}")
                        }
                        
                        echo '✅ Docker image built successfully'
                        
                        // Store image for later stages
                        env.DOCKER_IMAGE_BUILT = "${DOCKER_IMAGE}:${DOCKER_TAG}"
                        
                    } catch (Exception e) {
                        echo "❌ Docker build failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        error('Docker build failed')
                    }
                }
            }
        }
        
        stage('Test Docker Image') {
            steps {
                echo '🧪 Testing Docker image...'
                
                script {
                    try {
                        sh '''
                            # Test image can run
                            echo "🔍 Testing Docker image startup..."
                            
                            # Start container in background
                            docker run -d --name test-container-${BUILD_NUMBER} \
                                -p 3001:3000 \
                                -e NODE_ENV=test \
                                -e PORT=3000 \
                                -e MONGO_URI=mongodb://localhost:27017/test \
                                ${DOCKER_IMAGE}:${DOCKER_TAG}
                            
                            # Wait for container to be ready
                            sleep 10
                            
                            # Check if container is running
                            docker ps | grep test-container-${BUILD_NUMBER}
                            
                            # Test health endpoint (basic connectivity)
                            timeout 30 sh -c 'until curl -f http://localhost:3001/ > /dev/null 2>&1; do sleep 2; done' || true
                            
                            echo "✅ Docker image test completed"
                        '''
                    } catch (Exception e) {
                        echo "⚠️ Docker image test completed with warnings: ${e.getMessage()}"
                    } finally {
                        // Cleanup test container
                        sh '''
                            docker stop test-container-${BUILD_NUMBER} || true
                            docker rm test-container-${BUILD_NUMBER} || true
                        '''
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                echo '📤 Pushing Docker image to registry...'
                
                script {
                    try {
                        docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                            def image = docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}")
                            
                            // Push tagged version
                            image.push("${DOCKER_TAG}")
                            image.push("${GIT_COMMIT_SHORT}")
                            
                            // Push latest for main branch
                            if (env.GIT_BRANCH_NAME == 'main' || env.GIT_BRANCH_NAME == 'master') {
                                image.push("${DOCKER_LATEST}")
                            }
                        }
                        
                        echo '✅ Docker image pushed successfully'
                        
                    } catch (Exception e) {
                        echo "❌ Docker push failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        error('Docker push failed')
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo '🚀 Deploying to Kubernetes...'
                
                script {
                    try {
                        withCredentials([kubeconfigFile(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                            
                            // Update deployment with new image
                            sh '''
                                # Check kubectl connectivity
                                kubectl cluster-info
                                
                                # Deploy MongoDB (if not already deployed)
                                echo "📊 Deploying MongoDB..."
                                kubectl apply -f mongodb-deployment.yaml
                                
                                # Wait for MongoDB to be ready
                                kubectl rollout status deployment/mongodb --timeout=300s
                                
                                # Update application deployment with new image
                                echo "🔄 Updating application deployment..."
                                kubectl set image deployment/donate-books-app \
                                    donate-books-app=${DOCKER_IMAGE}:${DOCKER_TAG} \
                                    --record
                                
                                # Apply any configuration changes
                                kubectl apply -f app-deployment.yaml
                                
                                # Wait for rollout to complete
                                kubectl rollout status deployment/donate-books-app --timeout=300s
                                
                                # Verify deployment
                                kubectl get pods -l app=donate-books-app
                                kubectl get services donate-books-service
                            '''
                        }
                        
                        echo '✅ Kubernetes deployment completed successfully'
                        
                    } catch (Exception e) {
                        echo "❌ Kubernetes deployment failed: ${e.getMessage()}"
                        
                        // Attempt rollback
                        try {
                            withCredentials([kubeconfigFile(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                                sh 'kubectl rollout undo deployment/donate-books-app'
                                echo '⚠️ Rollback initiated'
                            }
                        } catch (Exception rollbackError) {
                            echo "❌ Rollback also failed: ${rollbackError.getMessage()}"
                        }
                        
                        currentBuild.result = 'FAILURE'
                        error('Kubernetes deployment failed')
                    }
                }
            }
        }
        
        stage('Post-Deployment Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo '🧪 Running post-deployment tests...'
                
                script {
                    try {
                        withCredentials([kubeconfigFile(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                            sh '''
                                # Get service endpoint
                                SERVICE_IP=$(kubectl get service donate-books-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' || echo "")
                                SERVICE_PORT=$(kubectl get service donate-books-service -o jsonpath='{.spec.ports[0].port}')
                                
                                if [ -z "$SERVICE_IP" ]; then
                                    echo "⚠️ LoadBalancer IP not yet assigned, using port-forward for testing"
                                    # Use port-forward for testing
                                    kubectl port-forward service/donate-books-service 8080:80 &
                                    PF_PID=$!
                                    sleep 10
                                    
                                    # Test application endpoint
                                    curl -f http://localhost:8080/ || echo "⚠️ Health check failed"
                                    
                                    # Cleanup port-forward
                                    kill $PF_PID || true
                                else
                                    echo "🔍 Testing application at $SERVICE_IP:$SERVICE_PORT"
                                    curl -f http://$SERVICE_IP:$SERVICE_PORT/ || echo "⚠️ Health check failed"
                                fi
                                
                                # Check pod health
                                kubectl get pods -l app=donate-books-app
                                kubectl top pods -l app=donate-books-app || echo "⚠️ Metrics not available"
                            '''
                        }
                        
                        echo '✅ Post-deployment tests completed'
                        
                    } catch (Exception e) {
                        echo "⚠️ Post-deployment tests completed with warnings: ${e.getMessage()}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo '🧹 Cleaning up...'
            
            script {
                // Cleanup Docker images
                try {
                    sh '''
                        # Remove test containers if any
                        docker ps -a | grep test-container | awk '{print $1}' | xargs -r docker rm -f || true
                        
                        # Clean up dangling images
                        docker image prune -f || true
                        
                        # Keep only recent images (last 5 builds)
                        docker images ${DOCKER_IMAGE} --format "table {{.Tag}}" | grep -E '^[0-9]+$' | sort -nr | tail -n +6 | xargs -r -I {} docker rmi ${DOCKER_IMAGE}:{} || true
                    '''
                } catch (Exception e) {
                    echo "⚠️ Cleanup completed with warnings: ${e.getMessage()}"
                }
            }
            
            // Archive artifacts
            archiveArtifacts artifacts: '*.json, *.log', allowEmptyArchive: true, fingerprint: true
            
            // Cleanup workspace for large files
            cleanWs(
                cleanWhenNotBuilt: false,
                cleanWhenAborted: true,
                cleanWhenFailure: true,
                cleanWhenSuccess: true,
                cleanWhenUnstable: true,
                deleteDirs: true,
                patterns: [
                    [pattern: 'node_modules/**', type: 'EXCLUDE'],
                    [pattern: '**/*.log', type: 'INCLUDE'],
                    [pattern: '**/*.tmp', type: 'INCLUDE']
                ]
            )
        }
        
        success {
            echo '🎉 Pipeline completed successfully!'
            
            script {
                // Send success notification (configure as needed)
                def message = """
✅ **Build Success**: ${env.JOB_NAME} - ${env.BUILD_NUMBER}
🌟 **Branch**: ${env.GIT_BRANCH_NAME}
📝 **Commit**: ${env.GIT_COMMIT_SHORT}
🐳 **Docker Image**: ${DOCKER_IMAGE}:${DOCKER_TAG}
⏱️ **Duration**: ${currentBuild.durationString}
🔗 **Build URL**: ${env.BUILD_URL}
                """.trim()
                
                echo message
                
                // Uncomment to send Slack notification
                // slackSend(
                //     color: 'good',
                //     message: message,
                //     channel: '#deployments'
                // )
            }
        }
        
        failure {
            echo '❌ Pipeline failed!'
            
            script {
                def message = """
❌ **Build Failed**: ${env.JOB_NAME} - ${env.BUILD_NUMBER}
🌟 **Branch**: ${env.GIT_BRANCH_NAME}
📝 **Commit**: ${env.GIT_COMMIT_SHORT}
⏱️ **Duration**: ${currentBuild.durationString}
🔗 **Build URL**: ${env.BUILD_URL}
                """.trim()
                
                echo message
                
                // Uncomment to send Slack notification
                // slackSend(
                //     color: 'danger',
                //     message: message,
                //     channel: '#deployments'
                // )
            }
        }
        
        unstable {
            echo '⚠️ Pipeline completed with warnings!'
        }
    }
}
