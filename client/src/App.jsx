import { useEffect, useState, useCallback, useRef } from "react";

// ===== Configuration =====
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const THEME_KEY = "mern-calculator-theme";
const CACHE_KEY = "mern-calculator-history";
const USER_ID_KEY = "mern-calculator-user-id";

// Generate unique user ID
function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// ===== Real Calculator Logic =====
// This works like a real calculator: left-to-right calculation, not BODMAS
class RealCalculator {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentValue = "0";
    this.previousValue = null;
    this.operator = null;
    this.waitingForOperand = false;
    this.expression = "";
    this.lastResult = null;
  }

  // Perform calculation between two numbers
  calculate(left, operator, right) {
    const a = parseFloat(left);
    const b = parseFloat(right);

    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
      case "×":
        return a * b;
      case "/":
      case "÷":
        if (b === 0) throw new Error("Cannot divide by zero");
        return a / b;
      case "%":
        return a % b;
      default:
        return b;
    }
  }

  // Format number for display
  formatDisplay(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    
    // Handle very large or small numbers
    if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-10 && num !== 0)) {
      return num.toExponential(6);
    }
    
    // Round to avoid floating point errors
    const rounded = Math.round(num * 1e12) / 1e12;
    const str = String(rounded);
    
    // Limit display length
    if (str.length > 12) {
      return parseFloat(rounded.toPrecision(10)).toString();
    }
    
    return str;
  }

  // Input a digit
  inputDigit(digit) {
    if (this.waitingForOperand) {
      this.currentValue = digit;
      this.waitingForOperand = false;
    } else {
      // Prevent multiple leading zeros
      if (this.currentValue === "0" && digit === "0") {
        return this.currentValue;
      }
      // Replace leading zero with digit
      if (this.currentValue === "0" && digit !== ".") {
        this.currentValue = digit;
      } else {
        // Limit input length
        if (this.currentValue.replace(/[-.]/g, "").length < 15) {
          this.currentValue += digit;
        }
      }
    }
    return this.currentValue;
  }

  // Input decimal point
  inputDecimal() {
    if (this.waitingForOperand) {
      this.currentValue = "0.";
      this.waitingForOperand = false;
      return this.currentValue;
    }

    if (!this.currentValue.includes(".")) {
      this.currentValue += ".";
    }
    return this.currentValue;
  }

  // Input operator (+, -, *, /)
  inputOperator(nextOperator) {
    const inputValue = parseFloat(this.currentValue);

    // If we already have an operator and a previous value, calculate first
    if (this.operator && !this.waitingForOperand) {
      try {
        const result = this.calculate(this.previousValue, this.operator, inputValue);
        this.currentValue = this.formatDisplay(result);
        this.previousValue = result;
        this.expression = `${this.formatDisplay(result)} ${this.getOperatorSymbol(nextOperator)}`;
      } catch (error) {
        this.currentValue = "Error";
        this.previousValue = null;
        this.operator = null;
        this.expression = "";
        return { display: "Error", expression: "" };
      }
    } else {
      this.previousValue = inputValue;
      this.expression = `${this.currentValue} ${this.getOperatorSymbol(nextOperator)}`;
    }

    this.waitingForOperand = true;
    this.operator = nextOperator;

    return {
      display: this.currentValue,
      expression: this.expression
    };
  }

  getOperatorSymbol(op) {
    const symbols = { "*": "×", "/": "÷" };
    return symbols[op] || op;
  }

  // Calculate result (equals button)
  equals() {
    if (!this.operator || this.previousValue === null) {
      // No operation pending, just return current value
      const expr = this.currentValue;
      const result = this.currentValue;
      this.lastResult = parseFloat(result);
      return { expression: expr, result, calculated: false };
    }

    const inputValue = parseFloat(this.currentValue);
    const fullExpression = `${this.formatDisplay(this.previousValue)} ${this.getOperatorSymbol(this.operator)} ${this.currentValue}`;

    try {
      const result = this.calculate(this.previousValue, this.operator, inputValue);
      const formattedResult = this.formatDisplay(result);

      this.currentValue = formattedResult;
      this.lastResult = result;
      this.previousValue = null;
      this.operator = null;
      this.waitingForOperand = true;
      this.expression = "";

      return {
        expression: fullExpression,
        result: formattedResult,
        calculated: true
      };
    } catch (error) {
      this.reset();
      return {
        expression: fullExpression,
        result: "Error",
        calculated: true,
        error: error.message
      };
    }
  }

  // Toggle sign (+/-)
  toggleSign() {
    const value = parseFloat(this.currentValue);
    this.currentValue = this.formatDisplay(-value);
    return this.currentValue;
  }

  // Percentage
  percentage() {
    const value = parseFloat(this.currentValue);
    this.currentValue = this.formatDisplay(value / 100);
    return this.currentValue;
  }

  // Square root
  squareRoot() {
    const value = parseFloat(this.currentValue);
    if (value < 0) {
      this.currentValue = "Error";
    } else {
      this.currentValue = this.formatDisplay(Math.sqrt(value));
    }
    return this.currentValue;
  }

  // Square (x²)
  square() {
    const value = parseFloat(this.currentValue);
    this.currentValue = this.formatDisplay(value * value);
    return this.currentValue;
  }

  // Reciprocal (1/x)
  reciprocal() {
    const value = parseFloat(this.currentValue);
    if (value === 0) {
      this.currentValue = "Error";
    } else {
      this.currentValue = this.formatDisplay(1 / value);
    }
    return this.currentValue;
  }

  // Clear entry (CE) - just clears current input
  clearEntry() {
    this.currentValue = "0";
    return this.currentValue;
  }

  // Clear all (AC)
  clearAll() {
    this.reset();
    return "0";
  }

  // Backspace - delete last digit
  backspace() {
    if (this.waitingForOperand) {
      return this.currentValue;
    }

    if (this.currentValue.length === 1 || 
        (this.currentValue.length === 2 && this.currentValue[0] === "-")) {
      this.currentValue = "0";
    } else {
      this.currentValue = this.currentValue.slice(0, -1);
    }
    return this.currentValue;
  }

  // Get current state
  getState() {
    return {
      display: this.currentValue,
      expression: this.expression,
      hasOperator: !!this.operator,
      operator: this.operator
    };
  }
}

// ===== Utility Functions =====
function formatTimestamp(value) {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

// ===== API Functions =====
async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

async function loadHistoryFromApi() {
  const userId = getUserId();
  return requestJson(`/history?userId=${userId}`);
}

async function saveHistoryToApi(entry) {
  const userId = getUserId();
  return requestJson("/history", {
    method: "POST",
    body: JSON.stringify({ ...entry, userId }),
  });
}

async function clearHistoryOnApi() {
  const userId = getUserId();
  return requestJson(`/history?userId=${userId}`, { method: "DELETE" });
}

// ===== Local Storage Functions =====
function readCachedHistory() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function storeCachedHistory(items) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(items));
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// ===== Icons =====
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5"/>
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
      <line x1="18" y1="9" x2="12" y2="15"/>
      <line x1="12" y1="9" x2="18" y2="15"/>
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10.01"/>
      <line x1="12" y1="10" x2="12" y2="10.01"/>
      <line x1="16" y1="10" x2="16" y2="10.01"/>
      <line x1="8" y1="14" x2="8" y2="14.01"/>
      <line x1="12" y1="14" x2="12" y2="14.01"/>
      <line x1="16" y1="14" x2="16" y2="14.01"/>
      <line x1="8" y1="18" x2="8" y2="18.01"/>
      <line x1="12" y1="18" x2="12" y2="18.01"/>
      <line x1="16" y1="18" x2="16" y2="18.01"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );
}

function FunctionsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 7c0-5.333-8-5.333-8 0v14"/>
      <path d="M6 17c0 2.667 4 2.667 4 0"/>
    </svg>
  );
}

// ===== Toast Component =====
function Toast({ message, show, type = "success" }) {
  return (
    <div className={`toast ${show ? "show" : ""} ${type}`}>
      <span className="toast-icon">
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      {message}
    </div>
  );
}

// ===== Calculator Button Component =====
function CalcButton({ label, display, type = "number", onClick, wide = false, tall = false, disabled = false, active = false }) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(null);
  const buttonRef = useRef(null);
  
  const handleClick = useCallback((e) => {
    if (disabled) return;
    
    // Create ripple effect
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, id: Date.now() });
    
    setPressed(true);
    onClick(label);
    setTimeout(() => setPressed(false), 100);
    setTimeout(() => setRipple(null), 500);
  }, [label, onClick, disabled]);
  
  const typeClass = {
    number: "calc-btn-number",
    operator: "calc-btn-operator",
    action: "calc-btn-action",
    equals: "calc-btn-equals",
    scientific: "calc-btn-scientific",
  }[type] || "calc-btn-number";
  
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`calc-btn ${typeClass} ${pressed ? "btn-press" : ""} ${wide ? "col-span-2" : ""} ${tall ? "row-span-2" : ""} ${active ? "btn-active" : ""}`}
    >
      {ripple && (
        <span 
          className="ripple" 
          style={{ left: ripple.x, top: ripple.y }}
        />
      )}
      <span className="btn-content">{display || label}</span>
    </button>
  );
}

// ===== History Item Component =====
function HistoryItem({ item, index, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="history-item"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="history-expression">{item.expression}</div>
      <div className="history-result">= {item.result}</div>
      <div className="history-time">{formatTimestamp(item.timestamp)}</div>
    </button>
  );
}

// ===== Main App Component =====
export default function App() {
  const [theme, setTheme] = useState(loadTheme);
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [activeOperator, setActiveOperator] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [showScientific, setShowScientific] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calculator instance
  const calculatorRef = useRef(new RealCalculator());
  const calc = calculatorRef.current;

  // Show toast notification
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 2500);
  }, []);

  // Update display from calculator state
  const updateDisplay = useCallback(() => {
    const state = calc.getState();
    setDisplay(state.display);
    setExpression(state.expression);
    setActiveOperator(state.hasOperator && calc.waitingForOperand ? state.operator : null);
  }, [calc]);

  // Animate result
  const animateResult = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Load history on mount
  useEffect(() => {
    let active = true;

    async function hydrateHistory() {
      try {
        const items = await loadHistoryFromApi();
        if (!active) return;
        setHistory(items);
        storeCachedHistory(items);
        setStatus("connected");
      } catch {
        const cached = readCachedHistory();
        if (!active) return;
        setHistory(cached);
        setStatus("offline");
      }
    }

    hydrateHistory();
    return () => { active = false; };
  }, []);

  // Handle number input
  const handleNumber = useCallback((num) => {
    calc.inputDigit(num);
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle decimal
  const handleDecimal = useCallback(() => {
    calc.inputDecimal();
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle operator
  const handleOperator = useCallback((op) => {
    calc.inputOperator(op);
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle equals
  const handleEquals = useCallback(async () => {
    const result = calc.equals();
    updateDisplay();
    animateResult();

    if (result.calculated && result.result !== "Error") {
      // Save to history
      const historyEntry = {
        expression: result.expression,
        result: result.result,
        timestamp: new Date().toISOString()
      };

      try {
        const savedItem = await saveHistoryToApi(historyEntry);
        const nextItem = savedItem && savedItem._id ? savedItem : {
          ...historyEntry,
          _id: `local-${Date.now()}`,
        };

        setHistory((current) => {
          const nextHistory = [nextItem, ...current.slice(0, 49)];
          storeCachedHistory(nextHistory);
          return nextHistory;
        });
        showToast("Saved to history");
      } catch {
        const localItem = {
          ...historyEntry,
          _id: `local-${Date.now()}`,
        };
        setHistory((current) => {
          const nextHistory = [localItem, ...current.slice(0, 49)];
          storeCachedHistory(nextHistory);
          return nextHistory;
        });
        showToast("Saved locally", "info");
      }
    } else if (result.error) {
      showToast(result.error, "error");
    }
  }, [calc, updateDisplay, animateResult, showToast]);

  // Handle clear
  const handleClear = useCallback(() => {
    calc.clearAll();
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle clear entry
  const handleClearEntry = useCallback(() => {
    calc.clearEntry();
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    calc.backspace();
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle toggle sign
  const handleToggleSign = useCallback(() => {
    calc.toggleSign();
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle percentage
  const handlePercentage = useCallback(() => {
    calc.percentage();
    updateDisplay();
  }, [calc, updateDisplay]);

  // Handle square root
  const handleSquareRoot = useCallback(() => {
    calc.squareRoot();
    updateDisplay();
    animateResult();
  }, [calc, updateDisplay, animateResult]);

  // Handle square
  const handleSquare = useCallback(() => {
    calc.square();
    updateDisplay();
    animateResult();
  }, [calc, updateDisplay, animateResult]);

  // Handle reciprocal
  const handleReciprocal = useCallback(() => {
    calc.reciprocal();
    updateDisplay();
    animateResult();
  }, [calc, updateDisplay, animateResult]);

  // Handle button click
  const handleInput = useCallback((value) => {
    switch (value) {
      case "0": case "1": case "2": case "3": case "4":
      case "5": case "6": case "7": case "8": case "9":
        handleNumber(value);
        break;
      case ".":
        handleDecimal();
        break;
      case "+": case "-": case "*": case "/":
        handleOperator(value);
        break;
      case "=":
        handleEquals();
        break;
      case "AC":
        handleClear();
        break;
      case "CE":
        handleClearEntry();
        break;
      case "⌫":
        handleBackspace();
        break;
      case "±":
        handleToggleSign();
        break;
      case "%":
        handlePercentage();
        break;
      case "√":
        handleSquareRoot();
        break;
      case "x²":
        handleSquare();
        break;
      case "1/x":
        handleReciprocal();
        break;
      default:
        break;
    }
  }, [handleNumber, handleDecimal, handleOperator, handleEquals, handleClear, 
      handleClearEntry, handleBackspace, handleToggleSign, handlePercentage,
      handleSquareRoot, handleSquare, handleReciprocal]);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (event) => {
      const { key } = event;

      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        handleNumber(key);
        return;
      }

      if (key === ".") {
        event.preventDefault();
        handleDecimal();
        return;
      }

      if (["+", "-", "*", "/"].includes(key)) {
        event.preventDefault();
        handleOperator(key);
        return;
      }

      if (key === "Enter" || key === "=") {
        event.preventDefault();
        handleEquals();
        return;
      }

      if (key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (key === "Escape" || key === "c" || key === "C") {
        event.preventDefault();
        handleClear();
        return;
      }

      if (key === "%") {
        event.preventDefault();
        handlePercentage();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNumber, handleDecimal, handleOperator, handleEquals, 
      handleBackspace, handleClear, handlePercentage]);

  // Clear history
  async function handleClearHistory() {
    try {
      await clearHistoryOnApi();
    } catch {
      // Continue even if API fails
    }
    setHistory([]);
    storeCachedHistory([]);
    showToast("History cleared");
  }

  // Restore from history
  function handleHistoryClick(item) {
    calc.reset();
    calc.currentValue = item.result;
    calc.waitingForOperand = true;
    updateDisplay();
    showToast("Result loaded");
  }

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  return (
    <>
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Toast Notification */}
      <Toast message={toast.message} show={toast.show} type={toast.type} />

      {/* Main Container */}
      <main className="app-container">
        <div className="app-wrapper">
          
          {/* Header */}
          <header className="app-header">
            <div className="header-brand">
              <div className="brand-icon">
                <CalculatorIcon />
              </div>
              <div>
                <h1 className="brand-title">Calculator</h1>
                <p className="brand-subtitle">MERN Stack Application</p>
              </div>
            </div>

            <div className="header-actions">
              {/* Status Badge */}
              <div className={`status-badge ${status}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {status === "connected" ? "Online" : status === "offline" ? "Offline" : "..."}
                </span>
              </div>

              {/* History Toggle (mobile) */}
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="history-toggle lg:hidden"
                title="Toggle History"
              >
                <HistoryIcon />
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle"
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                <span className="theme-icon">
                  {theme === "light" ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <div className="main-content">
            
            {/* Calculator */}
            <div className="calculator-wrapper">
              <div className="calculator">
                
                {/* Display */}
                <div className="calc-display">
                  <div className="display-expression">{expression || "\u00A0"}</div>
                  <div className={`display-value ${isAnimating ? "animate-pop" : ""}`}>
                    {display}
                  </div>
                  <div className="display-hint">
                    Use keyboard or click buttons
                  </div>
                </div>

                {/* Scientific Toggle */}
                <button
                  type="button"
                  onClick={() => setShowScientific(!showScientific)}
                  className="scientific-toggle"
                >
                  <FunctionsIcon />
                  <span>{showScientific ? "Hide" : "Show"} Functions</span>
                </button>

                {/* Scientific Buttons */}
                {showScientific && (
                  <div className="scientific-grid">
                    <CalcButton label="√" type="scientific" onClick={handleInput} />
                    <CalcButton label="x²" type="scientific" onClick={handleInput} />
                    <CalcButton label="1/x" type="scientific" onClick={handleInput} />
                    <CalcButton label="%" type="scientific" onClick={handleInput} />
                  </div>
                )}

                {/* Main Button Grid */}
                <div className="calc-grid">
                  <CalcButton label="AC" type="action" onClick={handleInput} />
                  <CalcButton label="CE" type="action" onClick={handleInput} />
                  <CalcButton label="⌫" type="action" onClick={handleInput} display={<DeleteIcon />} />
                  <CalcButton label="/" type="operator" onClick={handleInput} display="÷" active={activeOperator === "/"} />

                  <CalcButton label="7" type="number" onClick={handleInput} />
                  <CalcButton label="8" type="number" onClick={handleInput} />
                  <CalcButton label="9" type="number" onClick={handleInput} />
                  <CalcButton label="*" type="operator" onClick={handleInput} display="×" active={activeOperator === "*"} />

                  <CalcButton label="4" type="number" onClick={handleInput} />
                  <CalcButton label="5" type="number" onClick={handleInput} />
                  <CalcButton label="6" type="number" onClick={handleInput} />
                  <CalcButton label="-" type="operator" onClick={handleInput} active={activeOperator === "-"} />

                  <CalcButton label="1" type="number" onClick={handleInput} />
                  <CalcButton label="2" type="number" onClick={handleInput} />
                  <CalcButton label="3" type="number" onClick={handleInput} />
                  <CalcButton label="+" type="operator" onClick={handleInput} active={activeOperator === "+"} />

                  <CalcButton label="±" type="number" onClick={handleInput} />
                  <CalcButton label="0" type="number" onClick={handleInput} />
                  <CalcButton label="." type="number" onClick={handleInput} />
                  <CalcButton label="=" type="equals" onClick={handleInput} />
                </div>

              </div>
            </div>

            {/* History Panel */}
            <div className={`history-panel ${showHistory ? "show" : ""}`}>
              <div className="history-header">
                <div className="history-title">
                  <HistoryIcon />
                  <span>History</span>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="clear-history-btn"
                    title="Clear History"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>

              <div className="history-list">
                {history.length === 0 ? (
                  <div className="history-empty">
                    <div className="empty-icon">📝</div>
                    <p>No calculations yet</p>
                    <p className="empty-hint">Your history will appear here</p>
                  </div>
                ) : (
                  history.map((item, index) => (
                    <HistoryItem
                      key={item._id || index}
                      item={item}
                      index={index}
                      onClick={handleHistoryClick}
                    />
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <footer className="app-footer">
            <p>Built with React, Express, MongoDB & Node.js</p>
          </footer>

        </div>
      </main>
    </>
  );
}
