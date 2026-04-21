import { evaluateExpression, formatNumber, normalizeExpression } from "../../shared/evaluate.js";
import { addHistoryItem, clearHistoryItems, getHistoryItems } from "../utils/historyStore.js";

function getExpressionFromBody(body) {
  const rawExpression = body?.expression ?? body?.input ?? body?.formula ?? "";
  return normalizeExpression(rawExpression);
}

export async function calculate(req, res) {
  try {
    const expression = getExpressionFromBody(req.body);

    if (!expression) {
      return res.status(400).json({ message: "Expression is required." });
    }

    const result = evaluateExpression(expression);

    return res.json({
      expression,
      result: formatNumber(result),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Calculation failed." });
  }
}

export async function historyList(req, res) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }
    const items = await getHistoryItems(userId);
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch history." });
  }
}

export async function historyCreate(req, res) {
  try {
    const userId = req.body?.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }
    
    const expression = getExpressionFromBody(req.body);
    const result = req.body?.result ? String(req.body.result) : formatNumber(evaluateExpression(expression));

    if (!expression) {
      return res.status(400).json({ message: "Expression is required." });
    }

    const item = await addHistoryItem({
      userId,
      expression,
      result,
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Unable to save calculation." });
  }
}

export async function historyClear(req, res) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }
    await clearHistoryItems(userId);
    return res.json({ message: "History cleared." });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to clear history." });
  }
}