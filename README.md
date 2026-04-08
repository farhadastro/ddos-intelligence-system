# DDoS Intelligence System — Global Threat Map

A full-stack, real-time DDoS attack map simulator built for academic and analytical visualization. 
Displays synthetic cross-origin cyber threat streams on an interactive 3D globe with live metrics, severity scoring, and robust mitigation dashboard panels.

**IMPORTANT: This is strictly a simulation. All attack data is procedurally generated locally using statistical distribution models. No real network traffic or live attack intelligence is used or consumed.**

## Tech Stack
- **Backend:** Python, FastAPI, WebSockets (`uvicorn`)
- **Frontend:** React, Vite, Three.js (`@react-three/fiber`), Recharts
- **Theme:** Dark Cyberpunk UI (Glassmorphism, custom CSS)

## Running Locally

### 1. Start the Backend API (Terminal 1)
```bash
cd backend
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn api.server:app --port 8000
```
*The backend generates attack events and streams them via WS to `ws://localhost:8000/ws/attacks`.*

### 2. Start the Frontend App (Terminal 2)
```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```

### 3. Open Visualization
Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- **3D Interactive Globe:** Procedurally generated Earth with OrbitControls.
- **WebSocket Streaming Event Engine:** Continuously synthesizes Volumetric, Protocol, and App-Layer attacks adding burst probabilities.
- **Attack Arc Visualization:** Curved QuadraticBezier arcs coloring (Low/Mod/High/Critical severity) with animated trailing particles.
- **Real-time Vector Analysis & Metrics:** Live feed showing Peak Throughput (Gbps), Packet rate (Mpps), and HTTP request loads.
- **Targeted Simulation Array:** User-forced override button launching sustained volumetric attacks originating exclusively from one country via REST API.

## File Structure

```text
ddos-intelligence-system/
├── backend/                  # Python FastAPI Backend
│   ├── api/
│   │   └── server.py         # Main REST endpoints and WebSocket stream for live attacks
│   ├── simulation/
│   │   ├── attack_simulator.py # Generates synthetic attack events (volumetric, protocol, etc.)
│   │   └── geo_data.py       # Static mappings for country coordinates and target regions
│   └── requirements.txt      # Python dependencies (FastAPI, uvicorn, etc.)
└── frontend/                 # React + Vite Frontend
    ├── package.json          # Node dependencies and build scripts
    ├── index.html            # Main HTML entry point
    ├── vite.config.js        # Vite build configuration
    └── src/
        ├── App.jsx           # Root layout integrating the 3D map, dashboard & controls
        ├── main.jsx          # React DOM mounting entry point
        ├── index.css         # Global cyberpunk theme styles and layout utilities
        ├── assets/
        │   └── countries.json # GeoJSON data used to draw the 3D globe's country borders
        ├── components/
        │   ├── Globe.jsx     # Renders the 3D Earth, atmosphere, and wireframe
        │   ├── AttackArc.jsx # Simulates 3D curved trajectories for attacks on the globe
        │   ├── Dashboard.jsx # Left panel UI displaying real-time threat charts/metrics
        │   └── CountrySelector.jsx # UI panel for forcing targeted attacks from a specific origin
        └── hooks/
            └── useWebSocket.js # Custom hook managing the live WebSocket feed from the backend
```
