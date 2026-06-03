# ALBON PBR Remote Monitoring and Control MVP

This project is a proof-of-concept remote monitoring and control system for ALBON’s solar-powered photobioreactor prototype.

It includes a FastAPI backend, React frontend, and Python simulator client. The system can run locally on a developer laptop without physical PLC hardware.

---

## Features

* Live sensor telemetry through WebSocket
* Python simulator for dry-run sensor data and operator commands
* React dashboard for monitoring PBR system status
* Pump and light actuator control
* Emergency stop and reset flow
* Operator and viewer role separation
* Backend validation for sensor data and actuator commands
* Server logs, metrics, and CSV report download
* Backend tests for validation and actuator safety

---

## Tech Stack

### Backend

* Python
* FastAPI
* Pydantic
* Uvicorn
* Pytest

### Frontend

* React
* Vite
* JavaScript
* CSS

### Simulator

* Python CLI script
* Requests library

---

## Project Structure

```text
albon-pbr-monitor/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── simulator.py
│   ├── storage.py
│   ├── metrics.py
│   ├── requirements.txt
│   └── test/
│       ├── test_validation.py
│       └── test_actuator.py
│
├── frontend/
│   ├── src/
│   └── package.json
│
├── start.sh
└── README.md
```

---

## First-Time Setup

Before running the demo, install backend and frontend dependencies.

### Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Frontend setup

```bash
cd frontend
npm install
cd ..
```

---

## Run the Full Demo

From the project root:

```bash
chmod +x start.sh
./start.sh
```

This starts:

* FastAPI backend at `http://127.0.0.1:8000`
* React frontend at `http://localhost:5173`
* Simulator streaming data for all PBR sites

Open the frontend in your browser:

```text
http://localhost:5173
```

Backend API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

To stop all services, press:

```text
Ctrl + C
```

---

## Manual Run Option

You can also run each service manually in separate terminals.

### Terminal 1: Backend

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Simulator

```bash
cd backend
source .venv/bin/activate
python simulator.py --all
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev
```

---

## Login

The demo supports two user roles:

* **Operator**: can view all PBR sites and control actuators
* **Viewer**: can only view telemetry for their assigned PBR site

### Operator Login

Operator access is only available through Google OAuth.

```text
Role: operator
Login method: Google OAuth
Access: all PBR sites
Permissions: view telemetry, control pump/lights, trigger emergency stop, reset emergency stop
```

Only Google accounts included in the operator allowlist can access operator controls.

Do not commit real operator email addresses, OAuth secrets, or API keys to the repository.

### Viewer Login

Viewer access uses the demo username and password login.

```text
Role: viewer
Login method: username and password
Access: assigned PBR site only
Permissions: view telemetry only
```

Example viewer accounts:

| Role   | Username  | Password    | Access            |
| ------ | --------- | ----------- | ----------------- |
| Viewer | `viewer1` | `viewer001` | Assigned PBR site |
| Viewer | `viewer2` | `viewer002` | Assigned PBR site |
| Viewer | `viewer3` | `viewer003` | Assigned PBR site |
| Viewer | `viewer4` | `viewer004` | Assigned PBR site |

These are mock demo credentials only. 
They are included so reviewers can test viewer access quickly.
Do not use these credentials in production.

---

## Demo Flow

1. Start the backend, frontend, and simulator.
2. Open `http://localhost:5173`.
3. Log in as an operator using Google OAuth to view all PBR sites and test actuator controls.
4. Log in as a viewer using demo username/password credentials to confirm restricted view-only access.
5. Select a PBR site.
6. Check that live sensor data is updating.
7. Use operator controls to turn pump or lights on/off.
8. Trigger emergency stop.
9. Confirm actuator controls are locked.
10. Reset emergency stop.
11. View logs, metrics, and download a CSV report.

---

## Testing

Run backend tests from the `backend` folder:

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. python -m pytest test -v
```

The tests cover:

* Valid sensor data
* Invalid pH rejection
* Invalid latency rejection
* Operator actuator command success
* Viewer actuator command rejection
* Emergency stop blocking actuator commands

---

## Troubleshooting

### Backend is not running

Restart the backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend cannot connect to backend

Check that the backend is running on:

```text
http://127.0.0.1:8000
```

Also check that the frontend is running on:

```text
http://localhost:5173
```

### Telemetry is not updating

Restart the simulator:

```bash
cd backend
source .venv/bin/activate
python simulator.py --all
```

Then refresh the frontend.

### Google OAuth login is not working

Check that the Google OAuth client ID is configured correctly in the frontend environment.

Also confirm that the Google account being used is included in the operator allowlist.

### Viewer login is not working

Check that the viewer username and password exist in the demo user data file.

Also confirm that the viewer account is assigned to a valid PBR site.

### Actuator controls are disabled

Emergency stop may be active. Reset emergency stop as an operator, then check the current actuator state.

