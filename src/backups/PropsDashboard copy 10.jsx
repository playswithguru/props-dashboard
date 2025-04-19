import React, { useState, useEffect } from "react";
import LineupGeneratorPanel from "./LineupGeneratorPanel";

export default function PropsDashboard() {
  const [propsData, setPropsData] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [lineupResults, setLineupResults] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
  const [selectedPropType, setSelectedPropType] = useState("");
  const [showLineupSection, setShowLineupSection] = useState(false);

  const fetchProps = async () => {
    try {
      const res = await fetch("http://localhost:5050/props");
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Server error: ${res.status}`, errorText);
        setPropsData([]);
        return;
      }
      const data = await res.json();
      const cleaned = data.filter(
        d => d.Player && d.Team && d["Start Time"] && d["Prop Type"] && d["Prop Value"] && d["Projected Stat"] && !isNaN(d["Projected Stat"])
      );
      setPropsData(cleaned);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setPropsData([]);
    }
  };

  useEffect(() => {
    fetchProps();
  }, []);

  const handleLineupGenerate = async (config) => {
    console.log("🎯 User requested lineup generation with config:", config);
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
    backgroundColor: darkMode ? "#1c1c1c" : "#f9f9f9",
    color: darkMode ? "#f0f0f0" : "#000",
  };

  const allGames = Array.from(new Set(propsData.map(p => `${p.Team} vs ${p.Opponent}`)));
  const allPlayers = Array.from(new Set(propsData.map(p => p.Player)));
  const allPropTypes = Array.from(new Set(propsData.map(p => p["Prop Type"])));

  const filteredProps = propsData.filter(p => {
    const matchesTags = selectedTags.length === 0 || selectedTags.includes(p.Tag);
    const matchesGame = !selectedGame || `${p.Team} vs ${p.Opponent}` === selectedGame;
    const matchesPlayer = !playerInput || p.Player.toLowerCase().includes(playerInput.toLowerCase());
    const matchesPropType = !selectedPropType || p["Prop Type"] === selectedPropType;
    return matchesTags && matchesGame && matchesPlayer && matchesPropType;
  });

  const getBorderColorByTag = (tag) => {
    if (tag === "FADE/UNDER") return "#cc3333";
    if (tag === "GOOD" || tag === "LEAN") return "#ffd700";
    return "#339966";
  };

  const tagLabels = {
    "MEGA SMASH": "🚀 MEGA SMASH",
    "SMASH": "🔥 SMASH",
    "GOOD": "👍 GOOD",
    "LEAN": "🥏 LEAN",
    "FADE/UNDER": "💀 FADE/UNDER"
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", minHeight: "100vh", ...themeStyles }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="/playswithguru-logo.png"
            alt="PlaysWithGuru"
            style={{ height: "48px", width: "48px", marginRight: "1rem" }}
          />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>PlaysWithGuru</h1>
        </div>
        <div>
          <label style={{ fontWeight: "bold" }}>
            🌙 Dark Mode
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(prev => !prev)}
              style={{ marginLeft: "0.5rem" }}
            />
          </label>
        </div>
      </nav>

      {/* 🔘 Filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {Object.keys(tagLabels).map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "20px",
                border: selectedTags.includes(tag) ? "2px solid #1e90ff" : "1px solid #ccc",
                backgroundColor: selectedTags.includes(tag) ? "#1e90ff" : darkMode ? "#444" : "#eee",
                color: selectedTags.includes(tag) ? "#fff" : darkMode ? "#f0f0f0" : "#000",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: selectedTags.includes(tag) ? "0 0 10px rgba(30,144,255,0.5)" : "none",
                transition: "all 0.2s ease-in-out"
              }}
            >
              {tagLabels[tag]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <select
            value={selectedGame}
            onChange={(e) => {
              setSelectedGame(e.target.value);
              setPlayerInput("");
            }}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">All Games</option>
            {allGames.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>

          <input
            type="text"
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            placeholder="Start typing a player..."
            style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />

          <select
            value={selectedPropType}
            onChange={(e) => setSelectedPropType(e.target.value)}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="">All Types</option>
            {allPropTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowLineupSection(prev => !prev);
              setLineupResults([]);
            }}
            style={{ padding: "0.4rem 1rem", borderRadius: "6px", backgroundColor: "#1e90ff", color: "white", border: "none", cursor: "pointer" }}
          >
            {showLineupSection ? "Hide Lineup Generator" : "Show Lineup Generator"}
          </button>
        </div>

        {showLineupSection && <LineupGeneratorPanel onGenerate={handleLineupGenerate} />}
      </div>

      {/* 🧹 Prop Cards */}
      {lineupResults.length === 0 && filteredProps.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredProps.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: darkMode ? "#2c2c2c" : "white",
                color: darkMode ? "#f0f0f0" : "#000",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "10px",
                padding: "1rem",
                borderLeft: `2.5px solid ${getBorderColorByTag(item.Tag)}`,
                position: "relative"
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "1.25rem" }}>{item.Player}</div>
              <div style={{ fontSize: "0.95rem", color: darkMode ? "#bbb" : "#555" }}>{item.Team} vs {item.Opponent}</div>
              <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: darkMode ? "#aaa" : "#777" }}>Time: {item["Start Time"]}</div>
              <div style={{ fontSize: "0.95rem" }}><strong>{item["Prop Type"]}</strong>: {item["Prop Value"]} → <strong>{parseFloat(item["Projected Stat"]).toFixed(2)}</strong></div>
              <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: darkMode ? "#ddd" : "#555" }}>
                Tag: <strong>{item.Tag}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📜 Lineup Display */}
      {lineupResults.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h2>Generated Lineups</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {lineupResults.map((lineup, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "1rem",
                  backgroundColor: darkMode ? "#2c2c2c" : "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}
              >
                <h4 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Lineup #{i + 1}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {lineup.map((player, idx) => (
                    <li
                      key={idx}
                      style={{
                        marginBottom: "0.75rem",
                        borderLeft: `4px solid ${getBorderColorByTag(player.Tag)}`,
                        paddingLeft: "0.75rem"
                      }}
                    >
                      <strong>{player.Player}</strong> ({player.Team}) <br />
                      <span style={{ fontSize: "0.85rem", color: darkMode ? "#bbb" : "#555" }}>
                        {player["Prop Type"]}: {player["Prop Value"]} → <strong>{parseFloat(player["Projected Stat"]).toFixed(2)}</strong><br />
                        <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>{player.Tag}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer style={{ marginTop: "3rem", textAlign: "center", fontSize: "0.85rem", color: darkMode ? "#aaa" : "#888" }}>
        © {new Date().getFullYear()} PlaysWithGuru. All rights reserved.
      </footer>
    </div>
  );
}
