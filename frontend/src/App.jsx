import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Home,
  PieChart,
  Search,
  ShieldAlert,
  Sparkles,
  Table2,
  TrendingUp,
  UserRoundSearch,
} from "lucide-react";
import "./App.css";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "gmm-results", label: "GMM Results", icon: Table2 },
  { id: "surrogate", label: "Surrogate Model", icon: Brain },
  { id: "global-shap", label: "Global SHAP", icon: BarChart3 },
  { id: "cluster-shap", label: "Cluster Explanation", icon: Sparkles },
  { id: "local", label: "Local Explanation", icon: UserRoundSearch },
  { id: "predict", label: "New Prediction", icon: Search },
  { id: "uncertain", label: "Uncertain Customers", icon: ShieldAlert },
];

function PagePlaceholder({ title, description }) {
  return (
    <section className="content-panel">
      <p className="eyebrow">Page</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
}

function formatDashboardPercent(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Number(value).toFixed(decimals)}%`;
}

function getClusterTone(clusterId) {
  const tones = {
    0: "blue",
    1: "orange",
    2: "green",
  };

  return tones[clusterId] || "blue";
}

function DashboardPage({ dashboard, loading }) {
  const clusterSizes = dashboard?.cluster_sizes || [];
  const meanConfidence = dashboard ? dashboard.mean_confidence * 100 : null;
  const uncertainPercent = dashboard?.low_confidence_percent ?? null;
  const highConfidencePercent =
    uncertainPercent === null ? null : Math.max(0, 100 - uncertainPercent);
  const confidenceRingValue = meanConfidence ?? 0;

  const metricCards = [
    {
      label: "Total Customers",
      value: loading
        ? "Loading..."
        : dashboard?.total_customers?.toLocaleString() || "--",
      helper: "Insurance customer records",
      icon: Activity,
      tone: "blue",
    },
    {
      label: "Final Model",
      value: dashboard?.model || "GMM K=3",
      helper: `${dashboard?.covariance_type || "tied"} covariance model`,
      icon: Brain,
      tone: "teal",
    },
    {
      label: "Mean Confidence",
      value: meanConfidence === null ? "--" : formatDashboardPercent(meanConfidence),
      helper: "Average GMM probability",
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Uncertain Customers",
      value: dashboard
        ? dashboard.low_confidence_customers.toLocaleString()
        : "--",
      helper: dashboard
        ? `${formatDashboardPercent(dashboard.low_confidence_percent)} below 80%`
        : "Low confidence review queue",
      icon: ShieldAlert,
      tone: "orange",
    },
  ];

  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy">
          {/* <p className="eyebrow hero-eyebrow">Insurance XAI Command Center</p> */}
          <h1>Explainable customer segmentation for insurance decisions</h1>
          <p>
            Monitor GMM customer segments, probability confidence, surrogate
            model explanations, and business actions from one professional
            dashboard.
          </p>

          <div className="hero-chip-row">
            <span>GMM K=3 final model</span>
            <span>Random Forest surrogate</span>
            <span>SHAP explainability</span>
          </div>
        </div>

        <div className="confidence-spotlight">
          <div
            className="confidence-ring"
            style={{ "--confidence": `${confidenceRingValue}%` }}
          >
            <div>
              <strong>
                {meanConfidence === null
                  ? "--"
                  : formatDashboardPercent(meanConfidence)}
              </strong>
              <span>mean confidence</span>
            </div>
          </div>
          <div className="spotlight-copy">
            <p>GMM probability health</p>
            <h3>
              {uncertainPercent === null
                ? "Waiting for API"
                : `${formatDashboardPercent(highConfidencePercent)} high-confidence`}
            </h3>
            <span>
              {uncertainPercent === null
                ? "Start Django backend to load confidence results."
                : `${formatDashboardPercent(uncertainPercent)} of customers need review.`}
            </span>
          </div>
        </div>
      </section>

      <section className="executive-grid">
        {metricCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <div className={`executive-card ${metric.tone}`} key={metric.label}>
              <div className="metric-icon">
                <Icon size={20} />
              </div>
              <p>{metric.label}</p>
              <h3>{metric.value}</h3>
              <span>{metric.helper}</span>
            </div>
          );
        })}
      </section>

      <section className="dashboard-grid-main">
        <div className="insight-panel segment-panel">
          <div className="panel-heading-row">
            <div>
              <p className="eyebrow">Cluster Distribution</p>
              <h3>GMM customer segment sizes</h3>
            </div>
            <PieChart size={24} />
          </div>

          <div className="segment-bars">
            {clusterSizes.map((cluster) => {
              const tone = getClusterTone(cluster.Cluster);

              return (
                <div className="segment-row" key={cluster.Cluster}>
                  <div className="segment-meta">
                    <strong>Cluster {cluster.Cluster}</strong>
                    <span>{cluster.Cluster_Name}</span>
                  </div>

                  <div className="segment-bar-wrap">
                    <div
                      className={`segment-bar ${tone}`}
                      style={{ width: `${Math.max(cluster.Percentage, 4)}%` }}
                    ></div>
                  </div>

                  <div className="segment-value">
                    <strong>{cluster.Count.toLocaleString()}</strong>
                    <span>{cluster.Percentage.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}

            {!loading && clusterSizes.length === 0 && (
              <div className="empty-state">Cluster data will appear here.</div>
            )}
          </div>
        </div>

        <div className="insight-panel confidence-panel">
          <div className="panel-heading-row">
            <div>
              <p className="eyebrow">Confidence Review</p>
              <h3>Probability-based quality check</h3>
            </div>
            <TrendingUp size={24} />
          </div>

          <div className="confidence-breakdown">
            <div
              className="mini-donut"
              style={{
                "--high": `${highConfidencePercent ?? 0}%`,
                "--uncertain": `${uncertainPercent ?? 0}%`,
              }}
            >
              <span>
                {uncertainPercent === null
                  ? "--"
                  : formatDashboardPercent(uncertainPercent)}
              </span>
            </div>

            <div className="confidence-list">
              <div>
                <span className="legend-dot green"></span>
                <p>High confidence</p>
                <strong>
                  {highConfidencePercent === null
                    ? "--"
                    : formatDashboardPercent(highConfidencePercent)}
                </strong>
              </div>
              <div>
                <span className="legend-dot orange"></span>
                <p>Review needed</p>
                <strong>
                  {uncertainPercent === null
                    ? "--"
                    : formatDashboardPercent(uncertainPercent)}
                </strong>
              </div>
            </div>
          </div>

          <div className="review-callout">
            <ShieldAlert size={18} />
            <span>
              Low-confidence customers are likely near segment boundaries and
              should be reviewed before business action.
            </span>
          </div>
        </div>
      </section>

      <section className="workflow-panel">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">System Overview</p>
            <h3>Real-world XAI workflow</h3>
          </div>
          <Sparkles size={24} />
        </div>

        <div className="workflow-track">
          <div className="workflow-step">
            <CircleDollarSign size={20} />
            <strong>Customer Data</strong>
            <span>Insurance profile and engineered ratios</span>
          </div>
          <ArrowRight className="workflow-arrow" size={24} />
          <div className="workflow-step">
            <Gauge size={20} />
            <strong>GMM Segment</strong>
            <span>Cluster label and probability confidence</span>
          </div>
          <ArrowRight className="workflow-arrow" size={24} />
          <div className="workflow-step">
            <Brain size={20} />
            <strong>SHAP Explanation</strong>
            <span>Global, cluster-wise, and local reasons</span>
          </div>
          <ArrowRight className="workflow-arrow" size={24} />
          <div className="workflow-step">
            <CheckCircle2 size={20} />
            <strong>Business Action</strong>
            <span>Retention, affordability, or cross-sell strategy</span>
          </div>
        </div>
      </section>

      <section className="action-grid">
        <div className="action-card blue">
          <p>Cluster 0 Strategy</p>
          <h4>Recent high-income customers</h4>
          <span>Loyalty rewards, cross-selling, and premium upgrades.</span>
        </div>
        <div className="action-card orange">
          <p>Cluster 1 Strategy</p>
          <h4>Affordability-sensitive customers</h4>
          <span>Flexible payment plans and affordable coverage options.</span>
        </div>
        <div className="action-card green">
          <p>Cluster 2 Strategy</p>
          <h4>Older or inactive policy holders</h4>
          <span>Retention campaigns, renewal reminders, and re-engagement.</span>
        </div>
      </section>
    </>
  );
}

function GMMResultsPage({
  customers,
  pagination,
  customerSearch,
  setCustomerSearch,
  clusterFilter,
  setClusterFilter,
  customerPage,
  setCustomerPage,
  pageSize,
  setPageSize,
}) {
  return (
    <section className="content-panel">
      <div>
        <h3>Sample Customer Segmentation Results</h3>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label>Search Customer ID</label>
          <input
            type="text"
            placeholder="Example: 84966"
            value={customerSearch}
            onChange={(event) => {
              setCustomerSearch(event.target.value);
              setCustomerPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <label>Cluster Filter</label>
          <select
            value={clusterFilter}
            onChange={(event) => {
              setClusterFilter(event.target.value);
              setCustomerPage(1);
            }}
          >
            <option value="">All clusters</option>
            <option value="0">Cluster 0</option>
            <option value="1">Cluster 1</option>
            <option value="2">Cluster 2</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Rows Per Page</label>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCustomerPage(1);
            }}
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      <div className="result-summary">
        Showing page {pagination?.page || 1} of {pagination?.total_pages || 1}
        {" "}({pagination?.total_records?.toLocaleString() || 0} matching records)
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Cluster</th>
              <th>Segment Name</th>
              <th>Cluster 0 Prob.</th>
              <th>Cluster 1 Prob.</th>
              <th>Cluster 2 Prob.</th>
              <th>Max Prob.</th>
              <th>Confidence</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.Customer_ID}>
                <td>{customer.Customer_ID}</td>
                <td>Cluster {customer.GMM_Cluster}</td>
                <td>{customer.Cluster_Name}</td>
                <td>{(customer.GMM_Cluster_0_Probability * 100).toFixed(2)}%</td>
                <td>{(customer.GMM_Cluster_1_Probability * 100).toFixed(2)}%</td>
                <td>{(customer.GMM_Cluster_2_Probability * 100).toFixed(2)}%</td>
                <td>{(customer.Max_Probability * 100).toFixed(2)}%</td>
                <td>
                  <span
                    className={
                      customer.Confidence_Level === "High confidence"
                        ? "badge good"
                        : "badge warning"
                    }
                  >
                    {customer.Confidence_Level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <button
          className="page-button"
          disabled={!pagination?.has_previous}
          onClick={() => setCustomerPage(customerPage - 1)}
        >
          Previous
        </button>

        <span>
          Page {pagination?.page || 1} / {pagination?.total_pages || 1}
        </span>

        <button
          className="page-button"
          disabled={!pagination?.has_next}
          onClick={() => setCustomerPage(customerPage + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
function getMetricValue(metrics, name) {
  const row = metrics?.find((item) => item.Metric === name);
  return row ? Number(row.Value) : null;
}
function SurrogateModelPage({ performance }) {
  const accuracy = getMetricValue(performance?.metrics, "Accuracy");
  const macroF1 = getMetricValue(performance?.metrics, "Macro F1-score");

  return (
    <>
      <section className="hero-grid two">
        <div className="metric-card">
          <p>Surrogate Accuracy</p>
          <h3>{accuracy !== null ? `${(accuracy * 100).toFixed(2)}%` : "--"}</h3>
          <span>How well Random Forest imitates GMM</span>
        </div>

        <div className="metric-card">
          <p>Macro F1-score</p>
          <h3>{macroF1 !== null ? `${(macroF1 * 100).toFixed(2)}%` : "--"}</h3>
          <span>Balanced performance across clusters</span>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Surrogate Model</p>
        <h3>Why this model is used for XAI</h3>
        <p>
          GMM is an unsupervised clustering model, so it cannot be directly
          explained like a normal supervised classifier. Therefore, a Random
          Forest surrogate classifier was trained using the GMM cluster labels
          as target labels. If the surrogate accuracy is high, the surrogate
          successfully approximates the GMM assignment logic.
        </p>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Confusion Matrix</p>
        <h3>Actual GMM Cluster vs Surrogate Prediction</h3>

        <div className="table-wrap small">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Predicted 0</th>
                <th>Predicted 1</th>
                <th>Predicted 2</th>
              </tr>
            </thead>

            <tbody>
              {performance?.confusion_matrix?.map((row, index) => (
                <tr key={index}>
                  <td>Actual {index}</td>
                  <td>{row["0"]}</td>
                  <td>{row["1"]}</td>
                  <td>{row["2"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Classification Report</p>
        <h3>Precision, Recall, and F1-score</h3>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-score</th>
                <th>Support</th>
              </tr>
            </thead>

            <tbody>
              {performance?.classification_report?.map((row, index) => (
                <tr key={index}>
                  <td>{row["Unnamed: 0"]}</td>
                  <td>{Number(row.precision || 0).toFixed(4)}</td>
                  <td>{Number(row.recall || 0).toFixed(4)}</td>
                  <td>{Number(row["f1-score"] || 0).toFixed(4)}</td>
                  <td>{Number(row.support || 0).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function GlobalSHAPPage({ globalShap }) {
  const topFeatures = globalShap.slice(0, 10);

  return (
    <>
      <section className="content-panel">
        <p className="eyebrow">Global SHAP Explanation</p>
        <h3>Most Important Features for GMM Cluster Assignment</h3>
        <p>
          This page explains which customer attributes are most influential in
          assigning customers to GMM segments. The SHAP values are calculated
          from the Random Forest surrogate model that approximates the GMM
          clustering logic.
        </p>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Feature Importance Chart</p>
        <h3>Top Global SHAP Features</h3>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={topFeatures}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="Feature"
                width={170}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="Mean_Abs_SHAP" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Top Features</p>
        <h3>Ranked Global Importance</h3>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Feature</th>
                <th>Mean Absolute SHAP</th>
              </tr>
            </thead>

            <tbody>
              {globalShap.map((item, index) => (
                <tr key={item.Feature}>
                  <td>{index + 1}</td>
                  <td>{item.Feature}</td>
                  <td>{Number(item.Mean_Abs_SHAP).toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
const clusterInfo = {
  0: {
    name: "Recent high-income customers",
    recommendation: "Offer loyalty rewards, cross-selling, and premium product upgrades.",
  },
  1: {
    name: "Affordability-sensitive customers",
    recommendation: "Offer flexible payment plans, affordable coverage options, or premium review.",
  },
  2: {
    name: "Older or inactive policy holders",
    recommendation: "Use retention campaigns, renewal reminders, and re-engagement offers.",
  },
};
function ClusterSHAPPage({
  selectedCluster,
  setSelectedCluster,
  clusterShap,
}) {
  const topFeatures = clusterShap.slice(0, 10);
  const info = clusterInfo[selectedCluster];

  return (
    <>
      <section className="content-panel">
        <p className="eyebrow">Cluster-wise SHAP Explanation</p>
        <h3>Feature Drivers for Each Customer Segment</h3>
        <p>
          This page explains which features are most important for each GMM
          cluster. The explanation is based on the surrogate Random Forest model
          trained to imitate the GMM clustering result.
        </p>

        <div className="cluster-selector">
          {[0, 1, 2].map((clusterId) => (
            <button
              key={clusterId}
              className={
                selectedCluster === clusterId
                  ? "cluster-button active"
                  : "cluster-button"
              }
              onClick={() => setSelectedCluster(clusterId)}
            >
              Cluster {clusterId}
            </button>
          ))}
        </div>
      </section>

      <section className="hero-grid two">
        <div className="metric-card">
          <p>Selected Segment</p>
          <h3>Cluster {selectedCluster}</h3>
          <span>{info.name}</span>
        </div>

        <div className="metric-card">
          <p>Business Recommendation</p>
          <h3>Action</h3>
          <span>{info.recommendation}</span>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Feature Importance Chart</p>
        <h3>Top SHAP Features for Cluster {selectedCluster}</h3>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={topFeatures}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="Feature"
                width={170}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="Mean_Abs_SHAP" fill="#f97316" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Ranked Features</p>
        <h3>Cluster {selectedCluster} Explanation Table</h3>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Feature</th>
                <th>Mean Absolute SHAP</th>
              </tr>
            </thead>

            <tbody>
              {clusterShap.map((item, index) => (
                <tr key={`${item.Cluster}-${item.Feature}`}>
                  <td>{index + 1}</td>
                  <td>{item.Feature}</td>
                  <td>{Number(item.Mean_Abs_SHAP).toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function LocalExplanationPage({
  localCustomerId,
  setLocalCustomerId,
  localCustomer,
  localReasons,
  localError,
  handleLocalCustomerSearch,
}) {
  return (
    <>
      <section className="content-panel">
        <p className="eyebrow">Local Explanation</p>
        <h3>Explain One Customer</h3>
        <p>
          Enter a Customer ID to view the assigned GMM segment, cluster
          probabilities, confidence level, and the top features explaining that
          customer segment.
        </p>

        <div className="search-row">
          <input
            type="text"
            placeholder="Enter Customer ID, e.g. 84966"
            value={localCustomerId}
            onChange={(event) => setLocalCustomerId(event.target.value)}
          />
          <button onClick={handleLocalCustomerSearch}>Search Customer</button>
        </div>

        {localError && <div className="error-banner compact">{localError}</div>}
      </section>

      {localCustomer && (
        <>
          <section className="hero-grid two">
            <div className="metric-card">
              <p>Assigned Segment</p>
              <h3>Cluster {localCustomer.GMM_Cluster}</h3>
              <span>{localCustomer.Cluster_Name}</span>
            </div>

            <div className="metric-card">
              <p>GMM Confidence</p>
              <h3>{(localCustomer.Max_Probability * 100).toFixed(2)}%</h3>
              <span>{localCustomer.Confidence_Level}</span>
            </div>
          </section>

          <section className="content-panel">
            <p className="eyebrow">Cluster Probabilities</p>
            <h3>How likely this customer belongs to each cluster</h3>

            <div className="probability-grid">
              <div className="probability-card">
                <p>Cluster 0</p>
                <h4>
                  {(localCustomer.GMM_Cluster_0_Probability * 100).toFixed(2)}%
                </h4>
              </div>

              <div className="probability-card">
                <p>Cluster 1</p>
                <h4>
                  {(localCustomer.GMM_Cluster_1_Probability * 100).toFixed(2)}%
                </h4>
              </div>

              <div className="probability-card">
                <p>Cluster 2</p>
                <h4>
                  {(localCustomer.GMM_Cluster_2_Probability * 100).toFixed(2)}%
                </h4>
              </div>
            </div>
          </section>

          <section className="content-panel">
            <p className="eyebrow">Top Reasons</p>
            <h3>Why this customer belongs to Cluster {localCustomer.GMM_Cluster}</h3>

            <div className="reason-list">
              {localReasons.map((reason, index) => (
                <div className="reason-item" key={reason.Feature}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{reason.Feature}</strong>
                    <p>
                      This feature is important for Cluster{" "}
                      {localCustomer.GMM_Cluster}. Mean absolute SHAP value:{" "}
                      {Number(reason.Mean_Abs_SHAP).toFixed(6)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
function NewPredictionPage({
  predictionInput,
  updatePredictionInput,
  handlePredictCustomer,
  predictionResult,
  predictionError,
}) {
  const inputFields = [
    "Age",
    "Income Level",
    "Coverage Amount",
    "Premium Amount",
    "Purchase Year",
    "Purchase Month",
    "Purchase Day",
    "Digital_Channel_Flag",
  ];

  return (
    <>
      <section className="content-panel">
        <p className="eyebrow">New Customer Prediction</p>
        <h3>Predict Segment for a New Customer</h3>
        <p>
          Enter customer information below. The system will calculate ratio
          features in the backend and return the predicted GMM segment,
          confidence score, probabilities, recommendation, and explanation.
        </p>

        <div className="prediction-grid">
          {inputFields.map((field) => (
            <div className="filter-group" key={field}>
              <label>{field}</label>
              <input
                    type="number"
                    value={predictionInput[field]}
                    onChange={(event) =>
                      updatePredictionInput(field, event.target.value)
                    }
                    onBlur={(event) =>
                      updatePredictionInput(field, event.target.value)
                    }
                  />
            </div>
          ))}
        </div>

        <button className="primary-action" onClick={handlePredictCustomer}>
          Predict Customer Segment
        </button>

        {predictionError && (
          <div className="error-banner compact">{predictionError}</div>
        )}
      </section>

      {predictionResult && (
        <>
          <section className="hero-grid two">
            <div className="metric-card">
              <p>Predicted Segment</p>
              <h3>Cluster {predictionResult.assigned_cluster}</h3>
              <span>{predictionResult.cluster_name}</span>
            </div>

            <div className="metric-card">
              <p>Prediction Confidence</p>
              <h3>{(predictionResult.confidence * 100).toFixed(2)}%</h3>
              <span>{predictionResult.confidence_level}</span>
            </div>
          </section>

          <section className="content-panel">
            <p className="eyebrow">Cluster Probabilities</p>
            <h3>GMM Probability Output</h3>

            <div className="probability-grid">
              {Object.entries(predictionResult.probabilities).map(
                ([cluster, value]) => (
                  <div className="probability-card" key={cluster}>
                    <p>{cluster.replace("_", " ").toUpperCase()}</p>
                    <h4>{(value * 100).toFixed(2)}%</h4>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="content-panel">
            <p className="eyebrow">Business Recommendation</p>
            <h3>Suggested Action</h3>
            <p>{predictionResult.recommendation}</p>
          </section>

          <section className="content-panel">
            <p className="eyebrow">Top Reasons</p>
            <h3>Features Explaining This Prediction</h3>

            <div className="reason-list">
              {predictionResult.top_reasons?.map((reason, index) => (
                <div className="reason-item" key={reason.Feature}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{reason.Feature}</strong>
                    <p>
                      This feature is important for Cluster{" "}
                      {predictionResult.assigned_cluster}. Mean absolute SHAP
                      value: {Number(reason.Mean_Abs_SHAP).toFixed(6)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
function UncertainCustomersPage({
  uncertainCustomers,
  uncertainPagination,
  uncertainSearch,
  setUncertainSearch,
  uncertainClusterFilter,
  setUncertainClusterFilter,
  uncertainPage,
  setUncertainPage,
  uncertainPageSize,
  setUncertainPageSize,
}) {
  return (
    <section className="content-panel">
      <p className="eyebrow">Uncertain Customers</p>
      <h3>Customers Below 80% GMM Confidence</h3>
      <p>
        These customers are near the boundary between segments. They should be
        reviewed carefully before making marketing, retention, or pricing
        decisions.
      </p>

      {/* <div className="warning-note">
        Search, filter, and browse all uncertain customers below 80% confidence.
        Lower maximum probability means the model is less confident about the
        final segment.
      </div> */}

      <div className="filter-row">
        <div className="filter-group">
          <label>Search Customer ID</label>
          <input
            type="text"
            placeholder="Example: 59127"
            value={uncertainSearch}
            onChange={(event) => {
              setUncertainSearch(event.target.value);
              setUncertainPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <label>Cluster Filter</label>
          <select
            value={uncertainClusterFilter}
            onChange={(event) => {
              setUncertainClusterFilter(event.target.value);
              setUncertainPage(1);
            }}
          >
            <option value="">All clusters</option>
            <option value="0">Cluster 0</option>
            <option value="1">Cluster 1</option>
            <option value="2">Cluster 2</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Rows Per Page</label>
          <select
            value={uncertainPageSize}
            onChange={(event) => {
              setUncertainPageSize(Number(event.target.value));
              setUncertainPage(1);
            }}
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      <div className="result-summary">
        Showing page {uncertainPagination?.page || 1} of{" "}
        {uncertainPagination?.total_pages || 1} (
        {uncertainPagination?.total_records?.toLocaleString() || 0} uncertain
        records)
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Assigned Cluster</th>
              <th>Segment Name</th>
              <th>Cluster 0 Prob.</th>
              <th>Cluster 1 Prob.</th>
              <th>Cluster 2 Prob.</th>
              <th>Max Prob.</th>
              <th>Confidence</th>
            </tr>
          </thead>

          <tbody>
            {uncertainCustomers.map((customer) => (
              <tr key={customer.Customer_ID}>
                <td>{customer.Customer_ID}</td>
                <td>Cluster {customer.GMM_Cluster}</td>
                <td>{customer.Cluster_Name}</td>
                <td>{(customer.GMM_Cluster_0_Probability * 100).toFixed(2)}%</td>
                <td>{(customer.GMM_Cluster_1_Probability * 100).toFixed(2)}%</td>
                <td>{(customer.GMM_Cluster_2_Probability * 100).toFixed(2)}%</td>
                <td>{(customer.Max_Probability * 100).toFixed(2)}%</td>
                <td>
                  <span className="badge warning">
                    {customer.Confidence_Level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <button
          className="page-button"
          disabled={!uncertainPagination?.has_previous}
          onClick={() => setUncertainPage(uncertainPage - 1)}
        >
          Previous
        </button>

        <span>
          Page {uncertainPagination?.page || 1} /{" "}
          {uncertainPagination?.total_pages || 1}
        </span>

        <button
          className="page-button"
          disabled={!uncertainPagination?.has_next}
          onClick={() => setUncertainPage(uncertainPage + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [pageSize, setPageSize] = useState(10);

  const [customerPagination, setCustomerPagination] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState("");
  const [customerPage, setCustomerPage] = useState(1);

  const [surrogatePerformance, setSurrogatePerformance] = useState(null);
  const [globalShap, setGlobalShap] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(0);
  const [clusterShap, setClusterShap] = useState([]);

  const [localCustomerId, setLocalCustomerId] = useState("");
  const [localCustomer, setLocalCustomer] = useState(null);
  const [localReasons, setLocalReasons] = useState([]);
  const [localError, setLocalError] = useState("");

  const [predictionInput, setPredictionInput] = useState({
    Age: 25,
    "Income Level": 38794,
    "Coverage Amount": 366506,
    "Premium Amount": 1276,
    "Purchase Year": 2018,
    "Purchase Month": 10,
    "Purchase Day": 9,
    Digital_Channel_Flag: 1,
  });
  
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState("");

  const [uncertainCustomers, setUncertainCustomers] = useState([]);
  const [uncertainPagination, setUncertainPagination] = useState(null);
  const [uncertainSearch, setUncertainSearch] = useState("");
  const [uncertainClusterFilter, setUncertainClusterFilter] = useState("");
  const [uncertainPage, setUncertainPage] = useState(1);
  const [uncertainPageSize, setUncertainPageSize] = useState(10);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not connect to Django API");
        }
        return response.json();
      })
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Dashboard API error:", error);
        setApiError("Django backend is not connected. Please run python manage.py runserver.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({
      page: customerPage,
      page_size: pageSize,
    });
  
    if (customerSearch.trim() !== "") {
      params.append("search", customerSearch.trim());
    }
  
    if (clusterFilter !== "") {
      params.append("cluster", clusterFilter);
    }
  
    fetch(`${API_BASE_URL}/api/customers/?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        setCustomers(data.results || []);
        setCustomerPagination(data.pagination || null);
      })
      .catch((error) => {
        console.error("Customers API error:", error);
      });
  }, [customerSearch, clusterFilter, customerPage, pageSize]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/surrogate/performance/`)
      .then((response) => response.json())
      .then((data) => {
        setSurrogatePerformance(data);
      })
      .catch((error) => {
        console.error("Surrogate API error:", error);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/shap/global/`)
      .then((response) => response.json())
      .then((data) => {
        setGlobalShap(data);
      })
      .catch((error) => {
        console.error("Global SHAP API error:", error);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/shap/cluster/${selectedCluster}/`)
      .then((response) => response.json())
      .then((data) => {
        setClusterShap(data);
      })
      .catch((error) => {
        console.error("Cluster SHAP API error:", error);
      });
  }, [selectedCluster]);

  useEffect(() => {
    const params = new URLSearchParams({
      page: uncertainPage,
      page_size: uncertainPageSize,
    });
  
    if (uncertainSearch.trim() !== "") {
      params.append("search", uncertainSearch.trim());
    }
  
    if (uncertainClusterFilter !== "") {
      params.append("cluster", uncertainClusterFilter);
    }
  
    fetch(`${API_BASE_URL}/api/uncertain-customers/?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        setUncertainCustomers(data.results || []);
        setUncertainPagination(data.pagination || null);
      })
      .catch((error) => {
        console.error("Uncertain customers API error:", error);
      });
  }, [
    uncertainSearch,
    uncertainClusterFilter,
    uncertainPage,
    uncertainPageSize,
  ]);

  function handleLocalCustomerSearch() {
    if (localCustomerId.trim() === "") {
      setLocalError("Please enter a Customer ID.");
      return;
    }
  
    setLocalError("");
    setLocalCustomer(null);
    setLocalReasons([]);
  
    fetch(`${API_BASE_URL}/api/customers/${localCustomerId.trim()}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Customer not found");
        }
        return response.json();
      })
      .then((customer) => {
        setLocalCustomer(customer);
  
        return fetch(`${API_BASE_URL}/api/shap/cluster/${customer.GMM_Cluster}/`);
      })
      .then((response) => response.json())
      .then((reasons) => {
        setLocalReasons(reasons.slice(0, 5));
      })
      .catch((error) => {
        console.error("Local explanation error:", error);
        setLocalError("Customer not found. Please check the Customer ID.");
      });
  }
  function updatePredictionInput(field, value) {
    const cleanedValue = value === "" ? "" : Number(value);
  
    setPredictionInput((current) => ({
      ...current,
      [field]: cleanedValue,
    }));
  }
  
  function handlePredictCustomer() {
    setPredictionError("");
    setPredictionResult(null);
  
    fetch(`${API_BASE_URL}/api/predict/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(predictionInput),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Prediction failed");
        }
        return response.json();
      })
      .then((data) => {
        setPredictionResult(data);
      })
      .catch((error) => {
        console.error("Prediction error:", error);
        setPredictionError("Prediction failed. Please check backend server.");
      });
  }

  const activeMenu = menuItems.find((item) => item.id === activePage);

  function handleNavigation(pageId) {
    setActivePage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <aside className={mobileMenuOpen ? "sidebar mobile-open" : "sidebar"}>
        <button
          type="button"
          className="brand brand-button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-navigation"
        >
          <div className="brand-icon">
            <Gauge size={24} />
          </div>
          <div>
            <h1>Insurance XAI</h1>
            <p>Customer Segmentation</p>
          </div>
          <span className="mobile-menu-label">
            {mobileMenuOpen ? "Close" : activeMenu?.label || "Menu"}
          </span>
        </button>

        <nav id="main-navigation" className="nav-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={item.id === activePage ? "nav-item active" : "nav-item"}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">
        {/* <header className="topbar">
          <div>
            <p className="topbar-kicker">Third seminar XAI system</p>
            <h2>{activeMenu?.label || "Dashboard"}</h2>
          </div>

          <div className={apiError ? "status-pill error" : "status-pill"}>
            <span className="status-dot"></span>
            {apiError ? "Backend Offline" : "Backend Ready"}
          </div>
        </header> */}

        {apiError && <div className="error-banner">{apiError}</div>}

        {activePage === "dashboard" && (
          <DashboardPage dashboard={dashboard} loading={loading} />
        )}

        {activePage === "gmm-results" && (
          <GMMResultsPage
          customers={customers}
          pagination={customerPagination}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          clusterFilter={clusterFilter}
          setClusterFilter={setClusterFilter}
          customerPage={customerPage}
          setCustomerPage={setCustomerPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
        )}

        {activePage === "surrogate" && (
          <SurrogateModelPage performance={surrogatePerformance} />
        )}

        {activePage === "global-shap" && (
           <GlobalSHAPPage globalShap={globalShap} />
        )}

        {activePage === "cluster-shap" && (
          <ClusterSHAPPage
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
          clusterShap={clusterShap}
        />
        )}

        {activePage === "local" && (
          <LocalExplanationPage
          localCustomerId={localCustomerId}
          setLocalCustomerId={setLocalCustomerId}
          localCustomer={localCustomer}
          localReasons={localReasons}
          localError={localError}
          handleLocalCustomerSearch={handleLocalCustomerSearch}
        />
        )}

        {activePage === "predict" && (
           <NewPredictionPage
           predictionInput={predictionInput}
           updatePredictionInput={updatePredictionInput}
           handlePredictCustomer={handlePredictCustomer}
           predictionResult={predictionResult}
           predictionError={predictionError}
         />
        )}

        {activePage === "uncertain" && (
          <UncertainCustomersPage
          uncertainCustomers={uncertainCustomers}
          uncertainPagination={uncertainPagination}
          uncertainSearch={uncertainSearch}
          setUncertainSearch={setUncertainSearch}
          uncertainClusterFilter={uncertainClusterFilter}
          setUncertainClusterFilter={setUncertainClusterFilter}
          uncertainPage={uncertainPage}
          setUncertainPage={setUncertainPage}
          uncertainPageSize={uncertainPageSize}
          setUncertainPageSize={setUncertainPageSize}
        />
        )}
      </main>
    </div>
  );
}

export default App;
