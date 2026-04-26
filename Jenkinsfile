pipeline {
    agent any
    environment {
        AWS_ACCOUNT_ID = 'YOUR_12_DIGIT_ID' // Find this in the top right of AWS Console
        AWS_REGION     = 'eu-north-1'
        ECR_REPO_NAME  = 'YOUR_REPO_NAME' // The name of the repo you created earlier
        NAMESPACE      = "preview-env-${env.BUILD_NUMBER}"
    }
    stages {
        stage('Docker Build & Push') {
            steps {
                script {
                    def ecrUri = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                    def fullImageName = "${ecrUri}/${ECR_REPO_NAME}:${env.BUILD_NUMBER}"
                    
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
                    
                    // 2. Inject the new Image Tag into our YAML file
                    def fullImageName = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${env.BUILD_NUMBER}"
                    sh "sed -i 's|IMAGE_TAG|${fullImageName}|g' k8s/deployment.yaml"
                    
                    // 3. Deploy
                    sh "kubectl apply -f k8s/deployment.yaml -n ${NAMESPACE}"
                    
                    // 4. Wait for the URL
                    echo "Preview Environment is spinning up in namespace: ${NAMESPACE}"
                    sh "kubectl get svc preview-service -n ${NAMESPACE}"
                }
            }
        }
    }
}