// utils/teamColors.js

export const nbaTeamColors = {
    ATL: "#E03A3E", BOS: "#007A33", BKN: "#000000", CHA: "#1D1160",
    CHI: "#CE1141", CLE: "#6F263D", DAL: "#00538C", DEN: "#0E2240",
    DET: "#C8102E", GSW: "#1D428A", HOU: "#CE1141", IND: "#002D62",
    LAC: "#C8102E", LAL: "#552583", MEM: "#12173F", MIA: "#98002E",
    MIL: "#00471B", MIN: "#0C2340", NOP: "#0C2340", NYK: "#F58426",
    OKC: "#007AC1", ORL: "#0077C0", PHI: "#006BB6", PHX: "#1D1160",
    POR: "#E03A3E", SAC: "#5A2D81", SAS: "#C4CED4", TOR: "#CE1141",
    UTA: "#002B5C", WAS: "#002B5C"
  };
  
  export const mlbTeamColors = {
    ATL: "#13274F", BOS: "#BD3039", CHC: "#0E3386", CIN: "#C6011F",
    CLE: "#0C2340", COL: "#33006F", DET: "#0C2340", HOU: "#EB6E1F",
    KCR: "#004687", LAA: "#BA0021", LAD: "#005A9C", MIA: "#00A3E0",
    MIL: "#12284B", MIN: "#002B5C", NYM: "#002D72", NYY: "#132448",
    OAK: "#003831", PHI: "#E81828", PIT: "#FDB827", SDP: "#2F241D",
    SEA: "#0C2C56", SFG: "#FD5A1E", STL: "#C41E3A", TBR: "#092C5C",
    TEX: "#003278", TOR: "#134A8E", WSN: "#AB0003", ARI: "#A71930"
  };
  
  export const nflTeamColors = {
    ARI: "#97233F", ATL: "#A71930", BAL: "#241773", BUF: "#00338D",
    CAR: "#0085CA", CHI: "#0B162A", CIN: "#FB4F14", CLE: "#311D00",
    DAL: "#041E42", DEN: "#FB4F14", DET: "#0076B6", GB: "#203731",
    HOU: "#03202F", IND: "#002C5F", JAX: "#006778", KC: "#E31837",
    LV: "#000000", LAC: "#0080C6", LAR: "#003594", MIA: "#008E97",
    MIN: "#4F2683", NE: "#002244", NO: "#D3BC8D", NYG: "#0B2265",
    NYJ: "#125740", PHI: "#004C54", PIT: "#FFB612", SF: "#AA0000",
    SEA: "#002244", TB: "#D50A0A", TEN: "#4B92DB", WAS: "#773141"
  };
  
  export const nhlTeamColors = {
    ANA: "#FC4C02", ARI: "#8C2633", BOS: "#FFB81C", BUF: "#002654",
    CGY: "#C8102E", CAR: "#CC0000", CHI: "#CF0A2C", COL: "#6F263D",
    CBJ: "#002654", DAL: "#006847", DET: "#CE1126", EDM: "#041E42",
    FLA: "#041E42", LAK: "#111111", MIN: "#154734", MTL: "#AF1E2D",
    NSH: "#FFB81C", NJD: "#CE1126", NYI: "#00539B", NYR: "#0038A8",
    OTT: "#E31837", PHI: "#F74902", PIT: "#FCB514", SJS: "#006D75",
    SEA: "#99D9D9", STL: "#002F87", TBL: "#002868", TOR: "#00205B",
    VAN: "#00205B", VGK: "#B4975A", WSH: "#041E42", WPG: "#041E42"
  };
  
  export const wnbaTeamColors = {
    ATL: "#C8102E", CHI: "#FDB927", CON: "#002D62", DAL: "#006778",
    IND: "#002D62", LAS: "#552583", MIN: "#236192", NYL: "#00B2A9",
    PHX: "#E56020", SEA: "#2F9442", WAS: "#002B5C", LV: "#000000"
  };
  
  export const getTeamColor = (team, sport) => {
    if (!team || typeof team !== "string") return "#ccc";
  
    const maps = {
      NBA: nbaTeamColors,
      MLB: mlbTeamColors,
      NFL: nflTeamColors,
      NHL: nhlTeamColors,
      WNBA: wnbaTeamColors,
    };
  
    const colorMap = maps[sport] || {};
  
    if (team.includes("/")) {
      const [firstTeam] = team.split("/");
      return colorMap[firstTeam.trim()] || "#999";
    }
    
    return colorMap[team] || "#999"; // <-- this was missing
  };    
