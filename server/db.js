const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data.db');

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT,
  note TEXT
);
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  monthly REAL DEFAULT 1000,
  daily REAL DEFAULT 50
);
INSERT OR IGNORE INTO budgets(id, monthly, daily) VALUES (1, 1000, 50);
`);

module.exports = {
  insertExpense({date, amount, category, note}){
    const stmt = db.prepare('INSERT INTO expenses(date, amount, category, note) VALUES (?, ?, ?, ?)');
    const info = stmt.run(date, amount, category||'', note||'');
    return info.lastInsertRowid;
  },
  allExpenses(){
    const stmt = db.prepare('SELECT * FROM expenses ORDER BY date DESC');
    return stmt.all();
  },
  deleteExpense(id){
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    return stmt.run(id);
  },
  getBudgets(){
    return db.prepare('SELECT monthly, daily FROM budgets WHERE id = 1').get();
  },
  setBudgets({monthly, daily}){
    return db.prepare('UPDATE budgets SET monthly = ?, daily = ? WHERE id = 1').run(monthly, daily);
  }
}
