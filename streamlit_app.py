# streamlit_app.py
import streamlit as st
import requests
from datetime import date

st.set_page_config(page_title="Merida Weather MVP", layout="centered")

st.title("Merida Weather - MVP (NASA POWER + LightGBM)")
st.write("Predicciones para Mérida, Yucatán. Fuente: NASA POWER. Modelo: LightGBM.")

col1, col2 = st.columns(2)
with col1:
    sel_date = st.date_input("Fecha (predicción)", value=date.today())
with col2:
    st.write("Coordenadas (Mérida)")
    lat = st.number_input("Lat", value=20.9674, format="%.6f")
    lon = st.number_input("Lon", value=-89.5926, format="%.6f")

if st.button("Obtener predicción"):
    try:
        resp = requests.get("http://localhost:8000/predict", params={"date": sel_date.isoformat(), "lat": lat, "lon": lon}, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        preds = data["predictions"]
        st.subheader("Probabilidades")
        for k,v in preds.items():
            st.write(f"**{k}**: {v*100:.1f}%")
            st.progress(min(max(v,0.0),1.0))
    except Exception as e:
        st.error(f"Error: {e}")
