"""
DDoS Attack Simulation Engine
Generates synthetic attack events using statistical distributions.
All data is purely simulated — no real network traffic involved.
"""

import uuid
import time
import random
import math
from typing import Optional

from .geo_data import (
    COUNTRIES,
    SOURCE_WEIGHTS,
    TARGET_WEIGHTS,
    get_country_by_name,
)

# ─── Attack type definitions ────────────────────────────────────────────────

ATTACK_TYPES = {
    # Volumetric (L3/L4)
    "UDP_FLOOD": {
        "layer": "L3",
        "category": "volumetric",
        "throughput_range": (50, 800),
        "packet_rate_range": (5, 60),
        "rps_range": (0, 0),
    },
    "ICMP_FLOOD": {
        "layer": "L3",
        "category": "volumetric",
        "throughput_range": (30, 500),
        "packet_rate_range": (10, 80),
        "rps_range": (0, 0),
    },
    "DNS_AMPLIFICATION": {
        "layer": "L3",
        "category": "volumetric",
        "throughput_range": (100, 1200),
        "packet_rate_range": (8, 50),
        "rps_range": (0, 0),
    },
    # Protocol (L4)
    "SYN_FLOOD": {
        "layer": "L4",
        "category": "protocol",
        "throughput_range": (5, 120),
        "packet_rate_range": (5, 100),
        "rps_range": (0, 0),
    },
    "PING_OF_DEATH": {
        "layer": "L3",
        "category": "protocol",
        "throughput_range": (1, 30),
        "packet_rate_range": (1, 20),
        "rps_range": (0, 0),
    },
    "ACK_FLOOD": {
        "layer": "L4",
        "category": "protocol",
        "throughput_range": (10, 200),
        "packet_rate_range": (10, 90),
        "rps_range": (0, 0),
    },
    # Application Layer (L7)
    "HTTP_GET_FLOOD": {
        "layer": "L7",
        "category": "application",
        "throughput_range": (1, 50),
        "packet_rate_range": (1, 10),
        "rps_range": (20000, 500000),
    },
    "HTTP_POST_FLOOD": {
        "layer": "L7",
        "category": "application",
        "throughput_range": (2, 80),
        "packet_rate_range": (1, 15),
        "rps_range": (15000, 400000),
    },
    "SLOWLORIS": {
        "layer": "L7",
        "category": "application",
        "throughput_range": (0.1, 5),
        "packet_rate_range": (0.01, 1),
        "rps_range": (500, 10000),
    },
}

BOTNET_TYPES = [
    "IoT Devices",
    "Compromised Servers",
    "Mobile Devices",
    "Residential Nodes",
]

PULSE_PATTERNS = ["continuous", "pulse", "wave"]

TARGET_INFRA = [
    "Web Server Cluster",
    "CDN Edge Node",
    "DNS Infrastructure",
    "API Gateway",
    "Database Server",
    "Load Balancer",
    "Mail Server",
    "VPN Gateway",
]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _pick_weighted(items: list[dict], weights: dict, key: str = "code"):
    """Select a random item using weighted probabilities."""
    codes = [i[key] for i in items]
    w = [weights.get(c, 0.01) for c in codes]
    total = sum(w)
    w = [x / total for x in w]
    return random.choices(items, weights=w, k=1)[0]


def _burst_value(base: float, burst_chance: float = 0.15, burst_mult: float = 2.5):
    """Apply random burst multiplier to simulate traffic spikes."""
    if random.random() < burst_chance:
        return base * random.uniform(1.5, burst_mult)
    return base


def _compute_severity(throughput_gbps: float, packet_rate: float, rps: float):
    """
    Compute threat intensity score.
    severity = 0.4 * norm(throughput) + 0.3 * norm(packet_rate) + 0.3 * norm(rps)
    """
    norm_tp = min(throughput_gbps / 800, 1.0)
    norm_pr = min(packet_rate / 100, 1.0)
    norm_rps = min(rps / 500000, 1.0)

    score = 0.4 * norm_tp + 0.3 * norm_pr + 0.3 * norm_rps
    score = round(score, 4)

    if score >= 0.75:
        level = "CRITICAL"
    elif score >= 0.50:
        level = "HIGH"
    elif score >= 0.25:
        level = "MODERATE"
    else:
        level = "LOW"

    return score, level


# ─── Main generator ─────────────────────────────────────────────────────────

def generate_attack_event(source_country_name: Optional[str] = None) -> dict:
    """
    Generate a single synthetic DDoS attack event.
    If source_country_name is provided, the attack originates from that country.
    """
    # Pick attack type
    attack_name = random.choice(list(ATTACK_TYPES.keys()))
    attack_info = ATTACK_TYPES[attack_name]

    # Source
    if source_country_name:
        source = get_country_by_name(source_country_name)
        if source is None:
            source = _pick_weighted(COUNTRIES, SOURCE_WEIGHTS)
    else:
        source = _pick_weighted(COUNTRIES, SOURCE_WEIGHTS)

    # Destination (ensure different from source)
    dest = _pick_weighted(COUNTRIES, TARGET_WEIGHTS)
    attempts = 0
    while dest["code"] == source["code"] and attempts < 10:
        dest = _pick_weighted(COUNTRIES, TARGET_WEIGHTS)
        attempts += 1

    # Metrics with burst simulation
    lo_tp, hi_tp = attack_info["throughput_range"]
    lo_pr, hi_pr = attack_info["packet_rate_range"]
    lo_rps, hi_rps = attack_info["rps_range"]

    throughput = _burst_value(random.uniform(lo_tp, hi_tp))
    packet_rate = _burst_value(random.uniform(lo_pr, hi_pr))
    rps = _burst_value(random.uniform(lo_rps, hi_rps)) if hi_rps > 0 else 0

    throughput = round(throughput, 2)
    packet_rate = round(packet_rate, 2)
    rps = round(rps, 1)

    # Temporal data
    duration = random.choice([30, 60, 120, 300, 600, 900, 1800])
    pulse_pattern = random.choice(PULSE_PATTERNS)
    pulse_frequency = round(random.uniform(0.5, 5.0), 1) if pulse_pattern != "continuous" else 0

    # Severity
    severity_score, severity_level = _compute_severity(throughput, packet_rate, rps)

    # Mitigation simulation
    mitigation_rate = random.uniform(0.40, 0.98)
    clean_traffic = round((1.0 - mitigation_rate) * throughput, 2)
    blocked_traffic = round(mitigation_rate * throughput, 2)
    latency_impact_ms = round(random.uniform(2, 250), 1)

    return {
        "attack_id": str(uuid.uuid4()),
        "timestamp": time.time(),
        "attack_type": attack_name,
        "attack_category": attack_info["category"],
        "attack_layer": attack_info["layer"],
        "source_country": source["name"],
        "source_country_code": source["code"],
        "source_coordinates": {"lat": source["lat"], "lng": source["lng"]},
        "destination_country": dest["name"],
        "destination_country_code": dest["code"],
        "destination_coordinates": {"lat": dest["lat"], "lng": dest["lng"]},
        "throughput_gbps": throughput,
        "packet_rate_mpps": packet_rate,
        "requests_per_second": rps,
        "duration_seconds": duration,
        "pulse_pattern": pulse_pattern,
        "pulse_frequency": pulse_frequency,
        "botnet_type": random.choice(BOTNET_TYPES),
        "target_infrastructure": random.choice(TARGET_INFRA),
        "severity_score": severity_score,
        "severity_level": severity_level,
        "mitigation": {
            "clean_traffic_gbps": clean_traffic,
            "blocked_traffic_gbps": blocked_traffic,
            "mitigation_rate": round(mitigation_rate * 100, 1),
            "latency_impact_ms": latency_impact_ms,
        },
    }


def generate_batch(count: int = 5, source_country_name: Optional[str] = None) -> list[dict]:
    """Generate a batch of attack events."""
    return [generate_attack_event(source_country_name) for _ in range(count)]
