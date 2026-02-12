import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

interface Step {
  windowStart: number;
  compareIndex: number; // index within needle being compared (-1 if none)
  matchedCount: number; // how many chars matched so far at this window position
  status: "comparing" | "match" | "mismatch" | "found" | "not_found";
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

function validate(
  haystack: string,
  needle: string
): string | null {
  if (haystack.length === 0) return "Haystack cannot be empty.";
  if (haystack.length > 50) return "Haystack must be at most 50 characters.";
  if (needle.length === 0) return "Needle cannot be empty.";
  if (needle.length > 20) return "Needle must be at most 20 characters.";
  if (!/^[a-z]+$/.test(haystack))
    return "Haystack must contain only lowercase English letters.";
  if (!/^[a-z]+$/.test(needle))
    return "Needle must contain only lowercase English letters.";
  return null;
}

function generateSteps(haystack: string, needle: string): Step[] {
  const steps: Step[] = [];

  steps.push({
    windowStart: -1,
    compareIndex: -1,
    matchedCount: 0,
    status: "comparing",
    message: `Start searching for '${needle}' in '${haystack}'.`,
  });

  for (let i = 0; i <= haystack.length - needle.length; i++) {
    steps.push({
      windowStart: i,
      compareIndex: -1,
      matchedCount: 0,
      status: "comparing",
      message: `Try matching at position ${i}.`,
    });

    let matched = true;
    for (let j = 0; j < needle.length; j++) {
      const h = haystack[i + j];
      const n = needle[j];

      steps.push({
        windowStart: i,
        compareIndex: j,
        matchedCount: j,
        status: "comparing",
        message: `Compare haystack[${i + j}]='${h}' with needle[${j}]='${n}'.`,
      });

      if (h === n) {
        steps.push({
          windowStart: i,
          compareIndex: j,
          matchedCount: j + 1,
          status: "match",
          message: `Match at position ${i + j}!`,
        });
      } else {
        steps.push({
          windowStart: i,
          compareIndex: j,
          matchedCount: j,
          status: "mismatch",
          message: `Mismatch: haystack[${i + j}]='${h}' \u2260 needle[${j}]='${n}'. Move to next position.`,
        });
        matched = false;
        break;
      }
    }

    if (matched) {
      steps.push({
        windowStart: i,
        compareIndex: -1,
        matchedCount: needle.length,
        status: "found",
        message: `Found needle at index ${i}!`,
      });
      return steps;
    }
  }

  steps.push({
    windowStart: -1,
    compareIndex: -1,
    matchedCount: 0,
    status: "not_found",
    message: `Needle not found in haystack. Return -1.`,
  });

  return steps;
}

export default function FirstOccurrenceVisualization() {
  const [haystackInput, setHaystackInput] = useState("sadbutsad");
  const [needleInput, setNeedleInput] = useState("sad");
  const [inputError, setInputError] = useState<string | null>(null);
  const [haystack, setHaystack] = useState("sadbutsad");
  const [needle, setNeedle] = useState("sad");

  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const steps = useMemo(() => generateSteps(haystack, needle), [haystack, needle]);

  const handleHaystackChange = useCallback(
    (value: string) => {
      setHaystackInput(value);
      const err = validate(value, needleInput);
      setInputError(err);
      if (!err) {
        setHaystack(value);
        setNeedle(needleInput);
        stopRef.current = true;
        setIsRunning(false);
        setStepIndex(-1);
      }
    },
    [needleInput]
  );

  const handleNeedleChange = useCallback(
    (value: string) => {
      setNeedleInput(value);
      const err = validate(haystackInput, value);
      setInputError(err);
      if (!err) {
        setHaystack(haystackInput);
        setNeedle(value);
        stopRef.current = true;
        setIsRunning(false);
        setStepIndex(-1);
      }
    },
    [haystackInput]
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
              <span style={LABEL_STYLE}>haystack</span>
              <input
                style={INPUT_STYLE}
                value={haystackInput}
                onChange={(e) => handleHaystackChange(e.target.value)}
                placeholder='e.g. "sadbutsad"'
              />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>needle</span>
              <input
                style={{ ...INPUT_STYLE, width: 140 }}
                value={needleInput}
                onChange={(e) => handleNeedleChange(e.target.value)}
                placeholder='e.g. "sad"'
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
        {/* Haystack row */}
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
            Haystack
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {haystack.split("").map((char, i) => {
              let bg = "#1e293b";
              let borderColor = "#334155";
              let textColor = "#f8fafc";

              if (currentStep) {
                const ws = currentStep.windowStart;

                if (currentStep.status === "found") {
                  // Full match found — highlight all matched chars green
                  if (i >= ws && i < ws + needle.length) {
                    bg = "#166534";
                    borderColor = "#22c55e";
                  }
                } else if (currentStep.status === "not_found") {
                  // Not found — keep default
                } else if (ws >= 0 && i >= ws && i < ws + needle.length) {
                  const needleIdx = i - ws;

                  if (
                    currentStep.compareIndex >= 0 &&
                    needleIdx === currentStep.compareIndex
                  ) {
                    // Currently comparing this char
                    if (currentStep.status === "mismatch") {
                      bg = "#7f1d1d";
                      borderColor = "#ef4444";
                    } else if (currentStep.status === "match") {
                      bg = "#166534";
                      borderColor = "#22c55e";
                    } else {
                      bg = "#1e40af";
                      borderColor = "#3b82f6";
                    }
                  } else if (needleIdx < currentStep.matchedCount) {
                    // Already matched
                    bg = "#166534";
                    borderColor = "#22c55e";
                  } else if (needleIdx < (currentStep.compareIndex >= 0 ? currentStep.compareIndex : 0)) {
                    // Already matched (before current comparison)
                    bg = "#166534";
                    borderColor = "#22c55e";
                  } else {
                    // In window but not yet compared
                    bg = "#1e293b";
                    borderColor = "#475569";
                    textColor = "#94a3b8";
                  }
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
                  <div style={{ fontSize: 11, color: "#64748b" }}>{i}</div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: bg,
                      borderRadius: 8,
                      fontSize: 18,
                      fontWeight: 700,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      transition: "all 0.3s ease",
                      fontFamily: "monospace",
                    }}
                  >
                    {char}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needle row — aligned under haystack at current window position */}
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
            Needle {currentStep && currentStep.windowStart >= 0 && (
              <span style={{ color: "#64748b", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                (position {currentStep.windowStart})
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {/* Spacer boxes to align needle under the correct haystack position */}
            {currentStep && currentStep.windowStart >= 0 && (
              <>
                {Array.from({ length: currentStep.windowStart }).map((_, i) => (
                  <div
                    key={`spacer-${i}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "transparent" }}>0</div>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                      }}
                    />
                  </div>
                ))}
              </>
            )}
            {needle.split("").map((char, j) => {
              let bg = "#1e293b";
              let borderColor = "#334155";
              let textColor = "#f8fafc";

              if (currentStep && currentStep.windowStart >= 0) {
                if (currentStep.status === "found") {
                  bg = "#166534";
                  borderColor = "#22c55e";
                } else if (
                  currentStep.compareIndex >= 0 &&
                  j === currentStep.compareIndex
                ) {
                  if (currentStep.status === "mismatch") {
                    bg = "#7f1d1d";
                    borderColor = "#ef4444";
                  } else if (currentStep.status === "match") {
                    bg = "#166534";
                    borderColor = "#22c55e";
                  } else {
                    bg = "#1e40af";
                    borderColor = "#3b82f6";
                  }
                } else if (j < currentStep.matchedCount) {
                  bg = "#166534";
                  borderColor = "#22c55e";
                } else {
                  bg = "#1e293b";
                  borderColor = "#475569";
                  textColor = "#94a3b8";
                }
              } else {
                // Before any window position is set, show needle dimmed
                textColor = "#94a3b8";
                borderColor = "#334155";
              }

              return (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748b" }}>{j}</div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: bg,
                      borderRadius: 8,
                      fontSize: 18,
                      fontWeight: 700,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      transition: "all 0.3s ease",
                      fontFamily: "monospace",
                    }}
                  >
                    {char}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Window position indicator */}
        {currentStep && currentStep.windowStart >= 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
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
              Window
            </div>
            <div
              style={{
                background: "#1e293b",
                borderRadius: 6,
                padding: "6px 14px",
                border: "1px solid #334155",
                fontFamily: "monospace",
                fontSize: 13,
                color: "#8be9fd",
              }}
            >
              haystack[{currentStep.windowStart}..{currentStep.windowStart + needle.length - 1}]
              {" = '"}
              {haystack.slice(
                currentStep.windowStart,
                currentStep.windowStart + needle.length
              )}
              {"'"}
            </div>
          </div>
        )}

        {/* Current step message */}
        <div
          style={{
            background:
              currentStep?.status === "found"
                ? "#052e16"
                : currentStep?.status === "not_found"
                ? "#1c0a0a"
                : "#0c1222",
            border:
              currentStep?.status === "found"
                ? "1px solid #166534"
                : currentStep?.status === "not_found"
                ? "1px solid #7f1d1d"
                : "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px 16px",
            color:
              currentStep?.status === "found"
                ? "#4ade80"
                : currentStep?.status === "not_found"
                ? "#f87171"
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
