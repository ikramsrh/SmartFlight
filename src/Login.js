import React, { useState } from "react";
import Lanyard from "./components/Lanyard";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const VALID_USERNAME = "IKramAiR";
  const VALID_PASSWORD = "ikrramsrrh";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setError("");
      onLogin();
    } else {
      setError("Nom d'utilisateur ou mot de passe incorrect !");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",  // Conteneur relatif pour les absolus enfants
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Fond vidéo plein écran */}
      <video
        autoPlay
        loop
        muted
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Carte 3D - badge */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "10%",
          transform: "translate(-85%, -220%)",
          zIndex: 2,
          width: 500,
          height: 100,
        }}
      >
        <Lanyard />
      </div>

      {/* Formulaire login */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: "absolute",
          top: "52%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255,255,255,0.85)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 32px rgba(0,0,0,0.2)",
          padding: 24,
          width: 350,
          border: "none",
          zIndex: 3,
          pointerEvents: "auto",  // pour que le formulaire soit interactif
        }}
      >
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "1rem",
            marginBottom: 12,
            width: "100%",
          }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "1rem",
            marginBottom: 12,
            width: "100%",
          }}
        />
        <button
          type="submit"
          style={{
            background: "#00cfff",
            color: "#fff",
            padding: 10,
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            width: "100%",
            cursor: "pointer",
          }}
        >
          Se connecter
        </button>
        {error && (
          <div style={{ color: "red", textAlign: "center", marginTop: 10 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
