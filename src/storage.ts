import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const dir = join(homedir(), ".local", "share", "matrix-logs");
mkdirSync(dir, { recursive: true });

const db = new Database(join(dir, "logs.db"));

db.run(`
  CREATE TABLE IF NOT EXISTS logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   INTEGER NOT NULL,
    line         TEXT    NOT NULL,
    recorded_at  INTEGER DEFAULT (unixepoch())
  )
`);

export const SESSION_ID = Date.now();

const insertStmt = db.prepare("INSERT INTO logs (session_id, line) VALUES (?, ?)");
const clearStmt  = db.prepare("DELETE FROM logs WHERE session_id = ?");

export function insertLog(line: string) {
  insertStmt.run(SESSION_ID, line);
}

export function clearSession() {
  clearStmt.run(SESSION_ID);
}

export function getLastLogId(): number {
  const row = db.prepare("SELECT MAX(id) as id FROM logs WHERE session_id = ?").get(SESSION_ID) as { id: number | null };
  return row?.id ?? 0;
}

export function getLogsSince(id: number): string[] {
  const rows = db.prepare("SELECT line FROM logs WHERE session_id = ? AND id > ? ORDER BY id ASC").all(SESSION_ID, id) as { line: string }[];
  return rows.map(r => r.line);
}

export function getSessionLogCount(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM logs WHERE session_id = ?").get(SESSION_ID) as { count: number };
  return row.count;
}

// offset=0 → latest `limit` lines, offset=1 → one step older, etc.
// Returns oldest-first so index 0 = leftmost column
export function getLogsAtOffset(offset: number, limit: number): string[] {
  const rows = db.prepare(
    "SELECT line FROM logs WHERE session_id = ? ORDER BY id DESC LIMIT ? OFFSET ?"
  ).all(SESSION_ID, limit, offset) as { line: string }[];
  return rows.reverse().map(r => r.line);
}
