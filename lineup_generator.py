import numpy as np
import pandas as pd
import random
from itertools import combinations

# =========================
# 🎯 CORE LINEUP GENERATOR
# =========================
def generate_lineups(
    df,
    lineup_size=6,
    mix_type="3_OVER_3_UNDER",
    allowed_tags=None,
    filter_games=None,
    max_lineups=10,
    seed=None
):
    if isinstance(df, list):
        print("⚠️ Received a list instead of DataFrame, converting...")
        try:
            df = pd.DataFrame(df)
            print("✅ Converted to DataFrame — columns:", df.columns.tolist())
        except Exception as e:
            print("❌ Failed to convert list to DataFrame:", e)
            return []

    if seed is not None:
        random.seed(seed)

    print(f"🎯 Generating lineups — Mix: {mix_type}, Size: {lineup_size}, Max: {max_lineups}")

    if allowed_tags is None:
        allowed_tags = ["MEGA SMASH", "SMASH", "GOOD", "LEAN", "FADE/UNDER"]

    df_filtered = df[df["Tag"].isin(allowed_tags)].copy()

    # Clean player names and games
    df_filtered["Player"] = df_filtered["Player"].astype(str).str.strip()
    df_filtered["Team"] = df_filtered["Team"].astype(str).str.strip()
    df_filtered["Opponent"] = df_filtered["Opponent"].astype(str).str.strip()
    df_filtered["Game"] = df_filtered["Team"] + " vs " + df_filtered["Opponent"]

    if filter_games:
        df_filtered = df_filtered[df_filtered["Game"].isin(filter_games)]

    # Normalize tags
    df_filtered["Simulated Tag"] = df_filtered["Simulated Tag"].astype(str).str.upper().str.strip()

    over_tags = ["MEGA SMASH", "SMASH", "GOOD"]
    under_tags = ["FADE/UNDER"]
    if "LEAN" in allowed_tags:
        under_tags.append("LEAN")

    mix_options = {
        "6_OVER": (6, 0), "5_OVER_1_UNDER": (5, 1), "4_OVER_2_UNDER": (4, 2),
        "3_OVER_3_UNDER": (3, 3), "2_OVER_4_UNDER": (2, 4), "1_OVER_5_UNDER": (1, 5), "6_UNDER": (0, 6)
    }
    if mix_type not in mix_options:
        raise ValueError("Invalid mix_type. Valid types: " + ", ".join(mix_options.keys()))

    num_over, num_under = mix_options[mix_type]
    overs = df_filtered[df_filtered["Tag"].isin(over_tags)]
    unders = df_filtered[df_filtered["Tag"].isin(under_tags)]

    print(f"📦 Pool sizes — Over: {len(overs)}, Under: {len(unders)}")

    lineups = []
    attempts = 0
    seen = set()

    while len(lineups) < max_lineups and attempts < 500:
        over_sample = overs.sample(n=min(num_over, len(overs)), replace=False) if num_over > 0 else pd.DataFrame()
        under_sample = unders.sample(n=min(num_under, len(unders)), replace=False) if num_under > 0 else pd.DataFrame()
        lineup_df = pd.concat([over_sample, under_sample])

        if len(lineup_df) != lineup_size:
            attempts += 1
            continue

        if lineup_df["Player"].duplicated().any():
            attempts += 1
            continue

        team_counts = lineup_df["Team"].value_counts()
        if any(team_counts >= lineup_size):
            attempts += 1
            continue

        key = tuple(sorted(lineup_df["Player"]))
        if key in seen:
            attempts += 1
            continue

        seen.add(key)
        lineups.append(lineup_df)
        attempts += 1

    print(f"✅ {len(lineups)} lineups generated (from {attempts} attempts)")
    return lineups

# =========================
# 🔧 FROM CONFIG ENTRYPOINT
# =========================
def generate_lineups_from_config(config, df):
    print("📦 Config Received:")
    home_away_filter = config.get("homeAway", "")
    filter_games = config.get("filterGames", [])
    filter_tags = config.get("filterTags", [])
    mix_type = config.get("mixType", "3_OVER_3_UNDER")
    max_lineups = config.get("maxLineups", 10)

    print("  ▶️ homeAway:", home_away_filter)
    print("  ▶️ filterGames:", filter_games)
    print("  ▶️ filterTags:", filter_tags)

    if df is None:
        print("❌ DataFrame 'df' is None. Cannot generate lineups.")
        return []

    if not isinstance(filter_games, list):
        filter_games = []
    if not isinstance(filter_tags, list):
        filter_tags = []

    if home_away_filter in ["home", "away"]:
        df = df[df["Home/Away"].str.strip().str.lower() == home_away_filter]

    if len(filter_games) > 0:
        df = df[df["Game"].isin(filter_games)]

    if len(filter_tags) > 0:
        df = df[df["Tag"].isin(filter_tags)]

    try:
        print("🧪 Sample tags:", df["Tag"].dropna().unique()[:5])
        print("🧪 Sample teams:", df["Team"].dropna().unique()[:5])
        print("🧪 Sample opponents:", df["Opponent"].dropna().unique()[:5])
        print("🧪 Tag counts:", df["Tag"].value_counts())

        lineups = generate_lineups(
            df,
            lineup_size=6,
            mix_type=mix_type,
            max_lineups=max_lineups,
            allowed_tags=["MEGA SMASH", "SMASH", "GOOD", "LEAN", "FADE/UNDER"]
        )

        if lineups is None:
            print("⚠️ Warning: generate_lineups returned None")
            return []

        sanitized = []
        for lineup in lineups:
            if isinstance(lineup, pd.DataFrame):
                df_clean = lineup.replace({np.nan: None, np.inf: None, -np.inf: None})
                sanitized.append(df_clean.to_dict(orient="records"))
            else:
                print("⚠️ Warning: Unexpected lineup type:", type(lineup))

        return sanitized

    except Exception as e:
        print("❌ Failed inside generate_lineups_from_config:", e)
        return []

# =========================
# 💾 SAVE TO EXCEL (for manual testing only)
# =========================
def write_lineups_to_excel(lineups_dict, writer):
    for mix_name, lineup_list in lineups_dict.items():
        rows = []
        for idx, df in enumerate(lineup_list, start=1):
            for _, row in df.iterrows():
                rows.append({"Lineup": idx, **row})
        out_df = pd.DataFrame(rows)
        out_df.to_excel(writer, sheet_name=mix_name[:31], index=False)
        print(f"💾 Saved {len(lineup_list)} lineups to sheet: {mix_name}")
