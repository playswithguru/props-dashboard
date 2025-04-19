import React, { useState } from "react";
import { FaBasketballBall, FaBaseballBall, FaFootballBall, FaFutbol } from "react-icons/fa";  // You can add custom icons too
import './SportsMenu.css';  // Make sure to create this CSS file

const SportsMenu = () => {
  const [activeSport, setActiveSport] = useState('NBA'); // Default active sport

  const handleClick = (sport) => {
    setActiveSport(sport);
  };

  return (
    <div className="sports-menu">
      <div
        className={`menu-item ${activeSport === 'NBA' ? 'active' : ''}`}
        onClick={() => handleClick('NBA')}
      >
        <FaBasketballBall className="icon nba-icon" />
        <span className="sport-name">NBA</span>
      </div>
      <div
        className={`menu-item ${activeSport === 'MLB' ? 'active' : ''}`}
        onClick={() => handleClick('MLB')}
      >
        <FaBaseballBall className="icon mlb-icon" />
        <span className="sport-name">MLB</span>
      </div>
      <div
        className={`menu-item ${activeSport === 'NFL' ? 'active' : ''}`}
        onClick={() => handleClick('NFL')}
      >
        <FaFootballBall className="icon nfl-icon" />
        <span className="sport-name">NFL</span>
      </div>
      <div
        className={`menu-item ${activeSport === 'SOCCER' ? 'active' : ''}`}
        onClick={() => handleClick('SOCCER')}
      >
        <FaFutbol className="icon soccer-icon" />
        <span className="sport-name">SOCCER</span>
      </div>
    </div>
  );
};

export default SportsMenu;
