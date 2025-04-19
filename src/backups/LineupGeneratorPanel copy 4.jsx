import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  const tagEmojiMap = {
    "MEGA SMASH": "💥",
    "SMASH": "✅",
    "GOOD": "⚠️",
    "LEAN": "🔣",
    "FADE/UNDER": "❌"
  };

  const getDominantTag = (lineup) => {
    const tagCount = {};
    lineup.forEach(p => {
      tagCount[p.Tag] = (tagCount[p.Tag] || 0) + 1;
    });
    return Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  };

  const getTagSummary = (lineup) => {
    const count = {};
    lineup.forEach(p => {
      const emoji = tagEmojiMap[p.Tag];
      if (emoji) {
        count[emoji] = (count[emoji] || 0) + 1;
      }
    });
    return Object.entries(count).map(([emoji, n]) => `${emoji} x${n}`).join("   ");
  };

  const lineupRefs = useRef([]);

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const cardWidth = (pdfWidth - 30) / 2;
    const margin = 10;
    let x = margin;
    let y = margin;

    for (let i = 0; i < lineupRefs.current.length; i++) {
      const ref = lineupRefs.current[i];
      if (ref?.current) {
        const canvas = await html2canvas(ref.current);
        const imgData = canvas.toDataURL("image/png");
        const imgProps = doc.getImageProperties(imgData);
        const ratio = cardWidth / imgProps.width;
        const imgHeight = imgProps.height * ratio;

        if (y + imgHeight > pageHeight - margin) {
          doc.addPage();
          x = margin;
          y = margin;
        }

        doc.addImage(imgData, "PNG", x, y, cardWidth, imgHeight);
        x += cardWidth + 10;

        if (x + cardWidth > pdfWidth) {
          x = margin;
          y += imgHeight + 10;
        }
      }
    }

    doc.save("Guru_Lineups.pdf");
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
          <input type="number" value={maxLineups} onChange={(e) => setMaxLineups(e.target.value)} min={1} style={{ width: "60px" }} />
        </div>

        <div>
          <label>Filter Game:</label><br />
          <input type="text" value={lineupGameFilter} onChange={(e) => setLineupGameFilter(e.target.value)} placeholder="e.g. Golden State Warriors vs Memphis Grizzlies" style={{ width: "300px" }} />
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

        {lineupResults?.length > 0 && (
          <button
            onClick={handleExportPDF}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              height: "40px",
              marginTop: "1.2rem"
            }}
          >
            📄 Export to PDF
          </button>
        )}
      </div>

      {lineupResults?.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
          {lineupResults.map((lineup, i) => {
            const dominantTag = getDominantTag(lineup);
            const tagSummary = getTagSummary(lineup);
            const cardBorderColor = tagColorMap[dominantTag] || "#ccc";
            if (!lineupRefs.current[i]) lineupRefs.current[i] = React.createRef();

            return (
              <div
                key={i}
                ref={lineupRefs.current[i]}
                style={{
                  position: "relative",
                  borderLeft: `4px solid ${cardBorderColor}`,
                  borderRadius: "16px",
                  padding: "1rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  backgroundColor: darkMode ? "#2c2c2c" : "#fff",
                  color: darkMode ? "#f0f0f0" : "#000",
                  transition: "all 0.3s ease"
                }}
              >
                <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>Lineup {i + 1}</h3>
                <div style={{ fontSize: "0.85rem", marginBottom: "0.8rem", color: "#aaa" }}>
                  {tagSummary}
                </div>
                {lineup.map((player, j) => (
                  <div key={j} style={{
                    borderLeft: `4px solid ${tagColorMap[player.Tag] || "#ccc"}`,
                    paddingLeft: "0.75rem",
                    marginBottom: "0.75rem",
                    fontSize: "0.95rem"
                  }}>
                    <strong>{player.Player}</strong> — {player["Prop Type"]}: {player["Prop Value"]}
                  
                    {/* Confidence Bar */}
                    {player.Confidence !== undefined && (
                      <div style={{ marginTop: "0.25rem" }}>
                        <div style={{
                          height: "6px",
                          width: "100%",
                          backgroundColor: darkMode ? "#444" : "#eee",
                          borderRadius: "4px",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${Math.min(player.Confidence * 20, 100)}%`,  // scale to 0–100%
                            height: "100%",
                            backgroundColor: "#007bff",
                            transition: "width 0.3s ease"
                          }} />
                        </div>
                      </div>
                    )}
                  </div>                  
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LineupGeneratorPanel;
