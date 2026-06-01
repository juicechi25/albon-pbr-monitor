# albon-pbr-monitor

https://console.cloud.google.com/auth/clients/447611941892-18bvfphkse7n97ou1hu9488egdd140og.apps.googleusercontent.com?project=albon-pbr-mock&supportedpurview=project,folder



Here’s what you **still need to do** to fully meet the ALBON spec.

## Must do before submission

### 1. Fix backend data mismatch between simulator and API

Your `SensorData` model expects:

```py
{
  "system_id": "...",
  "sensors": {...},
  "latency": ...
}
```

but your `simulator.py` sends:

```py
{
  "system_id": "...",
  "temperature": ...,
  "ph": ...,
  "oxygen": ...,
  "turbidity": ...
}
```

So `/sensor` may reject simulator data with a validation error. Fix either the model or simulator so they use the same shape. Your backend currently defines `SensorData` with a `sensors` dictionary, while the simulator returns flat sensor fields.  

### 2. Add tests

The brief requires **unit or integration tests for at least one critical component**, including a happy path and one failure mode. 

Add tests for:

```text
POST /actuator as operator -> 200 acknowledged
POST /actuator as viewer -> 403 rejected
POST /actuator during emergency stop -> 423 locked
```

You already have `pytest` in `requirements.txt`, but I don’t see test files yet. 

### 3. Fix WebSocket duplicate code

In `main.py`, the WebSocket function has two repeated blocks with `await websocket.accept()` twice. This can cause unstable behaviour after disconnects. Keep only one accept loop. 

### 4. Add stronger input validation

The brief says all API endpoints need server-side validation for types, ranges, and allowed values before commands are processed. 

Currently:

```py
actuator: str
```

should be stricter:

```py
actuator: Literal["pump", "lights"]
```

Also validate sensor ranges, for example:

```text
temperature: 18–32 °C
pH: 5.5–8.5
oxygen: 40–95
turbidity: 5–50
```

### 5. Add reconnect state confirmation

The spec says after connection loss, actuator state must be re-confirmed before controls are enabled again. 

You partially do this with `stateSynced`, but you should make reconnect do this flow:

```text
WebSocket reconnects
→ frontend calls GET /systems/{system_id}/state
→ update pump/lights/emergency_stop
→ only then set stateSynced = true
→ re-enable controls
```

Your backend already has `GET /systems/{system_id}/state`, so use it in the frontend reconnect logic. 

### 6. Add README

The brief requires a README that lets ALBON engineers run the demo in under 10 minutes. 

Your README should include:

```text
1. Backend setup
2. Frontend setup
3. Simulator setup
4. Run commands
5. Login credentials
6. Demo flow
7. Known assumptions
8. AI disclosure
9. Code style guide
10. Troubleshooting checklist
```

### 7. Add architecture/report PDF

The brief asks for a PDF submission with architecture explanation, API definition, latency rationale, safety logic, deployment path, cost, and AI disclosure. 

You still need to write the report with:

```text
- Two architecture options
- Pros/cons of each
- Why you chose REST + WebSocket
- Block diagram
- API table
- Safety/fail-safe logic
- Testing summary
- Raspberry Pi deployment path
- Security hardening plan
- Monthly cost estimate
- AI disclosure
```

## Should improve

### 8. Add proper authentication explanation

You have role-based login in frontend and backend checks for `operator`, but this is not real authentication. The brief says basic authentication strategy must be documented, even if not fully implemented. 

In the report, say prototype uses mock roles, and production would use:

```text
JWT login
hashed passwords
HTTPS
role-based access control
operator audit logs
short session expiry
```

### 9. Add a Docker / Raspberry Pi path

The brief requires a clear path to containerise and deploy the server tier to Raspberry Pi or edge hardware. 

Add either:

```text
Dockerfile
docker-compose.yml
```

or at least a documented deployment plan.

### 10. Fix CSV report export

Your `/report/{system_id}` endpoint writes columns like:

```text
temperature, ph, oxygen, turbidity
```

but if stored records use `sensors: {...}`, the CSV writer may not match the data shape. Make the storage format consistent first, then fix report export.

### 11. Add troubleshooting checklist

The brief specifically asks for the three most likely live-site failure modes. 

Use something like:

```text
1. Backend offline
2. WebSocket disconnected / stale telemetry
3. Emergency stop active / actuator locked
```

### 12. Add measured latency explanation

You already have `/ping`, `/latency`, and metrics for average latency and message rate.  

But you need to document:

```text
Expected local latency: <100–200 ms for ping
Telemetry update interval: 1 second
Stale threshold: e.g. >2 seconds without fresh data
Why WebSocket is better than polling for operator confidence
```

## Nice extra, but not required

### 13. Add persistent storage

Right now storage is in-memory, so data disappears when the backend restarts. That is okay for MVP, but in your report say production would use SQLite/PostgreSQL.

### 14. Add Swagger screenshots

FastAPI automatically gives you:

```text
http://127.0.0.1:8000/docs
```

Include a screenshot in the report if you want the API section to look stronger.

### 15. Add a demo script

Write a clear demo sequence:

```text
1. Start backend
2. Start frontend
3. Login as operator
4. Select PBR-003
5. Start simulator
6. Show live telemetry
7. Toggle pump/lights
8. Trigger emergency stop
9. Show controls locked
10. Reset emergency stop
11. Download report
12. Show logs/metrics
```

## Priority order

Do these first:

```text
1. Fix sensor payload mismatch
2. Fix WebSocket duplicate accept block
3. Add tests
4. Add README
5. Add report PDF content
6. Add reconnect state confirmation
7. Tighten actuator/sensor validation
```

Once those are done, your project will be much closer to the spec.
