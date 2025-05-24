import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import LineupGeneratorPanel from './LineupGeneratorPanel';
import { googleLogout } from '@react-oauth/google';
import SportsMenu from "./SportsMenu";
import logo from "./assets/playswithguru-logo.png";
import nbaTeamLogos from "./assets/nbaTeamLogos.js";
import mlbTeamLogos from "./assets/mlbTeamLogos.js";
import { getTeamColor } from "./teamColors";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@radix-ui/react-tooltip";

import { Info } from "lucide-react"; // Use `Info` instead of `InfoIcon`

const OptimizedImage = React.memo(({ src, alt, style }) => {
  return <img src={src} alt={alt} loading="lazy" decoding="async" style={style} />;
});

export default function PropsDashboard() {
  const [activeSport, setActiveSport] = useState("NBA");
  const [isAdmin, setIsAdmin] = useState(false);
  const [propsData, setPropsData] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [lineupResults, setLineupResults] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
  const [selectedPropType, setSelectedPropType] = useState("");
  const [selectedConfidence, setSelectedConfidence] = useState("");
  const [showLineupSection, setShowLineupSection] = useState(false);
  const [user, setUser] = useState(null);
  const [maxLineups, setMaxLineups] = useState(10);
  const [mixType, setMixType] = useState("3_OVER_3_UNDER");
  const [lineupGameFilter, setLineupGameFilter] = useState([]);
  const [homeAwayFilter, setHomeAwayFilter] = useState("");
  const [lineupTagFilter, setLineupTagFilter] = useState([]);
  const [momentumFilter, setMomentumFilter] = useState("");
  const [momentumPatternFilter, setMomentumPatternFilter] = useState("");
  const [confirmedMomentumFilter, setConfirmedMomentumFilter] = useState("");
  const [playerTypeFilter, setPlayerTypeFilter] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedGuruPotential, setSelectedGuruPotential] = useState("");
  const [selectedZGuruTag, setSelectedZGuruTag] = useState("");
  const [selectedLeanDirection, setSelectedLeanDirection] = useState("");
  const [selectedGuruConflict, setSelectedGuruConflict] = useState("");
  const [showCommentary, setShowCommentary] = useState(false);
  const [selectedCommentary, setSelectedCommentary] = useState("");
  const lineupRefs = useRef([]);
  const detailRefs = useRef([]);
  const [cardToggles, setCardToggles] = useState({});
  const [selectedTime, setSelectedTime] = useState("All");
  const now = new Date();
  

  const toggleCardSections = (key) => {
    const isExpanded = cardToggles[key] || false;
    setCardToggles(prev => ({ ...prev, [key]: !isExpanded }));
  };

  const expandAllSections = () => {
    const allExpanded = Object.fromEntries(filteredProps.map(p => [`${p.Player}_${p["Prop Type"]}_${p["Prop Value"]}`, true]));
    setCardToggles(allExpanded);
  };

  const collapseAllSections = () => {
    const allCollapsed = Object.fromEntries(filteredProps.map(p => [`${p.Player}_${p["Prop Type"]}_${p["Prop Value"]}`, false]));
    setCardToggles(allCollapsed);
  };
  

    // ✅ Clear All Filters
    const clearAllFilters = () => {
      setSelectedTags([]);
      setSelectedGame("");
      setSelectedPropType("");
      setSelectedConfidence("");
      setPlayerInput("");
      setHomeAwayFilter("");
      setPlayerTypeFilter("");
      setSelectedTeam("");
      setMomentumFilter("");
      setConfirmedMomentumFilter("");
      setMomentumPatternFilter("");
      setSelectedGuruPotential("");
      setSelectedZGuruTag("");
      setSelectedLeanDirection("");
      setSelectedGuruConflict("");
      setShowCommentary(false);
      setSelectedCommentary("");
    };

  const getConfidenceLabel = (conf) => {
    if (conf >= 7.5) return "Elite";
    if (conf >= 6.5) return "Strong";
    if (conf >= 5.5) return "Moderate";
    return "Low";
  };

  //💬🗨️<
  const renderAICommentaryTrigger = (commentary) => (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              setSelectedCommentary(commentary);
              setShowCommentary(true);
            }}
            style={{ marginLeft: '0.5rem', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <span style={{ backgroundColor: '#f0f0f0', borderRadius: '50%', padding: '0.25rem' }}>
              <span role="img" aria-label="commentary">💬</span>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '0.5rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '0.85rem', color: '#333' }}>
          Guru Commentary
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderTagWithTooltip = (tag, confidence) => (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '999px',
            padding: '0.25rem 0.75rem',
            backgroundColor: tagColorMap?.[tag] ?? '#e0e0e0',
            color: 'white',
            marginRight: '0.5rem',
            cursor: 'default',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '5rem',
            textAlign: 'center'
          }}>
            {tag}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '0.5rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '0.85rem', color: '#333' }}>Confidence: {getConfidenceLabel(confidence)}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const tagColorMap = {
    "MEGA SMASH": "#0095e0",
    "SMASH": "#2e7d32",
    "GOOD": "#f9a825",
    "LEAN": "#8e24aa",
    "FADE/UNDER": "#d32f2f"
  };

  const getTeamLogo = (team) => {
    if (activeSport === "NBA") return nbaTeamLogos[team];
    if (activeSport === "MLB") return mlbTeamLogos[team];
    return null;
  };

  const nbaPropTypeLabelMap = {
    "R": "Rebounds", "PRA": "Points + Rebounds + Assists",
    "PR": "Points + Rebounds", "PA": "Points + Assists", "RA": "Rebounds + Assists",
    "3PT": "3PT Made", "2PTM": "Two Pointers Made", "2PTA": "Two Pointers Attempted",
    "Blocks": "Blocks", "Steals": "Steals",
    "FTM": "Free Throws Made", "FTA": "Free Throws Attempted",
    "OREB": "Offensive Rebounds", "DREB": "Defensive Rebounds",
    "FS": "Fantasy Score", "FGM": "Field Goals Made", "FGA": "FG Attempted", "PF": "Personal Fouls"
  };
  
  const mlbPropTypeLabelMap = {
    "Hits": "Hits", "Runs": "Runs", "RBIs": "RBIs", "Home Runs": "Home Runs",
    "Stolen Bases": "Stolen Bases", "Walks": "Walks", "Total Bases": "Total Bases",
    "Pitcher Strikeouts": "Pitcher Strikeouts", "Hitter Strikeouts": "Hitter Strikeouts",
    "Hitter Fantasy Score": "Hitter Fantasy Score", "Hits+Runs+RBIs": "Hits + Runs + RBIs"
  };

  const propTypeLabelMap = activeSport === "NBA" ? nbaPropTypeLabelMap : mlbPropTypeLabelMap;

  const getPropAbbr = (label) => {
    const entries = Object.entries(propTypeLabelMap);
    const match = entries.find(([abbr, full]) => full === label);
    return match ? match[0] : label;
  };

  const getProjectedValue = (p) => {
    return Number(
      p["Final Projection"] ??
      p["FinalAdjustedScore"] ??
      p[`Projected_${p["Prop Type"]}_Boosted`] ??
      p[`Projected_${p["Prop Type"]}`] ??
      0
    ).toFixed(2);
  };

  const isNumber = val => !isNaN(parseFloat(val)) && isFinite(val);

  const filteredProps = useMemo(() => {
    return propsData.filter(p => {
      if (selectedTags.length > 0 && !selectedTags.includes(p.Tag)) return false;
      if (selectedGuruPotential && p["GuruPotential"] !== selectedGuruPotential) return false;
      if (selectedGame) {
        const sortedTeams = [p.Team, p.Opponent].sort();
        const game = `${sortedTeams[0]} vs ${sortedTeams[1]}`;
        if (game !== selectedGame) return false;
      }
      if (selectedTime !== "All") {
        const timeStr = p["GameTime"];
        if (!timeStr) return false;
  
        const [time, meridian] = timeStr.split(" ");
        let [hour, minute] = time.split(":").map(Number);
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
  
        if (selectedTime === "Early" && hour < 15) return true;
        if (selectedTime === "Afternoon" && hour >= 15 && hour < 17) return true;
        if (selectedTime === "Evening" && hour >= 17 && hour < 20) return true;
        if (selectedTime === "Late" && hour >= 20) return true;
        return false;
      }
      if (selectedPropType && p["Prop Type"] !== selectedPropType) return false;
      //if (selectedConfidence && getConfidenceLabel(p.Confidence) !== selectedConfidence) return false;
      if (selectedZGuruTag && p["ZGuruTag"] !== selectedZGuruTag) return false;
      if (selectedLeanDirection && p["LeanDirection"] !== selectedLeanDirection) return false;
      if (selectedGuruConflict && p["GuruConflict"] !== selectedGuruConflict) return false;
    
      if (selectedConfidence) {
        const label = getConfidenceLabel(p.Confidence);
        if (selectedConfidence.startsWith("Over ")) {
          const threshold = selectedConfidence.replace("Over ", "");
          const levels = ["Low", "Moderate", "Strong", "Elite"];
          const i = levels.indexOf(threshold);
          const levelIndex = levels.indexOf(label);
          if (levelIndex <=i) return false;
        } else {
          if (label !== selectedConfidence) return false;
        }
      }      
      if (homeAwayFilter && p["Home/Away"]?.toLowerCase() !== homeAwayFilter.toLowerCase()) return false;
      if (playerInput && !(p.Player || "").toLowerCase().includes(playerInput.toLowerCase())) return false;

      // ✅ Old "Momentum Tag" filter
      if (momentumFilter === "TRENDING UP" && p["MomentumTag"] !== "TRENDING UP") return false;
      if (momentumFilter === "TRENDING DOWN" && p["MomentumTag"] !== "TRENDING DOWN") return false;

      // ✅ New "Momentum Pattern" filter
      if (momentumPatternFilter === "TRENDING UP" && p["MomentumPattern"] !== "TRENDING UP") return false;
      if (momentumPatternFilter === "TRENDING DOWN" && p["MomentumPattern"] !== "TRENDING DOWN") return false;

      // ✅ Confirmed Momentum (only if pattern and tag match)
      if (confirmedMomentumFilter === "CONFIRMED TRENDING UP" && p["ConfirmedMomentum"] !== "CONFIRMED TRENDING UP") return false;
      if (confirmedMomentumFilter === "CONFIRMED TRENDING DOWN" && p["ConfirmedMomentum"] !== "CONFIRMED TRENDING DOWN") return false;
      
      
      if (playerTypeFilter && p["Player Type"] && p["Player Type"] !== playerTypeFilter) return false;
      if (selectedTeam && p.Team !== selectedTeam) return false;
      if (p.Tag === "UNSUPPORTED" || p.Tag === "INSUFFICIENT" || p.Tag === "MISSINGDATA" || p.Tag === "NO_PROP") return false;
      return true;
    });
  }, [propsData, selectedTags, selectedGame, selectedPropType, selectedConfidence, selectedGuruPotential, playerInput,
    selectedZGuruTag, selectedLeanDirection, selectedGuruConflict, homeAwayFilter, momentumFilter, momentumPatternFilter,
     confirmedMomentumFilter,playerTypeFilter, selectedTeam, selectedTime]);


  const [propsCache, setPropsCache] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchProps = async (sport) => {
  setLoading(true);
  setPropsData([]); // Clear current cards immediately

  if (propsCache[sport]) {
    setTimeout(() => {
      setPropsData(propsCache[sport]);
      setLoading(false);
    }, 150);
    return;
  }

  try {
    const endpoint = sport === "MLB" ? "/api/mlb-props" : "/api/props";
    const res = await fetch(`${endpoint}`); // ✅ Ensures HTTPS relative fetch
    const data = await res.json();
    const cleaned = Array.isArray(data) ? data : [];
    setPropsCache(prev => ({ ...prev, [sport]: cleaned }));
  
    setTimeout(() => {
      setPropsData(cleaned);
      setLoading(false);
    }, 150);
  } catch (err) {
    console.error(`❌ Error fetching ${sport} props`, err);
    setPropsData([]);
    setLoading(false);
  }
  
};


useEffect(() => {
  setSelectedTags([]);
  setSelectedGame("");
  setSelectedPropType("");
  setSelectedConfidence("");
  setPlayerInput("");
  setHomeAwayFilter("");
  setPlayerTypeFilter("");
  setSelectedTeam("");
  setMomentumFilter("");
  setConfirmedMomentumFilter("");
  setMomentumPatternFilter("");
  setSelectedGuruPotential("");
  setSelectedZGuruTag("");
  setSelectedLeanDirection("");
  setSelectedGuruConflict("");
  setShowCommentary(false);
  setSelectedCommentary("");
  setLoading(true);            
  fetchProps(activeSport); 
}, [activeSport]);

  
const CommentaryModal = () => (
  showCommentary ? (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "12px", width: "90%", maxWidth: "600px", boxShadow: "0 0 10px rgba(0,0,0,0.25)" }}>
        <h2 style={{ marginTop: 0 }}>💬 Guru Commentary</h2>
        <p style={{ fontSize: "1rem", lineHeight: 1.4 }}>{selectedCommentary}</p>
        <button onClick={() => setShowCommentary(false)} style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "6px", backgroundColor: "#3498db", color: "white", border: "none" }}>Close</button>
      </div>
    </div>
  ) : null
);

  const shouldShowProps = ["NBA", "MLB"].includes(activeSport) && !showLineupSection;

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const uniqueGames = [...new Set(
  propsData
    .filter(p => p.Team && p.Opponent && p.Team.toLowerCase() !== 'nan' && p.Opponent.toLowerCase() !== 'nan')
    .map(p => {
      const teams = [p.Team, p.Opponent].sort();
      return `${teams[0]} vs ${teams[1]}`;
    })
)];
  
  const uniquePropTypes = useMemo(() => {
  if (activeSport === "MLB") {
    if (playerTypeFilter === "Batter") {
      return [...new Set(propsData.filter(p => p["Player Type"] === "Batter").map(p => p["Prop Type"]))];
    } else if (playerTypeFilter === "Pitcher") {
      return [...new Set(propsData.filter(p => p["Player Type"] === "Pitcher").map(p => p["Prop Type"]))];
    }
  }
  return [...new Set(propsData.map(p => p["Prop Type"]))];
}, [propsData, activeSport, playerTypeFilter]);


  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src={logo} alt="Logo" style={{ height: "130px" }} />
          <div>
            <h1 style={{ margin: 0 }}>PlaysWithGuru</h1>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", color: "#3498db" }}>PLAY LIKE A GURU</p>
          </div>
        </div>
        <div>
          <SportsMenu 
            activeSport={activeSport} 
            onSportChange={setActiveSport}  
            darkMode={darkMode} 
            setDarkMode={setDarkMode} />
        </div>
      </header>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {Object.keys(tagColorMap).map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            style={{
              backgroundColor: tagColorMap[tag],
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              opacity: selectedTags.length === 0 || selectedTags.includes(tag) ? 1 : 0.4,
            }}>
            {tag}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input placeholder="Search Player" value={playerInput} onChange={(e) => setPlayerInput(e.target.value)} style={{ padding: "0.5rem", borderRadius: "12px", border: "1px solid #ccc" }} />
        <select value={selectedPropType} onChange={(e) => setSelectedPropType(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Prop Types</option>
          {uniquePropTypes.map(pt => <option key={pt} value={pt}>{propTypeLabelMap[pt] || pt}</option>)}
        </select>
        <select value={selectedConfidence} onChange={(e) => setSelectedConfidence(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Confidence</option>
          <option value="Elite">Elite</option>
          <option value="Strong">Strong</option>
          <option value="Moderate">Moderate</option>
          <option value="Low">Low</option>
          <option value="Over Moderate">Over Moderate</option>
          <option value="Over Low">Over Low</option>
        </select>
        <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Games</option>
          {uniqueGames.map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={homeAwayFilter} onChange={(e) => setHomeAwayFilter(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Home/Away</option>
          <option value="home">Home</option>
          <option value="away">Away</option>
        </select>
        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Teams</option>
          {[...new Set(propsData.map(p => p.Team).filter(t => t && t !== 'nan'))].sort().map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
        <select
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="All">All Times</option>
          <option value="Early">Early</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
          <option value="Late">Late</option>
        </select>
        {activeSport === "MLB" && (
          <select value={playerTypeFilter} onChange={(e) => setPlayerTypeFilter(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
            <option value="">All Player Types</option>
            <option value="Batter">Batter</option>
            <option value="Pitcher">Pitcher</option>
          </select>
        )}
        {activeSport === "NFL" && (
          <select value={playerTypeFilter} onChange={(e) => setPlayerTypeFilter(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
            <option value="">All Player Types</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="Kicker">Kicker</option>
            <option value="Defense">Defense</option>
          </select>
        )}
        <select value={momentumFilter} onChange={(e) => setMomentumFilter(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Momentum Tag</option>
          <option value="TRENDING UP">Trending Up (Tag)</option>
          <option value="TRENDING DOWN">Trending Down (Tag)</option>
        </select>
        <select value={momentumPatternFilter} onChange={(e) => setMomentumPatternFilter(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Momentum Pattern</option>
          <option value="TRENDING UP">Trending Up (Pattern)</option>
          <option value="TRENDING DOWN">Trending Down (Pattern)</option>
        </select>
        <select value={confirmedMomentumFilter} onChange={(e) => setConfirmedMomentumFilter(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Confirmed Momentum</option>
          <option value="CONFIRMED TRENDING UP">Trending Up</option>
          <option value="CONFIRMED TRENDING DOWN">Trending Down</option>
        </select>
        <select value={selectedGuruPotential} onChange={(e) => setSelectedGuruPotential(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Guru Potential</option>
          <option value="GURU SMASH">GURU SMASH</option>
          <option value="GURU FADE">GURU FADE</option>
          <option value="MIXED">MIXED</option>
        </select>
        <select value={selectedZGuruTag} onChange={(e) => setSelectedZGuruTag(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
        <option value="">All Z-GURU Tags</option>
        <option value="AVOID FADE">AVOID FADE</option>
        <option value="AVOID OVERHYPE">AVOID OVERHYPE</option>
        <option value="HIGH VOLATILITY">HIGH VOLATILITY</option>
        <option value="LEAN">LEAN</option>
        <option value="NEUTRAL">NEUTRAL</option>
        <option value="UNKNOWN">UNKNOWN</option>
        </select>
        <select value={selectedLeanDirection} onChange={(e) => setSelectedLeanDirection(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Lean Directions</option>
          <option value="LEAN OVER">LEAN OVER</option>
          <option value="LEAN UNDER">LEAN UNDER</option>
        </select>
        <select value={selectedGuruConflict} onChange={(e) => setSelectedGuruConflict(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Guru Conflicts</option>
          <option value="MATCH">MATCH</option>
          <option value="RETAGGED">RETAGGED</option>
        </select>
        <button onClick={expandAllSections} style={{ padding: "0.5rem 1rem", backgroundColor: "#eee", borderRadius: "12px" }}>Expand All</button>
        <button onClick={collapseAllSections} style={{ padding: "0.5rem 1rem", backgroundColor: "#eee", borderRadius: "12px" }}>Collapse All</button>
        <button onClick={clearAllFilters} style={{ padding: "0.5rem 1rem", backgroundColor: "#ccc", borderRadius: "12px" }}>Clear All Filters</button>
        <button onClick={() => setShowLineupSection(prev => !prev)} style={{ backgroundColor: '#3498db', color: '#fff', borderRadius: '12px', padding: '0.5rem 1rem' }}>{showLineupSection ? 'Hide Lineup Generator' : 'Show Lineup Generator'}</button>
      </div>

      {shouldShowProps && (
        <TooltipProvider>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
            {filteredProps.map((p, i) => {
              const propLabel = propTypeLabelMap[p["Prop Type"]] || p["Prop Type"];
              const projected = getProjectedValue(p);
              const propAbbr = getPropAbbr(propLabel);
              const matchupLine = p.GameTime ? `🕒 ${p.GameTime} — ${p["Home/Away"]?.toLowerCase() === "home" ? "🏠 Home" : "✈️ Away"}` : "🕒 TBD";
              const teamAbbr = p.Team;
              const opponentAbbr = p.Opponent;
              const teamColor = getTeamColor(p.Team, activeSport);
              const opponentColor = getTeamColor(p.Opponent, activeSport);
              const cardKey = `${p.Player}_${p["Prop Type"]}_${p["Prop Value"]}`;
              const isExpanded = cardToggles[cardKey];
              const hasDetailData = (Array.isArray(p.Last10Stats) && p.Last10Stats.length > 0) || (Array.isArray(p.Last10vsOppStats) && p.Last10vsOppStats.length > 0);

              return (
                <div key={i} style={{ borderLeft: `4px solid ${tagColorMap[p.Tag] || '#ccc'}`, backgroundColor: darkMode ? '#1e1e1e' : '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>{p.Player}</span>
                    <span style={{ backgroundColor: teamColor, color: '#fff', fontWeight: 'bold', padding: '0.25rem 0.75rem', borderRadius: '999px' }}>{p.Team}</span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
                    <span style={{ backgroundColor: '#eee', padding: '0.4rem 0.75rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.85rem', boxShadow: 'inset 0 0 0 1px #ccc' }}>
                      🕒 {p.GameTime || 'TBD'} — {p["Home/Away"]?.toLowerCase() === "home" ? "🏠 Home" : "✈️ Away"}
                    </span>
                    <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>vs</span>
                    <span style={{ border: `2px solid ${opponentColor}`, padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 'bold', color: opponentColor, marginLeft: '0.5rem' }}>{p.Opponent}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: darkMode ? '#ccc' : '#555', margin: '0.5rem 0' }}>{p["Team Name"]} vs {p["Opponent Name"]}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem' }}>
                    <strong>📈 Prop:</strong>
                    <span style={{ fontWeight: 500 }}>{propLabel}</span>
                    — <strong>{Number(p["Prop Value"]).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem' }}>
                    <strong>📊 Projection:</strong>
                    <span>{projected}</span>
                    {p["AI Commentary"] && renderAICommentaryTrigger(p["AI Commentary"])}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>{renderTagWithTooltip(p.Tag, p.Confidence)}
                  </div>
                  <CommentaryModal />
                  {hasDetailData && (
                    <button
                      onClick={() => toggleCardSections(cardKey)}
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.8rem",
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      {isExpanded ? "Collapse Details" : "Expand Details"}
                    </button>
                  )}
                  {isExpanded && (
                    <>
                      {Array.isArray(p.Last10Stats) && p.Last10Stats.length > 0 && (
                        <details ref={el => (detailRefs.current[`${cardKey}-last10`] = el)} open={isExpanded}>
                          <summary style={{ fontSize: "0.95rem", marginTop: "0.3rem" }}>Last 10 Games</summary>
                          <table style={{ width: "100%", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                            <thead>
                              <tr><th>Date</th><th>Matchup</th><th>{propAbbr}</th></tr>
                            </thead>
                            <tbody>
                              {p.Last10Stats.map((entry, idx) => {
                                const propValue = Number(p["Prop Value"]);
                                let bg = entry.Value > propValue ? "#d4edda" : entry.Value < propValue ? "#f8d7da" : "#e2e3e5";
                                return (
                                  <tr key={idx} style={{ backgroundColor: bg }}>
                                    <td>{new Date(entry.Date).toLocaleDateString()}</td>
                                    <td>{entry.Matchup}</td>
                                    <td>{entry.Value}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </details>
                      )}
                      {Array.isArray(p.Last10vsOppStats) && p.Last10vsOppStats.length > 0 && (
                        <details ref={el => (detailRefs.current[`${cardKey}-vsopp`] = el)} open={isExpanded}>
                          <summary style={{ fontSize: "0.95rem", marginTop: "0.3rem" }}>Last 10 Games vs {p.Opponent}</summary>
                          <table style={{ width: "100%", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                            <thead>
                              <tr><th>Date</th><th>Matchup</th><th>{propAbbr}</th></tr>
                            </thead>
                            <tbody>
                              {p.Last10vsOppStats.map((entry, idx) => {
                                const propValue = Number(p["Prop Value"]);
                                let bg = entry.Value > propValue ? "#d4edda" : entry.Value < propValue ? "#f8d7da" : "#e2e3e5";
                                return (
                                  <tr key={idx} style={{ backgroundColor: bg }}>
                                    <td>{new Date(entry.Date).toLocaleDateString()}</td>
                                    <td>{entry.Matchup}</td>
                                    <td>{entry.Value}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </details>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
    );
  } // end PropsDashboard

                 
