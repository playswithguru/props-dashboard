import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import LineupGeneratorPanel from './LineupGeneratorPanel';
import { googleLogout } from '@react-oauth/google';


const teamAbbrMap = {
  "Chicago Bulls": "CHI",
  "Miami Heat": "MIA",
  "Dallas Mavericks": "DAL",
  "Sacramento Kings": "SAC"
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
  const [lineupGameFilter, setLineupGameFilter] = useState("");
  const [homeAwayFilter, setHomeAwayFilter] = useState("");

  const fetchProps = async () => {
    try {
      const res = await fetch("http://localhost:5050/props");
      const data = await res.json();
      //setPropsData(data); //old one where everything comes
      const cleanedData = data.filter(p =>
        p.Team && p.Opponent &&
        p.Team !== "NaN" && p.Opponent !== "NaN" &&
        p.Team !== "null" && p.Opponent !== "null"
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
    const config = { mixType, maxLineups: Number(maxLineups), filterGame: lineupGameFilter, homeAway: homeAwayFilter };
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

  const tagColorMap = {
    "MEGA SMASH": "#0095e0",
    "SMASH": "#2e7d32",
    "GOOD": "#f9a825",
    "LEAN": "#8e24aa",
    "FADE/UNDER": "#d32f2f"
  };

  const getBorderColorByTag = (tag) => tag === "FADE/UNDER" ? "#cc3333" : (tag === "GOOD" || tag === "LEAN") ? "#d4af37" : "#339966";

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Ensure dropdown has each matchup only once
  const uniqueGames = [...new Set(
    propsData.map(p => {
      const homeTeam = p.Team;
      const awayTeam = p.Opponent;
      return homeTeam < awayTeam ? `${homeTeam} vs ${awayTeam}` : `${awayTeam} vs ${homeTeam}`;
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

  // Confidence dot styling
  const getConfidenceDotStyle = (confidence) => {
    const baseColor = tagColorMap["FADE/UNDER"]; // Can adjust this for each player tag
    const opacity = Math.min(confidence / 5, 1);
    return {
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: baseColor,
      opacity,
      display: "inline-block"
    };
  };

  if (!user) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Please sign in with Google to access PlaysWithGuru</h2>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const userInfo = jwtDecode(credentialResponse.credential);
              setUser(userInfo);
              localStorage.setItem("userInfo", JSON.stringify(userInfo));
            }}
            onError={() => {
              console.log("Login Failed");
            }}
            useOneTap={false} // disable the one-tap version
            theme="filled_blue"
            size="large"
            text="signin_with"
          />
      </div>
    );
  }  
  

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif", minHeight: "100vh", ...themeStyles }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo/playswithguru-logo.png" alt="PlaysWithGuru Logo" style={{ height: "120px", marginRight: "1.5rem", maxWidth: "120px" }} />
            <div>
              <h1 style={{ fontSize: "2rem", margin: 0 }}>PlaysWithGuru</h1>
              <div style={{ fontSize: "1rem", fontWeight: "bold", color: tagColorMap["MEGA SMASH"] }}>PLAY LIKE A GURU</div>
            </div>
          </div>
        </div>
        <div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ marginRight: "0.5rem" }}>{darkMode ? "🌞 Light" : "🌙 Dark"}</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {[
          "MEGA SMASH",
          "SMASH",
          "GOOD",
          "LEAN",
          "FADE/UNDER"
        ].map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "20px",
              border: selectedTags.includes(tag) ? "2px solid white" : "none",
              boxShadow: selectedTags.includes(tag) ? "0 0 8px rgba(255, 255, 255, 0.4)" : "none",
              backgroundColor: tagColorMap[tag],
              color: "white",
              fontWeight: "bold"
            }}
          >
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
            homeAwayFilter={homeAwayFilter} // ✅ NEW
            setHomeAwayFilter={setHomeAwayFilter} // ✅ NEW
            onGenerate={handleLineupGenerate}
            lineupResults={lineupResults}
            darkMode={darkMode}
          />
        </div>
      )}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong title={p.Player}>
                    {p.Player.length > 16 ? p.Player.split(' ')[0][0] + '. ' + p.Player.split(' ')[1] : p.Player}
                    <span style={{ fontWeight: 400, fontSize: "0.85rem", opacity: 0.7 }}>
                      ({teamAbbrMap[p.Team] || p.Team})
                    </span>
                  </strong>
                </div>
                <div style={{ fontSize: "0.95rem" }}>{p.Team} vs {p.Opponent}</div>
                <div style={{ fontSize: "0.85rem", color: "#777" }}>Time: {p["Start Time"]}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>
                  {p["Prop Type"]}: {p["Prop Value"]} → {Number(p["Projected Stat"]).toFixed(2)}
                </div>
                <div style={{ fontSize: "0.85rem", marginTop: "0.25rem", fontWeight: "bold", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Tag: {p.Tag}</span>
                  <span
                    title={`Confidence: ${p.Confidence}`}  // Tooltip added for Confidence score
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: tagColorMap[p.Tag] || "#ccc", // Color based on tag
                      opacity: Math.min(p.Confidence / 5, 1),  // Opacity adjusted for confidence
                      display: "inline-block",
                      marginLeft: "0.3rem",  // Reduced margin for closer alignment
                    }}
                  ></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
