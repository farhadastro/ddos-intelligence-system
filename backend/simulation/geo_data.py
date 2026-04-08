"""
Geographic data module — static dataset mapping countries to coordinates.
Used for source/destination simulation in DDoS attack events.
"""

COUNTRIES = [
    {"name": "United States", "code": "US", "lat": 38.0, "lng": -97.0},
    {"name": "China", "code": "CN", "lat": 35.0, "lng": 105.0},
    {"name": "Russia", "code": "RU", "lat": 61.0, "lng": 105.0},
    {"name": "Brazil", "code": "BR", "lat": -14.0, "lng": -51.0},
    {"name": "India", "code": "IN", "lat": 20.0, "lng": 77.0},
    {"name": "Germany", "code": "DE", "lat": 51.0, "lng": 10.0},
    {"name": "United Kingdom", "code": "GB", "lat": 55.0, "lng": -3.0},
    {"name": "Japan", "code": "JP", "lat": 36.0, "lng": 138.0},
    {"name": "South Korea", "code": "KR", "lat": 36.0, "lng": 128.0},
    {"name": "France", "code": "FR", "lat": 46.0, "lng": 2.0},
    {"name": "Australia", "code": "AU", "lat": -25.0, "lng": 134.0},
    {"name": "Canada", "code": "CA", "lat": 56.0, "lng": -106.0},
    {"name": "Netherlands", "code": "NL", "lat": 52.5, "lng": 5.75},
    {"name": "Ukraine", "code": "UA", "lat": 49.0, "lng": 32.0},
    {"name": "Iran", "code": "IR", "lat": 32.0, "lng": 53.0},
    {"name": "Turkey", "code": "TR", "lat": 39.0, "lng": 35.0},
    {"name": "Vietnam", "code": "VN", "lat": 14.0, "lng": 108.0},
    {"name": "Indonesia", "code": "ID", "lat": -5.0, "lng": 120.0},
    {"name": "Nigeria", "code": "NG", "lat": 10.0, "lng": 8.0},
    {"name": "South Africa", "code": "ZA", "lat": -31.0, "lng": 24.0},
]

# --- Weighted source probabilities (higher = more likely to be attack source) ---
SOURCE_WEIGHTS = {
    "CN": 0.18, "RU": 0.15, "US": 0.12, "BR": 0.08, "IN": 0.08,
    "VN": 0.06, "ID": 0.05, "UA": 0.05, "IR": 0.04, "NG": 0.04,
    "KR": 0.03, "TR": 0.03, "DE": 0.02, "JP": 0.02, "FR": 0.01,
    "GB": 0.01, "NL": 0.01, "CA": 0.01, "AU": 0.005, "ZA": 0.005,
}

# --- Target weights (higher = more likely to be attack destination) ---
TARGET_WEIGHTS = {
    "US": 0.25, "DE": 0.12, "GB": 0.10, "FR": 0.08, "JP": 0.08,
    "NL": 0.06, "CA": 0.06, "AU": 0.05, "KR": 0.04, "IN": 0.04,
    "BR": 0.03, "CN": 0.03, "RU": 0.02, "TR": 0.01, "ZA": 0.01,
    "UA": 0.005, "IR": 0.005, "VN": 0.005, "ID": 0.005, "NG": 0.005,
}


def get_country_by_code(code: str):
    for c in COUNTRIES:
        if c["code"] == code:
            return c
    return None


def get_country_by_name(name: str):
    name_lower = name.lower()
    for c in COUNTRIES:
        if c["name"].lower() == name_lower:
            return c
    return None


def get_all_country_names():
    return [c["name"] for c in COUNTRIES]
