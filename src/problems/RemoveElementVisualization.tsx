import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

interface StepState {
  /** Current array state (mutated in-place) */
  arr: number[];
  /** Write pointer */
  k: number;
  /** Read pointer */
  i: number;
  /** The value to remove */
  val: number;
  /** Whether this step is the final summary */
  done: boolean;
  /** Whether the current element was skipped (equals val) */
  skipped: boolean;
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

export default function RemoveElementVisualization() {
  const [numsInput, setNumsInput] = useState("0, 1, 2, 2, 3, 0, 4, 2");
  const [valInput, setValInput] = useState("2");
  const [inputError, setInputError] = useState<string | null>(null);
  const [nums, setNums] = useState([0, 1, 2, 2, 3, 0, 4, 2]);
  const [val, setVal] = useState(2);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const parseAndValidate = useCallback((numsStr: string, valStr: string) => {
    // Validate val
    const vTrimmed = valStr.trim();
    if (vTrimmed === "" || isNaN(Number(vTrimmed)) || !Number.isInteger(Number(vTrimmed))) {
      return { error: "val must be a valid integer." };
    }
    const v = Number(vTrimmed);
    if (v < 0 || v > 100) {
      return { error: "val must be between 0 and 100." };
    }

    // Validate nums
    const trimmed = numsStr.trim();
    if (trimmed === "") {
      return { error: null, parsed: [], v };
    }
    const parts = trimmed.split(",").map((s) => s.trim());
    if (parts.some((p) => p === "" || isNaN(Number(p)) || !Number.isInteger(Number(p)))) {
      return { error: "Each element must be a valid integer." };
    }
    const parsed = parts.map(Number);
    if (parsed.length > 20) {
      return { error: "Array must have at most 20 elements." };
    }
    if (parsed.some((n) => n < 0 || n > 50)) {
      return { error: "Each element must be between 0 and 50." };
    }
    return { error: null, parsed, v };
  }, []);

  const handleNumsChange = useCallback(
    (value: string) => {
      setNumsInput(value);
      const result = parseAndValidate(value, valInput);
      if (result.error) {
        setInputError(result.error);
        return;
      }
      setInputError(null);
      setNums(result.parsed!);
      setVal(result.v!);
      stopRef.current = true;
      setIsRunning(false);
      setStepIndex(-1);
    },
    [valInput, parseAndValidate],
  );

  const handleValChange = useCallback(
    (value: string) => {
      setValInput(value);
      const result = parseAndValidate(numsInput, value);
      if (result.error) {
        setInputError(result.error);
        return;
      }
      setInputError(null);
      setNums(result.parsed!);
      setVal(result.v!);
      stopRef.current = true;
      setIsRunning(false);
      setStepIndex(-1);
    },
    [numsInput, parseAndValidate],
  );

  const steps = useMemo((): StepState[] => {
    const result: StepState[] = [];
    const arr = [...nums];

    if (arr.length === 0) {
      result.push({
        arr: [...arr],
        k: 0,
        i: -1,
        val,
        done: true,
        skipped: false,
        message: `Array is empty. k = 0.`,
      });
      return result;
    }

    let k = 0;

    // Initial step
    result.push({
      arr: [...arr],
      k: 0,
      i: 0,
      val,
      done: false,
      skipped: false,
      message: `Initialize: k = 0, val = ${val}. Scan through array.`,
    });

    for (let i = 0; i < arr.length; i++) {
      const valI = arr[i];

      // Inspect step
      result.push({
        arr: [...arr],
        k,
        i,
        val,
        done: false,
        skipped: false,
        message: `i = ${i}, nums[i] = ${valI}.`,
      });

      if (valI === val) {
        // Skip – equals val
        result.push({
          arr: [...arr],
          k,
          i,
          val,
          done: false,
          skipped: true,
          message: `nums[${i}] = ${valI} equals val (${val}). Skip.`,
        });
      } else {
        // Keep – write to position k
        arr[k] = valI;
        k++;
        result.push({
          arr: [...arr],
          k,
          i,
          val,
          done: false,
          skipped: false,
          message: `nums[${i}] = ${valI} \u2260 val (${val}). Write nums[${k - 1}] = ${valI}. k becomes ${k}.`,
        });
      }
    }

    // Final step
    const keptElements = arr.slice(0, k).join(", ");
    result.push({
      arr: [...arr],
      k,
      i: arr.length - 1,
      val,
      done: true,
      skipped: false,
      message: `Done! k = ${k}. First ${k} elements: [${keptElements}]`,
    });

    return result;
  }, [nums, val]);

  const currentState: StepState =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : {
          arr: [...nums],
          k: -1,
          i: -1,
          val,
          done: false,
          skipped: false,
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

  /** Check if original nums[idx] equals val (for red tint on source values) */
  const originalNums = nums;

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
                placeholder="e.g. 0, 1, 2, 2, 3, 0, 4, 2"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>val</span>
              <input
                style={{ ...INPUT_STYLE, width: 80 }}
                value={valInput}
                onChange={(e) => handleValChange(e.target.value)}
                placeholder="e.g. 2"
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
        {/* k counter and val display */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
              {currentState.k >= 0 ? currentState.k : "\u2014"}
            </span>
          </div>
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
              val =
            </span>
            <span
              style={{
                color: "#ef4444",
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {val}
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
              Kept {currentState.k} elements
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
              const isKeptRegion = currentState.k >= 0 && idx < currentState.k;
              const isActiveI = currentState.i === idx && !currentState.done;
              const isActiveK = currentState.k === idx && !currentState.done;
              const isValMatch = originalNums[idx] === val;
              const isCurrentlySkipped = currentState.skipped && currentState.i === idx;

              let bg = "#1e293b";
              let border = "2px solid #334155";
              let textColor = "#f8fafc";
              let textDecoration = "none";

              if (currentState.done && isKeptRegion) {
                bg = "#166534";
                border = "2px solid #22c55e";
              } else if (isCurrentlySkipped) {
                bg = "#450a0a";
                border = "2px solid #ef4444";
                textDecoration = "line-through";
              } else if (isActiveI) {
                bg = "#1e40af";
                border = "2px solid #3b82f6";
              } else if (isKeptRegion) {
                bg = "#14532d";
                border = "2px solid #166534";
              } else if (isValMatch && stepIndex >= 0) {
                // Subtle red tint for elements matching val that haven't been processed yet
                textColor = "#fca5a5";
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
                      color: textColor,
                      border,
                      textDecoration,
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
            background: currentState.done ? "#052e16" : currentState.skipped ? "#1c0a0a" : "#0c1222",
            border: currentState.done
              ? "1px solid #166534"
              : currentState.skipped
                ? "1px solid #450a0a"
                : "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px 16px",
            color: currentState.done ? "#4ade80" : currentState.skipped ? "#fca5a5" : "#cbd5e1",
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
