import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import LineupGeneratorPanel from './LineupGeneratorPanel';
import AdvancedLineupPanel from './AdvancedLineupPanel'; // Adjust the path as needed
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

function formatLocalTime(timeStr, sport) {
  if (!timeStr || typeof timeStr !== 'string') return 'TBD';

  const now = new Date();
  const [hourStr, minutePart] = timeStr.split(':');
  let [minuteStr, period] = minutePart.split(' ');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const gameTimeUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute));

  if (sport === 'NBA') {
    // Assume NBA data pulled in Central Time, shift by -5 (UTC-5)
    gameTimeUTC.setUTCHours(gameTimeUTC.getUTCHours() + 5);
  } else if (sport === 'MLB') {
    // Assume MLB data pulled in Eastern Time, shift by -4 (UTC-4)
    gameTimeUTC.setUTCHours(gameTimeUTC.getUTCHours() + 4);
  }

  return gameTimeUTC.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


const OptimizedImage = React.memo(({ src, alt, style }) => {
  return <img src={src} alt={alt} loading="lazy" decoding="async" style={style} />;
});


export default function PropsDashboard() {
  const [activeSport, setActiveSport] = useState("MLB");
  const [isAdmin, setIsAdmin] = useState(false);
  const [propsData, setPropsData] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [generatedLineups, setGeneratedLineups] = useState([]);
  const [lineupResults, setLineupResults] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
  const [selectedPropType, setSelectedPropType] = useState("");
  const [selectedConfidence, setSelectedConfidence] = useState("");
  const [showLineupSection, setShowLineupSection] = useState(false);
  const [user, setUser] = useState(null);
  const [maxLineups, setMaxLineups] = useState(10);
  const [mixType, setMixType] = useState("3_OVER_3_UNDER");
  const [homeAwayFilter, setHomeAwayFilter] = useState("");
  const [momentumFilter, setMomentumFilter] = useState("");
  const [momentumPatternFilter, setMomentumPatternFilter] = useState("");
  const [confirmedMomentumFilter, setConfirmedMomentumFilter] = useState("");
  const [playerTypeFilter, setPlayerTypeFilter] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedGuruPotential, setSelectedGuruPotential] = useState("");
  const [selectedZGuruTag, setSelectedZGuruTag] = useState("");
  const [selectedLeanDirection, setSelectedLeanDirection] = useState("");
  const [selectedGuruConflict, setSelectedGuruConflict] = useState("");
  const [selectedGuruPicks, setSelectedGuruPicks] = useState("");
  const [selectedIsGuruPicks, setSelectedIsGuruPicks] = useState("");
  const [selectedGuruMagic, setSelectedGuruMagic] = useState("");
  const [showCommentary, setShowCommentary] = useState(false);
  const [selectedCommentary, setSelectedCommentary] = useState("");
  const lineupRefs = useRef([]);
  const detailRefs = useRef([]);
  const [cardToggles, setCardToggles] = useState({});
  const [selectedTime, setSelectedTime] = useState("All");
  const now = new Date();
  const [propsCache, setPropsCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSports, setSelectedSports] = useState(["MLB"]); // Default to NBA or []
  const [uniqueGames, setUniqueGames] = useState([]);

  const multiSportMode = selectedSports.length > 1;
  

  const fetchProps = async (sport) => {
    setLoading(true);
    setSelectedSports([sport]); // 👈 force sport alignment
  
    if (propsCache[sport]) {
      setPropsData(propsCache[sport]);
      setLoading(false);
      return;
    }
  
    try {
      const endpoint = sport === "MLB" ? "/mlb-props" : "/props";
      const res = await fetch(`http://localhost:5050${endpoint}`);
      const data = await res.json();
      const cleaned = Array.isArray(data) ? data : [];
  
      setPropsCache(prev => ({ ...prev, [sport]: cleaned }));
  
      setTimeout(() => {
        setPropsData(cleaned);
        
        const games = cleaned
          .filter(p => p.Team && p.Opponent && p.Sport && p.Team.toLowerCase() !== 'nan' && p.Opponent.toLowerCase() !== 'nan')
          .map(p => {
            const teams = [p.Team, p.Opponent].sort();
            return multiSportMode
            ? `${teams[0]} vs ${teams[1]} (${p.Sport})`
            : `${teams[0]} vs ${teams[1]}`;
          });
  
        setUniqueGames([...new Set(games)].sort());
  
        setLoading(false);
      }, 150);
    } catch (err) {
      console.error(`❌ Error fetching ${sport} props`, err);
      setPropsData([]);
      setLoading(false);
    }
  };

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
    setSelectedGuruPicks("");
    setSelectedIsGuruPicks("");
    setShowCommentary(false);
    setSelectedCommentary("");
    setSelectedGuruMagic("");
    setSelectedTime("");
    setLoading(true);            
    fetchProps(activeSport); 
  }, [activeSport]);

  
  useEffect(() => {
    if (!loading && propsCache[activeSport]) {
      setPropsData(propsCache[activeSport]);
    }
  }, [loading, activeSport, propsCache]);


  // Additional filters for lineup generation
  const [lineupType, setLineupType] = useState("PROP");
  const [lineupSize, setLineupSize] = useState(6);
  const [overUnderPreference, setOverUnderPreference] = useState("Guru");
  const [lineupGameTimeFilter, setLineupGameTimeFilter] = useState("");
  const [lineupHomeAwayFilter, setLineupHomeAwayFilter] = useState("");
  const [lineupSportFilter, setLineupSportFilter] = useState(activeSport);
  const [lineupGameFilter, setLineupGameFilter] = useState("");
  const [lineupMode, setLineupMode] = useState("Basic"); // Basic or Advanced

// updated generateLineups logic to include random prop type fallback and direction label
// updated generateLineups logic to use selected sport, exclude props with missing game data, and avoid duplicate players

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const inputStyle = {
  padding: "0.5rem 1rem",
  fontSize: "0.95rem",
  borderRadius: "12px",
  border: "1px solid #ccc",
  background: "#fff",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  appearance: "none",
  fontFamily: "Inter, sans-serif",
  minWidth: "140px"
};

const generateLineups = (maxLineupsArg) => {
  const selectedProps = propsCache[lineupSportFilter] || [];
  const pool = selectedProps.filter((p) => {
    if (!p.Matchup || p.Matchup.toLowerCase().includes("nan")) return false;
    if (!p.Player || !p.Team) return false;
    if (lineupGameTimeFilter && !p.GameTime?.includes(lineupGameTimeFilter)) return false;
    if (lineupHomeAwayFilter && p["Home/Away"] !== lineupHomeAwayFilter) return false;
    if (lineupGameFilter && !p.Matchup?.toLowerCase().includes(lineupGameFilter.toLowerCase())) return false;
    return true;
  });

  const overs = shuffleArray(pool.filter(p => p.Tag === "SMASH" || p.Tag === "MEGA SMASH"));
  const unders = shuffleArray(pool.filter(p => p.Tag === "FADE/UNDER"));

  const lineups = [];

  for (let i = 0; i < maxLineupsArg; i++) {
    let attempts = 0;
    let lineup = [];
    while (attempts < 100) {
      let tempLineup = [];
      if (overUnderPreference === "Even") {
        const count = Math.floor(lineupSize / 2);
        tempLineup = [...overs.slice(0, count), ...unders.slice(0, lineupSize - count)];
      } else if (overUnderPreference === "MoreOvers") {
        const count = Math.ceil(lineupSize * 0.7);
        tempLineup = [...overs.slice(0, count), ...unders.slice(0, lineupSize - count)];
      } else if (overUnderPreference === "MoreUnders") {
        const count = Math.ceil(lineupSize * 0.7);
        tempLineup = [...unders.slice(0, count), ...overs.slice(0, lineupSize - count)];
      } else {
        tempLineup = shuffleArray(pool).slice(0, lineupSize);
      }

      if (tempLineup.length === lineupSize) {
        const teamCounts = {};
        const playerSet = new Set();
        let duplicatePlayer = false;

        for (const p of tempLineup) {
          if (!p.Player || playerSet.has(p.Player)) {
            duplicatePlayer = true;
            break;
          }
          playerSet.add(p.Player);
          teamCounts[p.Team] = (teamCounts[p.Team] || 0) + 1;
        }

        const teamDiversityOK = Object.keys(teamCounts).length > 1;
        if (teamDiversityOK && !duplicatePlayer) {
          lineup = tempLineup;
          break;
        }
      }
      attempts++;
    }

    if (lineup.length === lineupSize) {
      lineups.push(lineup);
    }
  }

  return lineups;
};


// 🔁 Lineup Result Rendering with Improved Spacing, Timestamp, and Logo Branding
const renderLineupResult = () => (
  generatedLineups.length > 0 && (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Generated Lineups</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {generatedLineups.map((lineup, index) => (
          <div key={index} style={{
            flex: '1 1 420px',
            border: '1px solid #ccc',
            borderRadius: '12px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            padding: '1rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/playswithguru-logo.png" alt="logo" style={{ height: '36px' }} />
                <span style={{
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '8px'
                }}>Lineup {index + 1}</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#777' }}>
                {new Date().toLocaleString(undefined, {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZoneName: 'short'
                })}
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '0.5fr 2fr 2fr 2fr 1fr 1fr',
              fontWeight: 'bold',
              borderBottom: '1px solid #ccc',
              paddingBottom: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <div>#</div>
              <div>Name</div>
              <div>Game</div>
              <div>Prop</div>
              <div style={{ paddingRight: '1rem', textAlign: 'right' }}>Value</div>
              <div>O/U</div>
            </div>
            {lineup.map((p, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: '0.5fr 2fr 2fr 2fr 1fr 1fr',
                alignItems: 'center',
                borderBottom: '1px dashed #eee',
                padding: '0.5rem 0'
              }}>
                <div>{idx + 1}</div>
                <div>
                  {p.Player}
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>({p.Sport || activeSport})</div>
                </div>
                <div>{p.Matchup || `${p.Team} ${p["Home/Away"] === 'away' ? '@' : 'vs'} ${p.Opponent}`}</div>
                <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{p["Prop Type"]}</div>
                <div style={{ paddingRight: '1.5rem', textAlign: 'right' }}>{p["Prop Value"]}</div>
                <div style={{ color: p.Tag === 'FADE/UNDER' ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' }}>
                  {p.Tag === 'FADE/UNDER' ? 'UNDER' : 'OVER'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
);





const handleGenerate = () => {
  const lineups = generateLineups(maxLineups);
  setGeneratedLineups(lineups);
};

// ✅ Lineup Generator Control Styling Upgrade
const lineupControlStyles = {
  base: {
    borderRadius: '10px',
    padding: '0.6rem 0.75rem',
    fontSize: '1rem',
    fontWeight: '500',
    border: '1px solid #ccc',
    backgroundColor: '#fefefe',
    color: '#333',
    minWidth: '160px'
  },
  label: {
    fontWeight: '600',
    fontSize: '0.85rem',
    marginBottom: '0.25rem',
    display: 'inline-block'
  }
};

  // Render lineup generation section
  const renderLineupGenerator = () => (
    <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', marginTop: '2rem' }}>
      {renderLineupFilters()}
      <button
        onClick={handleGenerate}
        style={{ padding: '0.75rem 1.5rem', background: 'black', color: 'white', border: 'none', borderRadius: '8px', marginBottom: '1rem' }}
      >
        Generate Lineup
      </button>
      {renderLineupResult()}
    </div>
  );

  const renderLineupFilters = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
      <div>
        <label style={lineupControlStyles.label}>Lineup Type</label><br />
        <select style={lineupControlStyles.base} value={lineupType} onChange={(e) => setLineupType(e.target.value)}>
          <option value="PROP">PROP</option>
          <option value="DK">DraftKings</option>
        </select>
      </div>
      <div>
        <label style={lineupControlStyles.label}>Max Lineups</label><br />
        <select style={lineupControlStyles.base} value={maxLineups} onChange={(e) => setMaxLineups(Number(e.target.value))}>
          {[1, 2, 3, 5, 10, 20].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={lineupControlStyles.label}>Lineup Size</label><br />
        <select style={lineupControlStyles.base} value={lineupSize} onChange={(e) => setLineupSize(Number(e.target.value))}>
          {[2, 3, 4, 5, 6, 8, 12].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={lineupControlStyles.label}>Over/Under Mix</label><br />
        <select style={lineupControlStyles.base} value={overUnderPreference} onChange={(e) => setOverUnderPreference(e.target.value)}>
          <option value="Guru">Guru Pick</option>
          <option value="Even">Even Mix</option>
          <option value="MoreOvers">More Overs</option>
          <option value="MoreUnders">More Unders</option>
        </select>
      </div>
      <div>
        <label style={lineupControlStyles.label}>Game Time</label><br />
        <select style={lineupControlStyles.base} value={lineupGameTimeFilter} onChange={(e) => setLineupGameTimeFilter(e.target.value)}>
          <option value="">All</option>
          <option value="Early">Early</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
          <option value="Late">Late</option>
        </select>
      </div>
      <div>
        <label style={lineupControlStyles.label}>Home/Away</label><br />
        <select style={lineupControlStyles.base} value={lineupHomeAwayFilter} onChange={(e) => setLineupHomeAwayFilter(e.target.value)}>
          <option value="">All</option>
          <option value="home">Home</option>
          <option value="away">Away</option>
        </select>
      </div>
      <div>
        <label style={lineupControlStyles.label}>Sport</label><br />
        <select style={lineupControlStyles.base} value={lineupSportFilter} onChange={(e) => setLineupSportFilter(e.target.value)}>
          <option value="MLB">MLB</option>
        </select>
      </div>
      <div>
        <label style={lineupControlStyles.label}>Game</label><br />
        <input
          type="text"
          placeholder="e.g. NYK vs BOS"
          style={lineupControlStyles.base} value={lineupGameFilter}
          onChange={(e) => setLineupGameFilter(e.target.value)}
        />
      </div>
    </div>
  );


  // Lineup mode toggle UI (Basic/Advanced)
  const renderLineupModeToggle = () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      <button
        onClick={() => setLineupMode("Basic")}
        style={{
          padding: "0.5rem 1rem",
          background: lineupMode === "Basic" ? "#333" : "#eee",
          color: lineupMode === "Basic" ? "white" : "black",
          border: "none",
          borderRadius: "8px"
        }}
      >
        Basic
      </button>
      <button
        onClick={() => setLineupMode("Advanced")}
        style={{
          padding: "0.5rem 1rem",
          background: lineupMode === "Advanced" ? "#333" : "#eee",
          color: lineupMode === "Advanced" ? "white" : "black",
          border: "none",
          borderRadius: "8px"
        }}
      >
        Advanced
      </button>
    </div>
  );
  


  const [lineupTagFilter, setLineupTagFilter] = useState([]);
  const [lineupConfidenceFilter, setLineupConfidenceFilter] = useState([]);
  const [lineupPropTypeFilter, setLineupPropTypeFilter] = useState([]);
  const [lineupMomentumTagFilter, setLineupMomentumTagFilter] = useState([]);
  const [lineupMomentumPatternFilter, setLineupMomentumPatternFilter] = useState([]);
  const [lineupConfirmedMomentumFilter, setLineupConfirmedMomentumFilter] = useState([]);
  const [lineupZGuruTagFilter, setLineupZGuruTagFilter] = useState([]);
  const [lineupGuruPotentialFilter, setLineupGuruPotentialFilter] = useState([]);
  const [lineupGuruConflictFilter, setLineupGuruConflictFilter] = useState([]);



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
      setSelectedGuruPicks("");
      setSelectedIsGuruPicks("");
      setShowCommentary(false);
      setSelectedCommentary("");
      setSelectedGuruMagic("");
      setSelectedTime("");
      
    };

  const getConfidenceLabel = (conf) => {
    if (conf >= 7.5) return "Elite";
    if (conf >= 6.5) return "Strong";
    if (conf >= 5.5) return "Moderate";
    return "Low";
  };

  //💬
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
    "MEGA SMASH": "#0095e0",    // Guru Blue (unchanged)
    "SMASH": "#2e7d32",         // Deep Green
    "LEAN OVER": "#8e24aa",     // Purple
    "MEGA FADE": "#b71c1c",     // Deeper Red (Blood Red)
    "FADE": "#ef6c00",          // Strong Orange (Dark Amber)
    "LEAN UNDER": "#f9a825",    // Yellow (unchanged)
    "COIN TOSS": "#90a4ae"      // Slate Gray (unchanged)
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
    "Stolen Bases": "Stolen Bases", "Walks": "Walks","Walks Allowed":"Walks Allowed", "Total Bases": "Total Bases",
    "Pitcher Strikeouts": "Pitcher Strikeouts", "Hitter Strikeouts": "Hitter Strikeouts",
    "Hitter Fantasy Score": "Hitter Fantasy Score", "Hits+Runs+RBIs": "Hits + Runs + RBIs", "ERA": "Earned Runs Allowed"
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
        const gameKey = multiSportMode
          ? `${[p.Team, p.Opponent].sort().join(' vs ')} (${p.Sport})`
          : `${[p.Team, p.Opponent].sort().join(' vs ')}`;
        if (gameKey !== selectedGame) return false;
      }      
      if (selectedTime !== "All") {
        const timeStr = p["GameTime"];
        if (!timeStr) return false;
      
        const [time, meridian] = timeStr.split(" ");
        let [hour, minute] = time.split(":").map(Number);
      
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
      
        const isEarly = hour < 15;
        const isAfternoon = hour >= 15 && hour < 17;
        const isEvening = hour >= 17 && hour < 20;
        const isLate = hour >= 20;
      
        if (
          (selectedTime === "Early" && !isEarly) ||
          (selectedTime === "Afternoon" && !isAfternoon) ||
          (selectedTime === "Evening" && !isEvening) ||
          (selectedTime === "Late" && !isLate)
        ) {
          return false;
        }
      }      
      if (selectedPropType && p["Prop Type"] !== selectedPropType) return false;
      if (selectedZGuruTag && p["ZGuruTag"] !== selectedZGuruTag) return false;
      if (selectedLeanDirection && p["LeanDirection"] !== selectedLeanDirection) return false;
      if (selectedGuruConflict && p["GuruConflict"] !== selectedGuruConflict) return false;
      if (selectedIsGuruPicks !== "" && p["IsGuruPick"] !== selectedIsGuruPicks) return false;
      if (selectedGuruPicks && p["GuruPick"] !== selectedGuruPicks) return false;
      if (selectedGuruMagic && p["GuruMagic"] !== selectedGuruMagic) return false;
      
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
      if (!loading && propsCache[activeSport]) {
        setPropsData(propsCache[activeSport]);
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
  }, [propsData, selectedTags, selectedGame, selectedPropType, selectedConfidence, selectedGuruPotential, playerInput,selectedGuruMagic,
    selectedZGuruTag, selectedLeanDirection, selectedGuruConflict,selectedGuruPicks,selectedIsGuruPicks,homeAwayFilter, momentumFilter, momentumPatternFilter,
     confirmedMomentumFilter,playerTypeFilter, selectedTeam, selectedTime, propsCache, loading, activeSport]);

     useEffect(() => {
      if (!propsData || propsData.length === 0) return;
  
      const allGames = propsData
        .filter(p =>
          p.Team &&
          p.Opponent &&
          p.Team.toLowerCase() !== 'nan' &&
          p.Opponent.toLowerCase() !== 'nan' &&
          selectedSports.includes(p.Sport)
        )
        .map(p => {
          const teams = [p.Team, p.Opponent].sort();
          return multiSportMode
            ? `${teams[0]} vs ${teams[1]} (${p.Sport})`
            : `${teams[0]} vs ${teams[1]}`;

        });
  
      setUniqueGames([...new Set(allGames)].sort());
    }, [propsData, selectedSports]);
    
  
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
        <select value={selectedGuruMagic} onChange={(e) => setSelectedGuruMagic(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Guru Magic</option>
          <option value="⚠️ GURU CHAOS">GURU CHAOS</option>
          <option value="OVER">OVER</option>
          <option value="⚠️ GURU RISK">GURU RISK</option>
          <option value="UNDER">UNDER</option>
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
        <select
          value={selectedIsGuruPicks}
          onChange={(e) => setSelectedIsGuruPicks(e.target.value === "true")}
          style={{ borderRadius: "12px", padding: "0.5rem" }}
        >
          <option value="">Full Player Pool</option>
          <option value="true">GURU POOL</option>
          <option value="false">FULL POOL</option>
        </select>

        <select value={selectedGuruPicks} onChange={(e) => setSelectedGuruPicks(e.target.value)} style={{ borderRadius: "12px", padding: "0.5rem" }}>
          <option value="">All Guru Picks</option>
          <option value="OVER">OVER</option>
          <option value="UNDER">UNDER</option>
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
              const matchupLine = p.GameTime ? `🕒 ${formatLocalTime(p.GameTime, activeSport)} — ${p["Home/Away"]?.toLowerCase() === "home" ? "🏠 Home" : "✈️ Away"}` : "🕒 TBD";
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
                      {matchupLine}
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
                    <strong>vs {p["opp_pitcher"]} (ERA):</strong>{Number(p["opp_era"]).toFixed(2)}
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
      {showLineupSection && (
        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', marginTop: '2rem' }}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ marginBottom: "1.2rem" }}>Lineup Generator</h2>
            {renderLineupModeToggle()}
          </div>
          {lineupMode === "Advanced" ? (
            <AdvancedLineupPanel
              allTags={Object.keys(tagColorMap)}
              allGames={uniqueGames}
              allSports={["NBA", "MLB", "NFL", "SOCCER", "MMA", "GOLF", "WNBA", "CBB", "NHL"]}
              selectedSports={selectedSports}
              setSelectedSports={setSelectedSports}
              handleLineupGenerate={(config) => {
                console.log("📦 Advanced config sent to backend:", config);
                fetch("http://localhost:5050/generate-lineups", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(config),
                })
                  .then(res => res.json())
                  .then(data => setGeneratedLineups(data))
                  .catch(err => console.error("❌ Failed to generate advanced lineups:", err));
              }}
            />
          ) : (
            renderLineupGenerator()
          )}
        </div>
      )}
    </div>
    );
  } // end PropsDashboard

     
