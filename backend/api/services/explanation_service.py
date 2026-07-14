from .customer_service import read_csv_file, ARTIFACT_DIR


def get_global_shap():
    shap_df = read_csv_file("shap_global_importance.csv")
    return shap_df.to_dict(orient="records")


def get_cluster_shap(cluster_id):
    shap_df = read_csv_file("shap_cluster_importance.csv")

    cluster_df = shap_df[
        shap_df["Cluster"].astype(int) == int(cluster_id)
    ]

    return cluster_df.to_dict(orient="records")


def get_surrogate_performance():
    metrics = read_csv_file("surrogate_metrics.csv")
    confusion = read_csv_file("confusion_matrix.csv")
    report = read_csv_file("classification_report.csv")

    return {
        "metrics": metrics.to_dict(orient="records"),
        "confusion_matrix": confusion.to_dict(orient="records"),
        "classification_report": report.to_dict(orient="records"),
    }


def get_decision_tree_rules():
    rules_path = ARTIFACT_DIR / "decision_tree_rules.txt"

    if not rules_path.exists():
        return ""

    return rules_path.read_text()