import React, { useState, useRef, useEffect } from "react";
import VideoSplash from "./VideoSplash";
import { Viewer, Entity, PolylineGraphics } from "resium";
import * as Cesium from "cesium";
import axios from "axios";
import { MapContainer, TileLayer, Polyline, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Rnd } from "react-rnd";
import L from "leaflet";
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import NightlightIcon from '@mui/icons-material/Nightlight';
import LightModeIcon from '@mui/icons-material/LightMode';
import Drawer from '@mui/material/Drawer';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { motion } from "framer-motion";
import CalculateIcon from '@mui/icons-material/Calculate';
import PilotBriefing from "./PilotBriefing";
import Login from "./Login";
import VoiceBriefing from "./VoiceBriefing";
const icons = {
  storm: "https://cdn-icons-png.flaticon.com/512/1146/1146869.png",
  turbulence: "https://cdn-icons-png.flaticon.com/512/2086/2086737.png",
  none: "https://cdn-icons-png.flaticon.com/512/252/252035.png"
};

const planeModelUrl = process.env.PUBLIC_URL + "/Cesium_Air.glb";
const CESIUM_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NGM0N2ExYi01NGIzLTRmYWUtOWU5Ni03NGI1MDVmZmUyOTgiLCJpZCI6Mjk3NzIwLCJpYXQiOjE3NDU3ODg4OTh9.J-O_jSYplzihgY5l398xZyYEYFNTwLnBDARtkyTBybk";
window.CESIUM_BASE_URL = "/";
Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

const TRAJ_NAMES = [
  "Route 1 – Directe",
  "Route 2 – Nord",
  "Route 3 – Sud"
];
const COLORS = [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE];
const HEX_COLORS = ["#ff0000", "#00cc00", "#0077ff"];
const COUNTRY_LABELS = [
  { name: "Algérie", lat: 36.75, lon: 3.06 },
];
function getInitialBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const toDeg = rad => rad * 180 / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  let brng = Math.atan2(y, x);
  brng = toDeg(brng);
  return (brng + 360) % 360;
}
function App() {
  // TOUS LES HOOKS
  const [loggedIn, setLoggedIn] = useState(false);
  const [dynamicRenderMode, setDynamicRenderMode] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [start, setStart] = useState("paris");
  const [end, setEnd] = useState("alger");
  const [trajectories, setTrajectories] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [time, setTime] = useState([]);
  const [recommendation, setRecommendation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [showTraj, setShowTraj] = useState([true, true, true]);
  const [airplaneSampledPos, setAirplaneSampledPos] = useState(null);
  const [airplaneTime, setAirplaneTime] = useState(null);
  const [airplaneEntity, setAirplaneEntity] = useState(null);
  const [nightMode, setNightMode] = useState(false);
  const [panel, setPanel] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [miniMapPos, setMiniMapPos] = useState({ x: 20, y: 110 });
  const [miniMapSize, setMiniMapSize] = useState({ width: 340, height: 240 });
  const [dragDisabled, setDragDisabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(true);
  const viewerRef = useRef();

  // Sélectionne la trajectoire recommandée
  const traj = trajectories[recommendation];
  const startP = traj && traj[0];
  const endP = traj && traj[traj.length - 1];

  // Calcul distance
  const distance = traj
    ? Math.round(traj.reduce((d, p, j, arr) =>
        j > 0
          ? d + Cesium.Cartesian3.distance(
              Cesium.Cartesian3.fromDegrees(arr[j-1].lon, arr[j-1].lat, 0),
              Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0)
          ) / 1000
        : d, 0))
  : 0;

  // Calcul direction réelle
  const direction = startP && endP
    ? Math.round(getInitialBearing(startP.lat, startP.lon, endP.lat, endP.lon)) + "°"
    : "";

  // Altitude dynamique selon la distance
  const altitude = distance > 2500 ? "FL370" : distance > 1000 ? "FL350" : "FL320";

  useEffect(() => {
    if (viewerRef.current && airplaneEntity) {
      viewerRef.current.cesiumElement.trackedEntity = undefined;
    }
  }, [airplaneEntity]);
  const recenterOnTrajectory = () => {
    if (trajectories.length > 0 && viewerRef.current && viewerRef.current.cesiumElement) {
      const traj = trajectories[recommendation];
      const startP = traj[0];
      const endP = traj[traj.length - 1];
      viewerRef.current.cesiumElement.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          (startP.lon + endP.lon) / 2,
          (startP.lat + endP.lat) / 2,
          2000000
        ),
        duration: 1.2
      });
    }
  };
  useEffect(() => { recenterOnTrajectory(); }, [trajectories, recommendation]);

  //login
  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }
  // SPLASH EN DEUXIÈME
  if (showSplash) {
    return <VideoSplash onEnter={() => setShowSplash(false)} />;
  }
  const demo = () => {
    setStart("paris");
    setEnd("alger");
    handleCalculate(undefined, true);
    setTimeout(() => setBriefingOpen(true), 9000);
  };
  const showRecommendedTrajectory = () => {
   setDynamicRenderMode(true);
   setAirplaneSampledPos(null);
   setAirplaneTime(null);
   setTimeout(() => {
     if (trajectories.length > 0 && recommendation !== null) {
       const traj = trajectories[recommendation];
       if (!traj || traj.length < 2) return;
       const property = new Cesium.SampledPositionProperty();
       const delay = 0;
       const duration = 16;
       let t = Cesium.JulianDate.addSeconds(Cesium.JulianDate.now(), delay, new Cesium.JulianDate());
       for (let i = 0; i < traj.length; i++) {
         const p = traj[i];
         property.addSample(
             Cesium.JulianDate.addSeconds(t, i * (duration / (traj.length - 1)), new Cesium.JulianDate()),
             Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 500000)
         );
       }
       setAirplaneSampledPos(property);
       setAirplaneTime({
         start: t,
         end: Cesium.JulianDate.addSeconds(t, duration, new Cesium.JulianDate())
       });
     }
   },100);
  };
  let allPoints = [];
  trajectories.forEach((traj, i) => {
    if (showTraj[i]) {
      allPoints = allPoints.concat(traj.map(p => [p.lat, p.lon]));
    }
  });

  const handleCalculate = async (e, isDemo = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTrajectories([]);
    setAirplaneSampledPos(null);
    setAirplaneTime(null);
    setPanel(null);
    setSelectedPoint(null);
    try {
      const response = await axios.post("https://smartflight.onrender.com/calculate-trajectories", {
        start,
        end
      });
      setTrajectories(response.data.trajectories);
      setFuel(response.data.fuel);
      setTime(response.data.time);
      setRecommendation(response.data.recommendation);
      if (isDemo) setTimeout(() => showRecommendedTrajectory(), 200);
    } catch (error) {
      alert("Erreur lors de l'appel à l'API : " + error.message);
    }
    setLoading(false);
  };

  const getMeteoMoyenne = (traj) => {
    if (!traj || traj.length === 0) return "-";
    const avgWind = (traj.reduce((a, p) => a + (p.weather?.wind || 0), 0) / traj.length).toFixed(1);
    const avgTemp = (traj.reduce((a, p) => a + (p.weather?.temp || 0), 0) / traj.length).toFixed(1);
    const descs = [...new Set(traj.map(p => p.weather?.desc || ""))].filter(Boolean);
    return `${descs.join(", ")} / Vent: ${avgWind} km/h / Temp: ${avgTemp}°C`;
  };

  const toggleTraj = idx => {
    setShowTraj(arr => arr.map((v, i) => i === idx ? !v : v));
  };

  const set2D = () => {
    if (viewerRef.current && viewerRef.current.cesiumElement && viewerRef.current.cesiumElement.scene) {
      viewerRef.current.cesiumElement.scene.morphTo2D(1.5);
      setTimeout(recenterOnTrajectory, 1500);
    }
  };
  const set3D = () => {
    if (viewerRef.current && viewerRef.current.cesiumElement && viewerRef.current.cesiumElement.scene) {
      viewerRef.current.cesiumElement.scene.morphTo3D(1.5);
      setTimeout(recenterOnTrajectory, 1500);
    }
  };

  const zoomIn = () => {
    if (viewerRef.current && viewerRef.current.cesiumElement) {
      viewerRef.current.cesiumElement.camera.zoomIn(1000000);
    }
  };
  const zoomOut = () => {
    if (viewerRef.current && viewerRef.current.cesiumElement) {
      viewerRef.current.cesiumElement.camera.zoomOut(1000000);
    }
  };

  const imageryProvider = new Cesium.BingMapsImageryProvider({
    url: "https://dev.virtualearth.net",
    key: "Aiz6oOq8n7lZJg4B6P8h1u0b0cW6k9v8wq9g7l8e3",
    mapStyle: Cesium.BingMapsStyle.AERIAL_WITH_LABELS
  });

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#4d19d2' },
      secondary: { main: '#ffae00' },
      background: {
        default: darkMode ? "#13181f" : "#f5f5f5",
        paper: darkMode ? "#232b36" : "#fff"
      }
    }
  });

  const scores = [75, 88, 62];
  const getRisques = (traj) => {
    if (!traj) return [];
    return traj.filter(p => p.weather && p.weather.risk && p.weather.risk !== "none");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 9999 }}>
        <IconButton
          onClick={() => setDarkMode(m => !m)}
          color="inherit"
          size="large"
          sx={{ background: darkMode ? "#232b36" : "#fff", boxShadow: 2 }}
        >
          {darkMode ? <LightModeIcon /> : <NightlightIcon />}
        </IconButton>
      </div>
      {actionsVisible && (
        <div style={{
          position: "absolute", top: 10, left: 0, right: 0, zIndex: 999,
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              margin: "16px 0",
              flexWrap: "wrap",
              justifyContent: "center"
            }}
          >
            <Button
              variant="contained"
              color="warning"
              startIcon={<CalculateIcon />}
              onClick={handleCalculate}
              style={{ fontWeight: "bold", minWidth: 120 }}
            >
              CALCULER
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={demo}
              style={{ fontWeight: "bold", minWidth: 120 }}
            >
              DÉMO ANIMÉE
            </Button>
            <Button onClick={() => setBriefingOpen(true)} variant="outlined" style={{ minWidth: 120 }}>
              BRIEFING
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setActionsVisible(false)}
              style={{ minWidth: 120 }}
            >
              Masquer les actions
            </Button>
            <VoiceBriefing
             trajName={TRAJ_NAMES[recommendation]}
             meteo={getMeteoMoyenne(trajectories[recommendation])}
             distance={distance}
             fuel={fuel[recommendation]}
             altitude={altitude}
             start={start}
             end={end}
             direction={direction}
            />
          </div>
          <form
            onSubmit={handleCalculate}
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16
            }}
          >
            <input
              value={start}
              onChange={e => setStart(e.target.value)}
              placeholder="Départ (ville ou coordonnées)"
              required
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <input
              value={end}
              onChange={e => setEnd(e.target.value)}
              placeholder="Arrivée (ville ou coordonnées)"
              required
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <Button variant="outlined" onClick={zoomIn}>Zoom +</Button>
            <Button variant="outlined" onClick={zoomOut}>Zoom -</Button>
            <Button
              variant="contained"
              color={nightMode ? "secondary" : "primary"}
              onClick={() => setNightMode(m => !m)}
            >
              {nightMode ? "Mode Jour" : "Mode Nuit"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={showRecommendedTrajectory}
              style={{marginLeft:10}}
            >
              Afficher la trajectoire recommandée
            </Button>
            <Button variant="outlined" onClick={set2D} style={{marginLeft:10}}>Vue 2D</Button>
            <Button variant="outlined" onClick={set3D}>Vue 3D</Button>
          </form>
        </div>
      )}

      {!actionsVisible && (
        <Button
          variant="contained"
          color="primary"
          style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            zIndex: 9999,
            borderRadius: "50%",
            minWidth: 0,
            width: 60,
            height: 60,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
          onClick={() => setActionsVisible(true)}
        >
          <CalculateIcon fontSize="large" />
        </Button>
      )}

      {allPoints.length > 0 && (
        <Rnd
          size={miniMapSize}
          position={miniMapPos}
          onDragStop={(e, d) => setMiniMapPos({ x: d.x, y: d.y })}
          onResizeStop={(e, direction, ref, delta, position) => {
            setMiniMapSize({
              width: parseInt(ref.style.width, 10),
              height: parseInt(ref.style.height, 10)
            });
            setMiniMapPos(position);
          }}
          style={{zIndex: 120}}
          disableDragging={dragDisabled}
        >
          <div
            onMouseEnter={() => setDragDisabled(true)}
            onMouseLeave={() => setDragDisabled(false)}
            style={{
              width: "100%", height: "100%",
              border: "2px solid #333", borderRadius: 12, overflow: "hidden", background: "#fff"
            }}
          >
            <MapContainer
              center={allPoints[0]}
              zoom={2}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
              dragging={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {trajectories.map((traj, i) => showTraj[i] && (
                <Polyline key={i} positions={traj.map(p => [p.lat, p.lon])} color={HEX_COLORS[i]} weight={i===recommendation?7:4} />
              ))}
              {trajectories.map((traj, i) => showTraj[i] && (
                <>
                  <Marker
                    key={i+"-depart"}
                    position={[traj[0].lat, traj[0].lon]}
                    icon={L.icon({iconUrl: icons.none, iconSize:[32,32]})}
                  >
                    <Tooltip direction="top" offset={[0, -20]}>{`Départ`}</Tooltip>
                  </Marker>
                  <Marker
                    key={i+"-arrivee"}
                    position={[traj[traj.length-1].lat, traj[traj.length-1].lon]}
                    icon={L.icon({iconUrl: icons.none, iconSize:[32,32]})}
                  >
                    <Tooltip direction="top" offset={[0, -20]}>{`Arrivée`}</Tooltip>
                  </Marker>
                </>
              ))}
            </MapContainer>
          </div>
        </Rnd>
      )}

      <div style={{ height: "100vh", width: "100vw" }}>
        <Viewer
          ref={viewerRef}
          full
          cesiumIonAccessToken={CESIUM_TOKEN}
          shouldAnimate
          imageryProvider={imageryProvider}
          requestRenderMode={!dynamicRenderMode}
          maximumRenderTimeChange={Infinity}
          animation={false}
          timeline={false}
        >
          {COUNTRY_LABELS.map(lbl => (
            <Entity
              key={lbl.name}
              position={Cesium.Cartesian3.fromDegrees(lbl.lon, lbl.lat, 0)}
              label={{
                text: lbl.name,
                font: "bold 18px sans-serif",
                fillColor: Cesium.Color.DARKBLUE,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: Cesium.Color.WHITE.withAlpha(0.8),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20)
              }}
            />
          ))}
          {trajectories.map((traj, i) => showTraj[i] && (
            <React.Fragment key={i}>
              <Entity>
                <PolylineGraphics
                  positions={traj.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 10000))}
                  width={i === recommendation ? 10 : 4}
                  material={
                    i === recommendation
                      ? new Cesium.PolylineGlowMaterialProperty({
                          color: COLORS[i].withAlpha(0.9),
                          glowPower: 0.3
                        })
                      : COLORS[i].withAlpha(0.6)
                  }
                  arcType={1}
                />
              </Entity>
              {traj.map((p, j) => (
                <Entity
                  key={i + "-" + j}
                  position={Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 10000)}
                  billboard={
                    p.weather && p.weather.risk && p.weather.risk !== "none"
                      ? { image: icons[p.weather.risk], scale: 0.02 }
                      : undefined
                  }
                  point={p.weather && p.weather.risk === "none"
                    ? { pixelSize: 10, color: COLORS[i] }
                    : undefined}
                  label={selectedPoint && selectedPoint.traj === i && selectedPoint.idx === j ? {
                    text:
                      (j === 0
                        ? "Départ"
                        : j === traj.length - 1
                        ? "Arrivée"
                        : "Etape") +
                      `\n${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}` +
                      (p.weather
                        ? `\n${p.weather.desc || ""}` +
                          `\nVent: ${p.weather.wind || 0} km/h` +
                          `\nTemp: ${p.weather.temp !== undefined ? p.weather.temp + "°C" : ""}` +
                          `\nPression: ${p.weather.pressure !== undefined ? p.weather.pressure + " hPa" : ""}` +
                          `\nHumidité: ${p.weather.humidity !== undefined ? p.weather.humidity + "%" : ""}` +
                          (p.weather.risk && p.weather.risk !== "none" ? `\n⚠️ Risque: ${p.weather.risk}` : "")
                        : ""),
                    font: "15px sans-serif",
                    fillColor: Cesium.Color.BLACK,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    showBackground: true,
                    backgroundColor: Cesium.Color.WHITE.withAlpha(0.7)
                  } : undefined}
                  onClick={() => setSelectedPoint({traj: i, idx: j})}
                />
              ))}
              <Entity
                position={Cesium.Cartesian3.fromDegrees(
                  traj[Math.floor(traj.length / 2)].lon,
                  traj[Math.floor(traj.length / 2)].lat,
                  120000
                )}
                label={{
                  text: TRAJ_NAMES[i],
                  font: "bold 17px sans-serif",
                  fillColor: COLORS[i],
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 3,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  showBackground: true,
                  backgroundColor: Cesium.Color.WHITE.withAlpha(0.8),
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  pixelOffset: new Cesium.Cartesian2(0, -10)
                }}
              />
            </React.Fragment>
          ))}
          {airplaneSampledPos && airplaneTime && (
            <Entity
              ref={setAirplaneEntity}
              availability={new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({
                  start: airplaneTime.start,
                  stop: airplaneTime.end
                })
              ])}
              position={airplaneSampledPos}
              orientation={new Cesium.VelocityOrientationProperty(airplaneSampledPos)}
              model={{
                uri: planeModelUrl,
                minimumPixelSize: 300,
                maximumScale: 50000,
                runAnimations: true
              }}
            />
          )}
        </Viewer>
      </div>

      <div style={{
        position: "fixed", bottom: 20, right: 20, background: "#fff",
        borderRadius: 8, padding: 10, zIndex: 99, boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        <div><span style={{color:"red",fontWeight:"bold"}}>■</span> Route 1 – Directe</div>
        <div><span style={{color:"green",fontWeight:"bold"}}>■</span> Route 2 – Nord</div>
        <div><span style={{color:"blue",fontWeight:"bold"}}>■</span> Route 3 – Sud</div>
        <div style={{marginTop:8}}><img src={icons.storm} alt="" style={{width:20,verticalAlign:"middle"}}/> Orage</div>
        <div><img src={icons.turbulence} alt="" style={{width:20,verticalAlign:"middle"}}/> Turbulence</div>
      </div>

      {showTable && trajectories.length > 0 && (
        <div style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(255,255,255,0.97)",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          padding: 16,
          minWidth: 600,
          margin: "0 auto",
          marginTop: -120,
          maxWidth: 900
        }}>
          <h3 style={{marginTop:0}}>Synthèse des Trajectoires</h3>
          <Grid container spacing={2}>
            {trajectories.map((traj, i) => (
              <Grid item xs={12} sm={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Card sx={{
                    background: i === recommendation ? "#d1ffe0" : "#fff",
                    color: "#222",
                    boxShadow: i === recommendation ? 8 : 2,
                    borderRadius: 3,
                    border: i === recommendation ? "2px solid #1976d2" : "none",
                    mb: 2
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS[i].toCssColorString() }}>
                        {TRAJ_NAMES[i]}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Distance : {traj && traj.length > 1
                          ? Math.round(traj.reduce((d, p, j, arr) =>
                            j > 0
                              ? d + Cesium.Cartesian3.distance(
                                  Cesium.Cartesian3.fromDegrees(arr[j-1].lon, arr[j-1].lat, 0),
                                  Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0)
                                ) / 1000
                              : d, 0))
                          : "-"} km
                      </Typography>
                      <Typography variant="body2">Carburant : {fuel[i]} L &nbsp;</Typography>
                      <Typography variant="body2">Temps : {time[i]} min &nbsp;</Typography>
                      <Typography variant="body2">Météo : {getMeteoMoyenne(traj)}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                        {i === recommendation ? "✅ Trajectoire recommandée" : ""}
                      </Typography>
                      <div>
                        <input
                          type="checkbox"
                          checked={showTraj[i]}
                          onChange={() => toggleTraj(i)}
                        /> Afficher
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </div>
      )}

      <Drawer anchor="right" open={briefingOpen} onClose={() => setBriefingOpen(false)}>
        <div style={{ width: 350, padding: 24 }}>
          <h2>Briefing pilote</h2>
          <p><b>Trajectoire recommandée :</b> {TRAJ_NAMES[recommendation]}</p>
          <p><b>Météo :</b> {getMeteoMoyenne(trajectories[recommendation])}</p>
          <p><b>Score IA :</b> {scores[recommendation]}</p>
          <p><b>Risques :</b>
            <ul>
              {getRisques(trajectories[recommendation]).map((p, idx) => (
                <li key={idx}>
                  {p.weather.desc} à {p.lat.toFixed(2)}, {p.lon.toFixed(2)} ({p.weather.risk})
                </li>
              ))}
            </ul>
          </p>
          <p><b>Pourquoi ce choix ?</b> Cette route minimise le carburant et évite les orages détectés sur la route 2.</p>
        </div>
      </Drawer>
    <PilotBriefing
      open={briefingOpen}
      onClose={() => setBriefingOpen(false)}
      start={start}
      end={end}
      trajName={TRAJ_NAMES[recommendation]}
      distance={distance}
      Cesium={Cesium}
      time={time[recommendation]}
      altitude={altitude}
      direction={direction}
      meteo={getMeteoMoyenne(trajectories[recommendation])}
      risks={getRisques(trajectories[recommendation])}
      fuel={fuel[recommendation]}
      score={scores[recommendation]}
      explanation={"Cette route est optimisée pour minimiser le carburant et éviter les risques météo."}
      trajectory={trajectories[recommendation]}
      trajectoryList={trajectories}
      timeList={time}
      fuelList={fuel}
   />
    </ThemeProvider>
  );
}

export default App;
