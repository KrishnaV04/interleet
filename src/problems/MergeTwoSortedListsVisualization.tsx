import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

/* ── Types ── */

interface StepState {
  /** Current pointer index into list1 (-1 = exhausted / not started) */
  i1: number;
  /** Current pointer index into list2 (-1 = exhausted / not started) */
  i2: number;
  /** Merged result so far */
  merged: number[];
  /** Which list the last element was taken from: 1 | 2 | null */
  takenFrom: 1 | 2 | null;
  /** Set of (list, index) pairs already consumed */
  consumed1: Set<number>;
  consumed2: Set<number>;
  /** Whether algorithm is done */
  done: boolean;
  /** Log message */
  message: string;
}

/* ── Constants ── */

const INPUT_STYLE: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #303030",
  color: "#e2e8f0",
  borderRadius: 6,
  padding: "4px 8px",
  fontFamily: "monospace",
  fontSize: 13,
  outline: "none",
  width: 200,
};
const LABEL_STYLE: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  marginRight: 8,
};
const ERROR_STYLE: React.CSSProperties = { color: "#ef4444", fontSize: 11, marginTop: 4 };

/* ── Helpers ── */

function parseList(raw: string): number[] | null {
  const trimmed = raw.trim();
  if (trimmed === "") return [];
  const parts = trimmed.split(",");
  const nums: number[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (t === "" || isNaN(Number(t))) return null;
    nums.push(Number(t));
  }
  return nums;
}

function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

/* ── Component ── */

export default function MergeTwoSortedListsVisualization() {
  /* ── Input state ── */
  const [list1Text, setList1Text] = useState("1, 2, 4");
  const [list2Text, setList2Text] = useState("1, 3, 4");
  const [inputError, setInputError] = useState<string | null>(null);

  /* ── Playback state ── */
  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /* ── Validate & parse inputs ── */
  const parsed = useMemo<{ list1: number[]; list2: number[] } | null>(() => {
    const l1 = parseList(list1Text);
    const l2 = parseList(list2Text);
    if (l1 === null) {
      setInputError("List 1 contains invalid integers.");
      return null;
    }
    if (l2 === null) {
      setInputError("List 2 contains invalid integers.");
      return null;
    }
    if (l1.length > 10) {
      setInputError("List 1 must have at most 10 elements.");
      return null;
    }
    if (l2.length > 10) {
      setInputError("List 2 must have at most 10 elements.");
      return null;
    }
    if (!isSorted(l1)) {
      setInputError("List 1 must be sorted in non-decreasing order.");
      return null;
    }
    if (!isSorted(l2)) {
      setInputError("List 2 must be sorted in non-decreasing order.");
      return null;
    }
    setInputError(null);
    return { list1: l1, list2: l2 };
  }, [list1Text, list2Text]);

  /* Reset step when input changes */
  useEffect(() => {
    stopRef.current = true;
    setIsRunning(false);
    setStepIndex(-1);
  }, [list1Text, list2Text]);

  /* ── Generate all algorithm steps ── */
  const steps = useMemo<StepState[]>(() => {
    if (!parsed) return [];
    const { list1, list2 } = parsed;
    const result: StepState[] = [];
    const merged: number[] = [];
    const consumed1 = new Set<number>();
    const consumed2 = new Set<number>();
    let i1 = 0;
    let i2 = 0;

    // Step 0: Initialize
    result.push({
      i1: list1.length > 0 ? 0 : -1,
      i2: list2.length > 0 ? 0 : -1,
      merged: [],
      takenFrom: null,
      consumed1: new Set(consumed1),
      consumed2: new Set(consumed2),
      done: false,
      message: `Initialize: list1 = [${list1.join(", ")}], list2 = [${list2.join(", ")}], merged = []`,
    });

    while (i1 < list1.length && i2 < list2.length) {
      const v1 = list1[i1];
      const v2 = list2[i2];

      // Compare step
      result.push({
        i1,
        i2,
        merged: [...merged],
        takenFrom: null,
        consumed1: new Set(consumed1),
        consumed2: new Set(consumed2),
        done: false,
        message: `Compare list1[${i1}]=${v1} vs list2[${i2}]=${v2}.`,
      });

      if (v1 <= v2) {
        merged.push(v1);
        consumed1.add(i1);
        result.push({
          i1,
          i2,
          merged: [...merged],
          takenFrom: 1,
          consumed1: new Set(consumed1),
          consumed2: new Set(consumed2),
          done: false,
          message: `Take ${v1} from list1. Merged: [${merged.join(", ")}]`,
        });
        i1++;
      } else {
        merged.push(v2);
        consumed2.add(i2);
        result.push({
          i1,
          i2,
          merged: [...merged],
          takenFrom: 2,
          consumed1: new Set(consumed1),
          consumed2: new Set(consumed2),
          done: false,
          message: `Take ${v2} from list2. Merged: [${merged.join(", ")}]`,
        });
        i2++;
      }
    }

    // Append remaining from list1
    if (i1 < list1.length) {
      const rest = list1.slice(i1);
      for (let k = i1; k < list1.length; k++) consumed1.add(k);
      merged.push(...rest);
      result.push({
        i1: list1.length,
        i2,
        merged: [...merged],
        takenFrom: 1,
        consumed1: new Set(consumed1),
        consumed2: new Set(consumed2),
        done: false,
        message: `List2 exhausted. Append remaining from list1: [${rest.join(", ")}]`,
      });
    }

    // Append remaining from list2
    if (i2 < list2.length) {
      const rest = list2.slice(i2);
      for (let k = i2; k < list2.length; k++) consumed2.add(k);
      merged.push(...rest);
      result.push({
        i1,
        i2: list2.length,
        merged: [...merged],
        takenFrom: 2,
        consumed1: new Set(consumed1),
        consumed2: new Set(consumed2),
        done: false,
        message: `List1 exhausted. Append remaining from list2: [${rest.join(", ")}]`,
      });
    }

    // Final step
    result.push({
      i1: list1.length,
      i2: list2.length,
      merged: [...merged],
      takenFrom: null,
      consumed1: new Set(consumed1),
      consumed2: new Set(consumed2),
      done: true,
      message: `Done! Merged list: [${merged.join(", ")}]`,
    });

    return result;
  }, [parsed]);

  /* ── Current state ── */
  const currentState: StepState =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : {
          i1: -1,
          i2: -1,
          merged: [],
          takenFrom: null,
          consumed1: new Set<number>(),
          consumed2: new Set<number>(),
          done: false,
          message: 'Press "Play" to animate the algorithm.',
        };

  /* ── Playback controls ── */
  const play = useCallback(async () => {
    if (!parsed) return;
    stopRef.current = false;
    setIsRunning(true);
    const start = stepIndex < 0 ? 0 : stepIndex + 1;
    for (let i = start; i < steps.length; i++) {
      if (stopRef.current) break;
      await new Promise((r) => setTimeout(r, 800 / speedRef.current));
      if (stopRef.current) break;
      setStepIndex(i);
    }
    setIsRunning(false);
  }, [stepIndex, steps.length, parsed]);

  const stop = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
    setStepIndex(-1);
  }, []);

  const isDone = stepIndex >= 0 && stepIndex === steps.length - 1;
  const logEntries = steps.slice(0, stepIndex + 1).map((s) => s.message);

  /* ── Render helpers ── */
  const list1 = parsed?.list1 ?? [];
  const list2 = parsed?.list2 ?? [];

  const renderListBox = (
    value: number,
    index: number,
    isPointer: boolean,
    isConsumed: boolean,
    justTaken: boolean,
  ) => {
    let bg = "#1e293b";
    let border = "2px solid #334155";
    let opacity = 1;

    if (justTaken) {
      bg = "#166534";
      border = "2px solid #22c55e";
    } else if (isPointer && !isConsumed) {
      bg = "#1e40af";
      border = "2px solid #3b82f6";
    }
    if (isConsumed && !justTaken) {
      opacity = 0.35;
    }

    return (
      <div
        key={index}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 10, color: "#64748b" }}>{index}</div>
        <div
          style={{
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: bg,
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 700,
            color: "#f8fafc",
            border,
            opacity,
            transition: "all 0.3s ease",
            fontFamily: "monospace",
          }}
        >
          {value}
        </div>
        {isPointer && !isConsumed && (
          <div style={{ fontSize: 14, color: "#3b82f6", fontWeight: 700 }}>^</div>
        )}
      </div>
    );
  };

  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>list1</span>
              <input
                style={INPUT_STYLE}
                value={list1Text}
                onChange={(e) => setList1Text(e.target.value)}
                placeholder="e.g. 1, 2, 4"
                disabled={isRunning}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>list2</span>
              <input
                style={INPUT_STYLE}
                value={list2Text}
                onChange={(e) => setList2Text(e.target.value)}
                placeholder="e.g. 1, 3, 4"
                disabled={isRunning}
              />
            </div>
          </div>
          {inputError && <div style={ERROR_STYLE}>{inputError}</div>}
        </div>
      }
      onPlay={play}
      onStop={stop}
      onReset={reset}
      isPlaying={isRunning}
      isDone={isDone}
      speed={speed}
      onSpeedChange={setSpeed}
      logEntries={logEntries}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
        {/* ── List 1 ── */}
        <div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 8,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            List 1
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {list1.length === 0 ? (
              <div style={{ color: "#475569", fontStyle: "italic", fontSize: 12 }}>Empty</div>
            ) : (
              list1.map((val, i) => {
                const isPointer = currentState.i1 === i;
                const isConsumed = currentState.consumed1.has(i);
                // "just taken" = this element was consumed and takenFrom=1 and it's the most recently consumed
                const justTaken =
                  currentState.takenFrom === 1 &&
                  isConsumed &&
                  !steps[Math.max(0, stepIndex - 1)]?.consumed1?.has(i);
                return renderListBox(val, i, isPointer, isConsumed, justTaken);
              })
            )}
          </div>
        </div>

        {/* ── List 2 ── */}
        <div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 8,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            List 2
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {list2.length === 0 ? (
              <div style={{ color: "#475569", fontStyle: "italic", fontSize: 12 }}>Empty</div>
            ) : (
              list2.map((val, i) => {
                const isPointer = currentState.i2 === i;
                const isConsumed = currentState.consumed2.has(i);
                const justTaken =
                  currentState.takenFrom === 2 &&
                  isConsumed &&
                  !steps[Math.max(0, stepIndex - 1)]?.consumed2?.has(i);
                return renderListBox(val, i, isPointer, isConsumed, justTaken);
              })
            )}
          </div>
        </div>

        {/* ── Merged ── */}
        <div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 8,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Merged
          </div>
          <div
            style={{
              background: "#0f172a",
              borderRadius: 8,
              border: currentState.done ? "1px solid #166534" : "1px solid #334155",
              padding: 12,
              minHeight: 60,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
              transition: "border 0.3s ease",
            }}
          >
            {currentState.merged.length === 0 ? (
              <div style={{ color: "#475569", fontStyle: "italic", fontSize: 12 }}>Empty</div>
            ) : (
              currentState.merged.map((val, i) => {
                const isLatest = i === currentState.merged.length - 1 && currentState.takenFrom !== null;
                return (
                  <div
                    key={i}
                    style={{
                      width: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isLatest ? "#166534" : "#1e293b",
                      borderRadius: 8,
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#f8fafc",
                      border: isLatest ? "2px solid #22c55e" : "2px solid #334155",
                      transition: "all 0.3s ease",
                      fontFamily: "monospace",
                    }}
                  >
                    {val}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Current Step Message ── */}
        <div
          style={{
            background: currentState.done ? "#052e16" : "#0c1222",
            border: currentState.done ? "1px solid #166534" : "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px 16px",
            color: currentState.done ? "#4ade80" : "#cbd5e1",
            fontSize: 14,
            lineHeight: 1.5,
            transition: "all 0.3s ease",
          }}
        >
          {currentState.message}
        </div>
      </div>
    </VisualizationLayout>
  );
}
