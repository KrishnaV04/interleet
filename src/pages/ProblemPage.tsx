import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { problems } from "../problems/registry";

// Eagerly import all problem images so Vite processes them
const imageModules = import.meta.glob<string>(
  "../assets/problems/**/*.{jpg,jpeg,png,gif,svg,webp}",
  { eager: true, import: "default" }
);

// Map of problem IDs to their visualization components (lazy loaded)
const visualizations: Record<number, ReturnType<typeof lazy>> = {
  1: lazy(() => import("../problems/TwoSumVisualization")),
  9: lazy(() => import("../problems/PalindromeNumberVisualization")),
  13: lazy(() => import("../problems/RomanToIntegerVisualization")),
  14: lazy(() => import("../problems/LongestCommonPrefixVisualization")),
  20: lazy(() => import("../problems/ValidParenthesesVisualization")),
  21: lazy(() => import("../problems/MergeTwoSortedListsVisualization")),
  26: lazy(() => import("../problems/RemoveDuplicatesVisualization")),
  27: lazy(() => import("../problems/RemoveElementVisualization")),
  28: lazy(() => import("../problems/FirstOccurrenceVisualization")),
  35: lazy(() => import("../problems/SearchInsertPositionVisualization")),
};

export default function ProblemPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const problemId = Number(id);
  const problem = problems.find((p) => p.id === problemId);
  const [markdown, setMarkdown] = useState("");
  const [leftWidth, setLeftWidth] = useState(35);
  const dragging = useRef(false);

  const onMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.min(Math.max(pct, 10), 60));
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    import(`../assets/problems/problem_${problemId}/problem.md?raw`)
      .then((mod) => setMarkdown(mod.default))
      .catch(() => setMarkdown("# Problem description not yet available.\n\nWant to contribute? Add a markdown file for this problem!"));
  }, [problemId]);

  const VisualizationComponent = visualizations[problemId];

  // Build a lookup from relative image names to Vite-processed URLs for this problem
  const imageMap = useMemo(() => {
    const prefix = `../assets/problems/problem_${problemId}/`;
    const map: Record<string, string> = {};
    for (const [path, url] of Object.entries(imageModules)) {
      if (path.startsWith(prefix)) {
        const filename = path.slice(prefix.length);
        map[`./${filename}`] = url;
        map[filename] = url;
      }
    }
    return map;
  }, [problemId]);

  if (!problem) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Problem not found</h2>
          <Link to="/" style={{ color: "#999" }}>Back to home</Link>
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
          borderBottom: "1px solid #252525",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            // If we have history from within the app, go back to preserve search params
            if (location.key !== "default") {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          style={{
            color: "#999",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          &larr; Interleet
        </a>
        <span style={{ color: "#444" }}>|</span>
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

      {/* Main content: resizable description | viz */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 49px)",
        }}
      >
        {/* Problem description */}
        <div
          style={{
            width: `${leftWidth}%`,
            flexShrink: 0,
            overflowY: "auto",
            padding: "24px 16px",
          }}
        >
          <div className="markdown-body">
            <ReactMarkdown
              components={{
                img: ({ src, alt, ...props }) => (
                  <img
                    src={src ? imageMap[src] ?? src : src}
                    alt={alt ?? ""}
                    style={{ maxWidth: "100%" }}
                    {...props}
                  />
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          style={{
            width: 6,
            cursor: "col-resize",
            background: "#252525",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#444")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#252525")}
        />

        {/* Visualization */}
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
              <h3 style={{ color: "#777", marginBottom: 12 }}>
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
