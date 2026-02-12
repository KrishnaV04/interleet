import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";

export interface VisualizationLayoutProps {
  /** Content for the input panel (arrays, targets, etc). Null = hidden. */
  inputPanel: ReactNode;
  /** The main visualization area */
  children: ReactNode;
  /** Playback callbacks */
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  isPlaying: boolean;
  isDone: boolean;
  /** Speed multiplier (0.5–3) */
  speed: number;
  onSpeedChange: (speed: number) => void;
  /** Step log entries displayed in the log panel */
  logEntries: string[];
}

const BTN_COLOR = "#3b82f6";
const BTN_HOVER = "#2563eb";
const BTN_DISABLED = "#334155";

export default function VisualizationLayout({
  inputPanel,
  children,
  onPlay,
  onStop,
  onReset,
  isPlaying,
  isDone,
  speed,
  onSpeedChange,
  logEntries,
}: VisualizationLayoutProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const [logFullscreen, setLogFullscreen] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries.length]);

  // Escape to close fullscreen log
  useEffect(() => {
    if (!logFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLogFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [logFullscreen]);

  const btnStyle = useCallback(
    (id: string, disabled: boolean): React.CSSProperties => ({
      padding: "6px 18px",
      background: disabled ? BTN_DISABLED : hoveredBtn === id ? BTN_HOVER : BTN_COLOR,
      color: "#fff",
      border: "none",
      borderRadius: 6,
      cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 600,
      fontSize: 13,
      opacity: disabled ? 0.5 : 1,
      transition: "background 0.15s, opacity 0.15s",
      whiteSpace: "nowrap",
    }),
    [hoveredBtn],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* ── Input Panel (15%) ── */}
      <div
        style={{
          flex: "0 0 15%",
          borderBottom: "1px solid #252525",
          overflowY: "auto",
          padding: "12px 16px",
        }}
      >
        {inputPanel}
      </div>

      {/* ── Visualization (55%) ── */}
      <div
        style={{
          flex: "0 0 55%",
          overflowY: "auto",
          padding: "16px",
        }}
      >
        {children}
      </div>

      {/* ── Controls (5%) ── */}
      <div
        style={{
          flex: "0 0 5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          borderTop: "1px solid #252525",
          borderBottom: "1px solid #252525",
          padding: "0 16px",
          minHeight: 40,
        }}
      >
        {isPlaying ? (
          <button
            style={btnStyle("stop", false)}
            onMouseEnter={() => setHoveredBtn("stop")}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={onStop}
          >
            Stop
          </button>
        ) : (
          <button
            style={btnStyle("play", isDone)}
            onMouseEnter={() => setHoveredBtn("play")}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={onPlay}
            disabled={isDone}
          >
            Play
          </button>
        )}

        <button
          style={btnStyle("reset", false)}
          onMouseEnter={() => setHoveredBtn("reset")}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={onReset}
        >
          Reset
        </button>

        {/* Speed slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
          <span style={{ color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>Speed</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.25}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            style={{
              width: 80,
              accentColor: BTN_COLOR,
              cursor: "pointer",
            }}
          />
          <span style={{ color: "#94a3b8", fontSize: 11, minWidth: 28, textAlign: "right" }}>
            {speed}x
          </span>
        </div>
      </div>

      {/* ── Log Panel (25%) ── */}
      <div
        style={{
          flex: logFullscreen ? undefined : "0 0 25%",
          position: logFullscreen ? "absolute" : "relative",
          inset: logFullscreen ? 0 : undefined,
          zIndex: logFullscreen ? 20 : undefined,
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Log header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
            borderBottom: "1px solid #1e293b",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Log
          </span>
          <button
            onClick={() => setLogFullscreen((v) => !v)}
            onMouseEnter={() => setHoveredBtn("fs")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              background: "none",
              border: "none",
              color: hoveredBtn === "fs" ? "#e2e8f0" : "#64748b",
              cursor: "pointer",
              fontSize: 14,
              padding: "2px 4px",
              transition: "color 0.15s",
            }}
            title={logFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {logFullscreen ? "✕" : "⛶"}
          </button>
        </div>

        {/* Log entries */}
        <div
          ref={logRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px",
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          {logEntries.length === 0 ? (
            <div style={{ color: "#475569", fontStyle: "italic" }}>No steps yet.</div>
          ) : (
            logEntries.map((entry, i) => (
              <div key={i} style={{ color: "#94a3b8" }}>
                <span style={{ color: "#475569", marginRight: 8 }}>{String(i + 1).padStart(2, "0")}</span>
                {entry}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
