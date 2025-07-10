import Database from "better-sqlite3";

const db = new Database("arbitrage-history.db");

export function initDB() {
  db.exec(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY,
    timestamp INTEGER,
    token_in TEXT,
    token_out TEXT,
    amount_in TEXT,
    amount_out TEXT,
    profit_eth REAL,
    tx_hash TEXT,
    simulated INTEGER
  );`);
}

export function insertHistory({
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  profit,
  txHash,
  simulated,
}) {
  const stmt = db.prepare(
    `SELECT * FROM history WHERE token_in=? AND token_out=? AND ABS(profit_eth-?)<0.00001 AND timestamp>? ORDER BY timestamp DESC LIMIT 1`
  );
  const last = stmt.get(tokenIn, tokenOut, profit, Date.now() - 60000);
  if (last) return;

  db.prepare(
    `INSERT INTO history (timestamp, token_in, token_out, amount_in, amount_out, profit_eth, tx_hash, simulated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);`
  ).run(
    Date.now(),
    tokenIn,
    tokenOut,
    amountIn.toString(),
    amountOut.toString(),
    profit,
    txHash || null,
    simulated ? 1 : 0
  );
}

export function getRecentHistory(limit = 20) {
  return db
    .prepare(`SELECT * FROM history ORDER BY timestamp DESC LIMIT ?`)
    .all(limit);
}
