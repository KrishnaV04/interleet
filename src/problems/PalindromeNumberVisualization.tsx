import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import VisualizationLayout from "../components/VisualizationLayout";

interface StepState {
  /** Digits of the original number */
  originalDigits: string[];
  /** Current remaining value of x */
  remaining: number;
  /** Current reversed half */
  reversed: number;
  /** The digit being moved this step, or null */
  movingDigit: number | null;
  /** Which digits (by index from right) have been moved to reversed */
  movedCount: number;
  /** Final result: true = palindrome, false = not, null = in progress */
  result: boolean | null;
  /** Whether this is an early-exit step (negative or trailing zero) */
  earlyExit: boolean;
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

const INT_MIN = -(2 ** 31);
const INT_MAX = 2 ** 31 - 1;

function generateSteps(x: number): StepState[] {
  const steps: StepState[] = [];
  const originalDigits = Math.abs(x).toString().split("");

  // Negative check
  if (x < 0) {
    steps.push({
      originalDigits,
      remaining: x,
      reversed: 0,
      movingDigit: null,
      movedCount: 0,
      result: false,
      earlyExit: true,
      message: `Check: x = ${x}. Negative numbers are not palindromes.`,
    });
    return steps;
  }

  // Trailing zero check
  if (x !== 0 && x % 10 === 0) {
    steps.push({
      originalDigits,
      remaining: x,
      reversed: 0,
      movingDigit: null,
      movedCount: 0,
      result: false,
      earlyExit: true,
      message: `Check: x = ${x} ends in 0 but isn't 0, so not a palindrome.`,
    });
    return steps;
  }

  // Initial step
  steps.push({
    originalDigits,
    remaining: x,
    reversed: 0,
    movingDigit: null,
    movedCount: 0,
    result: null,
    earlyExit: false,
    message: `Start: x = ${x}, reversed = 0. Reverse the second half of the number.`,
  });

  // Reversal loop
  let remaining = x;
  let reversed = 0;
  let movedCount = 0;

  while (remaining > reversed) {
    const digit = remaining % 10;
    const newReversed = reversed * 10 + digit;
    const newRemaining = Math.floor(remaining / 10);
    movedCount++;

    steps.push({
      originalDigits,
      remaining: newRemaining,
      reversed: newReversed,
      movingDigit: digit,
      movedCount,
      result: null,
      earlyExit: false,
      message: `x = ${remaining}, reversed = ${reversed}. Take last digit ${digit}, reversed becomes ${newReversed}. x becomes ${newRemaining}.`,
    });

    remaining = newRemaining;
    reversed = newReversed;
  }

  // Final comparison
  const isPalin = remaining === reversed || remaining === Math.floor(reversed / 10);
  const comparison =
    remaining === reversed
      ? `x === reversed (${remaining} === ${reversed})`
      : `x === floor(reversed/10) (${remaining} === ${Math.floor(reversed / 10)})`;

  steps.push({
    originalDigits,
    remaining,
    reversed,
    movingDigit: null,
    movedCount,
    result: isPalin,
    earlyExit: false,
    message: `Compare: x = ${remaining}, reversed = ${reversed}. ${comparison}: ${isPalin ? "true -- it is a palindrome!" : "false -- not a palindrome."}`,
  });

  return steps;
}

export default function PalindromeNumberVisualization() {
  const [xInput, setXInput] = useState("121");
  const [inputError, setInputError] = useState<string | null>(null);
  const [x, setX] = useState(121);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const handleXChange = useCallback((value: string) => {
    setXInput(value);
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "-") {
      setInputError("Please enter a valid integer.");
      return;
    }
    const n = Number(trimmed);
    if (isNaN(n) || !Number.isInteger(n)) {
      setInputError("Must be a valid integer.");
      return;
    }
    if (n < INT_MIN || n > INT_MAX) {
      setInputError(`Must be in range [${INT_MIN}, ${INT_MAX}].`);
      return;
    }
    setInputError(null);
    setX(n);
    stopRef.current = true;
    setIsRunning(false);
    setStepIndex(-1);
  }, []);

  const steps = useMemo(() => generateSteps(x), [x]);

  const currentState: StepState =
    stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex]
      : {
          originalDigits: Math.abs(x).toString().split(""),
          remaining: x,
          reversed: 0,
          movingDigit: null,
          movedCount: 0,
          result: null,
          earlyExit: false,
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

  // Derive digit display state
  const totalDigits = currentState.originalDigits.length;
  const isNegative = x < 0;
  const remainingDigits =
    currentState.remaining < 0
      ? []
      : currentState.remaining === 0 && currentState.movedCount > 0
        ? []
        : currentState.remaining.toString().split("");
  const reversedDigits =
    currentState.reversed === 0 && currentState.movedCount === 0
      ? []
      : currentState.reversed.toString().split("");

  return (
    <VisualizationLayout
      inputPanel={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={LABEL_STYLE}>x</span>
            <input
              style={INPUT_STYLE}
              value={xInput}
              onChange={(e) => handleXChange(e.target.value)}
              placeholder="e.g. 121"
            />
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
      <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
        {/* Original number display */}
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
            Original Number
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {isNegative && (
              <div
                style={{
                  width: 40,
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#3b1219",
                  borderRadius: 8,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#ef4444",
                  border: "2px solid #7f1d1d",
                }}
              >
                -
              </div>
            )}
            {currentState.originalDigits.map((digit, i) => {
              // Determine if this digit has been "moved" to the reversed side
              const digitIndexFromRight = totalDigits - 1 - i;
              const isMoved = digitIndexFromRight < currentState.movedCount;
              const isCurrentlyMoving =
                currentState.movingDigit !== null && digitIndexFromRight === currentState.movedCount - 1;

              let bg = "#1e293b";
              let borderColor = "#334155";
              if (currentState.result === true && isDone) {
                bg = "#166534";
                borderColor = "#22c55e";
              } else if (currentState.result === false && isDone) {
                bg = "#3b1219";
                borderColor = "#7f1d1d";
              } else if (isCurrentlyMoving) {
                bg = "#1e40af";
                borderColor = "#3b82f6";
              } else if (isMoved) {
                bg = "#0f172a";
                borderColor = "#1e293b";
              }

              return (
                <div
                  key={i}
                  style={{
                    width: 48,
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: bg,
                    borderRadius: 8,
                    fontSize: 22,
                    fontWeight: 700,
                    color: isMoved && !isCurrentlyMoving && currentState.result === null ? "#475569" : "#f8fafc",
                    border: `2px solid ${borderColor}`,
                    transition: "all 0.3s ease",
                  }}
                >
                  {digit}
                </div>
              );
            })}
          </div>
        </div>

        {/* Remaining and Reversed side by side */}
        {!currentState.earlyExit && (
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            {/* Remaining (x) */}
            <div style={{ flex: 1, minWidth: 160 }}>
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
                Remaining (x)
              </div>
              <div
                style={{
                  background: "#0f172a",
                  borderRadius: 8,
                  border: "1px solid #334155",
                  padding: 16,
                  minHeight: 60,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {remainingDigits.length === 0 ? (
                  <div style={{ color: "#475569", fontStyle: "italic" }}>0</div>
                ) : (
                  remainingDigits.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        width: 44,
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#1e293b",
                        borderRadius: 6,
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#8be9fd",
                        border: "1px solid #334155",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {d}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reversed */}
            <div style={{ flex: 1, minWidth: 160 }}>
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
                Reversed
              </div>
              <div
                style={{
                  background: "#0f172a",
                  borderRadius: 8,
                  border: "1px solid #334155",
                  padding: 16,
                  minHeight: 60,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {reversedDigits.length === 0 ? (
                  <div style={{ color: "#475569", fontStyle: "italic" }}>0</div>
                ) : (
                  reversedDigits.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        width: 44,
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#1e293b",
                        borderRadius: 6,
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#f1fa8c",
                        border: "1px solid #334155",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {d}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Moving digit indicator */}
        {currentState.movingDigit !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              background: "#1e293b",
              borderRadius: 8,
              border: "1px solid #3b82f6",
              width: "fit-content",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: 13 }}>Moving digit:</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                background: "#1e40af",
                borderRadius: 6,
                fontSize: 18,
                fontWeight: 700,
                color: "#f8fafc",
                border: "2px solid #3b82f6",
              }}
            >
              {currentState.movingDigit}
            </span>
            <span style={{ color: "#64748b", fontSize: 18 }}>&rarr;</span>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>appended to reversed</span>
          </div>
        )}

        {/* Result indicator */}
        {currentState.result !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              background: currentState.result ? "#052e16" : "#3b1219",
              border: currentState.result ? "1px solid #166534" : "1px solid #7f1d1d",
              borderRadius: 8,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: currentState.result ? "#22c55e" : "#ef4444",
              }}
            >
              {currentState.result ? "Palindrome" : "Not a Palindrome"}
            </span>
          </div>
        )}

        {/* Current step message */}
        <div
          style={{
            background:
              currentState.result === true
                ? "#052e16"
                : currentState.result === false
                  ? "#1c0a0a"
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
                  ? "#fca5a5"
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
