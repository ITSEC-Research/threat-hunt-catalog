#!/bin/sh

# Set the backend port, defaulting to 8080 if not set
BACKEND_PORT=${VITE_BACKEND_PORT:-8080}

# Start the Python backend API in the background
echo "Starting Python backend on port $BACKEND_PORT..."
# Uses gunicorn to run the Flask app specified in external/backend.py
# Assumes the Flask app instance is named 'app'
gunicorn --bind 0.0.0.0:$BACKEND_PORT external.backend:app &

# Set the frontend port, defaulting to 5173 if not set
FRONTEND_PORT=${PORT:-5173}

# Start the React frontend server in the foreground
# This serves the static 'dist' folder
echo "Starting React frontend on port $FRONTEND_PORT..."
serve -s dist -l $FRONTEND_PORT