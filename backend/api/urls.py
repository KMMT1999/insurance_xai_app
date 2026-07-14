from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health_check, name="health_check"),
    path("dashboard/", views.dashboard_summary, name="dashboard_summary"),
    path("customers/", views.customers_list, name="customers_list"),
    path("customers/<str:customer_id>/", views.customer_detail, name="customer_detail"),
    path("uncertain-customers/", views.uncertain_customers, name="uncertain_customers"),
    path("shap/global/", views.global_shap, name="global_shap"),
    path("shap/cluster/<int:cluster_id>/", views.cluster_shap, name="cluster_shap"),
    path("surrogate/performance/", views.surrogate_performance, name="surrogate_performance"),
    path("rules/", views.decision_tree_rules, name="decision_tree_rules"),
    path("predict/", views.predict, name="predict"),
]