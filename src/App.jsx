import React, { useState } from 'react';
import PropsDashboard from './PropsDashboard'; // Ensure correct path

const App = () => {
  const [activeSport, setActiveSport] = useState('NBA');

  return (
    <div>
      <PropsDashboard activeSport={activeSport} />
    </div>
  );
};

export default App;
