import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

interface Step {
  left: number;
  right: number;
  mid: number;
  status: "searching" | "found" | "insert";
  foundIndex: number; // index where target was found or insert position
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

function validate(numsStr: string, targetStr: string): string | null {
  if (targetStr.trim() === "" || isNaN(Number(targetStr)) || !Number.isInteger(Number(targetStr))) {
    return "Target must be a valid integer.";
  }
  const parts = numsStr.split(",").map((s) => s.trim());
  if (parts.some((p) => p === "" || isNaN(Number(p)) || !Number.isInteger(Number(p)))) {
    return "Each element must be a valid integer.";
  }
  const parsed = parts.map(Number);
  if (parsed.length < 1 || parsed.length > 20) {
    return "Array must have between 1 and 20 elements.";
  }
  // Check sorted ascending with distinct values
  for (let i = 1; i < parsed.length; i++) {
    if (parsed[i] <= parsed[i - 1]) {
      return "Array must be sorted in ascending order with distinct values.";
    }
  }
  return null;
}

function generateSteps(nums: number[], target: number): Step[] {
  const steps: Step[] = [];
  let left = 0;
  let right = nums.length - 1;

  steps.push({
    left,
    right,
    mid: -1,
    status: "searching",
    foundIndex: -1,
    message: `Binary search: target = ${target}, left = 0, right = ${nums.length - 1}.`,
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      left,
      right,
      mid,
      status: "searching",
      foundIndex: -1,
      message: `left = ${left}, right = ${right}, mid = ${mid}. nums[${mid}] = ${nums[mid]}.`,
    });

    if (nums[mid] === target) {
      steps.push({
        left,
        right,
        mid,
        status: "found",
        foundIndex: mid,
        message: `Found target ${target} at index ${mid}!`,
      });
      return steps;
    } else if (nums[mid] < target) {
      steps.push({
        left,
        right,
        mid,
        status: "searching",
        foundIndex: -1,
        message: `nums[${mid}] = ${nums[mid]} < ${target}. Search right half: left = ${mid + 1}.`,
      });
      left = mid + 1;
    } else {
      steps.push({
        left,
        right,
        mid,
        status: "searching",
        foundIndex: -1,
        message: `nums[${mid}] = ${nums[mid]} > ${target}. Search left half: right = ${mid - 1}.`,
      });
      right = mid - 1;
    }
  }

  steps.push({
    left,
    right,
    mid: -1,
    status: "insert",
    foundIndex: left,
    message: `Search complete. Insert position = ${left} (left pointer).`,
  });

  return steps;
}

export default function SearchInsertPositionVisualization() {
  const [numsInput, setNumsInput] = useState("1, 3, 5, 6");
  const [targetInput, setTargetInput] = useState("5");
  const [inputError, setInputError] = useState<string | null>(null);
  const [nums, setNums] = useState([1, 3, 5, 6]);
  const [target, setTarget] = useState(5);

  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const steps = useMemo(() => generateSteps(nums, target), [nums, target]);

  const handleNumsChange = useCallback(
    (value: string) => {
      setNumsInput(value);
      const err = validate(value, targetInput);
      setInputError(err);
      if (!err) {
        const parsed = value.split(",").map((s) => Number(s.trim()));
        setNums(parsed);
        setTarget(Number(targetInput));
        stopRef.current = true;
        setIsRunning(false);
        setStepIndex(-1);
      }
    },
    [targetInput]
  );

  const handleTargetChange = useCallback(
    (value: string) => {
      setTargetInput(value);
      const err = validate(numsInput, value);
      setInputError(err);
      if (!err) {
        const parsed = numsInput.split(",").map((s) => Number(s.trim()));
        setNums(parsed);
        setTarget(Number(value));
        stopRef.current = true;
        setIsRunning(false);
        setStepIndex(-1);
      }
    },
    [numsInput]
  );

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
  const logEntries = steps.slice(0, stepIndex + 1).map((s) => s.message);

  const currentStep: Step | null =
    stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null;

  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>nums</span>
              <input
                style={INPUT_STYLE}
                value={numsInput}
                onChange={(e) => handleNumsChange(e.target.value)}
                placeholder="e.g. 1, 3, 5, 6"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>target</span>
              <input
                style={{ ...INPUT_STYLE, width: 80 }}
                value={targetInput}
                onChange={(e) => handleTargetChange(e.target.value)}
                placeholder="e.g. 5"
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          height: "100%",
        }}
      >
        {/* Array display with pointer arrows */}
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
            {nums.map((num, i) => {
              let bg = "#1e293b";
              let borderColor = "#334155";
              let textColor = "#f8fafc";

              if (currentStep) {
                const isInRange =
                  currentStep.status === "searching" &&
                  i >= currentStep.left &&
                  i <= currentStep.right;
                const isMid =
                  currentStep.mid >= 0 && i === currentStep.mid;
                const isFound =
                  currentStep.status === "found" &&
                  i === currentStep.foundIndex;
                const isInsert =
                  currentStep.status === "insert" &&
                  i === currentStep.foundIndex;

                if (isFound) {
                  bg = "#166534";
                  borderColor = "#22c55e";
                } else if (isInsert) {
                  bg = "#1e40af";
                  borderColor = "#3b82f6";
                } else if (isMid) {
                  bg = "#713f12";
                  borderColor = "#f1fa8c";
                } else if (isInRange) {
                  bg = "#1e293b";
                  borderColor = "#475569";
                } else if (currentStep.status === "searching") {
                  // Outside search range
                  bg = "#0f172a";
                  borderColor = "#1e293b";
                  textColor = "#475569";
                }
              }

              // Determine which pointer labels to show
              const pointers: Array<{ label: string; color: string }> = [];
              if (currentStep) {
                if (
                  currentStep.status !== "found" &&
                  currentStep.status !== "insert"
                ) {
                  if (i === currentStep.left) pointers.push({ label: "L", color: "#3b82f6" });
                  if (i === currentStep.right) pointers.push({ label: "R", color: "#ef4444" });
                  if (currentStep.mid >= 0 && i === currentStep.mid)
                    pointers.push({ label: "M", color: "#f1fa8c" });
                }
                if (currentStep.status === "insert" && i === currentStep.foundIndex) {
                  pointers.push({ label: "insert", color: "#3b82f6" });
                }
                if (currentStep.status === "found" && i === currentStep.foundIndex) {
                  pointers.push({ label: "found", color: "#22c55e" });
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

                  {/* Value box */}
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
                      border: `2px solid ${borderColor}`,
                      transition: "all 0.3s ease",
                      fontFamily: "monospace",
                    }}
                  >
                    {num}
                  </div>

                  {/* Pointer labels below */}
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {pointers.map((p, pi) => (
                      <span
                        key={pi}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: p.color,
                          fontFamily: "monospace",
                        }}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Show insert marker after last element if insert position is at end */}
            {currentStep &&
              currentStep.status === "insert" &&
              currentStep.foundIndex === nums.length && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {nums.length}
                  </div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#1e40af",
                      borderRadius: 8,
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#f8fafc",
                      border: "2px dashed #3b82f6",
                      transition: "all 0.3s ease",
                      fontFamily: "monospace",
                    }}
                  >
                    {target}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#3b82f6",
                        fontFamily: "monospace",
                      }}
                    >
                      insert
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Pointer legend */}
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Pointers
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: "#3b82f6",
                }}
              />
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                L = left
                {currentStep && currentStep.status === "searching"
                  ? ` (${currentStep.left})`
                  : ""}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: "#ef4444",
                }}
              />
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                R = right
                {currentStep && currentStep.status === "searching"
                  ? ` (${currentStep.right})`
                  : ""}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: "#f1fa8c",
                }}
              />
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                M = mid
                {currentStep &&
                currentStep.status === "searching" &&
                currentStep.mid >= 0
                  ? ` (${currentStep.mid})`
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Current step message */}
        <div
          style={{
            background:
              currentStep?.status === "found"
                ? "#052e16"
                : currentStep?.status === "insert"
                ? "#0c1222"
                : "#0c1222",
            border:
              currentStep?.status === "found"
                ? "1px solid #166534"
                : "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px 16px",
            color:
              currentStep?.status === "found"
                ? "#4ade80"
                : currentStep?.status === "insert"
                ? "#8be9fd"
                : "#cbd5e1",
            fontSize: 14,
            lineHeight: 1.5,
            transition: "all 0.3s ease",
          }}
        >
          {currentStep
            ? currentStep.message
            : 'Press "Play" to animate the algorithm.'}
        </div>
      </div>
    </VisualizationLayout>
  );
}
