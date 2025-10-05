# api.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timedelta
import joblib
import numpy as np
import pandas as pd
from data_fetch import download_power_point
from features import build_features

app = FastAPI(title="Merida Weather MVP - NASA POWER + LightGBM")


BUNDLE = joblib.load("models/lgb_bundle.joblib")
if isinstance(BUNDLE.get("models"), dict):
    LGB_MODELS = BUNDLE["models"]
else:
    LGB_MODELS = joblib.load("models/lgb_models.joblib")

FEATURES = BUNDLE["features"]
LABELS = BUNDLE["labels"]

DEFAULT_LAT = 20.9674
DEFAULT_LON = -89.5926

class PredictResponse(BaseModel):
    predictions: dict

def create_feature_row_for_date(lat, lon, date_str):
    dt_obj = pd.to_datetime(date_str)
    end = dt_obj.strftime("%Y-%m-%d")
    start = (dt_obj - pd.Timedelta(days=10)).strftime("%Y-%m-%d")
    df_raw = download_power_point(lat, lon, start, end)
    df_features = build_features(df_raw)
    row = df_features[df_features['date'] == dt_obj.normalize()]
    if row.empty:
        row = df_features.iloc[[-1]]
    return row

@app.get("/predict", response_model=PredictResponse)
def predict(date: str = Query(None, description="Date YYYY-MM-DD (optional). If omitted uses last available."),
            lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON):
    try:
        if date is None:
            date_str = pd.Timestamp.today().strftime("%Y-%m-%d")
        else:
            date_str = date
        row = create_feature_row_for_date(lat, lon, date_str)
        X = row[FEATURES].values
        out = {}
        for lbl, model in LGB_MODELS.items():
            p = float(model.predict(X)[0])
            out[lbl] = round(p, 4)
        return {"predictions": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
