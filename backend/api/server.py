"""
FastAPI server — REST + WebSocket endpoints for the DDoS Intelligence System.
Streams synthetic attack events to connected clients in real-time.
"""

import asyncio
import json
import time
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulation.attack_simulator import generate_attack_event, generate_batch
from simulation.geo_data import get_all_country_names, COUNTRIES

# ─── State ───────────────────────────────────────────────────────────────────

recent_attacks: list[dict] = []
MAX_RECENT = 200
connected_clients: list[WebSocket] = []
background_task = None

# Country-specific simulation state
forced_source_country: Optional[str] = None
forced_source_expiry: float = 0


# ─── Background attack generator ────────────────────────────────────────────

async def attack_generator():
    """Continuously generates and broadcasts attack events."""
    global forced_source_country, forced_source_expiry

    while True:
        # Check if forced country simulation has expired
        if forced_source_country and time.time() > forced_source_expiry:
            forced_source_country = None

        source = forced_source_country
        event = generate_attack_event(source_country_name=source)

        # Store in recent history
        recent_attacks.append(event)
        if len(recent_attacks) > MAX_RECENT:
            del recent_attacks[: len(recent_attacks) - MAX_RECENT]

        # Broadcast to all connected WebSocket clients
        payload = json.dumps(event)
        disconnected = []
        for ws in connected_clients:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            connected_clients.remove(ws)

        # Wait 1–3 seconds before next event
        await asyncio.sleep(1.0 + (hash(event["attack_id"]) % 2000) / 1000)


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global background_task
    background_task = asyncio.create_task(attack_generator())
    yield
    background_task.cancel()
    try:
        await background_task
    except asyncio.CancelledError:
        pass


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DDoS Intelligence System",
    description="Synthetic DDoS attack visualization backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic models ────────────────────────────────────────────────────────

class SimulateCountryRequest(BaseModel):
    country: str
    duration_seconds: int = 60


class StatusResponse(BaseModel):
    status: str
    uptime_seconds: float
    total_events_generated: int
    active_connections: int
    countries_available: list[str]


_start_time = time.time()


# ─── REST endpoints ─────────────────────────────────────────────────────────

@app.get("/api/status")
async def get_status():
    return {
        "status": "operational",
        "uptime_seconds": round(time.time() - _start_time, 1),
        "total_events_generated": len(recent_attacks),
        "active_connections": len(connected_clients),
        "countries_available": get_all_country_names(),
        "forced_source_country": forced_source_country,
    }


@app.get("/api/attacks")
async def get_attacks(limit: int = 50):
    return {"attacks": recent_attacks[-limit:], "total": len(recent_attacks)}


@app.get("/api/countries")
async def get_countries():
    return {"countries": COUNTRIES}


@app.post("/api/simulate_country")
async def simulate_country(req: SimulateCountryRequest):
    global forced_source_country, forced_source_expiry

    available = get_all_country_names()
    if req.country not in available:
        return {"error": f"Unknown country. Available: {available}"}

    duration = max(10, min(req.duration_seconds, 300))
    forced_source_country = req.country
    forced_source_expiry = time.time() + duration

    return {
        "message": f"Simulating attacks from {req.country} for {duration}s",
        "country": req.country,
        "duration_seconds": duration,
    }


# ─── WebSocket endpoint ─────────────────────────────────────────────────────

@app.websocket("/ws/attacks")
async def websocket_attacks(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    try:
        # Send a burst of recent events on connect
        for event in recent_attacks[-10:]:
            await ws.send_text(json.dumps(event))

        # Keep connection alive — read pings from client
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if ws in connected_clients:
            connected_clients.remove(ws)
