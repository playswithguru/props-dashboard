import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PropsDashboard from './PropsDashboard'; // Make sure this path is correct

const App = () => {
  const [activeSport, setActiveSport] = useState('NBA'); // Optional, if you're filtering by sport

  return (
    <GoogleOAuthProvider clientId="400878472680-m23ccjb7eluoh14smcfk3k158ot10oj5.apps.googleusercontent.com">
      <div>
        <PropsDashboard activeSport={activeSport} />
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
