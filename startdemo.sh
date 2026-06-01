#!/bin/bash

echo "Starting ALBON PBR Monitor Demo..."

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting FastAPI backend..."
cd "$PROJECT_ROOT/backend"
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

sleep 3

echo "Starting simulator desktop client for all PBR sites..."
python simulator.py --all &
SIMULATOR_PID=$!

echo "Starting React frontend..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Demo running:"
echo "Backend:   http://127.0.0.1:8000"
echo "Frontend:  http://localhost:5173"
echo "Simulator: running for all PBR sites"
echo ""
echo "Press Ctrl+C to stop all services."

trap "echo 'Stopping services...'; kill $BACKEND_PID $SIMULATOR_PID $FRONTEND_PID; exit" INT

wait