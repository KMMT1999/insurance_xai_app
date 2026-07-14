import joblib
import numpy as np
import pandas as pd

from .customer_service import ARTIFACT_DIR
from .explanation_service import get_cluster_shap


_model_bundle = None


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