/**
 * Expression Evaluator
 * 
 * A safe mathematical expression parser and evaluator using the
 * Shunting-Yard algorithm to convert infix notation to Reverse Polish
 * Notation (RPN) before evaluation.
 * 
 * Supported operations:
 * - Basic: +, -, *, /, ^, %
 * - Functions: sqrt(), abs(), sin(), cos(), tan(), log(), ln()
 * - Constants: pi, e
 */

const OPERATORS = {
  "+": { precedence: 1, associativity: "left", arity: 2 },
  "-": { precedence: 1, associativity: "left", arity: 2 },
  "*": { precedence: 2, associativity: "left", arity: 2 },
  "/": { precedence: 2, associativity: "left", arity: 2 },
  "%": { precedence: 2, associativity: "left", arity: 2 },
  "^": { precedence: 3, associativity: "right", arity: 2 },
  "u-": { precedence: 4, associativity: "right", arity: 1 },
};

const FUNCTIONS = {
  sqrt: (x) => {
    if (x < 0) throw new Error("Cannot take square root of negative number");
    return Math.sqrt(x);
  },
  abs: (x) => Math.abs(x),
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  log: (x) => {
    if (x <= 0) throw new Error("Logarithm of non-positive number");
    return Math.log10(x);
  },
  ln: (x) => {
    if (x <= 0) throw new Error("Logarithm of non-positive number");
    return Math.log(x);
  },
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  round: (x) => Math.round(x),
};

const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
};

/**
 * Normalize expression by removing whitespace and replacing unicode operators
 */
export function normalizeExpression(expression = "") {
  return String(expression)
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi");
}

function isDigit(char) {
  return /[0-9]/.test(char);
}

function isLetter(char) {
  return /[a-zA-Z]/.test(char);
}

function isOperatorToken(token) {
  return token in OPERATORS;
}

function isFunctionToken(token) {
  return token in FUNCTIONS;
}

function isConstantToken(token) {
  return token in CONSTANTS;
}

/**
 * Tokenize the expression into numbers, operators, functions, and parentheses
 */
function tokenize(expression) {
  const input = normalizeExpression(expression);

  if (!input) {
    return [];
  }

  const tokens = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    // Parse numbers (including decimals)
    if (isDigit(char) || char === ".") {
      let number = "";
      let decimalCount = 0;

      while (index < input.length && (isDigit(input[index]) || input[index] === ".")) {
        if (input[index] === ".") {
          decimalCount += 1;
        }

        if (decimalCount > 1) {
          throw new Error("Invalid number format");
        }

        number += input[index];
        index += 1;
      }

      if (number === ".") {
        throw new Error("Invalid number format");
      }

      tokens.push(number);
      continue;
    }

    // Parse identifiers (functions and constants)
    if (isLetter(char)) {
      let identifier = "";

      while (index < input.length && isLetter(input[index])) {
        identifier += input[index];
        index += 1;
      }

      const lowerIdentifier = identifier.toLowerCase();

      // Check if it's a constant
      if (isConstantToken(lowerIdentifier)) {
        tokens.push(String(CONSTANTS[lowerIdentifier]));
        continue;
      }

      // Check if it's a function
      if (isFunctionToken(lowerIdentifier)) {
        tokens.push({ type: "function", name: lowerIdentifier });
        continue;
      }

      throw new Error(`Unknown identifier: ${identifier}`);
    }

    // Parse parentheses
    if (char === "(") {
      tokens.push(char);
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push(char);
      index += 1;
      continue;
    }

    // Parse operators
    if ("+-*/^%".includes(char)) {
      const previous = tokens[tokens.length - 1];
      const isUnaryMinus =
        char === "-" &&
        (!previous ||
          previous === "(" ||
          isOperatorToken(previous) ||
          (typeof previous === "object" && previous.type === "function"));

      tokens.push(isUnaryMinus ? "u-" : char);
      index += 1;
      continue;
    }

    // Skip commas (for function arguments, though we only support single-arg functions)
    if (char === ",") {
      index += 1;
      continue;
    }

    throw new Error(`Unsupported character: ${char}`);
  }

  return tokens;
}

/**
 * Convert tokens to Reverse Polish Notation using Shunting-Yard algorithm
 */
function toRpn(tokens) {
  const output = [];
  const operators = [];

  for (const token of tokens) {
    // Handle function tokens
    if (typeof token === "object" && token.type === "function") {
      operators.push(token);
      continue;
    }

    // Handle numbers
    if (typeof token === "string" && !Number.isNaN(Number(token))) {
      output.push(token);
      continue;
    }

    // Handle left parenthesis
    if (token === "(") {
      operators.push(token);
      continue;
    }

    // Handle right parenthesis
    if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        const op = operators.pop();
        if (typeof op === "object" && op.type === "function") {
          output.push(op);
        } else {
          output.push(op);
        }
      }

      if (!operators.length) {
        throw new Error("Mismatched parentheses");
      }

      operators.pop(); // Remove the left parenthesis

      // If there's a function on the stack, pop it to output
      if (
        operators.length &&
        typeof operators[operators.length - 1] === "object" &&
        operators[operators.length - 1].type === "function"
      ) {
        output.push(operators.pop());
      }

      continue;
    }

    // Handle operators
    if (isOperatorToken(token)) {
      const current = OPERATORS[token];

      while (operators.length) {
        const top = operators[operators.length - 1];

        // Skip if top is a function or parenthesis
        if (typeof top === "object" || top === "(") {
          break;
        }

        const topMeta = OPERATORS[top];

        if (!topMeta) {
          break;
        }

        const shouldPop =
          (current.associativity === "left" && current.precedence <= topMeta.precedence) ||
          (current.associativity === "right" && current.precedence < topMeta.precedence);

        if (!shouldPop) {
          break;
        }

        output.push(operators.pop());
      }

      operators.push(token);
      continue;
    }

    throw new Error(`Unsupported token: ${JSON.stringify(token)}`);
  }

  // Pop remaining operators
  while (operators.length) {
    const operator = operators.pop();

    if (operator === "(" || operator === ")") {
      throw new Error("Mismatched parentheses");
    }

    output.push(operator);
  }

  return output;
}

/**
 * Apply an operator to the stack
 */
function applyOperator(operator, stack) {
  const meta = OPERATORS[operator];

  if (!meta) {
    throw new Error(`Unknown operator: ${operator}`);
  }

  // Unary operators
  if (meta.arity === 1) {
    const value = stack.pop();

    if (typeof value !== "number") {
      throw new Error("Invalid expression");
    }

    stack.push(-value);
    return;
  }

  // Binary operators
  const right = stack.pop();
  const left = stack.pop();

  if (typeof left !== "number" || typeof right !== "number") {
    throw new Error("Invalid expression");
  }

  switch (operator) {
    case "+":
      stack.push(left + right);
      return;
    case "-":
      stack.push(left - right);
      return;
    case "*":
      stack.push(left * right);
      return;
    case "/":
      if (right === 0) {
        throw new Error("Division by zero");
      }
      stack.push(left / right);
      return;
    case "%":
      if (right === 0) {
        throw new Error("Modulo by zero");
      }
      stack.push(left % right);
      return;
    case "^":
      stack.push(Math.pow(left, right));
      return;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

/**
 * Apply a function to the stack
 */
function applyFunction(funcToken, stack) {
  const func = FUNCTIONS[funcToken.name];

  if (!func) {
    throw new Error(`Unknown function: ${funcToken.name}`);
  }

  const value = stack.pop();

  if (typeof value !== "number") {
    throw new Error("Invalid function argument");
  }

  stack.push(func(value));
}

/**
 * Evaluate a mathematical expression
 * @param {string} expression - The expression to evaluate
 * @returns {number} The result
 */
export function evaluateExpression(expression) {
  const tokens = tokenize(expression);

  if (!tokens.length) {
    throw new Error("Empty expression");
  }

  const rpn = toRpn(tokens);
  const stack = [];

  for (const token of rpn) {
    // Handle function tokens
    if (typeof token === "object" && token.type === "function") {
      applyFunction(token, stack);
      continue;
    }

    // Handle operator tokens
    if (isOperatorToken(token)) {
      applyOperator(token, stack);
      continue;
    }

    // Handle number tokens
    const numericValue = Number(token);

    if (Number.isNaN(numericValue)) {
      throw new Error(`Invalid number: ${token}`);
    }

    stack.push(numericValue);
  }

  if (stack.length !== 1) {
    throw new Error("Invalid expression");
  }

  const result = stack[0];

  if (!Number.isFinite(result)) {
    throw new Error("Invalid calculation result");
  }

  return result;
}

/**
 * Format a number for display
 * @param {number} value - The number to format
 * @returns {string} The formatted number
 */
export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  // Handle very small numbers
  if (Math.abs(value) < 1e-10 && value !== 0) {
    return value.toExponential(6);
  }

  // Handle very large numbers
  if (Math.abs(value) >= 1e12) {
    return value.toExponential(6);
  }

  // Regular formatting
  const rounded = Number.parseFloat(Number(value).toPrecision(12));
  
  // Format with locale-aware thousands separator for large integers
  if (Number.isInteger(rounded) && Math.abs(rounded) >= 1000) {
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  
  return String(rounded);
}
