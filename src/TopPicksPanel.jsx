import React, { useEffect, useState } from "react";

const TopPicksPanel = () => {
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5050/top-picks")
      .then((res) => res.json())
      .then((data) => {
        setTopPicks(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch top picks:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">🔥 Guru Top Picks</h2>
      {loading ? (
        <p>Loading...</p>
      ) : topPicks.length === 0 ? (
        <p>No top picks available yet.</p>
      ) : (
        <div className="grid gap-4">
          {topPicks.map((pick, idx) => (
            <div
              key={idx}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800"
            >
              <p className="font-bold">
                {pick.Player} ({pick.Team})
              </p>
              <p>
                <strong>{pick["Prop Type"]}:</strong> {pick["Prop Value"]}
              </p>
              <p>
                <strong>Projection:</strong> {pick["Weighted Projection"]}
              </p>
              <p>
                <strong>Tag:</strong> {pick.Tag}
              </p>
              <p>
                <strong>Confidence:</strong> {pick["Confidence Score"]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopPicksPanel;
