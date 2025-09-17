pipeline {
    agent any
    environment {
        DOCKER_IMAGE     = "bhavanagm15/donatebooks-app"
        DOCKER_TAG       = "${BUILD_NUMBER}"
        EKS_CLUSTER_NAME = "Bhavana-test-cluster"
        AWS_REGION       = "ap-southeast-1"
        KUBECONFIG       = "/var/lib/jenkins/.kube/config"  // persistent kubeconfig
    }
    stages {
        stage('Checkout') {
            steps {
                git credentialsId: 'github_credentials',
                    branch: 'master',
                    url: 'https://github.com/bhavanagm/Deployment_project.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🛠️ Building Docker image..."
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Docker Compose Test') {
            steps {
                script {
                    echo "🧪 Testing with Docker Compose..."
                    sh """
                        docker-compose down -v
                        docker-compose build
                        docker-compose up -d
                        sleep 30
                        docker-compose ps
                        i=1
                        while [ \$i -le 5 ]; do
                            if curl -f http://localhost:3000 2>/dev/null; then
                                echo "✅ Application is responding"
                                break
                            fi
                            echo "⏳ Waiting for application... attempt \$i/5"
                            i=\$((i+1))
                            sleep 10
                        done
                        docker-compose logs --tail=10 app
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    echo "📦 Pushing Docker image..."
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        sh """
                            docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                            docker push ${DOCKER_IMAGE}:latest
                        """
                    }
                    echo "✅ Docker images pushed successfully"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withAWS(credentials: 'aws_credentials', region: "${AWS_REGION}") {
                    script {
                        sh """
                            echo "🔄 Updating kubeconfig..."
                            mkdir -p /var/lib/jenkins/.kube
                            export KUBECONFIG=/var/lib/jenkins/.kube/config
                            aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME} --kubeconfig \$KUBECONFIG

                            echo "✅ Verifying cluster access..."
                            kubectl get nodes

                            echo "🚀 Deploying to Kubernetes..."
                            kubectl apply -f mongodb-deployment.yaml
                            kubectl apply -f app-deployment.yaml
                            kubectl set image deployment/donate-books-app \\
                                donate-books-app=${DOCKER_IMAGE}:${DOCKER_TAG}

                            echo "⏳ Waiting for deployments..."
                            kubectl rollout status deployment/mongodb --timeout=300s
                            kubectl rollout status deployment/donate-books-app --timeout=300s

                            echo "📊 Deployment status:"
                            kubectl get deployments
                            kubectl get services
                            kubectl get pods
                        """
                    }
                }
            }
        }

        stage('Get LoadBalancer URL') {
            steps {
                withAWS(credentials: 'aws_credentials', region: "${AWS_REGION}") {
                    script {
                        sh """
                            export KUBECONFIG=/var/lib/jenkins/.kube/config
                            echo "🌐 Getting LoadBalancer URL..."

                            i=1
                            while [ \$i -le 10 ]; do
                                EXTERNAL_IP=\$(kubectl get service donate-books-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
                                EXTERNAL_HOSTNAME=\$(kubectl get service donate-books-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

                                if [ ! -z "\$EXTERNAL_IP" ]; then
                                    echo "🌐 Application URL: http://\$EXTERNAL_IP"
                                    break
                                elif [ ! -z "\$EXTERNAL_HOSTNAME" ]; then
                                    echo "🌐 Application URL: http://\$EXTERNAL_HOSTNAME"
                                    break
                                fi

                                echo "⏳ Waiting for LoadBalancer... attempt \$i/10"
                                i=\$((i+1))
                                sleep 20
                            done

                            kubectl get service donate-books-service
                            echo "✅ Deployment completed successfully!"
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}
