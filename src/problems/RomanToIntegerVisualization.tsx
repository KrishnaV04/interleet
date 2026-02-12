import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

interface Step {
  currentIndex: number;
  total: number;
  operations: Array<{ index: number; op: "add" | "subtract" }>;
  message: string;
  done: boolean;
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

function validate(s: string): string | null {
  if (s.length === 0) return "String cannot be empty.";
  if (s.length > 15) return "String must be at most 15 characters.";
  if (!/^[IVXLCDM]+$/.test(s)) return "String must only contain I, V, X, L, C, D, M.";
  return null;
}

function generateSteps(s: string): Step[] {
  const steps: Step[] = [];
  let total = 0;
  const operations: Array<{ index: number; op: "add" | "subtract" }> = [];

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    const val = ROMAN_VALUES[char];
    const nextChar = i + 1 < s.length ? s[i + 1] : null;
    const nextVal = nextChar ? ROMAN_VALUES[nextChar] : 0;

    if (nextChar) {
      steps.push({
        currentIndex: i,
        total,
        operations: [...operations],
        message: `Looking at '${char}' (value ${val}) at index ${i}. Next is '${nextChar}' (value ${nextVal}).`,
        done: false,
      });
    } else {
      steps.push({
        currentIndex: i,
        total,
        operations: [...operations],
        message: `Looking at '${char}' (value ${val}) at index ${i}. This is the last character.`,
        done: false,
      });
    }

    if (nextChar && val < nextVal) {
      const newTotal = total - val;
      operations.push({ index: i, op: "subtract" });
      steps.push({
        currentIndex: i,
        total: newTotal,
        operations: [...operations],
        message: `Since ${val} < ${nextVal}, subtract: total = ${total} - ${val} = ${newTotal}`,
        done: false,
      });
      total = newTotal;
    } else {
      const newTotal = total + val;
      operations.push({ index: i, op: "add" });
      steps.push({
        currentIndex: i,
        total: newTotal,
        operations: [...operations],
        message: `Since ${val} >= ${nextVal}, add: total = ${total} + ${val} = ${newTotal}`,
        done: false,
      });
      total = newTotal;
    }
  }

  steps.push({
    currentIndex: s.length,
    total,
    operations: [...operations],
    message: `Result: ${s} = ${total}`,
    done: true,
  });

  return steps;
}

export default function RomanToIntegerVisualization() {
  const [inputValue, setInputValue] = useState("MCMXCIV");
  const [s, setS] = useState("MCMXCIV");
  const [error, setError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const steps = useMemo(() => generateSteps(s), [s]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    setInputValue(raw);
    const err = validate(raw);
    setError(err);
    if (!err) {
      setS(raw);
      setStepIndex(-1);
      stopRef.current = true;
      setIsRunning(false);
    }
  }, []);

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

  const isDone = stepIndex >= 0 && stepIndex === steps.length - 1;
  const logEntries = steps.slice(0, stepIndex + 1).map((st) => st.message);

  const currentStep: Step | null =
    stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null;

  // Build a lookup of operations completed so far
  const operationMap = useMemo(() => {
    const map: Record<number, "add" | "subtract"> = {};
    if (currentStep) {
      for (const op of currentStep.operations) {
        map[op.index] = op.op;
      }
    }
    return map;
  }, [currentStep]);

  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>s</span>
              <input
                style={INPUT_STYLE}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="e.g. MCMXCIV"
                maxLength={15}
              />
            </div>
          </div>
          {error && <div style={ERROR_STYLE}>{error}</div>}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
        {/* Running Total */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Total
          </div>
          <div
            style={{
              background: currentStep?.done ? "#166534" : "#1e293b",
              border: currentStep?.done ? "2px solid #22c55e" : "2px solid #334155",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 24,
              fontWeight: 700,
              color: currentStep?.done ? "#4ade80" : "#f8fafc",
              fontFamily: "monospace",
              transition: "all 0.3s ease",
              minWidth: 80,
              textAlign: "center",
            }}
          >
            {currentStep ? currentStep.total : 0}
          </div>
        </div>

        {/* Roman Characters Row */}
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
            Roman Numeral
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {s.split("").map((char, i) => {
              const val = ROMAN_VALUES[char];
              const isActive = currentStep && !currentStep.done && currentStep.currentIndex === i;
              const isProcessed = i in operationMap;
              const op = operationMap[i];

              let bg = "#1e293b";
              let borderColor = "#334155";
              let textColor = "#f8fafc";

              if (currentStep?.done) {
                // All done — show operations
                if (op === "subtract") {
                  bg = "#1e293b";
                  borderColor = "#ef4444";
                } else if (op === "add") {
                  bg = "#1e293b";
                  borderColor = "#22c55e";
                }
              } else if (isActive) {
                bg = "#1e40af";
                borderColor = "#3b82f6";
              } else if (isProcessed) {
                bg = "#1e293b";
                textColor = "#64748b";
                if (op === "subtract") {
                  borderColor = "#ef4444";
                } else {
                  borderColor = "#22c55e";
                }
              }

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {/* Index label */}
                  <div style={{ fontSize: 11, color: "#64748b" }}>{i}</div>

                  {/* Character box */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: bg,
                      borderRadius: 8,
                      fontSize: 20,
                      fontWeight: 700,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      transition: "all 0.3s ease",
                      fontFamily: "monospace",
                    }}
                  >
                    {char}
                  </div>

                  {/* Numeric value */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      fontFamily: "monospace",
                    }}
                  >
                    {val}
                  </div>

                  {/* Operation indicator */}
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isProcessed && op === "add" && (
                      <span style={{ color: "#22c55e" }}>+{val}</span>
                    )}
                    {isProcessed && op === "subtract" && (
                      <span style={{ color: "#ef4444" }}>-{val}</span>
                    )}
                    {isActive && !isProcessed && (
                      <span style={{ color: "#3b82f6", fontSize: 18 }}>^</span>
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
            background: currentStep?.done ? "#052e16" : "#0c1222",
            border: currentStep?.done ? "1px solid #166534" : "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px 16px",
            color: currentStep?.done ? "#4ade80" : "#cbd5e1",
            fontSize: 14,
            lineHeight: 1.5,
            transition: "all 0.3s ease",
          }}
        >
          {currentStep ? currentStep.message : 'Press "Play" to animate the algorithm.'}
        </div>
      </div>
    </VisualizationLayout>
  );
}
