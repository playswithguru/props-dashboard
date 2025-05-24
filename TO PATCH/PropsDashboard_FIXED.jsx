import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import LineupGeneratorPanel from './LineupGeneratorPanel';
import { googleLogout } from '@react-oauth/google';
import logo from './assets/playswithguru-logo.png';

const getConfidenceLabel = (conf) => {
  if (conf >= 7.5) return "Elite";
  if (conf >= 6.5) return "Strong";
  if (conf >= 5.5) return "Moderate";
  return "Low";
};

const tagColorMap = {
  "MEGA SMASH": "#0095e0",
  "SMASH": "#2e7d32",
  "GOOD": "#f9a825",
  "LEAN": "#8e24aa",
  "FADE/UNDER": "#d32f2f"
};

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
  const [lineupGameFilter, setLineupGameFilter] = useState([]);
  const [homeAwayFilter, setHomeAwayFilter] = useState("");
  const [lineupTagFilter, setLineupTagFilter] = useState([]);

  console.log("🎨 tagColorMap:", tagColorMap);

  const fetchProps = async () => {
    try {
      const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5050";
      const res = await fetch(`${baseURL}/props`, { credentials: "include" });
      const data = await res.json();
      const cleanedData = data.filter(p =>
        p.Team && p.Opponent && p.Team !== "NaN" && p.Opponent !== "NaN" && p.Team !== "null" && p.Opponent !== "null"
      );
      setPropsData(cleanedData);
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

  const login = async (jwt) => {
    try {
      const decodedUser = jwtDecode(jwt);
      setUser(decodedUser);
      localStorage.setItem("userInfo", JSON.stringify(decodedUser));
    } catch (err) {
      console.error("Google login failed", err);
    }
  };

  const logout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  const handleLineupGenerate = async () => {
    const config = {
      mixType,
      maxLineups: Number(maxLineups),
      filterGames: lineupGameFilter,
      filterTags: lineupTagFilter,
      homeAway: homeAwayFilter
    };
  
    console.log("📤 Sending config to Flask:", config);
  
    try {
      const res = await fetch("http://localhost:5050/generate-lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
  
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
  
      const data = await res.json();
      console.log("📥 Received lineup results:", data);
  
      setLineupResults(data);
    } catch (err) {
      console.error("❌ Failed to fetch lineups:", err);
    }
  };
  

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const uniqueGames = [...new Set(
    propsData.map(p => {
      const teams = [p.Team, p.Opponent].sort(); // ensures consistent order
      return `${teams[0]} vs ${teams[1]}`;
    })
  )];
  
  const uniquePropTypes = [...new Set(propsData.map(p => p["Prop Type"]))];

  const filteredProps = propsData.filter(p => {
    const [teamA, teamB] = selectedGame.split(" vs ") || [];
    const isGameMatch = !selectedGame ||
      (p.Team === teamA && p.Opponent === teamB) ||
      (p.Team === teamB && p.Opponent === teamA);

    return (
      (selectedTags.length === 0 || selectedTags.includes(p.Tag)) &&
      isGameMatch &&
      (!playerInput || p.Player.toLowerCase().includes(playerInput.toLowerCase())) &&
      (!selectedPropType || p["Prop Type"] === selectedPropType)
    );
  });

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif", minHeight: "100vh", backgroundColor: darkMode ? "#1c1c1c" : "#ffffff", color: darkMode ? "#f0f0f0" : "#000" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logo} alt="PlaysWithGuru Logo" style={{ height: "100px", marginRight: "1rem" }} />
          <div>
            <h1 style={{ margin: 0 }}>PlaysWithGuru</h1>
            <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: tagColorMap["MEGA SMASH"] }}>PLAY LIKE A GURU</div>
          </div>
        </div>
        <div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ marginRight: "1rem" }}>
            🌙 {darkMode ? "Light" : "Dark"}
          </button>
          {user ? (
            <button onClick={logout}>Logout</button>
          ) : (
            <GoogleLogin onSuccess={cred => login(cred.credential)} />
          )}
        </div>
      </div>

      <div style={{ margin: "1rem 0", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {Object.entries(tagColorMap).map(([tag, color]) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            style={{
              backgroundColor: color,
              color: "white",
              border: selectedTags.includes(tag) ? "3px solid white" : "none",
              borderRadius: "20px",
              padding: "0.4rem 0.9rem",
              fontWeight: "bold"
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}>
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
        />

        <select value={selectedPropType} onChange={(e) => setSelectedPropType(e.target.value)}>
          <option value="">All Prop Types</option>
          {uniquePropTypes.map(prop => (
            <option key={prop} value={prop}>{prop}</option>
          ))}
        </select>

        <button onClick={() => setShowLineupSection(!showLineupSection)}>
          {showLineupSection ? "Hide Lineup Generator" : "Show Lineup Generator"}
        </button>
      </div>

      {!showLineupSection && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredProps.map((p, idx) => (
            <div key={idx} style={{
              borderLeft: `3px solid ${tagColorMap[p.Tag] || "#ccc"}`,
              borderRadius: "16px",
              padding: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              backgroundColor: darkMode ? "#2c2c2c" : "#fff",
              transition: "all 0.3s ease"
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong>{p.Player}</strong>
                <div>{p.Team} vs {p.Opponent}</div>
                <div>Time: {p["Start Time"]}</div>
                <div>{p["Prop Type"]}: {p["Prop Value"]} → {Number(p["Projected Stat"]).toFixed(2)}</div>
                <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Tag: {p.Tag}</span>
                  <span
                    title={`Confidence: ${getConfidenceLabel(p.Confidence)}`}
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: tagColorMap[p.Tag] || "#ccc",
                      opacity: Math.min(p.Confidence / 5, 1),
                      display: "inline-block",
                      marginLeft: "0.3rem"
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLineupSection && (
        <LineupGeneratorPanel
          mixType={mixType}
          setMixType={setMixType}
          maxLineups={maxLineups}
          setMaxLineups={setMaxLineups}
          filterGames={uniqueGames}
          lineupGameFilter={lineupGameFilter}
          setLineupGameFilter={setLineupGameFilter}
          homeAwayFilter={homeAwayFilter}
          setHomeAwayFilter={setHomeAwayFilter}
          lineupTagFilter={lineupTagFilter}
          setLineupTagFilter={setLineupTagFilter}
          onGenerate={handleLineupGenerate}
          lineupResults={lineupResults}
          darkMode={darkMode}
          allTags={Object.keys(tagColorMap)}
        />
      )}
    </div>
  );
}