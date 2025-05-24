import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const sports = ["NBA", "MLB", "WNBA", "NFL", "SOCCER", "MMA", "GOLF", "TENNIS"];

export default function SportsMenu({ activeSport, onSportChange, darkMode, setDarkMode, onLogout }) {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/playguru.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    audioRef.current.addEventListener("error", (e) => {
      console.error("Failed to load audio:", e);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fadeOutAudio = () => {
    const fadeOutInterval = setInterval(() => {
      if (!audioRef.current) return clearInterval(fadeOutInterval);
      if (audioRef.current.volume > 0.1) {
        audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.1);
      } else {
        clearInterval(fadeOutInterval);
        audioRef.current.pause();
        audioRef.current.volume = 0.4;
      }
    }, 100);
  };

  const fadeInAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0;
    const fadeInInterval = setInterval(() => {
      if (!audioRef.current) return clearInterval(fadeInInterval);
      if (audioRef.current.volume < 1.0) {
        audioRef.current.volume = Math.min(1, audioRef.current.volume + 0.1);
      } else {
        clearInterval(fadeInInterval);
      }
    }, 100);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      fadeOutAudio();
    } else {
      audioRef.current.play();
      fadeInAudio();
    }
    setMusicPlaying(!musicPlaying);
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", padding: "0.5rem 1rem", marginBottom: "1rem" }}>
      <div>
        {/* Empty left side for logo area cleanliness */}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <motion.button
            onClick={toggleMusic}
            style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: "1px solid #007bff", fontWeight: 500, background: musicPlaying ? "#007bff" : "#fff", color: musicPlaying ? "#fff" : "#007bff" }}
            whileTap={{ scale: 0.95 }}
          >
            🎵 {musicPlaying ? "Music On" : "Play Music"}
          </motion.button>

          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: "1px solid #007bff", fontWeight: 500, background: darkMode ? "#000" : "#fff", color: darkMode ? "#fff" : "#007bff" }}
            whileTap={{ scale: 0.95 }}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </motion.button>

          <motion.button
            onClick={onLogout}
            style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: "1px solid red", fontWeight: 500, background: "#fff", color: "red" }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          {sports.map((id) => (
            <motion.button
              key={id}
              onClick={() => onSportChange(id)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "8px",
                border: "1px solid #007bff",
                fontWeight: 600,
                background: activeSport === id ? "#007bff" : "#fff",
                color: activeSport === id ? "#fff" : "#007bff"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {id}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
