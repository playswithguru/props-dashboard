import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const tagColorMap = {
  "MEGA SMASH": "#0095e0",
  "SMASH": "#2e7d32",
  "GOOD": "#f9a825",
  "LEAN": "#8e24aa",
  "FADE/UNDER": "#d32f2f"
};

const LineupGeneratorPanel = ({
  mixType,
  setMixType,
  maxLineups,
  setMaxLineups,
  lineupResults = [],
  setLineupResults,
  darkMode,
  homeAwayFilter,
  setHomeAwayFilter,
  lineupGameFilter,
  setLineupGameFilter,
  lineupTagFilter,
  setLineupTagFilter,
  allTags = [],
  allGames = [],
  filterGames,
  showGenerator = true,
  handleLineupGenerate,
  activeSport,
}) => {
  const [searchPlayer, setSearchPlayer] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [activeTab, setActiveTab] = useState("PRIZEPICKS");
  const tags = allTags || [];
  const games = allGames || [];
  const lineupRefs = useRef([]);

  const handleSubmit = () => {
    if (typeof handleLineupGenerate === 'function') {
      handleLineupGenerate({
        mixType,
        maxLineups: parseInt(maxLineups, 10),
        homeAway: homeAwayFilter,
        filterGames: lineupGameFilter,
        filterTags: lineupTagFilter,
        confidence: confidenceFilter
      });
    }
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const cardWidth = (pdfWidth - 40) / 2;
    const margin = 10;
    let x = margin;
    let y = margin;

    for (let i = 0; i < lineupRefs.current.length; i++) {
      const ref = lineupRefs.current[i];
      if (ref) {
        const canvas = await html2canvas(ref);
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
    <div className="max-w-4xl mx-auto p-4">
      {showGenerator && (
        <div className="border border-gray-300 rounded-2xl p-6 mb-6 shadow-lg bg-white">
          <div className="flex gap-4 border-b pb-3 mb-6">
            {['PRIZEPICKS', 'DRAFTKINGS', 'FANDUEL', 'MULTISPORT'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 ${activeTab === tab ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'PRIZEPICKS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mix Type:</label>
                <select value={mixType} onChange={(e) => setMixType(e.target.value)} className="w-full rounded-lg px-4 py-2 border border-gray-300">
                  <option value="3_OVER_3_UNDER">3 OVER 3 UNDER</option>
                  <option value="4_OVER_2_UNDER">4 OVER 2 UNDER</option>
                  <option value="2_OVER_4_UNDER">2 OVER 4 UNDER</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Max Lineups:</label>
                <input type="number" value={maxLineups} onChange={(e) => setMaxLineups(e.target.value)} className="w-full rounded-lg px-4 py-2 border border-gray-300" />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confidence:</label>
                <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)} className="w-full rounded-lg px-4 py-2 border border-gray-300">
                  <option value="">All</option>
                  <option value="Elite">Elite</option>
                  <option value="Strong">Strong</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Home/Away:</label>
                <select value={homeAwayFilter} onChange={(e) => setHomeAwayFilter(e.target.value)} className="w-full rounded-lg px-4 py-2 border border-gray-300">
                  <option value="">All</option>
                  <option value="H">Home</option>
                  <option value="A">Away</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by Tag:</label>
                <select multiple value={lineupTagFilter} onChange={(e) => setLineupTagFilter(Array.from(e.target.selectedOptions, option => option.value))} className="w-full h-40 rounded-lg px-4 py-2 border border-gray-300">
                  {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by Game:</label>
                <select multiple value={lineupGameFilter} onChange={(e) => setLineupGameFilter(Array.from(e.target.selectedOptions, option => option.value))} className="w-full h-40 rounded-lg px-4 py-2 border border-gray-300">
                  {games.map(game => <option key={game} value={game}>{game}</option>)}
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700"
                >
                  🚀 Generate Lineups
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={lineupResults.length === 0}
                  className={`px-6 py-2 rounded-lg font-semibold shadow transition-colors duration-200 ${lineupResults.length > 0 ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                >
                  📄 Export All Lineups to PDF
                </button>
                <input
                  type="text"
                  placeholder="e.g. Zach LaVine"
                  value={searchPlayer}
                  onChange={(e) => setSearchPlayer(e.target.value)}
                  className="rounded-lg px-4 py-2 border border-gray-300 min-w-[200px]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {lineupResults.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Generated Lineups</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {lineupResults.map((lineup, idx) => (
              <div
                key={idx}
                ref={(el) => (lineupRefs.current[idx] = el)}
                style={{ border: "1px solid #ccc", borderRadius: "12px", padding: "1rem", background: "#f9f9f9" }}
              >
                <h4 style={{ marginBottom: "0.5rem" }}>Lineup {idx + 1}</h4>
                <ul style={{ paddingLeft: "1.2rem" }}>
                  {lineup.map((player, i) => (
                    <li key={i}>
                      {player.Player} — {player["Prop Type"]} @ {player["Prop Value"]} ({player.Tag})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LineupGeneratorPanel;
