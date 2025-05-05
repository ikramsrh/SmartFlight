
import React from "react";

export default function VideoSplash({ onEnter }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "#000", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
    }}>
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        loop
        style={{ width: "100vw", height: "100vh", objectFit: "cover" }}
      />
      <button
        onClick={onEnter}
        style={{
          position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
          padding: "18px 48px", fontSize: 22, borderRadius: 30, border: "none",
          background: "rgba(255,255,255,0.93)", color: "#36232a", fontWeight: 700,
          cursor: "pointer", boxShadow: "0 4px 16px #0005", letterSpacing: 1.2
        }}
      >
         Visualize. Decide. Fly.
      </button>
    </div>
  );
}