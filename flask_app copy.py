from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import openpyxl
import numpy as np
import json
from lineup_generator import generate_lineups_from_config

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["https://playswithguru.com", "http://localhost:3000"]}})

HIGHLIGHTS_FILE = "PropAnalysis_Categorized_CLEAN.xlsx"
MLB_PROPS_FILE = "output/MLB_PropAnalysis_Output.xlsx"

# ✅ Load NBA Props
try:
    df = pd.read_excel(HIGHLIGHTS_FILE, sheet_name="Prop_Probabilities", engine="openpyxl")
    df = df.dropna(subset=["Team", "Opponent"])
    df["Team"] = df["Team"].astype(str).str.strip()
    df["Opponent"] = df["Opponent"].astype(str).str.strip()
    df["Game"] = df["Team"] + " vs " + df["Opponent"]
    df["Tag"] = df["Tag"].astype(str).str.upper().str.strip()
    df["Home/Away"] = df["Home/Away"].astype(str).str.lower().str.strip()
    if "GameTime" in df.columns:
        df["GameTime"] = df["GameTime"].astype(str).str.strip()
    else:
        df["GameTime"] = ""
    print("✅ NBA Excel data loaded successfully.")
except Exception as e:
    print("❌ Failed to load NBA Excel:", e)
    df = None

# ✅ Load Last10 NBA GameLogs
try:
    last10_df = pd.read_excel(HIGHLIGHTS_FILE, sheet_name="Last10_GameLogs", engine="openpyxl")
    last10_df["Player"] = last10_df["Player"].astype(str).str.strip()
    if "Home/Away" in last10_df.columns:
        last10_df["Home/Away"] = last10_df["Home/Away"].astype(str).str.lower()
    else:
        last10_df["Home/Away"] = "home"
    for col in ["Blocks", "Rebounds", "Assists", "Points", "3PT Made", "Turnovers", "Free Throws Made", "Free Throws Attempted"]:
        if col in last10_df.columns:
            last10_df[col] = pd.to_numeric(last10_df[col], errors="coerce")
    print("✅ Last10_GameLogs loaded")
    print("🧪 Sample columns in Last10 df:", list(last10_df.columns))
    print("🧪 Sample PRA row:", last10_df[last10_df["Player"].str.lower() == "jamalmurray"])
except Exception as e:
    print("⚠️ Could not load Last10_GameLogs:", e)
    last10_df = pd.DataFrame()

# ✅ Load MLB Props
try:
    mlb_df = pd.read_excel(MLB_PROPS_FILE, sheet_name="All_Picks", engine="openpyxl")
    mlb_df["Tag"] = mlb_df["Tag"].astype(str).str.upper().str.strip()
    mlb_df["Player"] = mlb_df["Player"].astype(str).str.strip()
    print("✅ MLB prop data loaded successfully.")
except Exception as e:
    print("❌ Failed to load MLB props:", e)
    mlb_df = pd.DataFrame()

@app.route("/props")
def get_props():
    tag = request.args.get("tag")
    game = request.args.get("game")

    if df is None:
        return jsonify([])

    filtered = df.copy()
    filtered["Tag"] = filtered["Tag"].astype(str).str.strip().str.upper()

    if tag:
        tag = tag.strip().upper()
        filtered = filtered[filtered["Tag"] == tag]

    if game:
        try:
            team1, team2 = game.split(" vs ")
            filtered = filtered[
                ((filtered["Team"] == team1.strip()) & (filtered["Opponent"] == team2.strip())) |
                ((filtered["Team"] == team2.strip()) & (filtered["Opponent"] == team1.strip()))
            ]
        except ValueError:
            print("⚠️ Invalid game format. Expected 'Team A vs Team B'")

    if not last10_df.empty:
        def extract_last10(row):
            player = row["Player"]
            prop_type = row["Prop Type"]

            col_map = {
                "P": "Points",
                "R": "Rebounds",
                "A": "Assists",
                "PR": ["Points", "Rebounds"],
                "PA": ["Points", "Assists"],
                "RA": ["Rebounds", "Assists"],
                "PRA": ["Points", "Rebounds", "Assists"],
                "3PT": "3PT Made",
                "TOV": "Turnovers",
                "B": "Blocks",
                "STL": "Steals",
                "FTA": "Free Throws Attempted",
                "FTM": "Free Throws Made",
                "OREB": "OREB",
                "DREB": "DREB",
                "PF": "PF",
                "FS": "FantasyScore_PP"
            }

            stat = col_map.get(prop_type)
            logs = last10_df[last10_df["Player"].str.lower() == str(player).lower()]
            if logs.empty:
                return []
            logs = logs.sort_values(by="Date", ascending=False).head(10)

            try:
                logs["Opponent"] = logs.apply(lambda r: f"@{r['Opponent']}" if r.get("Home/Away", "home") == "away" else r['Opponent'], axis=1)
                if isinstance(stat, list):
                    logs["Total"] = logs[stat].sum(axis=1).round(2)
                    result = logs[["Date", "Opponent", "Total"]].rename(columns={"Total": "Value"})
                elif stat in logs:
                    result = logs[["Date", "Opponent", stat]].rename(columns={stat: "Value"}).round(2)
                else:
                    print(f"⚠️ Stat column '{stat}' not found for {player} — {prop_type}")
                    return []
                print(f"📊 Last10 Logs for {player} [{prop_type}]\n", result.head(3))
                return result.to_dict(orient="records")
            except Exception as err:
                print(f"❌ Error extracting logs for {player} — {prop_type}: {err}")
                return []

        filtered["Last10Stats"] = filtered.apply(extract_last10, axis=1)

    filtered = filtered.replace({np.nan: None})
    return jsonify(filtered.to_dict(orient="records"))

@app.route("/mlb-props")
def get_mlb_props():
    tag = request.args.get("tag")
    filtered = mlb_df.copy()

    if tag:
        tag = tag.strip().upper()
        filtered = filtered[filtered["Tag"] == tag]

    filtered = filtered.replace({np.nan: None})
    return jsonify(filtered.to_dict(orient="records"))

@app.route("/generate-lineups", methods=["POST"])
def generate_lineups_api():
    try:
        config = request.get_json()
        filtered_df = df.copy()

        home_away = config.get("homeAway", "")
        filter_tags = config.get("filterTags", [])
        filter_games = config.get("filterGames", [])

        if home_away.lower() in ["home", "away"]:
            filtered_df = filtered_df[filtered_df["Home/Away"] == home_away.lower()]

        if filter_tags:
            filtered_df = filtered_df[filtered_df["Tag"].isin(filter_tags)]

        if filter_games:
            filtered_df = filtered_df[filtered_df["Game"].isin(filter_games)]

        lineups = generate_lineups_from_config(config, filtered_df)
        return jsonify(lineups)

    except Exception as e:
        print(f"❌ Error generating lineups:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5050)
