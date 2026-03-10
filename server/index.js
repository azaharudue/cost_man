const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API
app.get('/api/expenses', (req, res) => {
  const items = db.allExpenses();
  res.json(items);
});

app.post('/api/expenses', (req, res) => {
  const { date, amount, category, note } = req.body;
  const id = db.insertExpense({ date, amount, category, note });
  res.json({ id });
});

app.delete('/api/expenses/:id', (req, res) => {
  const id = req.params.id;
  db.deleteExpense(id);
  res.json({ ok: true });
});

app.get('/api/budgets', (req, res) => {
  res.json(db.getBudgets());
});

app.post('/api/budgets', (req, res) => {
  const { monthly, daily } = req.body;
  db.setBudgets({ monthly, daily });
  res.json({ ok: true });
});

app.get('/api/export', (req, res) => {
  const items = db.allExpenses();
  res.setHeader('Content-Type','application/json');
  res.send(JSON.stringify(items, null, 2));
});

// Serve static built frontend when deployed together
app.use(express.static(path.join(__dirname, '..')));

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log('Server listening on', port));
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Database = require('better-sqlite3');

const DB_FILE = path.join(__dirname, 'data.db');
const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');
db.prepare(`CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT,
  note TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY,
  monthly REAL,
  daily REAL
)`).run();

// ensure single budgets row
if(!db.prepare('SELECT COUNT(*) as c FROM budgets').get().c){
  db.prepare('INSERT INTO budgets(monthly,daily) VALUES(?,?)').run(1000,50);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/api/expenses', (req,res)=>{
  const rows = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  res.json(rows);
});

app.post('/api/expenses', (req,res)=>{
  const {date, amount, category, note} = req.body;
  if(!date || !amount) return res.status(400).json({error:'date and amount required'});
  const info = db.prepare('INSERT INTO expenses(date,amount,category,note) VALUES(?,?,?,?)').run(date, amount, category||null, note||null);
  const row = db.prepare('SELECT * FROM expenses WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

app.get('/api/budgets', (req,res)=>{
  const row = db.prepare('SELECT monthly,daily FROM budgets LIMIT 1').get();
  res.json(row);
});

app.put('/api/budgets', (req,res)=>{
  const {monthly,daily} = req.body;
  if(monthly==null || daily==null) return res.status(400).json({error:'monthly and daily required'});
  db.prepare('UPDATE budgets SET monthly=?, daily=? WHERE id=(SELECT id FROM budgets LIMIT 1)').run(monthly,daily);
  res.json({monthly,daily});
});

app.get('/api/months/:year', (req,res)=>{
  const year = Number(req.params.year);
  if(!year) return res.status(400).json({error:'invalid year'});
  const rows = db.prepare('SELECT date, amount FROM expenses WHERE substr(date,1,4)=?').all(String(year));
  const months = new Array(12).fill(0);
  rows.forEach(r=>{ const d=new Date(r.date); months[d.getMonth()] += Number(r.amount); });
  res.json({year, months});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));
