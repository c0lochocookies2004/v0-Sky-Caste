# features.py
import numpy as np
import pandas as pd

def compute_heat_index(T, RH):
    e = 6.105 * np.exp(17.27 * T / (237.7 + T))
    HI = T + 0.33 * (RH/100) * e
    return HI

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values('date').reset_index(drop=True).copy()
    df = df.set_index('date')
    # lags
    df['t_lag1'] = df['t2m_c'].shift(1)
    df['t_lag2'] = df['t2m_c'].shift(2)
    df['precip_3d'] = df['precip'].rolling(window=3, min_periods=1).sum()
    df['precip_7d'] = df['precip'].rolling(window=7, min_periods=1).sum()
    df['ws_lag1'] = df['ws'].shift(1)
    # cyclical time
    doy = df.index.dayofyear
    df['sin_doy'] = np.sin(2*np.pi*doy/365.25)
    df['cos_doy'] = np.cos(2*np.pi*doy/365.25)
    # heat index
    df['heat_index'] = compute_heat_index(df['t2m_c'], df['rh'])
    # labels
    df['very_hot'] = (df['t2m_c'] > 35).astype(int)
    df['very_cold'] = (df['t2m_c'] < 0).astype(int)
    df['very_windy'] = (df['ws'] > 10).astype(int)
    df['very_wet'] = (df['precip_3d'] > 5).astype(int)
    df['very_uncomfortable'] = (((df['t2m_c'] > 30) & (df['rh'] > 80)) | (df['heat_index'] > 40)).astype(int)
    df = df.dropna().reset_index()
    return df
