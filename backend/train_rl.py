from rl_env_realdata import RealTrajectoryEnv
from stable_baselines3 import DQN

env = RealTrajectoryEnv("real_trajectory_dataset.csv")

model = DQN("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=20000)

model.save("dqn_trajectory_realdata")
print("Modèle RL entraîné sur données réelles et sauvegardé !")
