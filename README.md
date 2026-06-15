# 🚀 PreviewOps

**PreviewOps** is an automated CI/CD and infrastructure-as-code (IaC) platform designed to dynamically provision isolated, production-like preview environments for Kubernetes applications. 

By seamlessly integrating GitHub webhooks with Jenkins and Amazon EKS, this project eliminates manual infrastructure configuration. It allows developers to instantly test, review, and validate code changes in live, internet-facing environments prior to merging, accelerating the software delivery lifecycle.

---

## 🏗️ Architecture Overview

The system operates on an event-driven CI/CD architecture hosted entirely on AWS:

1. **Trigger:** A developer opens or updates a Pull Request in GitHub.
2. **Webhook:** GitHub fires a payload to our AWS-hosted infrastructure.
3. **CI/CD Server:** Jenkins (running on a dedicated EC2 instance) intercepts the webhook, checks out the code, builds the Docker images, and pushes them.
4. **Orchestration:** Jenkins deploys the new application state to an Amazon EKS cluster using `kubectl` and dynamically generates a unique preview namespace/environment.
5. **Routing:** An NGINX Ingress Controller automatically routes traffic to the new environment via a public AWS Load Balancer.
6. **Validation:** Reviewers access the live preview via a custom `.local` domain to validate changes before merging.

---

## 🛠️ Tech Stack

*   **Cloud Provider:** AWS (EC2, EKS, VPC, ALB/NLB, Security Groups)
*   **Infrastructure as Code (IaC):** Terraform
*   **Containerization & Orchestration:** Docker, Kubernetes (Amazon EKS Auto Mode)
*   **CI/CD:** Jenkins, GitHub Webhooks
*   **Ingress & Routing:** NGINX Ingress Controller

---

## ⚙️ Infrastructure Configuration

### 1. Terraform (EC2 & Security)
Our base infrastructure is immutable and managed via Terraform (`main.tf`). 
*   **Jenkins Server:** Runs on an `m7i-flex.large` Ubuntu 22.04 LTS instance.
*   **Automated Bootstrapping:** The `user_data` script automatically handles the installation of Java 21 JDK, AWS CLI, Kubectl, Docker, and Jenkins on boot.
*   **Security Groups:** Terraform strictly manages our network perimeter. 
    *   Port `8080` (Jenkins UI/Webhooks) and Port `80` (HTTP) are open to `0.0.0.0/0` to allow GitHub webhook deliveries.
    *   Port `22` (SSH) is restricted strictly to administrator IP addresses.
    *   Terraform dynamically attaches firewall rules to our EKS Auto Mode security groups to ensure the worker nodes always accept inbound HTTP traffic.

### 2. Kubernetes (Amazon EKS)
We utilize **Amazon EKS** (managed via `eksctl` and AWS Auto Mode) to host our workloads.
*   **Subnet Strategy:** To ensure our Load Balancers are reachable by external reviewers and webhooks, the cluster is configured to use **Public Subnets** with direct routes to an Internet Gateway (`igw`).
*   **Ingress Controller:** We utilize the NGINX Ingress Controller annotated with AWS-specific configurations to enforce an internet-facing scheme:
    ```yaml
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
    ```

---

## 🚦 Local Environment Mapping

Because we dynamically spin up multiple preview environments (e.g., `development`, `master`), DNS routing is handled locally during the testing phase. 

To access the preview environments, teammates must map the AWS Load Balancer's public IP to our custom `.local` domains in their `/etc/hosts` file:
```text
# Example /etc/hosts configuration
<AWS_LOAD_BALANCER_IP> env-master.previewops.local
<AWS_LOAD_BALANCER_IP> env-development.previewops.local
