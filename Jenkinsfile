pipeline {
    agent any
    environment {
        AWS_ACCOUNT_ID = '885232248552' // Find this in the top right of AWS Console
        AWS_REGION     = 'eu-north-1'
        ECR_REPO_NAME  = 'previewops-backend' // The name of the repo you created earlier

        CLEAN_ID       = "${env.BRANCH_NAME.toLowerCase().replaceAll(' ', '-')}"
        NAMESPACE      = "preview-env-${CLEAN_ID}"
    }
    stages {
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                    // Output lands in frontend/dist/ — picked up by COPY . . in Dockerfile
                }
            }
        }
        stage('Docker Build & Push') {
            steps {
                script {
                    def ecrUri = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                    def fullImageName = "${ecrUri}/${ECR_REPO_NAME}:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                    
                    // Login, Build, and Push
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ecrUri}"
                    sh "docker build -t ${fullImageName} ."
                    sh "docker push ${fullImageName}"
                }
            }
        }
        stage('Deploy to EKS') {
            steps {
                script {
                    // 1. Create unique namespace
                    sh "kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"

                    // 2. Apply RBAC so the pod can list namespaces
                    sh "sed -i 's|NAMESPACE_PLACEHOLDER|${NAMESPACE}|g' k8s/rbac.yaml"
                    sh "kubectl apply -f k8s/rbac.yaml"

                    // 3. Create the GitHub token secret (idempotent)
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN_VALUE')]) {
                        sh """
                            kubectl create secret generic bridge-api-secrets \
                              --from-literal=GITHUB_TOKEN=${GITHUB_TOKEN_VALUE} \
                              --namespace=${NAMESPACE} \
                              --dry-run=client -o yaml | kubectl apply -f -
                        """
                    }

                    // 4. Inject the new Image Tag into our YAML file
                    def fullImageName = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                    sh "sed -i 's|IMAGE_TAG|${fullImageName}|g' k8s/deployment.yaml"

                    // 5. Inject the Dynamic URL Route into Ingress YAMLs
                    sh "sed -i 's|DYNAMIC_ENV|${CLEAN_ID}|g' k8s/ingress.yaml"

                    // 6. Deploy
                    sh "kubectl apply -f k8s/deployment.yaml -n ${NAMESPACE}"
                    sh "kubectl apply -f k8s/service.yaml -n ${NAMESPACE}"
                    sh "kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE}"

                    // 7. Wait for the URL
                    echo "Preview Environment is spinning up in namespace: ${NAMESPACE}"
                    echo "Your dynamic URL will route via host: env-${env.BRANCH_NAME}.previewops.local"
                }
            }
        }
    }
}
