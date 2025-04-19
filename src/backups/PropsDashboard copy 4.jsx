import React, { useState, useEffect } from "react";
import LineupGeneratorPanel from "./LineupGeneratorPanel";
import { GoogleLogin, googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function PropsDashboard() {
  const [propsData, setPropsData] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [lineupResults, setLineupResults] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
  const [selectedPropType, setSelectedPropType] = useState("");
  const [showLineupSection, setShowLineupSection] = useState(false);
  const [user, setUser] = useState(null);
  const [maxLineups, setMaxLineups] = useState(10);
  const [mixType, setMixType] = useState("3_OVER_3_UNDER");
  const [lineupGameFilter, setLineupGameFilter] = useState("");

  const fetchProps = async () => {
    try {
      const res = await fetch("http://localhost:5050/props");
      const data = await res.json();
      setPropsData(data);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setPropsData([]);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("userInfo");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchProps();
  }, []);

  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        setUser(res.data);
        localStorage.setItem("userInfo", JSON.stringify(res.data));
      } catch (err) {
        console.error("Google login failed", err);
      }
    },
    onError: err => console.error("Login Failed:", err)
  });

  const logout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  const handleLineupGenerate = async () => {
    const config = { mixType, maxLineups: Number(maxLineups), filterGame: lineupGameFilter };
    try {
      const res = await fetch("http://localhost:5050/generate-lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setLineupResults(data);
    } catch (err) {
      console.error("❌ Failed to fetch lineups:", err);
    }
  };

  const themeStyles = {
    backgroundColor: darkMode ? "#1c1c1c" : "#ffffff",
    color: darkMode ? "#f0f0f0" : "#000"
  };

  const getBorderColorByTag = tag => tag === "FADE/UNDER" ? "#cc3333" : (tag === "GOOD" || tag === "LEAN") ? "#d4af37" : "#339966";

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const uniqueGames = [...new Set(propsData.map(p => `${p.Team} vs ${p.Opponent}`))];
  const uniquePropTypes = [...new Set(propsData.map(p => p["Prop Type"]))];
  const filteredProps = propsData.filter(p => (
    (selectedTags.length === 0 || selectedTags.includes(p.Tag)) &&
    (!selectedGame || `${p.Team} vs ${p.Opponent}` === selectedGame) &&
    (!playerInput || p.Player.toLowerCase().includes(playerInput.toLowerCase())) &&
    (!selectedPropType || p["Prop Type"] === selectedPropType)
  ));

  if (!user) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Please sign in with Google to access PlaysWithGuru</h2>
        <button onClick={login} style={{ padding: "0.6rem 1.5rem", fontSize: "1rem", backgroundColor: "#4285F4", color: "white", border: "none", borderRadius: "6px" }}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", minHeight: "100vh", ...themeStyles }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo/playswithguru-logo.png" alt="PlaysWithGuru Logo" style={{ height: "84px", marginRight: "1rem" }} />
          <h1 style={{ fontSize: "2rem" }}>PlaysWithGuru</h1>
        </div>
        <div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ marginRight: "0.5rem" }}>{darkMode ? "🌞 Light" : "🌙 Dark"}</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {["MEGA SMASH", "SMASH", "GOOD", "LEAN", "FADE/UNDER"].map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "20px",
              border: selectedTags.includes(tag) ? "2px solid black" : "none",
              backgroundColor: {
                "MEGA SMASH": "#4caf50",
                "SMASH": "#66bb6a",
                "GOOD": "#d4af37",
                "LEAN": "#5c6bc0",
                "FADE/UNDER": "#e57373"
              }[tag],
              color: "white",
              fontWeight: "bold"
            }}>
            {tag}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="">All Games</option>
          {uniqueGames.map(game => (
            <option key={game} value={game}>{game}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search Player"
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          style={{ padding: "0.5rem", width: "200px" }}
        />
        <select value={selectedPropType} onChange={(e) => setSelectedPropType(e.target.value)} style={{ padding: "0.5rem" }}>
          <option value="">All Prop Types</option>
          {uniquePropTypes.map(pt => (
            <option key={pt} value={pt}>{pt}</option>
          ))}
        </select>
        <button onClick={() => setShowLineupSection(prev => !prev)} style={{ padding: "0.5rem 1rem" }}>
          {showLineupSection ? "Hide Lineup Generator" : "Show Lineup Generator"}
        </button>
      </div>

      {showLineupSection && (
        <div style={{ marginBottom: "2rem" }}>
          <LineupGeneratorPanel
            mixType={mixType}
            setMixType={setMixType}
            maxLineups={maxLineups}
            setMaxLineups={setMaxLineups}
            filterGames={uniqueGames}
            lineupGameFilter={lineupGameFilter}
            setLineupGameFilter={setLineupGameFilter}
            onGenerate={handleLineupGenerate}
            lineupResults={lineupResults}
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {filteredProps.map((p, idx) => (
          <div key={idx} style={{
            borderLeft: `3px solid ${getBorderColorByTag(p.Tag)}`,
            borderRadius: "16px",
            padding: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            backgroundColor: darkMode ? "#2c2c2c" : "#fff",
            transition: "all 0.3s ease"
          }}>
            <div style={{ fontWeight: "bold", fontSize: "1.25rem" }}>{p.Player}</div>
            <div style={{ fontSize: "0.95rem" }}>{p.Team} vs {p.Opponent}</div>
            <div style={{ fontSize: "0.85rem", color: "#777" }}>Time: {p["Start Time"]}</div>
            <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>{p["Prop Type"]}: {p["Prop Value"]} → {Number(p["Projected Stat"]).toFixed(2)}</div>
            <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", fontWeight: "bold" }}>Tag: {p.Tag}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
