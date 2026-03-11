import { $, $$, loadData, formatCurrency, saveData } from '../utils.js';

export function renderCalendar(){
  const main = $('#main');
  const data = loadData();
  const now = new Date();
  let currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let touchStartX = 0;
  
  main.innerHTML = `
    <div class="calendar">
      <div class="calendar-header">
        <button id="prevMonth">← Prev</button>
        <h3 id="monthYear">${currentDate.toLocaleDateString('en-US', {month:'long',year:'numeric'})}</h3>
        <button id="nextMonth">Next →</button>
      </div>
      <div class="cal-grid" id="calGrid"></div>
    </div>
    <div class="day-view" id="dayView"></div>
  `;

  function renderCal(){
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    $('#monthYear').textContent = currentDate.toLocaleDateString('en-US', {month:'long',year:'numeric'});
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid = $('#calGrid');
    grid.innerHTML = 'SunMonTueWedThuFriSat'.match(/.{1,3}/g).map(d=>`<div class="cal-day-header">${d}</div>`).join('');
    
    // prev month days
    for(let i = firstDay - 1; i >= 0; i--){
      const d = daysInPrevMonth - i;
      grid.innerHTML += `<div class="cal-day other-month">${d}</div>`;
    }
    
    // current month
    const today = new Date().toISOString().slice(0,10);
    for(let d = 1; d <= daysInMonth; d++){
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const cls = dateStr === today ? 'today' : '';
      grid.innerHTML += `<div class="cal-day ${cls}" data-date="${dateStr}">${d}</div>`;
    }
    
    // next month days
    const totalCells = grid.children.length;
    for(let d = 1; totalCells + d <= 42; d++){
      grid.innerHTML += `<div class="cal-day other-month">${d}</div>`;
    }
  }
  
  function showDay(dateStr){
    const expenses = data.filter(e => e.date.slice(0,10) === dateStr).sort((a,b)=>a.date.localeCompare(b.date));
    const dayTotal = expenses.reduce((s,e)=>s+Number(e.amount),0);
    
    $('#dayView').innerHTML = `
      <h3>${dateStr}</h3>
      <p>Total: <strong>${formatCurrency(dayTotal)}</strong></p>
      <button id="addExpenseDay">Add Expense</button>
      <ul class="day-expenses" id="dayExpenses"></ul>
    `;
    
    const dayExpenses = $('#dayExpenses');
    dayExpenses.innerHTML = expenses.map(e=>`
      <li data-id="${e.id}">
        <div>
          <strong>${formatCurrency(e.amount)}</strong> 
          <span class="meta">${e.category||'–'} ${e.note?'· '+e.note:''}</span>
        </div>
        <button class="delete" data-id="${e.id}">✕</button>
      </li>
    `).join('');
    
    $('#addExpenseDay').addEventListener('click', ()=>{
      const modal = $('#modal');
      const modalBody = $('#modalBody');
      modalBody.innerHTML = `
        <h3>Add expense on ${dateStr}</h3>
        <form id="dayForm">
          <label>Amount <input type="number" step="0.01" name="amount" required autofocus></label>
          <label>Category <input name="category"></label>
          <label>Note <input name="note"></label>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button type="submit">Add</button>
            <button type="button" id="cancel">Cancel</button>
          </div>
        </form>
      `;
      modal.classList.add('show');
      modal.querySelector('#cancel').addEventListener('click', ()=>modal.classList.remove('show'));
      modal.querySelector('#dayForm').addEventListener('submit', (ev)=>{
        ev.preventDefault();
        const f = ev.target;
        const item = { 
          id: Date.now(), 
          date: dateStr, 
          amount: Number(f.amount.value), 
          category: f.category.value, 
          note: f.note.value 
        };
        data.push(item);
        saveData(data);
        modal.classList.remove('show');
        showDay(dateStr);
      });
    });
    
    dayExpenses.addEventListener('click', (ev)=>{
      if(!ev.target.classList.contains('delete')) return;
      if(!confirm('Delete?')) return;
      const id = ev.target.dataset.id;
      const remaining = data.filter(x=>String(x.id)!==String(id));
      saveData(remaining);
      showDay(dateStr);
    });
  }
  
  renderCal();
  showDay(now.toISOString().slice(0,10));
  
  $('#prevMonth').addEventListener('click', ()=>{
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCal();
  });
  
  $('#nextMonth').addEventListener('click', ()=>{
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCal();
  });
  
  $('#calGrid').addEventListener('click', (ev)=>{
    const day = ev.target.closest('.cal-day:not(.other-month)');
    if(!day) return;
    $$('.cal-day.selected').forEach(d=>d.classList.remove('selected'));
    day.classList.add('selected');
    showDay(day.dataset.date);
  });
  
  // Swipe support for month navigation
  $('#calGrid').addEventListener('touchstart', (e)=>{
    touchStartX = e.touches[0].clientX;
  }, {passive: true});
  
  $('#calGrid').addEventListener('touchend', (e)=>{
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if(Math.abs(diff) > 50) {
      if(diff > 0) $('#nextMonth').click();
      else $('#prevMonth').click();
    }
  }, {passive: true});
}
