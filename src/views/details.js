import { $, loadData, formatCurrency } from '../utils.js';

export function renderDetails(){
  const main = $('#main');
  const data = loadData();
  const year = (new Date()).getFullYear();
  const months = new Array(12).fill(0);
  const categories = {};
  
  data.forEach(e=>{
    const d = new Date(e.date);
    if(d.getFullYear()===year){
      months[d.getMonth()] += Number(e.amount);
      const cat = e.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + Number(e.amount);
    }
  });
  
  const maxMonth = Math.max(...months, 1);
  const maxCat = Math.max(...Object.values(categories), 1);
  
  main.innerHTML = `
    <h2>Year ${year} - Spending Analysis</h2>
    
    <section style="margin:16px 0">
      <h3>Monthly Spending</h3>
      <table class="month-table"><thead><tr><th>Month</th><th>Amount</th><th>Trend</th></tr></thead>
        <tbody>${months.map((m,i)=>{
          const pct = Math.round((m/maxMonth)*100);
          return `<tr>
            <td>${i+1}</td>
            <td>${formatCurrency(m)}</td>
            <td><div style="background:#e2e8f0;border-radius:4px;height:20px;width:100px"><div style="background:#2b6cb0;height:100%;width:${pct}%;border-radius:4px"></div></div></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </section>
    
    <section style="margin:16px 0">
      <h3>Spending by Category</h3>
      <ul style="list-style:none;padding:0;margin:0">
        ${Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([cat, amount])=>{
          const pct = Math.round((amount/maxCat)*100);
          return `<li style="margin:8px 0">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span>${cat}</span><strong>${formatCurrency(amount)}</strong>
            </div>
            <div style="background:#e2e8f0;border-radius:4px;height:16px">
              <div style="background:#2b6cb0;height:100%;width:${pct}%;border-radius:4px"></div>
            </div>
          </li>`;
        }).join('')}
      </ul>
    </section>
    
    <button id="export" style="margin-top:16px">Export JSON</button>
  `;
  
  $('#export').addEventListener('click', ()=>{
    const a = document.createElement('a');
    a.href = '/api/export';
    a.download = 'expenses.json'; 
    a.click();
  });
}
