from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .services.customer_service import (
    get_dashboard_summary,
    get_customers,
    get_customer_by_id,
    get_uncertain_customers,
)

from .services.explanation_service import (
    get_global_shap,
    get_cluster_shap,
    get_surrogate_performance,
    get_decision_tree_rules,
)

from .services.model_service import predict_customer


@api_view(["GET"])
def health_check(request):
    return Response(
        {
            "status": "ok",
            "message": "Insurance XAI backend is running",
        }
    )


@api_view(["GET"])
def dashboard_summary(request):
    data = get_dashboard_summary()
    return Response(data)


@api_view(["GET"])
def customers_list(request):
    search = request.GET.get("search", "")
    cluster = request.GET.get("cluster", "")
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))

    data = get_customers(
        search=search,
        cluster=cluster,
        page=page,
        page_size=page_size,
    )

    return Response(data)


@api_view(["GET"])
def customer_detail(request, customer_id):
    data = get_customer_by_id(customer_id)

    if data is None:
        return Response(
            {"error": "Customer not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(data)


@api_view(["GET"])
def uncertain_customers(request):
    search = request.GET.get("search", "")
    cluster = request.GET.get("cluster", "")
    page = int(request.GET.get("page", 1))
    page_size = int(request.GET.get("page_size", 10))

    data = get_uncertain_customers(
        search=search,
        cluster=cluster,
        page=page,
        page_size=page_size,
    )

    return Response(data)


@api_view(["GET"])
def global_shap(request):
    data = get_global_shap()
    return Response(data)


@api_view(["GET"])
def cluster_shap(request, cluster_id):
    data = get_cluster_shap(cluster_id)
    return Response(data)


@api_view(["GET"])
def surrogate_performance(request):
    data = get_surrogate_performance()
    return Response(data)


@api_view(["GET"])
def decision_tree_rules(request):
    data = {
        "rules": get_decision_tree_rules()
    }
    return Response(data)


@api_view(["POST"])
def predict(request):
    result = predict_customer(request.data)
    return Response(result)