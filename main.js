import './styles.css';

let deferredPrompt = null;

function $(sel) { return document.querySelector(sel); }

// Lazy load view modules
const views = {
  '/': () => import('./views/dashboard.js').then(m => m.renderDashboard()),
  'details': () => import('./views/details.js').then(m => m.renderDetails()),
  'calendar': () => import('./views/calendar.js').then(m => m.renderCalendar())
};

function renderAppShell(){
  document.getElementById('app').innerHTML = `
    <header>
      <div style="display:flex;align-items:center;gap:12px"><h1 style="margin:0">PWA Costs</h1><small style="color:rgba(255,255,255,0.9)">— track daily & monthly spending</small></div>
      <nav><a href="#/">Dashboard</a> | <a href="#/calendar">Calendar</a> | <a href="#/details">Year Details</a> ${deferredPrompt ? ' | <a href="#" id="installApp" style="color:#fbbf24">📱 Install</a>' : ''}</nav>
    </header>
    <main id="main"></main>
    <div id="modal" class="modal" aria-hidden="true"><div class="panel" role="dialog" aria-modal="true"><button id="closeModal" style="float:right;background:transparent;border:none;font-size:20px">✕</button><div id="modalBody"></div></div></div>
    <div class="fab" id="openAdd" title="Add expense">＋</div>
    <footer>Offline-capable PWA · Simple budget tracker</footer>
  `;
  
  $('#closeModal').addEventListener('click', ()=>$('#modal').classList.remove('show'));
  
  // Add install handler if available
  if(deferredPrompt && $('#installApp')) {
    $('#installApp').addEventListener('click', async (e)=>{
      e.preventDefault();
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      deferredPrompt = null;
      location.reload();
    });
  }
}

async function router(){
  const path = location.hash.replace('#','') || '/';
  const view = path.split('/')[1] ? views[path.replace('#','')] : views['/'];
  
  if(!view) { 
    $('#main').innerHTML = '<h2>Page not found</h2>'; 
    return; 
  }
  
  try {
    await view();
  } catch(e) {
    console.error('View load error:', e);
    $('#main').innerHTML = '<h2>Error loading view</h2>';
  }
}

function registerSW(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
}

// Capture PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('PWA install prompt available');
});

renderAppShell();
window.addEventListener('hashchange', router);
router();
registerSW();
