import { useParams, Link } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import { problems } from "../problems/registry";

// Map of problem IDs to their visualization components (lazy loaded)
const visualizations: Record<number, ReturnType<typeof lazy>> = {
  1: lazy(() => import("../problems/TwoSumVisualization")),
};

export default function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const problemId = Number(id);
  const problem = problems.find((p) => p.id === problemId);
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    import(`../assets/problems/problem_${problemId}.md?raw`)
      .then((mod) => setMarkdown(mod.default))
      .catch(() => setMarkdown("# Problem description not yet available.\n\nWant to contribute? Add a markdown file for this problem!"));
  }, [problemId]);

  const VisualizationComponent = visualizations[problemId];

  if (!problem) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Problem not found</h2>
          <Link to="/" style={{ color: "#3b82f6" }}>Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e2e8f0" }}>
      {/* Top bar */}
      <div
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #1e1e1e",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link
          to="/"
          style={{
            color: "#3b82f6",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          &larr; Interleet
        </Link>
        <span style={{ color: "#334155" }}>|</span>
        <span style={{ fontWeight: 700 }}>
          #{problem.id}. {problem.title}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color:
              problem.difficulty === "Easy"
                ? "#22c55e"
                : problem.difficulty === "Medium"
                ? "#f59e0b"
                : "#ef4444",
          }}
        >
          {problem.difficulty}
        </span>
      </div>

      {/* Main content: 20% description | 80% viz */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 49px)",
        }}
      >
        {/* Problem description 20% */}
        <div
          style={{
            width: "20%",
            flexShrink: 0,
            overflowY: "auto",
            padding: "24px 16px",
            borderRight: "1px solid #1e1e1e",
          }}
        >
          <div className="markdown-body">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>

        {/* Visualization 80% */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px",
          }}
        >
          {VisualizationComponent ? (
            <Suspense
              fallback={
                <div style={{ color: "#475569", textAlign: "center", padding: 40 }}>
                  Loading visualization...
                </div>
              }
            >
              <VisualizationComponent />
            </Suspense>
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#475569",
                padding: 60,
              }}
            >
              <h3 style={{ color: "#64748b", marginBottom: 12 }}>
                No visualization yet
              </h3>
              <p>
                Want to contribute? Create a visualization component for this problem!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
