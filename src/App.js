import React, { useState } from 'react';

function App() {
  //const [activeSport, setActiveSport] = useState("NBA"); // Default active sport

  return (
    <div>
      {/* Render PropsDashboard here */}
      <PropsDashboard activeSport={activeSport} />
    </div>
  );
}

export default App; // Make sure to export App component
