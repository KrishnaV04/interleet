import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

interface Step {
  columnIndex: number;
  /** Which string index caused the mismatch, or -1 if all matched */
  mismatchStringIndex: number;
  prefix: string;
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
  width: 320,
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

function parseStrings(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function validate(strs: string[]): string | null {
  if (strs.length === 0) return "At least 1 string is required.";
  if (strs.length > 10) return "At most 10 strings allowed.";
  for (const s of strs) {
    if (s.length === 0) return "Each string must be non-empty.";
    if (s.length > 50) return "Each string must be at most 50 characters.";
  }
  return null;
}

function generateSteps(strs: string[]): Step[] {
  const steps: Step[] = [];

  if (strs.length === 0) return steps;

  const minLen = Math.min(...strs.map((s) => s.length));
  let prefix = "";

  for (let j = 0; j < minLen; j++) {
    const targetChar = strs[0][j];

    // Step: checking column
    steps.push({
      columnIndex: j,
      mismatchStringIndex: -1,
      prefix,
      message: `Checking column ${j}: comparing '${targetChar}' across all strings.`,
      done: false,
    });

    let mismatchFound = false;

    for (let k = 0; k < strs.length; k++) {
      const c = strs[k][j];
      if (c !== targetChar) {
        steps.push({
          columnIndex: j,
          mismatchStringIndex: k,
          prefix,
          message: `String '${strs[k]}': char at [${j}] = '${c}' — mismatches '${targetChar}'.`,
          done: false,
        });

        // Final step
        steps.push({
          columnIndex: j,
          mismatchStringIndex: k,
          prefix,
          message: `Mismatch found! String '${strs[k]}' has '${c}' instead of '${targetChar}'. Final prefix: '${prefix}'`,
          done: true,
        });

        mismatchFound = true;
        break;
      }
    }

    if (mismatchFound) break;

    // All matched
    prefix += targetChar;
    steps.push({
      columnIndex: j,
      mismatchStringIndex: -1,
      prefix,
      message: `All strings have '${targetChar}' at index ${j}. Prefix so far: '${prefix}'`,
      done: false,
    });
  }

  // If we exhausted all columns without mismatch
  if (steps.length === 0 || !steps[steps.length - 1].done) {
    // Check if a string was too short (minLen < longest string)
    const maxLen = Math.max(...strs.map((s) => s.length));
    if (minLen < maxLen) {
      const shortIdx = strs.findIndex((s) => s.length === minLen);
      steps.push({
        columnIndex: minLen,
        mismatchStringIndex: shortIdx,
        prefix,
        message: `Mismatch found! String '${strs[shortIdx]}' is too short (length ${minLen}). Final prefix: '${prefix}'`,
        done: true,
      });
    } else {
      steps.push({
        columnIndex: minLen,
        mismatchStringIndex: -1,
        prefix,
        message: `All characters matched! Final prefix: '${prefix}'`,
        done: true,
      });
    }
  }

  return steps;
}

export default function LongestCommonPrefixVisualization() {
  const [inputValue, setInputValue] = useState("flower, flow, flight");
  const [strs, setStrs] = useState<string[]>(["flower", "flow", "flight"]);
  const [error, setError] = useState<string | null>(null);

  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const steps = useMemo(() => generateSteps(strs), [strs]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = parseStrings(raw);
    const err = validate(parsed);
    setError(err);
    if (!err) {
      setStrs(parsed);
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

  // Determine maximum string length for grid layout
  const maxLen = useMemo(() => Math.max(...strs.map((s) => s.length), 0), [strs]);

  // Determine the prefix length confirmed so far
  const confirmedPrefixLen = currentStep ? currentStep.prefix.length : 0;

  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>strs</span>
              <input
                style={INPUT_STYLE}
                value={inputValue}
                onChange={handleInputChange}
                placeholder='e.g. flower, flow, flight'
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
        {/* Current Prefix Display */}
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
            Prefix
          </div>
          <div
            style={{
              background: currentStep?.done ? "#166534" : "#1e293b",
              border: currentStep?.done ? "2px solid #22c55e" : "2px solid #334155",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 20,
              fontWeight: 700,
              color: currentStep?.done
                ? "#4ade80"
                : confirmedPrefixLen > 0
                  ? "#f8fafc"
                  : "#475569",
              fontFamily: "monospace",
              transition: "all 0.3s ease",
              minWidth: 80,
              minHeight: 36,
              display: "flex",
              alignItems: "center",
            }}
          >
            {confirmedPrefixLen > 0
              ? `"${currentStep?.prefix}"`
              : currentStep
                ? '""'
                : '""'}
          </div>
        </div>

        {/* String Grid */}
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
            Strings
          </div>

          {/* Column indices header */}
          <div style={{ display: "flex", gap: 0, marginBottom: 4, marginLeft: 90 }}>
            {Array.from({ length: maxLen }, (_, j) => (
              <div
                key={j}
                style={{
                  width: 40,
                  textAlign: "center",
                  fontSize: 11,
                  color: "#64748b",
                  fontFamily: "monospace",
                }}
              >
                {j}
              </div>
            ))}
          </div>

          {/* String rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {strs.map((str, rowIdx) => (
              <div key={rowIdx} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {/* String label */}
                <div
                  style={{
                    width: 86,
                    fontSize: 11,
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: 4,
                    flexShrink: 0,
                  }}
                  title={str}
                >
                  [{rowIdx}]
                </div>

                {/* Character cells */}
                {str.split("").map((char, colIdx) => {
                  const isInCurrentColumn =
                    currentStep && !currentStep.done && currentStep.columnIndex === colIdx;
                  const isConfirmedPrefix = colIdx < confirmedPrefixLen;
                  const isMismatchCell =
                    currentStep &&
                    currentStep.mismatchStringIndex === rowIdx &&
                    currentStep.columnIndex === colIdx &&
                    currentStep.mismatchStringIndex !== -1;

                  let bg = "#1e293b";
                  let borderColor = "#334155";
                  let textColor = "#f8fafc";

                  if (isMismatchCell) {
                    bg = "#7f1d1d";
                    borderColor = "#ef4444";
                    textColor = "#fca5a5";
                  } else if (isConfirmedPrefix) {
                    bg = "#166534";
                    borderColor = "#22c55e";
                    textColor = "#4ade80";
                  } else if (isInCurrentColumn) {
                    bg = "#1e40af";
                    borderColor = "#3b82f6";
                  }

                  return (
                    <div
                      key={colIdx}
                      style={{
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: bg,
                        borderRadius: 4,
                        fontSize: 16,
                        fontWeight: 600,
                        color: textColor,
                        border: `2px solid ${borderColor}`,
                        transition: "all 0.3s ease",
                        fontFamily: "monospace",
                        margin: "0 2px",
                      }}
                    >
                      {char}
                    </div>
                  );
                })}

                {/* Empty cells for shorter strings to maintain grid alignment */}
                {Array.from({ length: maxLen - str.length }, (_, colIdx) => {
                  const actualCol = str.length + colIdx;
                  const isInCurrentColumn =
                    currentStep && !currentStep.done && currentStep.columnIndex === actualCol;

                  return (
                    <div
                      key={`empty-${colIdx}`}
                      style={{
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isInCurrentColumn ? "#1e293b" : "#0f172a",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "#475569",
                        border: isInCurrentColumn
                          ? "2px dashed #3b82f6"
                          : "2px dashed #1e293b",
                        transition: "all 0.3s ease",
                        fontFamily: "monospace",
                        margin: "0 2px",
                      }}
                    >
                      -
                    </div>
                  );
                })}
              </div>
            ))}
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
