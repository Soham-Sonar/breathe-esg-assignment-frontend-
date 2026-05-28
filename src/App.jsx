// App.jsx
// Root component. Holds all state. Passes data down to pages as props.

import { useState, useEffect } from "react";
import "./index.css";

import Sidebar    from "./components/Sidebar";
import Dashboard  from "./pages/Dashboard";
import Review     from "./pages/Review";
import Upload     from "./pages/Upload";
import History    from "./pages/History";
import FailedRows from "./pages/FailedRows";

import {
  fetchDashboard,
  fetchUploads,
  fetchFailedRows,
  reviewRecord,
  bulkReviewRecords,
  fetchCompanies,
} from "./api";

import {
  mockRecords,
  mockUploads,
  mockFailedRows,
  mockSummary,
  mockCompanies,
} from "./mockData";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  review:    "Review Records",
  upload:    "Upload Data",
  history:   "Upload History",
  failed:    "Failed Rows",
};

export default function App() {
  const [page,       setPage]       = useState("dashboard");
  const [company,    setCompany]    = useState(null);

  // ── Data state ─────────────────────────────────────────
  // summary shape matches backend: { total_records, pending, approved,
  //   rejected, flagged, scope1_total_kg, scope2_total_kg, scope3_total_kg }
  const [summary,    setSummary]    = useState(mockSummary);
  const [records,    setRecords]    = useState(mockRecords);
  const [uploads,    setUploads]    = useState(mockUploads);
  const [failedRows, setFailedRows] = useState(mockFailedRows);
  const [loading,    setLoading]    = useState(false);
  const [companies, setCompanies] = useState([]);

  // ── Load company on mount ──────────────────────────────
  useEffect(() => {
    fetchCompanies()
      .then((companies) => {
        if (companies.length > 0) {
  setCompanies(companies);
  setCompany(companies[0]);
}
      })
      .catch((err) => {
  console.error(err);
  alert("Failed to load companies");
});
  }, []);

  // ── Load dashboard whenever company changes ────────────
  useEffect(() => {
    if (!company) return;
    loadDashboard();
    loadUploads();
    loadFailedRows();
  }, [company]);

  async function loadDashboard() {
    try {
      setLoading(true);
      // Backend returns { summary: {...}, records: [...] }
      const data = await fetchDashboard(company.id);
      setSummary(data.summary);
      setRecords(data.records);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadUploads() {
    try {
      const data = await fetchUploads(company.id);
      setUploads(data);
    } catch (err) {
      console.error("Uploads fetch error:", err);
    }
  }

  async function loadFailedRows() {
    try {
      // Fetch failed rows across all uploads for this company
      const data = await fetchFailedRows(company.id);
      setFailedRows(data);
    } catch (err) {
      console.error("Failed rows fetch error:", err);
    }
  }

  // ── Review single record ───────────────────────────────
  async function handleReview(recordId, action, notes) {
    // Optimistic UI update — don't wait for API
    const updated = records.map((r) =>
      r.id === recordId
        ? { ...r, review_status: action, reviewer_notes: notes }
        : r
    );
    setRecords(updated);
    recomputeSummary(updated);

    try {
      await reviewRecord(recordId, action, notes, "analyst@breathe.com");
      // Refresh from server to get accurate state
      await loadDashboard();
    } catch (err) {
      console.error("Review error:", err);
    }
  }

  // ── Bulk approve all pending ───────────────────────────
  async function handleBulkApprove() {
    const pendingIds = records
      .filter((r) => r.review_status === "PENDING")
      .map((r) => r.id);

    // Optimistic update
    const updated = records.map((r) =>
      r.review_status === "PENDING" ? { ...r, review_status: "APPROVED" } : r
    );
    setRecords(updated);
    recomputeSummary(updated);

    try {
      await bulkReviewRecords(pendingIds, "APPROVED", "analyst@breathe.com");
      await loadDashboard();
    } catch (err) {
      console.error("Bulk review error:", err);
    }
  }

  // ── Called by Upload page after a successful upload ────
  async function handleUploadComplete() {
    await loadDashboard();
    await loadUploads();
    await loadFailedRows();
  }

  // ── Recompute summary counts from local records ────────
  function recomputeSummary(updatedRecords) {
    setSummary((prev) => ({
      ...prev,
      approved: updatedRecords.filter((r) => r.review_status === "APPROVED").length,
      rejected: updatedRecords.filter((r) => r.review_status === "REJECTED").length,
      flagged:  updatedRecords.filter((r) => r.review_status === "FLAGGED").length,
      pending:  updatedRecords.filter((r) => r.review_status === "PENDING").length,
    }));
  }

  // ── Sidebar badge counts ───────────────────────────────
  const pendingCount = records.filter(
    (r) => r.review_status === "PENDING" || r.review_status === "FLAGGED"
  ).length;

  const failedCount = failedRows.length;

  // ── Render ─────────────────────────────────────────────
  function renderPage() {
    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            summary={summary}
            records={records}
            loading={loading}
            onNavigate={setPage}
          />
        );
      case "review":
        return (
          <Review
            records={records}
            onReview={handleReview}
            onBulkApprove={handleBulkApprove}
          />
        );
      case "upload":
        return (
          <Upload
            companyId={company?.id}
            onUploadComplete={handleUploadComplete}
          />
        );
      case "history":
        return <History uploads={uploads} />;
      case "failed":
        return <FailedRows failedRows={failedRows} />;
      default:
        return null;
    }
  }

  return (
    <div className="app">
<Sidebar

  currentPage={page}

  onNavigate={setPage}

  pendingCount={pendingCount}

  failedCount={failedCount}

  companies={companies}

  companyId={company?.id || ""}

  onCompanyChange={(id)=>{

    const selected = companies.find(

      c=>c.id===id

    )

    setCompany(selected)

  }}

/>
      <div className="main">
        <div className="topbar">
          <div className="page-title">{PAGE_TITLES[page]}</div>
                <select
          className="company-chip"
          value={company?.id || ""}
          onChange={(e) => {
            const selected = companies.find(
              (c) => c.id === e.target.value
            );
            setCompany(selected);
          }}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        </div>
        <div className="content">
          {loading && (
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
              ⏳ Loading...
            </div>
          )}
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
