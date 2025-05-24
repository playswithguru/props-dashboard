from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import openpyxl
import numpy as np
import json

app = Flask(__name__)
##CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["https://playswithguru.com", "http://localhost:3000"]}})






# ✅ Load the Excel file globally
try:
    df = pd.read_excel("PropAnalysis_Categorized_CLEAN.xlsx", sheet_name="Prop_Probabilities", engine="openpyxl")
    print("✅ Excel data loaded successfully.")
except Exception as e:
    print("❌ Failed to load Excel:", e)
    df = None

# ✅ Safe JSON conversion for NaNs
def safe_json(df):
    return json.loads(df.replace({np.nan: None}).to_json(orient="records"))
    
@app.route("/unders-confidence")
def unders_confidence():
    unders = df[df["Tag"] == "FADE/UNDER"]
    print("UNDERS Confidence Range:", unders["Confidence"].min(), "-", unders["Confidence"].max())
    return jsonify({
        "min": unders["Confidence"].min(),
        "max": unders["Confidence"].max(),
        "avg": unders["Confidence"].mean()
    })


@app.route("/props")
def get_props():
    tag = request.args.get("tag")

    if df is None:
        return jsonify([])

    # Normalize Tag column (and ignore rows with NaN)
    df["Tag"] = df["Tag"].astype(str).str.strip().str.upper()

    if tag:
        tag = tag.strip().upper()
        filtered = df[df["Tag"] == tag]
    else:
        filtered = df.copy()

    print("🪵 Final count after filters:", len(filtered))
    if not filtered.empty:
        print("📌 Example row:", filtered.iloc[0].to_dict())

    # ✅ This is the only fix needed
    filtered = filtered.replace({np.nan: None})  # ✅ NaNs to None
    return jsonify(filtered.to_dict(orient="records"))

from lineup_generator import generate_lineups_from_config
@app.route("/generate-lineups", methods=["POST"])
def generate_lineups_api():
    try:
        config = request.get_json()
        home_away = config.get("homeAway")
        filter_tags = config.get("filterTags", [])
        filter_games = config.get("filterGames", [])

        df_filtered = df.copy()

        # 1. Apply Home/Away Filter
        if home_away == "Home":
            df_filtered = df_filtered[df_filtered["Home/Away"].str.lower() == "home"]
        elif home_away == "Away":
            df_filtered = df_filtered[df_filtered["Home/Away"].str.lower() == "away"]

        # 2. Apply Tag Filter
        if filter_tags:
            df_filtered = df_filtered[df_filtered["Tag"].isin(filter_tags)]

        # 3. Apply Game Filter
        if filter_games:
            # Create a matchup string in the same way it's generated in frontend
            df_filtered["Game"] = df_filtered.apply(
                lambda row: f"{min(row['Team'], row['Opponent'])} vs {max(row['Team'], row['Opponent'])}", axis=1
            )
            df_filtered = df_filtered[df_filtered["Game"].isin(filter_games)]

        # ✅ Now generate lineups using filtered data
        lineups = generate_lineups_from_config(config, df_filtered)

        cleaned_lineups = []
        for lineup in lineups:
            lineup_cleaned = lineup.where(pd.notna(lineup), None)
            cleaned_lineups.append(lineup_cleaned.to_dict(orient="records"))

        return jsonify(cleaned_lineups)
    except Exception as e:
        print(f"❌ Error generating lineups:", e)
        return jsonify({"error": str(e)}), 500

