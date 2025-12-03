const displayEl = document.getElementById('display');
const previewEl = document.getElementById('preview');
const keys = document.querySelectorAll('.btn');
const themeToggle = document.getElementById('themeToggle');
const calcWrap = document.querySelector('.calculator-wrap');

let expr = '';
let justEvaluated = false; // flag to know if last action was '='
let history = []; // store past calculations

// inject small styles for faded preview, pop animation and history panel
(function injectStyles(){
  const css = `
  .preview.faded{opacity:0.7; font-size:13px; color:rgba(255,255,255,0.65); transition:opacity .18s ease, transform .18s ease}
  .display.result-pop{animation: resultPop .36s cubic-bezier(.2,.9,.3,1)}
  @keyframes resultPop{0%{transform:translateY(6px) scale(.98); opacity:0}60%{transform:translateY(-2px) scale(1.02); opacity:1}100%{transform:translateY(0) scale(1); opacity:1}}
  .history-panel{position:fixed; right:18px; top:18px; width:220px; max-height:70vh; overflow:auto; background: rgba(6,10,18,0.86); border-radius:10px; box-shadow:0 8px 30px rgba(2,6,23,0.6); padding:8px; color: #e6eef6; font-size:13px; z-index:9999}
  .history-panel h4{margin:4px 0 8px 0; font-size:13px}
  .history-item{padding:8px;border-radius:8px;margin-bottom:6px;background:rgba(255,255,255,0.02);cursor:pointer}
  .history-item small{display:block;color:#9aa6b2}
  .history-controls{display:flex;gap:6px; margin-bottom:8px}
  .history-btn{flex:1;padding:6px;border-radius:8px;border:0;background:#12212a;color:#cfeee0;cursor:pointer}
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
})();

function sanitize(raw){
  return raw
    .replace(/×/g,'*')
    .replace(/÷/g,'/')
    .replace(/−/g,'-');
}

function calc(raw){
  try{
    const cleaned = sanitize(raw);
    if(!/^[0-9+\-*/().]+$/.test(cleaned)) return null;
    const out = Function(`"use strict";return (${cleaned})`)();
    return (typeof out === 'number' && isFinite(out)) ? out : null;
  }catch{
    return null;
  }
}

function refresh(){
  displayEl.textContent = expr || '0';
}

function add(v){
  if(justEvaluated && /[0-9.]/.test(v)){
    expr = '';
    justEvaluated = false;
  } else if(justEvaluated && /[+\-*/]/.test(v)){
    justEvaluated = false; // allow chaining
  }
  expr += v;
  refresh();
}
function clearAll(){ expr = ''; justEvaluated = false; previewEl.textContent = ''; refresh(); }
function back(){
  if(justEvaluated){ expr = expr.slice(0,-1); justEvaluated = false; }
  else expr = expr.slice(0,-1);
  refresh();
}
function paren(){
  const open = (expr.match(/\(/g)||[]).length;
  const close = (expr.match(/\)/g)||[]).length;
  add(open > close ? ')' : '(');
}

// HISTORY UI
const historyPanel = document.createElement('div');
historyPanel.className = 'history-panel';
historyPanel.innerHTML = `
  <div class="history-controls">
    <button class="history-btn" id="use-last">Use last</button>
    <button class="history-btn" id="clear-history">Clear</button>
  </div>
  <h4>History</h4>
  <div id="historyList"></div>
`;
document.body.appendChild(historyPanel);
const historyListEl = historyPanel.querySelector('#historyList');
historyPanel.querySelector('#clear-history').addEventListener('click', ()=>{ history = []; renderHistory(); });
historyPanel.querySelector('#use-last').addEventListener('click', ()=>{ if(history.length){ const last = history[0]; expr = String(last.result); previewEl.textContent = `${last.expr} =`; refresh(); justEvaluated = true; add(''); } });

function renderHistory(){
  historyListEl.innerHTML = '';
  if(history.length === 0){ historyListEl.innerHTML = '<div style="opacity:.6;font-size:13px">No history yet</div>'; return; }
  history.forEach((h, idx)=>{
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `<strong>${h.result}</strong><small>${h.expr} =</small>`;
    item.addEventListener('click', ()=>{
      // when user clicks, load that result as current display
      expr = String(h.result);
      previewEl.textContent = h.expr + ' =';
      refresh();
      justEvaluated = true;
      // visually pop
      displayEl.classList.remove('result-pop');
      void displayEl.offsetWidth;
      displayEl.classList.add('result-pop');
    });
    historyListEl.appendChild(item);
  });
}

function pushHistory(exprStr, res){
  history.unshift({expr: exprStr, result: res});
  if(history.length > 100) history.pop();
  renderHistory();
}

keys.forEach(btn =>{
  btn.addEventListener('click', ()=>{
    const val = btn.dataset.value;
    const action = btn.dataset.action;

    if(action){
      if(action === 'clear') return clearAll();
      if(action === 'back') return back();
      if(action === 'paren') return paren();
      if(action === 'equals'){
        const rawExpr = expr;
        const result = calc(expr);
        if(result !== null){
          // faded preview on top
          previewEl.textContent = rawExpr + ' =';
          previewEl.classList.add('faded');

          // set result and animate
          expr = String(result);
          refresh();
          displayEl.classList.remove('result-pop');
          void displayEl.offsetWidth; // trigger reflow
          displayEl.classList.add('result-pop');

          justEvaluated = true;
          pushHistory(rawExpr, result);
        }
        return;
      }
    }

    if(val) add(val);
  });
});

window.addEventListener('keydown', e =>{
  if(/[0-9]/.test(e.key)){
    add(e.key);
    return;
  }

  if(['+','-','*','/','.','(',')'].includes(e.key)){
    add(e.key);
    return;
  }

  if(e.key === 'Enter' || e.key === '='){
    const rawExpr = expr;
    const r = calc(expr);
    if(r !== null){
      previewEl.textContent = rawExpr + ' =';
      previewEl.classList.add('faded');

      expr = String(r);
      refresh();
      displayEl.classList.remove('result-pop');
      void displayEl.offsetWidth;
      displayEl.classList.add('result-pop');

      justEvaluated = true;
      pushHistory(rawExpr, r);
    }
    return;
  }

  if(e.key === 'Backspace') return back();
  if(e.key === 'Escape') return clearAll();
});

themeToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('light');
});

clearAll();
renderHistory();
