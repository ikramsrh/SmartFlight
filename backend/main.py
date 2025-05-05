from fastapi import FastAPI
from pydantic import BaseModel
import requests
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import math
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS sécurisé pour développement et production
origins = [
    "http://localhost:3000",           # Pour React en local
    "https://smart-flight.vercel.app",
    "https://smartflight.onrender.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENWEATHERMAP_API_KEY = "ccd470b5ffad59e89efaaa2906b3250b"

class TrajectoryRequest(BaseModel):
    start: str
    end: str

class TrajectoryPoint(BaseModel):
    lat: float
    lon: float

class TrajectoryResponse(BaseModel):
    trajectories: list
    fuel: list
    time: list
    recommendation: int

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2*R*math.asin(math.sqrt(a))

def get_weather(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
    try:
        r = requests.get(url, timeout=1.5)
        if r.status_code != 200:
            return {}
        return r.json()
    except Exception as e:
        print(f"Erreur météo pour {lat},{lon} : {e}")
        return {}

# Charger et entraîner le modèle de régression sur les données historiques
df = pd.read_csv("data_train.csv")
X = df[["distance", "wind", "precipitation"]]
y = df["score"]
reg_model = LinearRegression()
reg_model.fit(X, y)

def get_coords(city):
    try:
        lat, lon = map(float, city.split(","))
        return (lat, lon)
    except:
        pass
    try:
        url = f"https://nominatim.openstreetmap.org/search"
        params = {"q": city, "format": "json", "limit": 1}
        r = requests.get(url, params=params, headers={"User-Agent": "traj3d/1.0"}, timeout=5)
        results = r.json()
        if results:
            lat = float(results[0]["lat"])
            lon = float(results[0]["lon"])
            return (lat, lon)
    except Exception as e:
        print("Erreur géocodage:", e)
    return (48.8566, 2.3522)  # Paris par défaut

def interpolate_points(start, end, n=15):
    return [
        (
            start[0] + (end[0] - start[0]) * i / (n - 1),
            start[1] + (end[1] - start[1]) * i / (n - 1)
        )
        for i in range(n)
    ]

@app.get("/")
def read_root():
    return {"message": "Backend FastAPI opérationnel avec ML, géocodage dynamique et trajectoires lisses !"}

@app.post("/calculate-trajectories", response_model=TrajectoryResponse)
def calculate_trajectories(req: TrajectoryRequest):
    start_coords = get_coords(req.start)
    end_coords = get_coords(req.end)

    mid_lat = (start_coords[0] + end_coords[0]) / 2
    mid_lon = (start_coords[1] + end_coords[1]) / 2
    n_points = 15

    # Génère 3 trajectoires lisses (directe, nord, sud)
    traj1 = interpolate_points(start_coords, end_coords, n_points)
    mid_nord = (mid_lat + 2, mid_lon + 2)
    traj2 = interpolate_points(start_coords, mid_nord, n_points//2)[:-1] + interpolate_points(mid_nord, end_coords, n_points//2)
    mid_sud = (mid_lat - 2, mid_lon - 2)
    traj3 = interpolate_points(start_coords, mid_sud, n_points//2)[:-1] + interpolate_points(mid_sud, end_coords, n_points//2)
    trajs = [traj1, traj2, traj3]

    trajs_with_weather = []
    fuel = []
    time = []
    scores = []
    for traj in trajs:
        points = []
        total_dist = 0
        total_wind = 0
        total_precip = 0
        for i, (lat, lon) in enumerate(traj):
            weather = get_weather(lat, lon)
            wind = weather.get("wind", {}).get("speed", 0)
            precip = weather.get("rain", {}).get("1h", 0) if "rain" in weather else 0
            temp = weather.get("main", {}).get("temp", "")
            pressure = weather.get("main", {}).get("pressure", "")
            humidity = weather.get("main", {}).get("humidity", "")
            desc = weather.get("weather", [{}])[0].get("description", "")
            # --- Détection des risques météo ---
            risk = "none"
            if wind and wind > 30:
                risk = "turbulence"
            if "storm" in desc or "orage" in desc or "thunder" in desc:
                risk = "storm"
            if "rain" in desc and precip and precip > 5:
                risk = "storm"
            # -----------------------------------
            points.append({
                "lat": lat,
                "lon": lon,
                "weather": {
                    "wind": wind,
                    "precip": precip,
                    "desc": desc,
                    "temp": temp,
                    "pressure": pressure,
                    "humidity": humidity,
                    "risk": risk
                }
            })
            if i > 0:
                total_dist += haversine(traj[i-1][0], traj[i-1][1], lat, lon)
            total_wind += wind
            total_precip += precip
        trajs_with_weather.append(points)
        avg_wind = total_wind / len(traj)
        avg_precip = total_precip / len(traj)
        score = reg_model.predict(np.array([[total_dist, avg_wind, avg_precip]]))[0]
        scores.append(score)
        fuel.append(round(total_dist * (1 + avg_wind/100), 2))
        time.append(round(total_dist / 800 * 60, 2))
    best_index = scores.index(min(scores))
    return {
        "trajectories": trajs_with_weather,
        "fuel": fuel,
        "time": time,
        "recommendation": best_index
    }
