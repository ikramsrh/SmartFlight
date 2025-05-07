import requests
import csv

# Liste de points de départ et d'arrivée
villes = ["Paris", "Alger" , "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille",
    "Annaba", "Toulon", "Reims", "Saint-Étienne", "Le Havre", "Villeurbanne", "Dijon", "Canada","Italie","Dubai","Mexico","Brazil"]

# Prépare le fichier CSV
with open("real_trajectory_dataset.csv", "w", newline='', encoding='utf-8') as csvfile:
    fieldnames = ["situation_id", "trajectory_id", "distance", "wind", "precipitation", "fuel", "time", "score"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()

    situation_id = 0
    for depart in villes:
        for arrivee in villes:
            if depart == arrivee:
                continue
            situation_id += 1
            url = "http://localhost:8000/calculate-trajectories"
            data = {"start": depart, "end": arrivee}
            try:
                response = requests.post(url, json=data, timeout=100)
                if response.status_code == 200:
                    result = response.json()
                    for traj_id, traj in enumerate(result["trajectories"]):
                        # On prend la moyenne des features sur la trajectoire
                        distance = result["fuel"][traj_id]  # ou calcule la distance si tu veux
                        wind = sum([pt["weather"]["wind"] for pt in traj]) / len(traj)
                        precip = sum([pt["weather"]["precip"] for pt in traj]) / len(traj)
                        fuel = result["fuel"][traj_id]
                        time = result["time"][traj_id]
                        # Le score, tu peux utiliser fuel + time ou autre
                        score = fuel + time
                        writer.writerow({
                            "situation_id": situation_id,
                            "trajectory_id": traj_id,
                            "distance": distance,
                            "wind": wind,
                            "precipitation": precip,
                            "fuel": fuel,
                            "time": time,
                            "score": score
                        })
                        print(f"Ajouté situation {situation_id}, trajectoire {traj_id}")
                else:
                    print(f"Erreur API pour {depart} -> {arrivee}: {response.status_code}")
            except Exception as e:
                print(f"Erreur pour {depart} -> {arrivee}: {e}")
                time.sleep(2)

print("Fichier real_trajectory_dataset.csv généré !")
