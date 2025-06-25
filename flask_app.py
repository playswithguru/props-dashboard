from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from lineup_generator import generate_lineups_from_config

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["https://playswithguru.com", "http://localhost:3000"]}})

NBA_FILE_PATH = "output/NBA_PropAnalysis_Output.xlsx"
MLB_FILE_PATH = "output/MLB_PropAnalysis_Output.xlsx"

def extract_nba_last10_stats():
    try:
        df = pd.read_excel(NBA_FILE_PATH, sheet_name="Last10_GameLogs")
        df["Player"] = df["Player"].astype(str).str.strip()
        df["Date"] = pd.to_datetime(df["Date"]).dt.date
        return df
    except Exception as e:
        print(f"❌ Error loading NBA last10 stats: {e}")
        return pd.DataFrame()

def extract_nba_last10_vsOpp_stats():
    try:
        df = pd.read_excel(NBA_FILE_PATH, sheet_name="Last10vsOpp_GameLogs")
        df["Player"] = df["Player"].astype(str).str.strip()
        df["Date"] = pd.to_datetime(df["Date"]).dt.date
        return df
    except Exception as e:
        print(f"❌ Error loading NBA last10 vsOpp stats: {e}")
        return pd.DataFrame()


def enrich_last10_from_df(player, prop_type, source_df):
    col_map = {
        "Points": "Points",
        "Rebounds": "Rebounds",
        "Assists": "Assists",
        "Pts+Rebs": ["Points", "Rebounds"],
        "Pts+Asts": ["Points", "Assists"],
        "Rebs+Asts": ["Rebounds", "Assists"],
        "Pts+Rebs+Asts": ["Points", "Rebounds", "Assists"],
        "3-PT Attempted": "3PT Attempted",
        "3-PT Made": "3PT Made",
        "Turnovers": "Turnovers",
        "Blocked Shots": "Blocks",
        "Steals": "Steals",
        "Free Throws Attempted": "Free Throws Attempted",
        "Free Throws Made": "Free Throws Made",
        "Offensive Rebounds": "OREB",
        "Defensive Rebounds": "DREB",
        "Personal Fouls": "PF",
        "Fantasy Score": "FantasyScore_PP",
        "FG Attempted": "Field Goals Attempted",
        "FG Made": "Field Goals Made",
        "Two Pointers Made": lambda row: row.get("Field Goals Made", 0) - row.get("3PT Made", 0),
        "Two Pointers Attempted": lambda row: row.get("Field Goals Attempted", 0) - row.get("3PT Attempted", 0)
    }

    if source_df.empty:
        return []
    
    subset = source_df[source_df["Player"].str.lower() == player.lower()]
    if subset.empty:
        return []

    subset = subset.sort_values("Date", ascending=False).head(10)
    results = []
    for _, row in subset.iterrows():
        if prop_type in col_map:
            stat_def = col_map[prop_type]
            if callable(stat_def):
                value = stat_def(row)
            elif isinstance(stat_def, list):
                value = sum([row.get(col, 0) for col in stat_def])
            else:
                value = row.get(stat_def, 0)
        else:
            value = None

        results.append({
            "Date": row["Date"],
            "Team": row["Team"],
            "Opponent": row["Opponent"],
            "Home/Away": "home" if str(row["Matchup"]).startswith(row["Team"]) else "away",
            "Matchup": row["Matchup"],
            "Value": round(value, 2) if pd.notna(value) else None
        })

    return results


@app.route("/props")
def get_nba_props():
    try:
        print("🚀 /props endpoint hit")
        props_df = pd.read_excel(NBA_FILE_PATH, sheet_name="All_Picks")
        last10_df = extract_nba_last10_stats()
        last10vsOpp_df = extract_nba_last10_vsOpp_stats()
        props_df = props_df[props_df["Tag"].notna()].copy()
        print("✅ NBA props loaded")

        props = []
        for _, row in props_df.iterrows():
            conf = row.get("Confidence", 0)
            try:
                conf = float(conf)
                if conf <= 1:
                    conf *= 10
            except:
                conf = 0

            season_avg = row.get("Season_Avg", None)
            last5_avg = row.get("Last5_Avg", None)
            last10_avg = row.get("Last10_Avg", None)

            try:
                if season_avg in [None, 0] and last10_avg not in [None, 0]:
                    last5_vs_season = (last5_avg - last10_avg) / last10_avg
                    last10_vs_season = 0
                elif season_avg not in [None, 0]:
                    last5_vs_season = (last5_avg - season_avg) / season_avg if last5_avg not in [None, 0] else 0
                    last10_vs_season = (last10_avg - season_avg) / season_avg if last10_avg not in [None, 0] else 0
                else:
                    last5_vs_season = 0
                    last10_vs_season = 0
            except:
                last5_vs_season = 0
                last10_vs_season = 0

            props.append({
                "Player": row.get("Player", ""),
                "Team": row.get("Team", ""),
                "Team Name": row.get("Team Name", ""),
                "Opponent": row.get("Opponent", ""),
                "Opponent Name": row.get("Opponent Name", ""),
                "Player Type": row.get("Player Type", "UNKNOWN"),
                "Prop Type": row.get("Prop Type", row.get("PropType", "")),
                "Prop Value": row.get("Prop Value", row.get("PropValue", "")),
                "Tag": row.get("Tag", ""),
                "MomentumTag": row.get("Momentum Tag",""),
                "MomentumPattern": row.get("Momentum Pattern",""),
                "ConfirmedMomentum": row.get("Confirmed Momentum",""),
                "GuruPotential": row.get("Guru Potential",""),
                "ZGuruTag": row.get("Z-GURU Tag",""),
                "GuruConflict": row.get("Guru Conflict"),
                "LeanDirection": row.get("Lean Direction"),
                "Confidence": round(conf, 2),
                "RiskNote": row.get("Risk Note"),
                "AI Commentary": row.get("AI Commentary"),
                "GuruPick": row.get("Guru Pick"),
                "GuruMagic": row.get("Guru Magic"),
                "Sport": row.get("Sport"),
                "IsGuruPick": row.get("IsGuru Pick"),
                "WinProbability": row.get("WinProbability", 0),
                "GameTime": str(row.get("GameTime", "")) if pd.notna(row.get("GameTime")) else "",
                "Home/Away": row.get("Home/Away", "home"),
                "Matchup": row.get("Matchup", f"{row.get('Team', '')} vs {row.get('Opponent', '')}"),
                "Final Projection": row.get("Final Projection", row.get("FinalAdjustedScore", None)),
                "Last10Stats": enrich_last10_from_df(row.get("Player", ""), row.get("Prop Type", row.get("PropType", "")),last10_df),
                "Last10vsOppStats":enrich_last10_from_df(row.get("Player", ""), row.get("Prop Type", row.get("PropType", "")),last10vsOpp_df),
                "Last5_vs_Season": round(last5_vs_season, 5),
                "Last10_vs_Season": round(last10_vs_season, 5)
            })

        return jsonify(pd.DataFrame(props).replace({np.nan: None}).to_dict(orient="records"))
    except Exception as e:
        print(f"❌ Error loading NBA props: {e}")
        return jsonify({"error": str(e)})


@app.route("/mlb-props")
def get_mlb_props():
    try:
        print("🚀 /mlb-props endpoint hit")
        picks_df = pd.read_excel(MLB_FILE_PATH, sheet_name="All_Picks")
        print("✅ MLB props loaded")
        last10_batters_df = pd.read_excel(MLB_FILE_PATH, sheet_name="Last 10 Batters")
        last10_batters_df.columns = last10_batters_df.columns.str.strip().str.lower()
        print("✅ Last10 batters loaded")
        last10_pitchers_df = pd.read_excel(MLB_FILE_PATH, sheet_name="Last 10 Pitchers")
        last10_pitchers_df.columns = last10_pitchers_df.columns.str.strip().str.lower()
        print("✅ Last10 pitchers loaded")

        props = []

        for _, row in picks_df.iterrows():
            player = str(row.get("Player", ""))
            team = str(row.get("Team", ""))
            teamName = str(row.get("Team Name", ""))
            opponent = str(row.get("Opponent", ""))
            opponentName = str(row.get("Opponent Name", ""))
            playerType = str(row.get("Player Type", ""))
            prop_type = str(row.get("Prop Type", ""))
            value = row.get("Prop Value", "")
            tag = row.get("Tag", "")
            conf = row.get("Confidence", "")
            prob = row.get("WinProbability", "")
            guruP = row.get("Guru Potential","")
            momentumT = row.get("Momentum Tag","")
            zgTag = row.get("Z-GURU Tag","")
            gc = row.get("Guru Conflict","")
            ld = row.get("Lean Direction","")
            mp = row.get("Momentum Pattern","")
            cm = row.get("Confirmed Momentum","")
            ac = row.get("AI Commentary","")
            sport = row.get("Sport","")
            guruPick = row.get("Guru Pick","")
            guruMagic = row.get("Guru Magic","")
            isguruPick = row.get("IsGuru Pick","")
            start = row.get("GameTime", "")
            ha = row.get("Home/Away", "home")
            last5_vs_Season = row.get("Last5_vs_Season", None)
            last10_vs_Season = row.get("Last10_vs_Season", None)
            ptype = playerType
            final_projection = row.get("Final Projection", row.get("FinalAdjustedScore", None))
            pitcher = row.get("opp_pitcher", "") 
            era = row.get("opp_era", None)
            hand = row.get("opp_hand", "")

            if not ptype:
                if player.lower() in last10_batters_df["player"].str.lower().values:
                    ptype = "Batter"
                elif player.lower() in last10_pitchers_df["player"].str.lower().values:
                    ptype = "Pitcher"

            last10_df = last10_batters_df if ptype == "Batter" else last10_pitchers_df
            subset = last10_df[last10_df["player"].str.lower() == player.lower()]

            last10stats = []
            if not subset.empty:
                subset = subset.sort_values(by="date", ascending=False).head(10)

                stat_map = {
                    "Hits+Runs+RBIs": ["hits", "runs", "rbi"],
                    "Hits": "hits", "Runs": "runs", "RBIs": "rbi", "Home Runs": "homeruns",
                    "Pitcher Strikeouts": "strikeouts", "Pitcher Fantasy Score": "pp_fantasy",
                    "Hitter Fantasy Score": "pp_fantasy", "Total Bases": "totalbases",
                    "Stolen Bases": "stolenbases", "Walks": "baseonballs", "Hits Allowed": "hits",
                    "Earned Runs Allowed": "runs", "Doubles": "doubles", "Triples": "triples",
                    "Singles": "singles", "Hitter Strikeouts": "strikeouts", "Pitching Outs": "outs",
                    "Pitches Thrown": "numberofpitches", "Walks Allowed": "baseonballs"
                }
                stat_col = stat_map.get(prop_type)

                if isinstance(stat_col, list):
                    subset["value"] = subset[stat_col].sum(axis=1)
                elif stat_col and stat_col in subset.columns:
                    subset["value"] = subset[stat_col]
                else:
                    print(f"⚠️ Stat column not found: {stat_col} for {player} - {prop_type}")
                    subset["value"] = None

                for _, srow in subset.iterrows():
                    last10stats.append({
                        "Date": pd.to_datetime(srow.get("date")).strftime("%Y-%m-%d") if pd.notna(srow.get("date")) else None,
                        "Opponent": srow.get("opponent", ""),
                        "HomeAway": srow.get("home/away", "Home"),
                        "Team": srow.get("team", ""),
                        "Matchup": srow.get("matchup", f"{srow.get('team', '')} vs. {srow.get('opponent', '')}"),
                        "Value": round(srow.get("value", 0), 2) if pd.notna(srow.get("value")) else None
                    })

            conf = row.get("Confidence", 0)
            try:
                conf = float(conf)
                if conf <= 1:
                    conf *= 10
            except:
                conf = 0

            props.append({
                "Player": player,
                "Team": team,
                "Team Name": teamName,
                "Opponent": opponent,
                "Opponent Name": opponentName,
                "Prop Type": prop_type,
                "Player Type": ptype,
                "Prop Value": value,
                "Tag": tag,
                "Confidence": round(conf, 2),
                "WinProbability": prob,
                "GuruPotential": guruP,
                "MomentumTag": momentumT,
                "ZGuruTag":zgTag,
                "GuruConflict": gc,
                "LeanDirection": ld,
                "MomentumPattern": mp,
                "ConfirmedMomentum": cm,
                "AI Commentary": ac,
                "Sport": sport,
                "GuruPick": guruPick,
                "GuruMagic": guruMagic,
                "IsGuruPick": isguruPick,
                "GameTime": start,
                "Home/Away": ha,
                "Matchup": row.get("Matchup", f"{team} vs {opponent}"),
                "Final Projection": final_projection,
                "Last10Stats": last10stats,
                "Last5_vs_Season": last5_vs_Season,
                "Last10_vs_Season": last10_vs_Season,
                "opp_pitcher": pitcher,
                "opp_era": era,
                "opp_hand": hand

            })

        return jsonify(pd.DataFrame(props).replace({np.nan: None}).to_dict(orient="records"))
    except Exception as e:
        print(f"❌ Error loading MLB props: {e}")
        return jsonify({"error": str(e)})


@app.route("/generate-lineups", methods=["POST"])
def generate_lineups_api():
    try:
        print("🚀 /generate-lineups endpoint hit")
        config = request.get_json()
        filter_sports = config.get("sports", [])

        if not filter_sports:
            raise ValueError("No sports specified in request.")

        # ✅ Load only the requested sport files
        dfs = []
        for sport in filter_sports:
            sport_upper = sport.upper()
            if sport_upper == "NBA":
                df = pd.read_excel(NBA_FILE_PATH, sheet_name="All_Picks")
            elif sport_upper == "MLB":
                df = pd.read_excel(MLB_FILE_PATH, sheet_name="All_Picks")
            else:
                print(f"⚠️ Unsupported sport requested: {sport}")
                continue
            dfs.append(df)

        if not dfs:
            raise ValueError("No valid data loaded for selected sports.")

        # ✅ Combine and proceed
        df = pd.concat(dfs, ignore_index=True)
        lineups = generate_lineups_from_config(config, df)
        print("✅ Lineups generated:", lineups[:1])
        return jsonify(lineups)

    except Exception as e:
        print(f"❌ Error generating lineups: {e}")
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True, port=5050)

