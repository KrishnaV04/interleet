import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

interface StepState {
  /** Current array state (mutated in-place) */
  arr: number[];
  /** Slow pointer – write position */
  k: number;
  /** Fast pointer – read position */
  i: number;
  /** Whether this step is the final summary */
  done: boolean;
  message: string;
}

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

const ERROR_STYLE: React.CSSProperties = {
  color: "#ef4444",
  fontSize: 11,
  marginTop: 4,
};

export default function RemoveDuplicatesVisualization() {
  const [numsInput, setNumsInput] = useState("0, 0, 1, 1, 1, 2, 2, 3, 3, 4");
  const [inputError, setInputError] = useState<string | null>(null);
  const [nums, setNums] = useState([0, 0, 1, 1, 1, 2, 2, 3, 3, 4]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const handleNumsChange = useCallback((value: string) => {
    setNumsInput(value);
    const parts = value.split(",").map((s) => s.trim());
    if (parts.some((p) => p === "" || isNaN(Number(p)) || !Number.isInteger(Number(p)))) {
      setInputError("Each element must be a valid integer.");
      return;
    }
    const parsed = parts.map(Number);
    if (parsed.length < 1 || parsed.length > 20) {
      setInputError("Array must have between 1 and 20 elements.");
      return;
    }
    for (let i = 1; i < parsed.length; i++) {
      if (parsed[i] < parsed[i - 1]) {
        setInputError("Array must be sorted in non-decreasing order.");
        return;
      }
    }
    setInputError(null);
    setNums(parsed);
    stopRef.current = true;
    setIsRunning(false);
    setStepIndex(-1);
  }, []);

  const steps = useMemo((): StepState[] => {
    const result: StepState[] = [];
    const arr = [...nums];

    if (arr.length === 0) {
      result.push({
        arr: [...arr],
        k: 0,
        i: -1,
        done: true,
        message: "Array is empty. k = 0.",
      });
      return result;
    }

    if (arr.length === 1) {
      result.push({
        arr: [...arr],
        k: 1,
        i: 0,
        done: true,
        message: `Only one element. k = 1. First 1 element: [${arr[0]}]`,
      });
      return result;
    }

    let k = 1;

    // Initial step
    result.push({
      arr: [...arr],
      k: 1,
      i: 1,
      done: false,
      message: "Initialize: k = 1 (first element is always unique). Start scanning from index 1.",
    });

    for (let i = 1; i < arr.length; i++) {
      const val = arr[i];
      const prev = arr[k - 1];

      // Compare step
      result.push({
        arr: [...arr],
        k,
        i,
        done: false,
        message: `i = ${i}, nums[i] = ${val}. Compare with nums[k-1] = nums[${k - 1}] = ${prev}.`,
      });

      if (val === prev) {
        // Duplicate – skip
        result.push({
          arr: [...arr],
          k,
          i,
          done: false,
          message: `nums[${i}] = ${val} equals nums[${k - 1}] = ${prev}. Skip (duplicate).`,
        });
      } else {
        // Unique – write
        arr[k] = val;
        k++;
        result.push({
          arr: [...arr],
          k,
          i,
          done: false,
          message: `nums[${i}] = ${val} differs from nums[${k - 2}] = ${prev}. Write nums[${k - 1}] = ${val}. k becomes ${k}.`,
        });
      }
    }

    // Final step
    const uniqueElements = arr.slice(0, k).join(", ");
    result.push({
      arr: [...arr],
      k,
      i: arr.length - 1,
      done: true,
      message: `Done! k = ${k}. First ${k} elements: [${uniqueElements}]`,
    });

    return result;
  }, [nums]);

  const currentState: StepState =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : {
          arr: [...nums],
          k: -1,
          i: -1,
          done: false,
          message: 'Press "Play" to animate the algorithm.',
        };

  const isDone = stepIndex >= 0 && stepIndex === steps.length - 1;
  const logEntries = steps.slice(0, stepIndex + 1).map((s) => s.message);

  const play = useCallback(async () => {
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
  }, [stepIndex, steps.length]);

  const stop = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stopRef.current = true;
    setIsRunning(false);
    setStepIndex(-1);
  }, []);

  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>nums</span>
              <input
                style={INPUT_STYLE}
                value={numsInput}
                onChange={(e) => handleNumsChange(e.target.value)}
                placeholder="e.g. 0, 0, 1, 1, 1, 2, 2, 3, 3, 4"
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
      {/* ── Visualization ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
        {/* k counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "8px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              k =
            </span>
            <span
              style={{
                color: "#22c55e",
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {currentState.k >= 0 ? currentState.k : "—"}
            </span>
          </div>
          {currentState.done && (
            <div
              style={{
                color: "#22c55e",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Unique count: {currentState.k}
            </div>
          )}
        </div>

        {/* Array display */}
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
            Array
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {currentState.arr.map((num, idx) => {
              const isUniqueRegion = currentState.k >= 0 && idx < currentState.k;
              const isActiveI = currentState.i === idx && !currentState.done;
              const isActiveK = currentState.k === idx && !currentState.done;

              let bg = "#1e293b";
              let border = "2px solid #334155";

              if (currentState.done && isUniqueRegion) {
                bg = "#166534";
                border = "2px solid #22c55e";
              } else if (isActiveI) {
                bg = "#1e40af";
                border = "2px solid #3b82f6";
              } else if (isUniqueRegion) {
                bg = "#14532d";
                border = "2px solid #166534";
              }

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748b" }}>{idx}</div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: bg,
                      borderRadius: 8,
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#f8fafc",
                      border,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {num}
                  </div>
                  {/* Pointer labels below the boxes */}
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      minHeight: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isActiveK && (
                      <span
                        style={{
                          color: "#22c55e",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        k
                      </span>
                    )}
                    {isActiveI && (
                      <span
                        style={{
                          color: "#3b82f6",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        i
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current step message */}
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
