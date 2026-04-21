import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Calculation from "../models/Calculation.js";
import { isMongoConnected } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "history.json");

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf8");
  }
}

async function readLocalHistory() {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalHistory(items) {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(items, null, 2), "utf8");
}

export async function getHistoryItems(userId) {
  if (isMongoConnected()) {
    const records = await Calculation.find({ userId }).sort({ timestamp: -1 }).lean();
    return records.map((record) => ({
      _id: String(record._id),
      userId: record.userId,
      expression: record.expression,
      result: record.result,
      timestamp: record.timestamp,
      source: "mongo",
    }));
  }

  const items = await readLocalHistory();
  const filtered = items.filter(item => item.userId === userId);
  return filtered.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
}

export async function addHistoryItem(entry) {
  const payload = {
    userId: entry.userId,
    expression: entry.expression,
    result: entry.result,
    timestamp: entry.timestamp || new Date().toISOString(),
    _id: entry._id || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source: isMongoConnected() ? "mongo" : "local",
  };

  if (isMongoConnected()) {
    const created = await Calculation.create({
      userId: payload.userId,
      expression: payload.expression,
      result: payload.result,
      timestamp: payload.timestamp,
    });

    return {
      _id: String(created._id),
      userId: created.userId,
      expression: created.expression,
      result: created.result,
      timestamp: created.timestamp,
      source: "mongo",
    };
  }

  const items = await readLocalHistory();
  items.unshift(payload);
  await writeLocalHistory(items);
  return payload;
}

export async function clearHistoryItems(userId) {
  if (isMongoConnected()) {
    await Calculation.deleteMany({ userId });
    return;
  }

  const items = await readLocalHistory();
  const filtered = items.filter(item => item.userId !== userId);
  await writeLocalHistory(filtered);
}