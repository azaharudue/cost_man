import { $, loadData, loadBudgets, formatCurrency, getMonthKey, saveData, saveBudgets, exportData, importData } from '../utils.js';

export async function renderDashboard(){
  const main = $('#main');
  const data = loadData();
  const budgets = loadBudgets();
  const now = new Date();
  const monthKey = getMonthKey(now);
  const monthTotal = data.filter(e=>getMonthKey(e.date)===monthKey).reduce((s,e)=>s+Number(e.amount),0);
  const todayKey = now.toISOString().slice(0,10);
  const dayTotal = data.filter(e=>e.date.slice(0,10)===todayKey).reduce((s,e)=>s+Number(e.amount),0);
  
  // Previous month comparison
  const prevMonth = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const prevMonthKey = getMonthKey(prevMonth);
  const prevMonthTotal = data.filter(e=>getMonthKey(e.date)===prevMonthKey).reduce((s,e)=>s+Number(e.amount),0);
  const monthDiff = monthTotal - prevMonthTotal;
  const monthDiffPct = prevMonthTotal > 0 ? Math.round((monthDiff/prevMonthTotal)*100) : 0;
  
  // Budget status
  const monthAlert = monthTotal > budgets.monthly;
  const dayAlert = dayTotal > budgets.daily;

  main.innerHTML = `
    ${monthAlert ? `<div class="alert warning">⚠️ Monthly budget exceeded by ${formatCurrency(monthTotal - budgets.monthly)}</div>` : ''}
    ${dayAlert ? `<div class="alert danger">🚨 Daily budget exceeded by ${formatCurrency(dayTotal - budgets.daily)}</div>` : ''}
    
    <section class="cards">
      <div class="card">
        <h2>Monthly</h2>
        <div class="meter"><div class="fill" style="width:${Math.min(100, (monthTotal/budgets.monthly)*100)}%"></div></div>
        <p>${formatCurrency(monthTotal)} / ${formatCurrency(budgets.monthly)}</p>
        <small style="color:var(--muted)">vs last: ${formatCurrency(prevMonthTotal)} ${monthDiff >= 0 ? '+' : ''}${monthDiffPct}%</small>
      </div>
      <div class="card">
        <h2>Today</h2>
        <div class="meter"><div class="fill" style="width:${Math.min(100, (dayTotal/budgets.daily)*100)}%"></div></div>
        <p>${formatCurrency(dayTotal)} / ${formatCurrency(budgets.daily)}</p>
      </div>
    </section>

    <section class="budgets">
      <h3>⚙️ Settings</h3>
      <label>Monthly Budget <input id="budgetMonthly" type="number" step="0.01" value="${budgets.monthly}"></label>
      <label>Daily Budget <input id="budgetDaily" type="number" step="0.01" value="${budgets.daily}"></label>
      <div style="margin-top:12px">
        <button id="saveBudgets">Save Budgets</button>
        <button id="exportBtn" style="margin-left:8px">📥 Export</button>
        <button id="importBtn" style="margin-left:8px">📤 Import</button>
      </div>
      <input type="file" id="importFile" accept=".json" style="display:none">
    </section>

    <section class="filters">
      <h3>Filter</h3>
      <input type="text" id="searchBox" placeholder="Search by category or note..." style="width:100%;">
      <div id="categoryFilter" style="margin-top:8px"></div>
    </section>

    <section class="recent">
      <h3>Recent expenses</h3>
      <ul id="recentList"></ul>
    </section>
  `;

  // Build category buttons
  const categories = [...new Set(data.map(e=>e.category).filter(Boolean))];
  const categoryFilter = $('#categoryFilter');
  categoryFilter.innerHTML = categories.map(cat=>`<button class="cat-btn" data-cat="${cat}" style="margin:4px;padding:6px 12px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer">${cat}</button>`).join('');

  let filteredData = data;
  let selectedCats = new Set();

  function updateList(){
    const search = $('#searchBox').value.toLowerCase();
    filteredData = data.filter(e=>{
      const matchSearch = !search || e.category?.toLowerCase().includes(search) || e.note?.toLowerCase().includes(search);
      const matchCat = selectedCats.size === 0 || selectedCats.has(e.category);
      return matchSearch && matchCat;
    });
    
    const recentList = $('#recentList');
    const recent = filteredData.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
    recentList.innerHTML = recent.map(r=>`<li data-id="${r.id}"><div><strong>${r.date.slice(0,10)}</strong> <span class="meta">${formatCurrency(r.amount)}${r.category?` · ${r.category}`:''}</span><span class="badge">${r.note||''}</span></div><div class="actions"><button class="delete" data-id="${r.id}">Delete</button></div></li>`).join('');

    recentList.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('.delete'); 
      if(!btn) return;
      const id = btn.dataset.id;
      if(!confirm('Delete this expense?')) return;
      const remaining = loadData().filter(x=>String(x.id)!==String(id)); 
      saveData(remaining); 
      renderDashboard();
    });
  }

  // Category filter clicks
  categoryFilter.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('.cat-btn');
    if(!btn) return;
    const cat = btn.dataset.cat;
    if(selectedCats.has(cat)) selectedCats.delete(cat);
    else selectedCats.add(cat);
    btn.style.borderColor = selectedCats.has(cat) ? '#2b6cb0' : '#e2e8f0';
    btn.style.background = selectedCats.has(cat) ? '#edf2f7' : 'transparent';
    updateList();
  });

  $('#searchBox').addEventListener('input', updateList);

  // Modal + fab
  const modal = $('#modal');
  const modalBody = $('#modalBody');
  function openModal(){
    const now = new Date();
    modalBody.innerHTML = `
      <h3>Add expense</h3>
      <form id="expenseForm">
        <label>Date <input type="date" name="date" required value="${now.toISOString().slice(0,10)}"></label>
        <label>Amount <input type="number" step="0.01" name="amount" required></label>
        <label>Category <input name="category" list="categories"></label>
        <datalist id="categories">${categories.map(c=>`<option>${c}</option>`).join('')}</datalist>
        <label>Note <input name="note"></label>
        <div style="display:flex;gap:8px;margin-top:8px"><button type="submit">Add</button><button type="button" id="cancel">Cancel</button></div>
      </form>
    `;
    modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
    modal.querySelector('#cancel').addEventListener('click', closeModal);
    modal.querySelector('#expenseForm').addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const f = ev.target;
      const item = { id: Date.now(), date: f.date.value, amount: Number(f.amount.value), category: f.category.value, note: f.note.value };
      const all = loadData(); all.push(item); saveData(all); closeModal(); renderDashboard();
    });
  }
  function closeModal(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
  $('#openAdd').addEventListener('click', openModal);
  $('#closeModal').addEventListener('click', closeModal);

  $('#saveBudgets').addEventListener('click', ()=>{
    const b = { monthly: Number($('#budgetMonthly').value)||0, daily: Number($('#budgetDaily').value)||0 };
    saveBudgets(b); 
    renderDashboard();
  });
  
  $('#exportBtn').addEventListener('click', exportData);
  
  $('#importBtn').addEventListener('click', ()=>$('#importFile').click());
  $('#importFile').addEventListener('change', async (ev)=>{
    if(!ev.target.files[0]) return;
    try {
      await importData(ev.target.files[0]);
      alert('Data imported successfully!');
      renderDashboard();
    } catch(e) {
      alert('Import failed: ' + e.message);
    }
  });

  updateList();
}
