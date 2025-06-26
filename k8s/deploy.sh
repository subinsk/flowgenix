#!/bin/bash

# Flowgenix Kubernetes Deployment Script

set -e

echo "🚀 Deploying Flowgenix to Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Apply manifests in order
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo "📦 Creating storage resources..."
kubectl apply -f k8s/storage.yaml

echo "📦 Creating config maps and secrets..."
kubectl apply -f k8s/configmap.yaml

echo "📦 Deploying database services..."
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/chromadb.yaml

echo "📦 Deploying application services..."
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

echo "📦 Deploying monitoring stack..."
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/grafana.yaml

echo "📦 Creating ingress..."
kubectl apply -f k8s/ingress.yaml

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment --all -n flowgenix

echo "🎉 Deployment complete!"

# Get service information
echo ""
echo "📋 Service Information:"
kubectl get services -n flowgenix

echo ""
echo "📋 Pod Status:"
kubectl get pods -n flowgenix

echo ""
echo "🌐 Access URLs (add these to your /etc/hosts file):"
echo "127.0.0.1 flowgenix.local"
echo "127.0.0.1 api.flowgenix.local"
echo "127.0.0.1 grafana.flowgenix.local"
echo "127.0.0.1 prometheus.flowgenix.local"
echo "127.0.0.1 kibana.flowgenix.local"

echo ""
echo "🎯 Application URLs:"
echo "Frontend: http://flowgenix.local"
echo "Backend API: http://api.flowgenix.local"
echo "Grafana: http://grafana.flowgenix.local (admin/admin)"
echo "Prometheus: http://prometheus.flowgenix.local"
echo "Kibana: http://kibana.flowgenix.local"

echo ""
echo "✅ Flowgenix deployment completed successfully!"
