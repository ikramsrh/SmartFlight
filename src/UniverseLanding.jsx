import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";
import "./UniverseLanding.css";

export default function UniverseLanding({ title = "Explore the Universe", subtitle = "Visualisez vos trajectoires en 3D" }) {
  const globeEl = useRef();

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.8;
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 });
    }
  }, []);

  return (
    <div className="universe-bg">
      <div className="universe-globe">
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor="#6B6E82"
          atmosphereAltitude={0.22}
          showGraticules={false}
          width={360}
          height={360}
        />
      </div>
      <div className="universe-overlay">
        <div className="universe-glass-card">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="universe-stars"></div>
    </div>
  );
}
