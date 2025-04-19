from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import openpyxl
import numpy as np
import json

app = Flask(__name__)
CORS(app)

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
        #config = request.get_json()
        #print("📨 Received config:", config)  # <-- DEBUG LOG
        
        #lineups = generate_lineups_from_config(config, df)
        #print("✅ Lineups generated:", len(lineups))  # <-- DEBUG LOG
        
        config = request.get_json()
        home_away = config.get("homeAway")

        # Apply Home/Away filter if set
        if home_away == "Home":
            df_filtered = df[df["Home/Away"] == "Home"]
        elif home_away == "Away":
            df_filtered = df[df["Home/Away"] == "Away"]
        else:
            df_filtered = df.copy()

        lineups = generate_lineups_from_config(config, df_filtered)

        
        cleaned_lineups = []
        for lineup in lineups:
            # Replace NaNs with None for JSON safety
            lineup_cleaned = lineup.where(pd.notna(lineup), None)
            cleaned_lineups.append(lineup_cleaned.to_dict(orient="records"))
            
        return jsonify(cleaned_lineups)
    except Exception as e:
        print(f"❌ Error generating lineups:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5050, debug=True)
