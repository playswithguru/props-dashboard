from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import openpyxl
import numpy as np
import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # Allow requests from your frontend

# Define a dictionary to map sport names to sheet names
sport_sheets = {
    "NBA": "NBA",  # Match the sheet name "NBA" here
    "MLB": "MLB",
    "NFL": "NFL",
    # Add other sports here as needed
}

# Load the Excel file and process it dynamically for the specific sport
def load_sport_data(sport):
    try:
        if sport in sport_sheets:
            sheet_name = sport_sheets[sport]
            df = pd.read_excel("PropAnalysis_Categorized_CLEAN.xlsx", sheet_name=sheet_name, engine="openpyxl")
            print(f"✅ Loaded {sport} data successfully.")
            return df
        else:
            print(f"❌ Invalid sport provided: {sport}")
            return None
    except Exception as e:
        print(f"❌ Failed to load {sport} data:", e)
        return None

@app.route("/props", methods=["GET"])
def get_props():
    sport = request.args.get("sport")  # Get the sport from the query parameter

    if not sport:
        return jsonify({"error": "Sport parameter is required."}), 400

    # Load sport-specific data
    df = load_sport_data(sport)
    if df is None:
        return jsonify({"error": f"Failed to load data for {sport}"}), 500

    # Normalize Tag column (and ignore rows with NaN)
    df["Tag"] = df["Tag"].astype(str).str.strip().str.upper()

    # Filter data based on the tag if provided
    tag = request.args.get("tag")
    if tag:
        tag = tag.strip().upper()
        filtered = df[df["Tag"] == tag]
    else:
        filtered = df.copy()

    # Ensure the filtered data is being processed correctly
    print(f"Filtered data (first few rows): {filtered.head()}")

    # Replace NaNs with None for JSON safety
    filtered = filtered.replace({np.nan: None})  # Replace NaNs with None
    return jsonify(filtered.to_dict(orient="records"))

from lineup_generator import generate_lineups_from_config

@app.route("/generate-lineups", methods=["POST"])
def generate_lineups_api():
    try:
        config = request.get_json()
        sport = config.get("sport")  # Ensure the sport is passed along with the config

        if not sport:
            return jsonify({"error": "Sport parameter is missing in the request."}), 400

        # Load sport-specific data for lineups generation
        df = load_sport_data(sport)
        if df is None:
            return jsonify({"error": f"Failed to load {sport} data for lineups generation"}), 500

        # Generate lineups based on the provided configuration
        lineups = generate_lineups_from_config(config, df)
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
