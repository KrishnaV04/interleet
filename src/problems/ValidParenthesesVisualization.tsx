import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

/* ── Types ── */

interface StepState {
  /** Index of the character currently being processed (-1 = not started) */
  charIndex: number;
  /** Current stack contents (array of opening brackets) */
  stack: string[];
  /** Per-character status: "pending" | "active" | "matched" | "failed" */
  charStatuses: Array<"pending" | "active" | "matched" | "failed">;
  /** If a pop/match just happened, the index that was matched */
  matchedIndex: number | null;
  /** Whether the result is known: null = in-progress, true = valid, false = invalid */
  result: boolean | null;
  /** Log message for this step */
  message: string;
}

/* ── Constants ── */

const MATCHING: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const OPENERS = new Set(["(", "[", "{"]);
const VALID_CHARS = new Set(["(", ")", "[", "]", "{", "}"]);

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

/* ── Component ── */

export default function ValidParenthesesVisualization() {
  /* ── Input state ── */
  const [inputText, setInputText] = useState('({[]})');
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

  /* ── Validate & parse input ── */
  const parsedInput = useMemo<string | null>(() => {
    const s = inputText.trim();
    if (s.length === 0 || s.length > 30) {
      setInputError("Length must be 1–30.");
      return null;
    }
    for (const ch of s) {
      if (!VALID_CHARS.has(ch)) {
        setInputError(`Invalid character '${ch}'. Only ( ) { } [ ] allowed.`);
        return null;
      }
    }
    setInputError(null);
    return s;
  }, [inputText]);

  /* Reset step when input changes */
  useEffect(() => {
    stopRef.current = true;
    setIsRunning(false);
    setStepIndex(-1);
  }, [inputText]);

  /* ── Generate all algorithm steps ── */
  const steps = useMemo<StepState[]>(() => {
    if (!parsedInput) return [];
    const s = parsedInput;
    const result: StepState[] = [];
    const stack: string[] = [];
    // Track which indices in the original string correspond to stack entries
    const stackIndices: number[] = [];
    const statuses: Array<"pending" | "active" | "matched" | "failed"> = Array(s.length).fill("pending");

    // Step 0: Initialize
    result.push({
      charIndex: -1,
      stack: [],
      charStatuses: [...statuses],
      matchedIndex: null,
      result: null,
      message: "Initialize empty stack.",
    });

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];

      // Mark current char as active
      statuses[i] = "active";
      result.push({
        charIndex: i,
        stack: [...stack],
        charStatuses: [...statuses],
        matchedIndex: null,
        result: null,
        message: `Processing '${ch}' at index ${i}.`,
      });

      if (OPENERS.has(ch)) {
        // Push opening bracket
        stack.push(ch);
        stackIndices.push(i);
        statuses[i] = "matched"; // tentatively matched (on stack)
        result.push({
          charIndex: i,
          stack: [...stack],
          charStatuses: [...statuses],
          matchedIndex: null,
          result: null,
          message: `'${ch}' is an opening bracket. Push to stack. Stack: [${stack.join(", ")}]`,
        });
      } else {
        // Closing bracket
        if (stack.length === 0) {
          statuses[i] = "failed";
          result.push({
            charIndex: i,
            stack: [...stack],
            charStatuses: [...statuses],
            matchedIndex: null,
            result: false,
            message: `'${ch}' is closing but stack is empty — MISMATCH! Not valid.`,
          });
          return result;
        }
        const top = stack[stack.length - 1];
        const topIdx = stackIndices[stackIndices.length - 1];
        if (MATCHING[ch] === top) {
          stack.pop();
          stackIndices.pop();
          statuses[i] = "matched";
          result.push({
            charIndex: i,
            stack: [...stack],
            charStatuses: [...statuses],
            matchedIndex: topIdx,
            result: null,
            message: `'${ch}' is closing. Top of stack is '${top}' — match! Pop. Stack: [${stack.join(", ")}]`,
          });
        } else {
          statuses[i] = "failed";
          result.push({
            charIndex: i,
            stack: [...stack],
            charStatuses: [...statuses],
            matchedIndex: null,
            result: false,
            message: `'${ch}' is closing. Top of stack is '${top}' — MISMATCH! Not valid.`,
          });
          return result;
        }
      }
    }

    // Final step
    if (stack.length === 0) {
      result.push({
        charIndex: -1,
        stack: [],
        charStatuses: [...statuses],
        matchedIndex: null,
        result: true,
        message: "Stack is empty — Valid!",
      });
    } else {
      // Mark remaining stack chars as failed
      for (const idx of stackIndices) {
        statuses[idx] = "failed";
      }
      result.push({
        charIndex: -1,
        stack: [...stack],
        charStatuses: [...statuses],
        matchedIndex: null,
        result: false,
        message: `Stack not empty — Invalid. Remaining: [${stack.join(", ")}]`,
      });
    }

    return result;
  }, [parsedInput]);

  /* ── Current state ── */
  const currentState: StepState =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : {
          charIndex: -1,
          stack: [],
          charStatuses: parsedInput ? Array(parsedInput.length).fill("pending") : [],
          matchedIndex: null,
          result: null,
          message: 'Press "Play" to animate the algorithm.',
        };

  /* ── Playback controls ── */
  const play = useCallback(async () => {
    if (!parsedInput) return;
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
  }, [stepIndex, steps.length, parsedInput]);

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

  /* ── Helpers for rendering ── */
  const charBg = (status: "pending" | "active" | "matched" | "failed"): string => {
    switch (status) {
      case "active":
        return "#1e40af";
      case "matched":
        return "#166534";
      case "failed":
        return "#7f1d1d";
      default:
        return "#1e293b";
    }
  };
  const charBorder = (status: "pending" | "active" | "matched" | "failed"): string => {
    switch (status) {
      case "active":
        return "2px solid #3b82f6";
      case "matched":
        return "2px solid #22c55e";
      case "failed":
        return "2px solid #ef4444";
      default:
        return "2px solid #334155";
    }
  };

  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={LABEL_STYLE}>s</span>
              <input
                style={INPUT_STYLE}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='e.g. ({[]})'
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
        {/* ── Input String ── */}
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Characters */}
          <div style={{ flex: 1 }}>
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
              Input String
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {parsedInput &&
                parsedInput.split("").map((ch, i) => {
                  const status = currentState.charStatuses[i] || "pending";
                  const isPointer = currentState.charIndex === i;
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
                      <div style={{ fontSize: 10, color: "#64748b" }}>{i}</div>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: charBg(status),
                          borderRadius: 8,
                          fontSize: 22,
                          fontWeight: 700,
                          color: "#f8fafc",
                          border: charBorder(status),
                          transition: "all 0.3s ease",
                          fontFamily: "monospace",
                        }}
                      >
                        {ch}
                      </div>
                      {isPointer && (
                        <div style={{ fontSize: 14, color: "#3b82f6", fontWeight: 700 }}>^</div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ── Stack ── */}
          <div style={{ minWidth: 100 }}>
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
              Stack
            </div>
            <div
              style={{
                background: "#0f172a",
                borderRadius: 8,
                border: "1px solid #334155",
                padding: 12,
                minHeight: 60,
                display: "flex",
                flexDirection: "column-reverse",
                gap: 6,
                alignItems: "center",
              }}
            >
              {currentState.stack.length === 0 ? (
                <div style={{ color: "#475569", fontStyle: "italic", fontSize: 12 }}>Empty</div>
              ) : (
                currentState.stack.map((ch, i) => {
                  const isTop = i === currentState.stack.length - 1;
                  return (
                    <div
                      key={i}
                      style={{
                        width: 44,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isTop ? "#1e40af" : "#1e293b",
                        borderRadius: 8,
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#f8fafc",
                        border: isTop ? "2px solid #3b82f6" : "2px solid #334155",
                        transition: "all 0.3s ease",
                        fontFamily: "monospace",
                      }}
                    >
                      {ch}
                    </div>
                  );
                })
              )}
            </div>
            {currentState.stack.length > 0 && (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 10,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                top
              </div>
            )}
          </div>
        </div>

        {/* ── Current Step Message ── */}
        <div
          style={{
            background:
              currentState.result === true
                ? "#052e16"
                : currentState.result === false
                  ? "#450a0a"
                  : "#0c1222",
            border:
              currentState.result === true
                ? "1px solid #166534"
                : currentState.result === false
                  ? "1px solid #7f1d1d"
                  : "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px 16px",
            color:
              currentState.result === true
                ? "#4ade80"
                : currentState.result === false
                  ? "#f87171"
                  : "#cbd5e1",
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
