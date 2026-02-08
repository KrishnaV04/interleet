import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { problems } from "../problems/registry";

const PAGE_SIZE = 10;

const difficultyColor: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [vizOnly, setVizOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = problems;
    if (vizOnly) {
      result = result.filter((p) => p.hasVisualization);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || String(p.id).includes(q),
      );
    }
    return result;
  }, [search, vizOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageProblems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e2e8f0" }}
    >
      {/* Contribute button */}
      <a
        href="https://github.com/KrishnaV04/interleet"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          padding: "8px 16px",
          background: "#1e293b",
          color: "#3b82f6",
          border: "1px solid #2a3a4e",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#253347")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#1e293b")}
      >
        Contribute a Solution?
      </a>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px" }}>
        {/* Header */}
        <h1
          style={{
            textAlign: "center",
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 8,
            letterSpacing: -1,
          }}
        >
          <span style={{ color: "#3b82f6" }}>Inter</span>
          <span style={{ color: "#e2e8f0" }}>leet</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: 16,
            marginBottom: 40,
          }}
        >
          Visualize Leetcode Solutions
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by problem number or title..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 20px",
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            color: "#e2e8f0",
            fontSize: 16,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 32,
          }}
        />

        {/* Visualization Filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => {
              setVizOnly((v) => !v);
              setPage(0);
            }}
            style={{
              position: "relative",
              width: 40,
              height: 22,
              borderRadius: 11,
              border: "none",
              background: vizOnly ? "#3b82f6" : "#2a2a2a",
              cursor: "pointer",
              transition: "background 0.2s",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: vizOnly ? 21 : 3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#e2e8f0",
                transition: "left 0.2s",
              }}
            />
          </button>
          <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>
            Show only with visualization
          </span>
        </div>

        {/* Problem List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {pageProblems.length === 0 ? (
            <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
              No problems found.
            </div>
          ) : (
            pageProblems.map((p) => (
              <Link
                key={p.id}
                to={`/problem/${p.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 20px",
                  background: "#111",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "#e2e8f0",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1a1a2e")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#111")
                }
              >
                <span
                  style={{
                    width: 44,
                    fontWeight: 700,
                    color: "#64748b",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  #{p.id}
                </span>
                <span style={{ flex: 1, fontWeight: 500 }}>{p.title}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: difficultyColor[p.difficulty],
                    flexShrink: 0,
                  }}
                >
                  {p.difficulty}
                </span>
                {p.hasVisualization && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "#1e293b",
                      color: "#3b82f6",
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    VIZ
                  </span>
                )}
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 32,
            }}
          >
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: "8px 16px",
                background: page === 0 ? "#1a1a1a" : "#1e293b",
                color: page === 0 ? "#333" : "#94a3b8",
                border: "none",
                borderRadius: 6,
                cursor: page === 0 ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              Prev
            </button>
            <span style={{ color: "#64748b", fontSize: 14 }}>
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "8px 16px",
                background: page >= totalPages - 1 ? "#1a1a1a" : "#1e293b",
                color: page >= totalPages - 1 ? "#333" : "#94a3b8",
                border: "none",
                borderRadius: 6,
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
