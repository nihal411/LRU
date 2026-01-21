async function api(path, opts) {
const res = await fetch(path, opts);
return res.json();
}


function log(msg) {
const el = document.getElementById('log');
const p = document.createElement('div');
p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
el.prepend(p);
}


function renderState(state) {
const area = document.getElementById('cacheArea');
area.innerHTML = '';
state.forEach(item => {
const d = document.createElement('div');
d.className = 'cacheItem';
d.innerHTML = `<div class="cacheKey">${item.k}</div><div class="cacheVal">${item.v}</div>`;
area.appendChild(d);
});
}


async function refresh() {
const r = await api('/api/state');
renderState(r.state);
}


window.addEventListener('load', async () => {
document.getElementById('putBtn').addEventListener('click', async () => {
const k = document.getElementById('putKey').value;
const v = document.getElementById('putVal').value;
if (!k) return alert('enter key');
const r = await api('/api/put', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key: k, value: v})});
if (r.evicted) log(`PUT ${r.key}=${r.value} — evicted ${r.evicted.k}=${r.evicted.v}`);
else log(`PUT ${r.key}=${r.value}`);
renderState(r.state);
});


document.getElementById('getBtn').addEventListener('click', async () => {
const k = document.getElementById('getKey').value;
if (!k) return alert('enter key');
const r = await api(`/api/get?key=${encodeURIComponent(k)}`);
if (r.value === -1) log(`GET ${r.key} => MISS`);
else log(`GET ${r.key} => ${r.value}`);
renderState(r.state);
});


});