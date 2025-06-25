import React, { useState } from 'react';

const AdvancedLineupPanel = ({
  allTags,
  allGames,
  allSports,
  handleLineupGenerate,
}) => {
  const [mixType, setMixType] = useState('3_OVER_3_UNDER');
  const [maxLineups, setMaxLineups] = useState(20);
  const [lineupTagFilter, setLineupTagFilter] = useState([]);
  const [lineupGameFilter, setLineupGameFilter] = useState([]);
  const [selectedSports, setSelectedSports] = useState(["NBA"]);
  const multiSportMode = selectedSports.length > 1;
  const formatGameKey = (team1, team2, sport) =>
    multiSportMode
      ? `${[team1, team2].sort().join(' vs ')} (${sport})`
      : `${[team1, team2].sort().join(' vs ')}`;



  const onGenerate = () => {
    handleLineupGenerate({
      mixType,
      maxLineups,
      tags: lineupTagFilter,
      games: lineupGameFilter,
      sports: selectedSports,
    });
  };

  const baseStyle = {
    borderRadius: '10px',
    padding: '0.6rem 0.75rem',
    fontSize: '1rem',
    fontWeight: '500',
    border: '1px solid #ccc',
    backgroundColor: '#fefefe',
    color: '#333',
    minWidth: '160px',
  };

  const labelStyle = {
    fontWeight: '600',
    fontSize: '0.85rem',
    marginBottom: '0.25rem',
    display: 'inline-block'
  };

  const sectionStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
    alignItems: 'flex-start'
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', marginTop: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {/* ✅ Include Sports */}
        <div>
          <label style={labelStyle}>Include Sports</label><br />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '12px',
            background: '#fefefe',
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '200px',
            fontSize: '0.95rem'
          }}>
            {allSports.map(sport => (
              <label key={sport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  value={sport}
                  checked={selectedSports.includes(sport)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedSports(prev =>
                      e.target.checked ? [...prev, value] : prev.filter(s => s !== value)
                    );
                  }}
                />
                {sport}
              </label>
            ))}
          </div>
        </div>

        {/* ✅ Filter by Game beside Sports */}
        <div>
          <label style={labelStyle}>Filter by Game</label><br />
          <select
            multiple
            value={lineupGameFilter}
            onChange={(e) => setLineupGameFilter([...e.target.selectedOptions].map(o => o.value))}
            style={{
              ...baseStyle,
              minHeight: '200px',
              minWidth: '250px',
              fontSize: '0.95rem',
              padding: '0.75rem'
            }}
          >
            {allGames.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Mix Type</label><br />
          <select style={baseStyle} value={mixType} onChange={(e) => setMixType(e.target.value)}>
            <option value="3_OVER_3_UNDER">3 OVER 3 UNDER</option>
            <option value="2_OVER_2_UNDER">2 OVER 2 UNDER</option>
            <option value="FLEX">FLEX</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Max Lineups</label><br />
          <input
            type="number"
            value={maxLineups}
            onChange={(e) => setMaxLineups(parseInt(e.target.value))}
            min={1}
            max={500}
            style={baseStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Filter by Tag</label><br />
          <select
            multiple
            value={lineupTagFilter}
            onChange={(e) => setLineupTagFilter([...e.target.selectedOptions].map(o => o.value))}
            style={{ ...baseStyle, minHeight: '100px' }}
          >
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          onClick={onGenerate}
          style={{
            padding: "0.75rem 1.5rem",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "8px",
            marginBottom: "1rem"
          }}
        >
          Generate Multi-Sport Lineups
        </button>
      </div>
    </div>
  );
};

export default AdvancedLineupPanel;
