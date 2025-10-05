# data_fetch.py
import requests
import pandas as pd
from datetime import datetime, date
from typing import Tuple

POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"

def download_power_point(lat: float, lon: float, start: str, end: str, parameters: str="T2M,PRECTOT,WS2M,RH2M"):
    """
    Download POWER daily point data from start to end (YYYY-MM-DD).
    Returns pandas DataFrame with columns: date, t2m (C), prectot (mm/day), ws (m/s), rh (%)
    """
    params = {
        "start": start,
        "end": end,
        "lat": lat,
        "lon": lon,
        "parameters": parameters,
        "community": "ag",
        "format": "JSON"
    }
    r = requests.get(POWER_BASE, params=params, timeout=60)
    r.raise_for_status()
    j = r.json()
    params_dict = j["properties"]["parameter"]
    df = pd.DataFrame(params_dict).T.reset_index().rename(columns={"index":"date"})
    df['date'] = pd.to_datetime(df['date'])
    # Standardize column names
    rename = {}
    for c in df.columns:
        if c == 'date':
            continue
        rename[c] = c.lower()
    df = df.rename(columns=rename)
    # Typical POWER keys: t2m, prectot, ws2m, rh2m
    # normalize names
    if 't2m' in df.columns:
        df = df.rename(columns={'t2m':'t2m_c'})
    if 'prectot' in df.columns:
        df = df.rename(columns={'prectot':'precip'})
    if 'ws2m' in df.columns:
        df = df.rename(columns={'ws2m':'ws'})
    if 'rh2m' in df.columns:
        df = df.rename(columns={'rh2m':'rh'})
    return df[['date'] + [c for c in df.columns if c!='date']]

if __name__ == "__main__":
    # quick test download last 365 days for Mérida
    lat, lon = 20.9674, -89.5926
    today = date.today()
    start = (today.replace(year=today.year-1)).isoformat()
    end = today.isoformat()
    df = download_power_point(lat, lon, start, end)
    print(df.head())
