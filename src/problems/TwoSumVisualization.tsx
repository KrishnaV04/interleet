import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

interface StepState {
  currentIndex: number;
  hashMap: Record<number, number>;
  found: [number, number] | null;
  message: string;
  checking: number | null;
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

function hasTwoSumSolution(nums: number[], target: number): boolean {
  const seen = new Set<number>();
  for (const n of nums) {
    if (seen.has(target - n)) return true;
    seen.add(n);
  }
  return false;
}

export default function TwoSumVisualization() {
  const [numsInput, setNumsInput] = useState("2, 7, 11, 15");
  const [targetInput, setTargetInput] = useState("9");
  const [inputError, setInputError] = useState<string | null>(null);
  const [nums, setNums] = useState([2, 7, 11, 15]);
  const [target, setTarget] = useState(9);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const handleNumsChange = useCallback(
    (value: string) => {
      setNumsInput(value);
      const parts = value.split(",").map((s) => s.trim());
      if (parts.some((p) => p === "" || isNaN(Number(p)) || !Number.isInteger(Number(p)))) {
        setInputError("Each element must be a valid integer.");
        return;
      }
      const parsed = parts.map(Number);
      if (parsed.length < 2 || parsed.length > 20) {
        setInputError("Array must have between 2 and 20 elements.");
        return;
      }
      // Parse current target to validate pair existence
      const t = Number(targetInput);
      if (isNaN(t) || !Number.isInteger(t)) {
        setInputError("Target must be a valid integer.");
        return;
      }
      if (!hasTwoSumSolution(parsed, t)) {
        setInputError("No valid two-sum pair exists for this input and target.");
        return;
      }
      setInputError(null);
      setNums(parsed);
      setTarget(t);
      stopRef.current = true;
      setIsRunning(false);
      setStepIndex(-1);
    },
    [targetInput],
  );

  const handleTargetChange = useCallback(
    (value: string) => {
      setTargetInput(value);
      const t = Number(value);
      if (value.trim() === "" || isNaN(t) || !Number.isInteger(t)) {
        setInputError("Target must be a valid integer.");
        return;
      }
      // Parse current nums to validate pair existence
      const parts = numsInput.split(",").map((s) => s.trim());
      if (parts.some((p) => p === "" || isNaN(Number(p)) || !Number.isInteger(Number(p)))) {
        setInputError("Each element must be a valid integer.");
        return;
      }
      const parsed = parts.map(Number);
      if (parsed.length < 2 || parsed.length > 20) {
        setInputError("Array must have between 2 and 20 elements.");
        return;
      }
      if (!hasTwoSumSolution(parsed, t)) {
        setInputError("No valid two-sum pair exists for this input and target.");
        return;
      }
      setInputError(null);
      setNums(parsed);
      setTarget(t);
      stopRef.current = true;
      setIsRunning(false);
      setStepIndex(-1);
    },
    [numsInput],
  );

  const steps = useMemo((): StepState[] => {
    const result: StepState[] = [];
    const hashMap: Record<number, number> = {};

    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];

      if (complement in hashMap) {
        result.push({
          currentIndex: i,
          hashMap: { ...hashMap },
          found: [hashMap[complement], i],
          message: `Found! nums[${hashMap[complement]}] + nums[${i}] = ${nums[hashMap[complement]]} + ${nums[i]} = ${target}`,
          checking: complement,
        });
        break;
      }

      result.push({
        currentIndex: i,
        hashMap: { ...hashMap },
        found: null,
        message: `Index ${i}: nums[${i}] = ${nums[i]}. Need complement ${complement}. Not in hash map.`,
        checking: complement,
      });

      hashMap[nums[i]] = i;
      result.push({
        currentIndex: i,
        hashMap: { ...hashMap },
        found: null,
        message: `Store ${nums[i]} → index ${i} in hash map.`,
        checking: null,
      });
    }

    return result;
  }, [nums, target]);

  const currentState: StepState =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : {
          currentIndex: -1,
          hashMap: {},
          found: null,
          message: 'Press "Play" to animate the algorithm.',
          checking: null,
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
                placeholder="e.g. 2, 7, 11, 15"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>target</span>
              <input
                style={{ ...INPUT_STYLE, width: 80 }}
                value={targetInput}
                onChange={(e) => handleTargetChange(e.target.value)}
                placeholder="e.g. 9"
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
      {/* ── Visualization: Array + Hash Map ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
        {/* Array display */}
        <div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Array
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {nums.map((num, i) => {
              const isActive = currentState.currentIndex === i;
              const isFound = currentState.found?.includes(i);
              let bg = "#1e293b";
              if (isFound) bg = "#166534";
              else if (isActive) bg = "#1e40af";

              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>i={i}</div>
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
                      border: isActive ? "2px solid #3b82f6" : isFound ? "2px solid #22c55e" : "2px solid #334155",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {num}
                  </div>
                  {isActive && !isFound && <div style={{ fontSize: 18 }}>^</div>}
                  {isFound && <div style={{ fontSize: 14, color: "#22c55e" }}>found</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hash Map */}
        <div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            Hash Map
          </div>
          <div
            style={{
              background: "#0f172a",
              borderRadius: 8,
              border: "1px solid #334155",
              padding: 16,
              minHeight: 60,
            }}
          >
            {Object.keys(currentState.hashMap).length === 0 ? (
              <div style={{ color: "#475569", fontStyle: "italic" }}>Empty</div>
            ) : (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {Object.entries(currentState.hashMap).map(([key, idx]) => (
                  <div
                    key={key}
                    style={{
                      background: "#1e293b",
                      borderRadius: 6,
                      padding: "8px 14px",
                      border:
                        currentState.checking === Number(key) && currentState.found
                          ? "1px solid #22c55e"
                          : "1px solid #334155",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <span style={{ color: "#f1fa8c" }}>{key}</span>
                    <span style={{ color: "#475569", margin: "0 6px" }}>&rarr;</span>
                    <span style={{ color: "#8be9fd" }}>idx {idx}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current step message */}
        <div
          style={{
            background: currentState.found ? "#052e16" : "#0c1222",
            border: currentState.found ? "1px solid #166534" : "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px 16px",
            color: currentState.found ? "#4ade80" : "#cbd5e1",
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
