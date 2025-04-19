// React Component: LineupGeneratorPanel.jsx
import React, { useState } from "react";

const LineupGeneratorPanel = ({
  onGenerate,
  mixType,
  setMixType,
  maxLineups,
  setMaxLineups,
  lineupGameFilter,
  setLineupGameFilter,
  lineupResults,
  darkMode
}) => {
  const handleSubmit = () => {
    onGenerate({
      mixType,
      maxLineups: parseInt(maxLineups, 10),
      filterGame: lineupGameFilter.trim()
    });
  };
  const tagColorMap = {
    "MEGA SMASH": "#0095e0",
    "SMASH": "#2e7d32",
    "GOOD": "#f9a825",
    "LEAN": "#8e24aa",
    "FADE/UNDER": "#d32f2f"
  }; 
   
  const cardStyle = {
    padding: "1rem",
    border: "2px dashed #ccc",
    borderRadius: "12px",
    background: darkMode ? "#1e1e1e" : "#f9f9f9",
    color: darkMode ? "#f0f0f0" : "#000"
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>📊 Lineup Generator</h2>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <label>Mix Type:</label><br />
          <select value={mixType} onChange={(e) => setMixType(e.target.value)}>
            <option value="6_OVER">6 Over</option>
            <option value="5_OVER_1_UNDER">5 Over 1 Under</option>
            <option value="4_OVER_2_UNDER">4 Over 2 Under</option>
            <option value="3_OVER_3_UNDER">3 Over 3 Under</option>
            <option value="2_OVER_4_UNDER">2 Over 4 Under</option>
            <option value="1_OVER_5_UNDER">1 Over 5 Under</option>
            <option value="6_UNDER">6 Under</option>
          </select>
        </div>

        <div>
          <label>Max Lineups:</label><br />
          <input
            type="number"
            value={maxLineups}
            onChange={(e) => setMaxLineups(e.target.value)}
            min={1}
            style={{ width: "60px" }}
          />
        </div>

        <div>
          <label>Filter Game:</label><br />
          <input
            type="text"
            value={lineupGameFilter}
            onChange={(e) => setLineupGameFilter(e.target.value)}
            placeholder="e.g. Golden State Warriors vs Memphis Grizzlies"
            style={{ width: "300px" }}
          />
        </div>

        <button
          onClick={handleSubmit}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            height: "40px",
            marginTop: "1.2rem"
          }}
        >
          🚀 Generate Lineups
        </button>
      </div>

      {lineupResults?.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
          {lineupResults.map((lineup, i) => (
            <div key={i} style={{
              borderLeft: `4px solid ${tagColorMap[lineup[0]?.Tag] || "#ccc"}`,
              borderRadius: "16px",
              padding: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              backgroundColor: darkMode ? "#2c2c2c" : "#fff",
              color: darkMode ? "#f0f0f0" : "#000",
              transition: "all 0.3s ease"
            }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>Lineup {i + 1}</h3>
              {lineup.map((player, j) => (
                <div key={j} style={{ marginBottom: "0.35rem", fontSize: "0.95rem" }}>
                  <strong>{player.Player}</strong> — {player["Prop Type"]}: {player["Prop Value"]}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LineupGeneratorPanel;