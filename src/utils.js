const STORAGE_KEY = 'pwa_costs_data_v1';
const BUDGET_KEY = 'pwa_costs_budgets_v1';

export function $(sel) { return document.querySelector(sel); }
export function $$(sel) { return document.querySelectorAll(sel); }

export function loadData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadBudgets() {
  return JSON.parse(localStorage.getItem(BUDGET_KEY) || JSON.stringify({monthly: 1000, daily: 50}));
}

export function saveBudgets(b) { 
  localStorage.setItem(BUDGET_KEY, JSON.stringify(b)); 
}

export function formatCurrency(n){ 
  return '$' + Number(n).toFixed(2); 
}

export function getMonthKey(date){ 
  const d = new Date(date); 
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; 
}

export async function apiGet(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error('api error');
  return await r.json();
}

export async function apiPost(path, body){
  const r = await fetch(path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error('api error');
  return await r.json();
}

export async function apiDelete(path){
  const r = await fetch(path, { method: 'DELETE' });
  if(!r.ok) throw new Error('delete failed');
  return await r.json();
}

export async function fetchExpenses(){
  try{ return await apiGet('/api/expenses'); }catch(e){ return loadData(); }
}

export async function saveExpense(item){
  try{ await apiPost('/api/expenses', item); }catch(e){ 
    const data = loadData(); data.push(item); saveData(data); 
  }
}

export async function fetchBudgets(){
  try{ return await apiGet('/api/budgets'); }catch(e){ return loadBudgets(); }
}

export async function saveBudgetsToServer(b){
  try{ await apiPost('/api/budgets', b); }catch(e){ saveBudgets(b); }
}

export function exportData() {
  const data = loadData();
  const budgets = loadBudgets();
  const backup = { version: 1, timestamp: new Date().toISOString(), expenses: data, budgets };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pwa-costs-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if(!backup.expenses || !Array.isArray(backup.expenses)) throw new Error('Invalid backup');
        saveData(backup.expenses);
        if(backup.budgets) saveBudgets(backup.budgets);
        resolve(true);
      } catch(err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
