# Flowgenix Kubernetes Deployment Script for Windows

param(
    [switch]$Cleanup
)

if ($Cleanup) {
    Write-Host "🧹 Cleaning up Flowgenix deployment..." -ForegroundColor Yellow
    kubectl delete namespace flowgenix --ignore-not-found=true
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
    exit 0
}

Write-Host "🚀 Deploying Flowgenix to Kubernetes..." -ForegroundColor Cyan

# Check if kubectl is available
try {
    kubectl version --client | Out-Null
} catch {
    Write-Host "❌ kubectl is not installed. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check if cluster is accessible
try {
    kubectl cluster-info | Out-Null
} catch {
    Write-Host "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Kubernetes cluster is accessible" -ForegroundColor Green

# Apply manifests in order
Write-Host "📦 Creating namespace..." -ForegroundColor Blue
kubectl apply -f k8s/namespace.yaml

Write-Host "📦 Creating storage resources..." -ForegroundColor Blue
kubectl apply -f k8s/storage.yaml

Write-Host "📦 Creating config maps and secrets..." -ForegroundColor Blue
kubectl apply -f k8s/configmap.yaml

Write-Host "📦 Deploying database services..." -ForegroundColor Blue
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/chromadb.yaml

Write-Host "📦 Deploying application services..." -ForegroundColor Blue
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

Write-Host "📦 Deploying monitoring stack..." -ForegroundColor Blue
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/grafana.yaml

Write-Host "📦 Creating ingress..." -ForegroundColor Blue
kubectl apply -f k8s/ingress.yaml

Write-Host "⏳ Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment --all -n flowgenix

Write-Host "🎉 Deployment complete!" -ForegroundColor Green

# Get service information
Write-Host ""
Write-Host "📋 Service Information:" -ForegroundColor Cyan
kubectl get services -n flowgenix

Write-Host ""
Write-Host "📋 Pod Status:" -ForegroundColor Cyan
kubectl get pods -n flowgenix

Write-Host ""
Write-Host "🌐 Access URLs (add these to your hosts file):" -ForegroundColor Yellow
Write-Host "127.0.0.1 flowgenix.local"
Write-Host "127.0.0.1 api.flowgenix.local"
Write-Host "127.0.0.1 grafana.flowgenix.local"
Write-Host "127.0.0.1 prometheus.flowgenix.local"
Write-Host "127.0.0.1 kibana.flowgenix.local"

Write-Host ""
Write-Host "🎯 Application URLs:" -ForegroundColor Magenta
Write-Host "Frontend: http://flowgenix.local"
Write-Host "Backend API: http://api.flowgenix.local"
Write-Host "Grafana: http://grafana.flowgenix.local (admin/admin)"
Write-Host "Prometheus: http://prometheus.flowgenix.local"
Write-Host "Kibana: http://kibana.flowgenix.local"

Write-Host ""
Write-Host "✅ Flowgenix deployment completed successfully!" -ForegroundColor Green
