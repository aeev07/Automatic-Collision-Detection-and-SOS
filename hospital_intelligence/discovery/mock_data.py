from typing import List, Dict, Any
from hospital_intelligence.gps.distance import haversine_distance

# High-fidelity emergency hospitals around Lucknow reference center (26.8467, 80.9462)
MOCK_HOSPITALS_DATABASE: List[Dict[str, Any]] = [
    {
        "name": "Civil Hospital Hazratganj",
        "latitude": 26.8510,
        "longitude": 80.9450,
        "address": "Park Rd, Hazratganj, Lucknow, Uttar Pradesh 226001",
        "phone": "+91 522 223 9012"
    },
    {
        "name": "King George's Medical University (Trauma Centre)",
        "latitude": 26.8703,
        "longitude": 80.9174,
        "address": "Shah Mina Rd, Chowk, Lucknow, Uttar Pradesh 226003",
        "phone": "+91 522 225 7450"
    },
    {
        "name": "Sanjay Gandhi Postgraduate Institute of Medical Sciences (SGPGI)",
        "latitude": 26.7441,
        "longitude": 80.9392,
        "address": "Raebareli Rd, Lucknow, Uttar Pradesh 226014",
        "phone": "+91 522 266 8004"
    },
    {
        "name": "Dr. Ram Manohar Lohia Institute of Medical Sciences",
        "latitude": 26.8647,
        "longitude": 80.9995,
        "address": "Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010",
        "phone": "+91 522 669 2000"
    },
    {
        "name": "Apollomedics Super Speciality Hospital",
        "latitude": 26.7824,
        "longitude": 80.9021,
        "address": "Sector B, Bargawan, LDA Colony, Lucknow, Uttar Pradesh 226012",
        "phone": "+91 522 667 7777"
    },
    {
        "name": "Sahara Hospital",
        "latitude": 26.8522,
        "longitude": 81.0041,
        "address": "Viraj Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010",
        "phone": "+91 522 678 0001"
    },
    {
        "name": "Medanta Hospital Lucknow",
        "latitude": 26.7761,
        "longitude": 80.9782,
        "address": "Sector A, Pocket 1, Sushant Golf City, Amar Shaheed Path, Lucknow 226030",
        "phone": "+91 522 450 5050"
    }
]


def get_mock_hospitals_for_location(lat: float, lon: float, radius_km: float = 15.0) -> List[Dict[str, Any]]:
    """
    Returns mock hospitals filtered within radius_km.
    If the requested coordinates are far from Lucknow, generates dynamically positioned
    emergency facilities relative to the given coordinates so that demos anywhere succeed!
    """
    results = []
    for h in MOCK_HOSPITALS_DATABASE:
        dist = haversine_distance(lat, lon, h["latitude"], h["longitude"])
        if dist <= radius_km:
            results.append({
                "name": h["name"],
                "latitude": h["latitude"],
                "longitude": h["longitude"],
                "address": h["address"],
                "phone": h["phone"],
                "distance_km": dist
            })

    # Dynamic fallback if query location is far away (e.g. testing in Delhi, Mumbai, or internationally)
    if not results:
        offsets = [
            ("Central District Trauma Center", 0.015, 0.012, "Main Medical Blvd", "+91 11 2345 6789"),
            ("City Emergency Hospital", -0.022, 0.018, "Hospital Way Sector 4", "+91 11 9876 5432"),
            ("Metropolitan General Hospital", 0.035, -0.028, "Ring Road Junction", "+91 11 5555 1234"),
        ]
        for name, d_lat, d_lon, addr, ph in offsets:
            h_lat = round(lat + d_lat, 5)
            h_lon = round(lon + d_lon, 5)
            dist = haversine_distance(lat, lon, h_lat, h_lon)
            results.append({
                "name": name,
                "latitude": h_lat,
                "longitude": h_lon,
                "address": addr,
                "phone": ph,
                "distance_km": dist
            })

    return results
