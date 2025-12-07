"""Mood prediction using simple ML"""
from datetime import datetime, timedelta

import numpy as np
from sklearn.linear_model import LinearRegression


class MoodPredictor:
    async def predict_trend(self, mood_data: list) -> dict:
        """Predict next 7 days mood trend"""
        if len(mood_data) < 7:
            return {"predictions": [], "confidence": "low", "message": "Insufficient data"}

        # Prepare data
        dates = np.array([datetime.fromisoformat(m['date']).timestamp() for m in mood_data]).reshape(-1, 1)
        scores = np.array([m['avg_mood'] for m in mood_data])

        # Train model
        model = LinearRegression()
        model.fit(dates, scores)

        # Predict next 7 days
        future_dates = [datetime.now() + timedelta(days=i) for i in range(1, 8)]
        future_timestamps = np.array([d.timestamp() for d in future_dates]).reshape(-1, 1)
        predictions = model.predict(future_timestamps)

        return {
            "predictions": [
                {"date": str(d.date()), "predicted_mood": max(1, min(10, float(p)))}
                for d, p in zip(future_dates, predictions, strict=False)
            ],
            "confidence": "medium" if len(mood_data) > 14 else "low",
            "r_squared": float(model.score(dates, scores))
        }
