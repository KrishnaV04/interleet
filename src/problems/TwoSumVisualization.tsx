import { useState, useCallback } from "react";

interface StepState {
  currentIndex: number;
  hashMap: Record<number, number>;
  found: [number, number] | null;
  message: string;
  checking: number | null;
}

const INITIAL_NUMS = [2, 7, 11, 15];
const INITIAL_TARGET = 9;

export default function TwoSumVisualization() {
  const [nums] = useState(INITIAL_NUMS);
  const [target] = useState(INITIAL_TARGET);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  const generateSteps = useCallback((): StepState[] => {
    const steps: StepState[] = [];
    const hashMap: Record<number, number> = {};

    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];

      // Step: check if complement exists in hash
      if (complement in hashMap) {
        steps.push({
          currentIndex: i,
          hashMap: { ...hashMap },
          found: [hashMap[complement], i],
          message: `Found! nums[${hashMap[complement]}] + nums[${i}] = ${nums[hashMap[complement]]} + ${nums[i]} = ${target}`,
          checking: complement,
        });
        break;
      }

      // Step: show checking
      steps.push({
        currentIndex: i,
        hashMap: { ...hashMap },
        found: null,
        message: `Index ${i}: nums[${i}] = ${nums[i]}. Need complement ${complement}. Not in hash map.`,
        checking: complement,
      });

      // Step: add to hash
      hashMap[nums[i]] = i;
      steps.push({
        currentIndex: i,
        hashMap: { ...hashMap },
        found: null,
        message: `Store ${nums[i]} -> index ${i} in hash map.`,
        checking: null,
      });
    }

    return steps;
  }, [nums, target]);

  const steps = generateSteps();

  const currentState: StepState =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : {
          currentIndex: -1,
          hashMap: {},
          found: null,
          message: 'Press "Step" to walk through the algorithm, or "Play" to animate.',
          checking: null,
        };

  const stepForward = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const reset = () => {
    setStepIndex(-1);
    setIsRunning(false);
  };

  const play = async () => {
    setIsRunning(true);
    for (let i = stepIndex < 0 ? 0 : stepIndex + 1; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setStepIndex(i);
    }
    setIsRunning(false);
  };

  const isDone = stepIndex >= 0 && stepIndex === steps.length - 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
      {/* Target info */}
      <div style={{ textAlign: "center" }}>
        <span style={{ color: "#94a3b8", fontSize: 14 }}>Target = </span>
        <span style={{ color: "#f1fa8c", fontSize: 20, fontWeight: 700 }}>{target}</span>
      </div>

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
                    border: currentState.checking === Number(key) && currentState.found
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

      {/* Message */}
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

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={stepForward}
          disabled={isDone || isRunning}
          style={{
            padding: "10px 24px",
            background: isDone || isRunning ? "#334155" : "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: isDone || isRunning ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Step
        </button>
        <button
          onClick={play}
          disabled={isDone || isRunning}
          style={{
            padding: "10px 24px",
            background: isDone || isRunning ? "#334155" : "#8b5cf6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: isDone || isRunning ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {isRunning ? "Playing..." : "Play"}
        </button>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            background: "#1e293b",
            color: "#94a3b8",
            border: "1px solid #334155",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
