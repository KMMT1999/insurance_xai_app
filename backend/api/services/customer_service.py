from pathlib import Path
import pandas as pd


BACKEND_DIR = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = BACKEND_DIR / "ml_artifacts"


def read_csv_file(filename):
    file_path = ARTIFACT_DIR / filename

    if not file_path.exists():
        raise FileNotFoundError(f"Missing artifact file: {file_path}")

    return pd.read_csv(file_path)


def get_dashboard_summary():
    customers = read_csv_file("gmm_xai_customer_results.csv")
    probability_summary = read_csv_file("probability_summary.csv")
    cluster_sizes = read_csv_file("cluster_sizes.csv")
    surrogate_metrics = read_csv_file("surrogate_metrics.csv")

    prob = probability_summary.iloc[0]

    accuracy_row = surrogate_metrics[surrogate_metrics["Metric"] == "Accuracy"]
    f1_row = surrogate_metrics[surrogate_metrics["Metric"] == "Macro F1-score"]

    accuracy = float(accuracy_row["Value"].iloc[0]) if not accuracy_row.empty else None
    macro_f1 = float(f1_row["Value"].iloc[0]) if not f1_row.empty else None

    return {
        "total_customers": int(len(customers)),
        "model": "GMM K=3",
        "covariance_type": "tied",
        "mean_confidence": float(prob["Mean_Max_Probability"]),
        "median_confidence": float(prob["Median_Max_Probability"]),
        "low_confidence_customers": int(prob["Customers_Below_80pct"]),
        "low_confidence_percent": float(prob["Percent_Below_80pct"]),
        "surrogate_accuracy": accuracy,
        "surrogate_macro_f1": macro_f1,
        "cluster_sizes": cluster_sizes.to_dict(orient="records"),
    }


def get_customers(search="", cluster="", page=1, page_size=10):
    customers = read_csv_file("gmm_xai_customer_results.csv")

    if search:
        customers = customers[
            customers["Customer_ID"].astype(str).str.contains(str(search), case=False)
        ]

    if cluster != "":
        customers = customers[
            customers["GMM_Cluster"].astype(int) == int(cluster)
        ]

    total_records = len(customers)

    page = max(int(page), 1)
    page_size = max(int(page_size), 1)

    start = (page - 1) * page_size
    end = start + page_size

    page_data = customers.iloc[start:end]

    total_pages = (total_records + page_size - 1) // page_size

    return {
        "results": page_data.to_dict(orient="records"),
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_records": int(total_records),
            "total_pages": int(total_pages),
            "has_previous": page > 1,
            "has_next": page < total_pages,
        },
    }


def get_customer_by_id(customer_id):
    customers = read_csv_file("gmm_xai_customer_results.csv")

    matched = customers[
        customers["Customer_ID"].astype(str) == str(customer_id)
    ]

    if matched.empty:
        return None

    return matched.iloc[0].to_dict()


def get_uncertain_customers(search="", cluster="", page=1, page_size=10):
    customers = read_csv_file("gmm_xai_customer_results.csv")

    uncertain = customers[
        customers["Max_Probability"] < 0.80
    ].sort_values("Max_Probability")

    if search:
        uncertain = uncertain[
            uncertain["Customer_ID"].astype(str).str.contains(str(search), case=False)
        ]

    if cluster != "":
        uncertain = uncertain[
            uncertain["GMM_Cluster"].astype(int) == int(cluster)
        ]

    total_records = len(uncertain)

    page = max(int(page), 1)
    page_size = max(int(page_size), 1)

    start = (page - 1) * page_size
    end = start + page_size

    page_data = uncertain.iloc[start:end]

    total_pages = (total_records + page_size - 1) // page_size

    return {
        "results": page_data.to_dict(orient="records"),
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_records": int(total_records),
            "total_pages": int(total_pages),
            "has_previous": page > 1,
            "has_next": page < total_pages,
        },
    }