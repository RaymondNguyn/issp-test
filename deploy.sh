#!/bin/bash

# Exit on any error
set -e

echo "==============================================="
echo "Starting deployment for Ubuntu"
echo "==============================================="

# Create a directory for logs
mkdir -p logs

# Install all dependencies for Ubuntu
echo "==============================================="
echo "Installing system dependencies..."
echo "==============================================="

# Update package lists
sudo apt-get update

# Install essential tools
sudo apt-get install -y curl wget git build-essential

# Install Python and pip
echo "Installing Python..."
sudo apt-get install -y python3 python3-pip python3-venv

# Install MongoDB
echo "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install yarn (often used with React)
echo "Installing yarn..."
sudo npm install --global yarn

# Verify installations
echo "Verifying installations..."
python3 --version
pip3 --version
node --version
npm --version
mongod --version

echo "All dependencies installed successfully!"

# Deploy Python backend
echo "==============================================="
echo "Setting up Python backend..."
echo "==============================================="

cd backend || { echo "Backend directory not found"; exit 1; }

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create systemd service file for backend
echo "Creating backend service file..."

cat << EOF > backend.service
[Unit]
Description=Python Backend Service
After=network.target mongodb.service
Wants=mongodb.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
StandardOutput=append:$(pwd)/../logs/backend.log
StandardError=append:$(pwd)/../logs/backend_error.log
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

# Deactivate virtual environment
deactivate

# Move to parent directory
cd ..

# Deploy React frontend
echo "==============================================="
echo "Setting up React frontend..."
echo "==============================================="

cd my-app || { echo "React app directory not found"; exit 1; }

# Install dependencies
npm install

# Build for production
npm run build

# Create systemd service file for frontend
echo "Creating frontend service file..."

cat << EOF > frontend.service
[Unit]
Description=React Frontend Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(which npm) run dev
Restart=on-failure
StandardOutput=append:$(pwd)/../logs/frontend.log
StandardError=append:$(pwd)/../logs/frontend_error.log
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Move to parent directory
cd ..

# Setup service files
echo "==============================================="
echo "Installing and starting services..."
echo "==============================================="

# Copy service files to systemd directory
sudo cp backend/backend.service /etc/systemd/system/
sudo cp my-app/frontend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable backend.service
sudo systemctl enable frontend.service

# Start services
sudo systemctl start backend.service
sudo systemctl start frontend.service

# Check service status
echo "==============================================="
echo "Service status:"
echo "==============================================="
echo "Backend service:"
sudo systemctl status backend.service --no-pager
echo "==============================================="
echo "Frontend service:"
sudo systemctl status frontend.service --no-pager

echo "==============================================="
echo "Deployment completed!"
echo "Backend API running at: http://localhost:8000"
echo "Frontend running at: http://localhost:3000 (or your configured port)"
echo "Logs are available in the logs directory"
echo "==============================================="
