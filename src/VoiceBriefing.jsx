import React from "react";
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';

export default function VoiceBriefing({ trajName, meteo, distance, fuel, altitude,start,
  end,direction }) {
  const speakBriefing = () => {
    const now = new Date();
    const heures = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const heureStr = `${heures}h${minutes}`;
    const message = `
      Bonjour et bienvenue à bord d’IkramAir !  Il est actuellement ${heureStr}.
      Nous décollerons de ${start.charAt(0).toUpperCase() + start.slice(1)} en direction de ${end.charAt(0).toUpperCase() + end.slice(1)} , cap sur ${direction}
      Préparez-vous pour une aventure unique : aujourd'hui, le meilleur itinéraire sélectionné par notre équipe d'experts est :${trajName}.
      Les conditions météo sont : ${meteo}.
      Vous parcourrez ${distance} kilomètres., pour une consommation optimisée de ${fuel} litres de carburant, à une altitude de croisière de  ${altitude}.
      Toute l’équipe IkramAir vous souhaite un vol exceptionnel, sous le signe de la sécurité, de l’innovation et du plaisir !
      En route vers de nouveaux horizons,           bon voyage avec IkramAir !
    `;


    const speak = () => {
      const utterance = new window.SpeechSynthesisUtterance(message);
      utterance.lang = "fr-FR";
      utterance.rate = 1.12;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(
        v =>
          v.lang === "fr-FR" &&
          (
            v.name.toLowerCase().includes("homme") ||
            v.name.toLowerCase().includes("male") ||
            v.name.toLowerCase().includes("thomas") ||
            v.name.toLowerCase().includes("paul") ||   // Windows
            v.name.toLowerCase().includes("google français") // Chrome
          )
      );
      if (maleVoice) {
        utterance.voice = maleVoice;
      }
      window.speechSynthesis.cancel(); //
      window.speechSynthesis.speak(utterance);
    };


    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  };

  return (
    <Button
      variant="contained"
      color="success"
      startIcon={<MicIcon />}
      onClick={speakBriefing}
      style={{ minWidth: 260, fontWeight: "bold", marginTop: 16 }}
    >
      🎤 Écouter le briefing  (IA temps réel)
    </Button>
  );
}





