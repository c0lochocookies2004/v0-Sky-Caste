# train.py
import os
from pathlib import Path
import joblib
import json
import pandas as pd
import numpy as np
from sklearn.metrics import roc_auc_score, brier_score_loss
import lightgbm as lgb
from data_fetch import download_power_point
from features import build_features

MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

# Config
LAT, LON = 20.9674, -89.5926
START = "2022-01-01"
END = pd.Timestamp.today().strftime("%Y-%m-%d")
LABELS = ['very_hot','very_cold','very_windy','very_wet','very_uncomfortable']

def main():
    print("Downloading POWER data...")
    df_raw = download_power_point(LAT, LON, START, END)
    print("Building features...")
    df = build_features(df_raw)
    features = [c for c in df.columns if c not in ['date'] + LABELS]
    X = df[features]
    y = df[LABELS]
    # time-ordered train/test split (80/20)
    split = int(0.8 * len(df))
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]
    # Train per-label LightGBM
    lgb_models = {}
    metrics = {}
    for lbl in LABELS:
        print(f"Training LightGBM for {lbl} ...")
        dtrain = lgb.Dataset(X_train, label=y_train[lbl])
        params = {
            "objective": "binary",
            "metric": "binary_logloss",
            "verbosity": -1,
            "num_leaves": 64,
            "learning_rate": 0.05,
            "min_data_in_leaf": 20
        }
        m = lgb.train(params, dtrain, num_boost_round=500)
        lgb_models[lbl] = m
        # evaluate
        p = m.predict(X_test)
        auc = float(roc_auc_score(y_test[lbl], p)) if len(np.unique(y_test[lbl]))>1 else None
        brier = float(brier_score_loss(y_test[lbl], p))
        metrics[lbl] = {"auc": auc, "brier": brier}
        print(f"{lbl} - AUC: {auc}, Brier: {brier}")
    # save models and metadata
    joblib.dump({"models": lgb_models, "features": features, "labels": LABELS}, MODEL_DIR / "lgb_bundle.joblib")
    (MODEL_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print("Saved models to", MODEL_DIR)

if __name__ == "__main__":
    main()
