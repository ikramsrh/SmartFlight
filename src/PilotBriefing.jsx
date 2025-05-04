import React from "react";
import { Drawer, Typography, Divider, Box, Chip, Button } from "@mui/material";
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { usePDF } from "react-to-pdf";

// Pour le calcul de la distance (si Cesium est global)
const getDistance = (traj) =>
  traj && traj.length > 1
    ? Math.round(traj.reduce((d, p, j, arr) =>
        j > 0
          ? d + window.Cesium.Cartesian3.distance(
              window.Cesium.Cartesian3.fromDegrees(arr[j-1].lon, arr[j-1].lat, 0),
              window.Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0)
            ) / 1000
          : d, 0))
    : 0;

// Fonction pour exporter en CSV
function downloadCSV({ start, end, trajName, distance, time, altitude, direction, meteo, risks, fuel, score }) {
  const csvRows = [
    ["Départ", "Arrivée", "Trajectoire", "Distance (km)", "Temps", "Altitude", "Direction", "Météo", "Risques", "Carburant", "Score IA"],
    [
      start, end, trajName, distance, time, altitude, direction, meteo,
      (risks && risks.length > 0 ? risks.map(r => `${r.desc} (${r.lat.toFixed(2)},${r.lon.toFixed(2)})`).join(" | ") : "Aucun"),
      fuel, score
    ]
  ];
  const csvContent = csvRows.map(e => e.join(";")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plan-de-vol.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function PilotBriefing({
  open,
  onClose,
  start,
  end,
  Cesium,
  trajName,
  distance,
  time,
  altitude,
  direction,
  meteo,
  risks,
  fuel,
  score,
  explanation,
  trajectory,
  trajectoryList, // array des 3 trajectoires
  timeList,       // array des 3 temps
  fuelList        // array des 3 carburants
}) {
  const { toPDF, targetRef } = usePDF({ filename: 'plan-de-vol.pdf' });
  const getDistance = (traj) =>
    traj && traj.length > 1
      ? Math.round(traj.reduce((d, p, j, arr) =>
          j > 0
            ? d + Cesium.Cartesian3.distance(
                Cesium.Cartesian3.fromDegrees(arr[j-1].lon, arr[j-1].lat, 0),
                Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0)
              ) / 1000
            : d, 0))
      : 0;
  // Distances pour chaque trajectoire
  const distances = trajectoryList
    ? trajectoryList.map(getDistance)
    : [0, 0, 0];

  // Données pour le graphique
  const data = [
    { name: 'Route 1', Temps: timeList?.[0], Distance: distances[0], Carburant: fuelList?.[0] },
    { name: 'Route 2', Temps: timeList?.[1], Distance: distances[1], Carburant: fuelList?.[1] },
    { name: 'Route 3', Temps: timeList?.[2], Distance: distances[2], Carburant: fuelList?.[2] },
  ];

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 430, p: 3, bgcolor: "#f7fafd", height: "100%" }}>
        {/* Boutons PDF & CSV en haut */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Button onClick={toPDF} variant="contained" color="primary">
            Sauvegarder le plan de vol (PDF)
          </Button>
          <Button
            onClick={() => downloadCSV({ start, end, trajName, distance, time, altitude, direction, meteo, risks, fuel, score })}
            variant="outlined"
            color="secondary"
          >
            Sauvegarder le plan de vol (CSV)
          </Button>
        </Box>
        {/* Tout le contenu à exporter en PDF */}
        <div ref={targetRef}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            <FlightTakeoffIcon sx={{ mr: 1, color: "#1976d2" }} />
            Briefing Pilote
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              <b>Départ :</b> {start} &nbsp; <b>→</b> &nbsp; <b>Arrivée :</b> {end}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <b>Trajectoire :</b> {trajName}
            </Typography>
            <Typography variant="body1">
              <b>Distance :</b> {distance} km &nbsp; <b>Temps :</b> {time}
            </Typography>
            <Typography variant="body1">
              <b>Altitude :</b> {altitude || "FL350"} &nbsp; <b>Direction :</b> {direction}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1"><b>Météo :</b> {meteo}</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <b>Risques détectés :</b>
              {(!risks || risks.length === 0) ? (
                <Chip icon={<CheckCircleIcon sx={{ color: "green" }} />} label="Aucun risque" color="success" size="small" sx={{ ml: 1 }} />
              ) : (
                <ul style={{ paddingLeft: 18 }}>
                  {risks.map((r, idx) => (
                    <li key={idx} style={{ color: "#e65100", marginBottom: 2 }}>
                      <WarningIcon sx={{ color: "#e65100", fontSize: 18, mr: 0.5, mb: "-2px" }} />
                      {r.desc} à {r.lat.toFixed(2)}, {r.lon.toFixed(2)} ({r.risk})
                    </li>
                  ))}
                </ul>
              )}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1"><b>Carburant estimé :</b> {fuel}</Typography>
            <Typography variant="body1"><b>Score IA :</b> {score}</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <b>Pourquoi cette route ?</b> <br />
              {explanation || "Cette route minimise le carburant et évite les zones météo à risque."}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 700 }}>Comparatif des 3 trajectoires :</Typography>
          <BarChart width={350} height={220} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Temps" fill="#1976d2" />
            <Bar dataKey="Distance" fill="#82ca9d" />
            <Bar dataKey="Carburant" fill="#ff9800" />
          </BarChart>
        </div>
      </Box>
    </Drawer>
  );
}
