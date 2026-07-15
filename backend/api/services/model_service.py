import joblib
import numpy as np
import pandas as pd

from .customer_service import ARTIFACT_DIR
from .explanation_service import get_cluster_shap
from datetime import date


_model_bundle = None
TRAINING_REFERENCE_DATE = date(2023, 12, 28)


def calculate_date_features(input_data, data, feature_cols):
    data = data.copy()

    try:
        purchase_year = int(float(input_data.get("Purchase Year", data.get("Purchase Year", 2023))))
        purchase_month = int(float(input_data.get("Purchase Month", data.get("Purchase Month", 1))))
        purchase_day = int(float(input_data.get("Purchase Day", data.get("Purchase Day", 1))))

        purchase_date = date(purchase_year, purchase_month, purchase_day)

        recency_days = (TRAINING_REFERENCE_DATE - purchase_date).days

        # Prevent negative value if user enters date newer than training data
        recency_days = max(recency_days, 0)

        policy_age = recency_days / 365.25

        if "Purchase Year" in feature_cols:
            data["Purchase Year"] = float(purchase_year)

        if "Purchase Month" in feature_cols:
            data["Purchase Month"] = float(purchase_month)

        if "Purchase Day" in feature_cols:
            data["Purchase Day"] = float(purchase_day)

        if "Recency Days" in feature_cols:
            data["Recency Days"] = float(recency_days)

        if "Policy Age" in feature_cols:
            data["Policy Age"] = float(policy_age)

    except Exception:
        pass

    return data

def load_model_bundle():
    global _model_bundle

    if _model_bundle is None:
        model_path = ARTIFACT_DIR / "model_bundle.joblib"

        if not model_path.exists():
            raise FileNotFoundError(f"Missing model file: {model_path}")

        _model_bundle = joblib.load(model_path)

    return _model_bundle


def calculate_ratio_features(data, feature_cols):
    data = data.copy()

    income = max(float(data.get("Income Level", 1)), 1)
    coverage = max(float(data.get("Coverage Amount", 1)), 1)
    premium = float(data.get("Premium Amount", 0))

    if "Premium_to_Income" in feature_cols:
        data["Premium_to_Income"] = premium / income

    if "Coverage_to_Income" in feature_cols:
        data["Coverage_to_Income"] = coverage / income

    if "Premium_to_Coverage" in feature_cols:
        data["Premium_to_Coverage"] = premium / coverage

    return data


def predict_customer(input_data):
    bundle = load_model_bundle()

    scaler = bundle["scaler"]
    gmm = bundle["gmm"]
    feature_cols = bundle["feature_cols"]
    medians = bundle["feature_medians"]
    cluster_names = bundle["cluster_names"]
    recommendations = bundle["cluster_recommendations"]
    confidence_threshold = bundle["confidence_threshold"]

    data = {}

    for feature in feature_cols:
        data[feature] = float(input_data.get(feature, medians.get(feature, 0)))


    data = calculate_date_features(input_data, data, feature_cols)
    data = calculate_ratio_features(data, feature_cols)

    input_df = pd.DataFrame([data], columns=feature_cols)

    probabilities = gmm.predict_proba(
        scaler.transform(input_df)
    )[0]

    assigned_cluster = int(np.argmax(probabilities))
    confidence = float(np.max(probabilities))

    if confidence >= confidence_threshold:
        confidence_level = "High confidence"
    else:
        confidence_level = "Low confidence / uncertain"

    cluster_shap = get_cluster_shap(assigned_cluster)

    top_reasons = cluster_shap[:5]

    return {
        "assigned_cluster": assigned_cluster,
        "cluster_name": cluster_names.get(assigned_cluster),
        "confidence": confidence,
        "confidence_level": confidence_level,
        "probabilities": {
            f"cluster_{i}": float(probabilities[i])
            for i in range(len(probabilities))
        },
        "recommendation": recommendations.get(assigned_cluster),
        "top_reasons": top_reasons,
        "input_features": data,
    }