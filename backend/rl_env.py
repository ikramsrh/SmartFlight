import gym
from gym import spaces
import numpy as np

class TrajectoryEnv(gym.Env):
    """
    Environnement RL pour choisir la meilleure trajectoire aérienne.
    Observation : [distance, vent, precipitation] pour chaque trajectoire
    Action : 0 = directe, 1 = nord, 2 = sud
    """
    def __init__(self):
        super(TrajectoryEnv, self).__init__()
        # 3 trajectoires, 3 features chacune
        self.observation_space = spaces.Box(low=0, high=10000, shape=(3, 3), dtype=np.float32)
        self.action_space = spaces.Discrete(3)

    def reset(self):
        self.state = np.random.rand(3, 3) * np.array([1000, 50, 20])  # distance, vent, precipitation
        return self.state

    def step(self, action):
        # On suppose que la "meilleure" trajectoire est celle avec le moins de (distance + vent*10 + precipitation*5)
        costs = self.state[:, 0] + self.state[:, 1]*10 + self.state[:, 2]*5
        reward = -costs[action]  #
        done = True
        info = {}
        return self.state, reward, done, info
