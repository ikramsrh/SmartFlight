import gym
from gym import spaces
import numpy as np
import pandas as pd

class RealTrajectoryEnv(gym.Env):
    """
    Environnement RL pour choisir la meilleure trajectoire à partir de situations réelles du CSV.
    Observation : matrice (3, features) pour chaque situation (distance, wind, precipitation, fuel, time)
    Action : 0 = directe, 1 = nord, 2 = sud
    """
    def __init__(self, csv_path="real_trajectory_dataset.csv"):
        super().__init__()
        self.df = pd.read_csv(csv_path)
        self.situations = self.df["situation_id"].unique()
        self.current_situation = None
        # 5 features : distance, wind, precipitation, fuel, time
        self.observation_space = spaces.Box(low=0, high=np.inf, shape=(3, 5), dtype=np.float32)
        self.action_space = spaces.Discrete(3)
        self.current_obs = None

    def reset(self):
        # Tirer une situation au hasard
        self.current_situation = np.random.choice(self.situations)
        rows = self.df[self.df["situation_id"] == self.current_situation].sort_values("trajectory_id")
        obs = rows[["distance", "wind", "precipitation", "fuel", "time"]].values.astype(np.float32)
        self.current_obs = obs
        return obs

    def step(self, action):
        # Récupérer la ligne correspondant à l'action choisie
        rows = self.df[self.df["situation_id"] == self.current_situation].sort_values("trajectory_id")
        chosen = rows.iloc[action]
        # On veut minimiser le score (fuel + time par exemple)
        reward = -float(chosen["score"])
        done = True  # Un seul choix par épisode
        info = {"chosen_trajectory": int(chosen["trajectory_id"])}
        return self.current_obs, reward, done, info
