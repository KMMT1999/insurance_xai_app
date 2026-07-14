import os
import warnings
from pathlib import Path

os.environ.setdefault("LOKY_MAX_CPU_COUNT", "4")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

warnings.filterwarnings("ignore")

import joblib
import numpy as np
import pandas as pd

from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    confusion_matrix,
    classification_report,
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score,
)

try:
    import shap
    SHAP_AVAILABLE = True
except Exception:
    SHAP_AVAILABLE = False


# =========================
# Paths
# =========================
BACKEND_DIR = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = BACKEND_DIR / "ml_artifacts"

DATA_FILE = Path(
    "/Users/khaingmyomyattun/Desktop/Masterthesis/output_simple/"
    "feature_engineered_dataset.csv"
)

ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


# =========================
# Settings
# =========================
RANDOM_STATE = 42
N_CLUSTERS = 3
CONFIDENCE_THRESHOLD = 0.80

CLUSTER_NAMES = {
    0: "Recent high-income customers",
    1: "Affordability-sensitive customers",
    2: "Older or inactive policy holders",
}

CLUSTER_RECOMMENDATIONS = {
    0: "Offer loyalty rewards, cross-selling, and premium product upgrades.",
    1: "Offer flexible payment plans, affordable coverage options, or premium review.",
    2: "Use retention campaigns, renewal reminders, and re-engagement offers.",
}

ID_COLUMNS = [
    "Customer ID",
    "CustomerID",
    "customer_id",
    "Customer_Id",
    "Customer Id",
]

DROP_COLUMNS = ID_COLUMNS + [
    "Segmentation Group",
    "Age_Group",
    "Income_Band",
    "Premium_Band",
    "Coverage_Band",
]


# =========================
# Helper Functions
# =========================
def find_id_column(df):
    for col in ID_COLUMNS:
        if col in df.columns:
            return col
    return None


def normalize_shap_values(raw_values, n_classes):
    values = np.asarray(raw_values)

    if isinstance(raw_values, list):
        return np.asarray(raw_values)

    if values.ndim == 2:
        return values[np.newaxis, :, :]

    if values.ndim == 3 and values.shape[0] == n_classes:
        return values

    if values.ndim == 3 and values.shape[2] == n_classes:
        return np.transpose(values, (2, 0, 1))

    raise ValueError(f"Unexpected SHAP shape: {values.shape}")


def prepare_features(df):
    feature_df = df.drop(
        columns=[col for col in DROP_COLUMNS if col in df.columns],
        errors="ignore",
    )

    numeric_cols = feature_df.select_dtypes(include=np.number).columns.tolist()

    X = feature_df[numeric_cols].replace([np.inf, -np.inf], np.nan)
    medians = X.median(numeric_only=True)
    X = X.fillna(medians)

    return X, numeric_cols, medians


# =========================
# Main Training
# =========================
def main():
    print("Loading dataset...")
    df = pd.read_csv(DATA_FILE)

    id_col = find_id_column(df)
    X, feature_cols, medians = prepare_features(df)

    print("Dataset rows:", len(df))
    print("Features used:")
    for col in feature_cols:
        print("-", col)

    # =========================
    # Train GMM
    # =========================
    print("\nTraining GMM K=3 tied covariance...")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    gmm = GaussianMixture(
        n_components=N_CLUSTERS,
        covariance_type="tied",
        random_state=RANDOM_STATE,
        n_init=10,
        max_iter=300,
    )

    cluster_labels = gmm.fit_predict(X_scaled)
    probabilities = gmm.predict_proba(X_scaled)

    result_df = pd.DataFrame()

    if id_col is not None:
        result_df["Customer_ID"] = df[id_col].values
    else:
        result_df["Customer_ID"] = np.arange(len(df))

    result_df["GMM_Cluster"] = cluster_labels
    result_df["Cluster_Name"] = result_df["GMM_Cluster"].map(CLUSTER_NAMES)

    for cluster_id in range(N_CLUSTERS):
        result_df[f"GMM_Cluster_{cluster_id}_Probability"] = probabilities[:, cluster_id]

    probability_cols = [
        f"GMM_Cluster_{cluster_id}_Probability"
        for cluster_id in range(N_CLUSTERS)
    ]

    result_df["Max_Probability"] = result_df[probability_cols].max(axis=1)

    result_df["Confidence_Level"] = np.where(
        result_df["Max_Probability"] >= CONFIDENCE_THRESHOLD,
        "High confidence",
        "Low confidence / uncertain",
    )

    for col in feature_cols:
        result_df[col] = X[col].values

    result_df.to_csv(
        ARTIFACT_DIR / "gmm_xai_customer_results.csv",
        index=False,
    )

    # =========================
    # Cluster Summary
    # =========================
    cluster_sizes = (
        result_df["GMM_Cluster"]
        .value_counts()
        .sort_index()
        .rename_axis("Cluster")
        .reset_index(name="Count")
    )

    cluster_sizes["Percentage"] = cluster_sizes["Count"] / len(result_df) * 100
    cluster_sizes["Cluster_Name"] = cluster_sizes["Cluster"].map(CLUSTER_NAMES)

    cluster_sizes.to_csv(
        ARTIFACT_DIR / "cluster_sizes.csv",
        index=False,
    )

    cluster_summary = (
        result_df
        .groupby("GMM_Cluster")[feature_cols]
        .mean()
        .reset_index()
    )

    cluster_summary["Cluster_Name"] = cluster_summary["GMM_Cluster"].map(CLUSTER_NAMES)

    cluster_summary.to_csv(
        ARTIFACT_DIR / "cluster_summary.csv",
        index=False,
    )

    probability_summary = pd.DataFrame(
        [
            {
                "Mean_Max_Probability": result_df["Max_Probability"].mean(),
                "Median_Max_Probability": result_df["Max_Probability"].median(),
                "Min_Max_Probability": result_df["Max_Probability"].min(),
                "Customers_Below_80pct": int(
                    (result_df["Max_Probability"] < CONFIDENCE_THRESHOLD).sum()
                ),
                "Percent_Below_80pct": float(
                    (result_df["Max_Probability"] < CONFIDENCE_THRESHOLD).mean() * 100
                ),
            }
        ]
    )

    probability_summary.to_csv(
        ARTIFACT_DIR / "probability_summary.csv",
        index=False,
    )

    gmm_metrics = pd.DataFrame(
        [
            {
                "Model": "GMM",
                "K": N_CLUSTERS,
                "Covariance_Type": "tied",
                "Silhouette": silhouette_score(
                    X_scaled,
                    cluster_labels,
                    sample_size=min(5000, len(X_scaled)),
                    random_state=RANDOM_STATE,
                ),
                "Davies_Bouldin": davies_bouldin_score(X_scaled, cluster_labels),
                "Calinski_Harabasz": calinski_harabasz_score(X_scaled, cluster_labels),
                "BIC": gmm.bic(X_scaled),
                "AIC": gmm.aic(X_scaled),
            }
        ]
    )

    gmm_metrics.to_csv(
        ARTIFACT_DIR / "gmm_model_metrics.csv",
        index=False,
    )

    # =========================
    # Surrogate Random Forest
    # =========================
    print("\nTraining surrogate Random Forest...")

    y = cluster_labels

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    surrogate_model = RandomForestClassifier(
        n_estimators=300,
        random_state=RANDOM_STATE,
        class_weight="balanced",
        n_jobs=1,
    )

    surrogate_model.fit(X_train, y_train)
    y_pred = surrogate_model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")

    surrogate_metrics = pd.DataFrame(
        [
            {"Metric": "Accuracy", "Value": accuracy},
            {"Metric": "Macro F1-score", "Value": macro_f1},
        ]
    )

    surrogate_metrics.to_csv(
        ARTIFACT_DIR / "surrogate_metrics.csv",
        index=False,
    )

    cm = confusion_matrix(y_test, y_pred)

    pd.DataFrame(cm).to_csv(
        ARTIFACT_DIR / "confusion_matrix.csv",
        index=False,
    )

    report = classification_report(y_test, y_pred, output_dict=True)

    pd.DataFrame(report).transpose().to_csv(
        ARTIFACT_DIR / "classification_report.csv",
    )

    feature_importance = pd.DataFrame(
        {
            "Feature": feature_cols,
            "Importance": surrogate_model.feature_importances_,
        }
    ).sort_values("Importance", ascending=False)

    feature_importance.to_csv(
        ARTIFACT_DIR / "surrogate_feature_importance.csv",
        index=False,
    )

    # =========================
    # Decision Tree Rules
    # =========================
    print("\nTraining simple decision tree for rules...")

    decision_tree = DecisionTreeClassifier(
        max_depth=4,
        min_samples_leaf=80,
        random_state=RANDOM_STATE,
        class_weight="balanced",
    )

    decision_tree.fit(X, y)

    rules_text = export_text(
        decision_tree,
        feature_names=feature_cols,
    )

    with open(ARTIFACT_DIR / "decision_tree_rules.txt", "w") as f:
        f.write(rules_text)

    # =========================
    # SHAP Explanation
    # =========================
    print("\nCreating SHAP explanation files...")

    if SHAP_AVAILABLE:
        sample_size = min(1500, len(X_test))
        X_shap = X_test.sample(sample_size, random_state=RANDOM_STATE)

        explainer = shap.TreeExplainer(surrogate_model)
        shap_raw = explainer.shap_values(X_shap)
        shap_values = normalize_shap_values(shap_raw, len(surrogate_model.classes_))

        global_importance = pd.DataFrame(
            {
                "Feature": feature_cols,
                "Mean_Abs_SHAP": np.mean(np.abs(shap_values), axis=(0, 1)),
            }
        ).sort_values("Mean_Abs_SHAP", ascending=False)

        global_importance.to_csv(
            ARTIFACT_DIR / "shap_global_importance.csv",
            index=False,
        )

        cluster_rows = []

        for class_position, cluster_id in enumerate(surrogate_model.classes_):
            class_values = shap_values[class_position]
            class_importance = np.mean(np.abs(class_values), axis=0)

            for feature, value in zip(feature_cols, class_importance):
                cluster_rows.append(
                    {
                        "Cluster": int(cluster_id),
                        "Cluster_Name": CLUSTER_NAMES[int(cluster_id)],
                        "Feature": feature,
                        "Mean_Abs_SHAP": float(value),
                    }
                )

        cluster_shap = pd.DataFrame(cluster_rows).sort_values(
            ["Cluster", "Mean_Abs_SHAP"],
            ascending=[True, False],
        )

        cluster_shap.to_csv(
            ARTIFACT_DIR / "shap_cluster_importance.csv",
            index=False,
        )

    else:
        print("SHAP is not installed. Using feature importance fallback.")

        fallback = feature_importance.rename(
            columns={"Importance": "Mean_Abs_SHAP"}
        )

        fallback.to_csv(
            ARTIFACT_DIR / "shap_global_importance.csv",
            index=False,
        )

        rows = []

        for cluster_id in range(N_CLUSTERS):
            for item in fallback.itertuples(index=False):
                rows.append(
                    {
                        "Cluster": cluster_id,
                        "Cluster_Name": CLUSTER_NAMES[cluster_id],
                        "Feature": item.Feature,
                        "Mean_Abs_SHAP": item.Mean_Abs_SHAP,
                    }
                )

        pd.DataFrame(rows).to_csv(
            ARTIFACT_DIR / "shap_cluster_importance.csv",
            index=False,
        )

    # =========================
    # Save Model Bundle
    # =========================
    print("\nSaving model bundle...")

    model_bundle = {
        "scaler": scaler,
        "gmm": gmm,
        "surrogate_model": surrogate_model,
        "decision_tree": decision_tree,
        "feature_cols": feature_cols,
        "feature_medians": medians.to_dict(),
        "cluster_names": CLUSTER_NAMES,
        "cluster_recommendations": CLUSTER_RECOMMENDATIONS,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }

    joblib.dump(
        model_bundle,
        ARTIFACT_DIR / "model_bundle.joblib",
    )

    print("\nTraining finished successfully.")
    print("Artifacts saved to:", ARTIFACT_DIR)
    print("Surrogate Accuracy:", round(accuracy, 4))
    print("Macro F1-score:", round(macro_f1, 4))


if __name__ == "__main__":
    main()