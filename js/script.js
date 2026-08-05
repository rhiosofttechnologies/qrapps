
/* ---------------- DOM ELEMENTS ---------------- */
const splash = document.getElementById('splash-screen');
const splashLogo = document.getElementById('splashLogo');
const splashTitle = document.getElementById('splashTitle');
const appLogo = document.getElementById('appLogo');
const appTitleEl = document.getElementById('appTitle');
const appFooter = document.getElementById('appFooter');
const themeIcon = document.getElementById('themeIcon');
const modulesEl = document.getElementById('modules');
const toolsEl = document.getElementById('tools');
const modal = document.getElementById('modal');
const iconSelect = document.getElementById('icon');
const labelInput = document.getElementById('label');
const descInput = document.getElementById('desc');
const linkInput = document.getElementById('link');

let modules = JSON.parse(localStorage.getItem('modules')||'[]');
let tools   = JSON.parse(localStorage.getItem('tools')||'[]');
let currentType = null;
let editIndex = null;

/* ---------------- INITIALIZATION ---------------- */
function initApp() {
  const a = JSON.parse(localStorage.getItem('appearance')) || { 
    color: '#2563eb', 
    footerText: '© 2026 Farm System', 
    footerHidden: false, 
    appTitle: 'QR Apps',
    font: "'Segoe UI', sans-serif"
  };
  
  applyLiveChanges(a);
  
  if(localStorage.getItem('theme')==='dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)){
    document.body.classList.add('dark');
    themeIcon.className='fas fa-sun';
  }

  setTimeout(() => { splash.classList.add('splash-hidden'); }, 2000);
}

function applyLiveChanges(data) {
    if(!data) return;
    if(data.color) {
        document.documentElement.style.setProperty('--primary', data.color);
        splash.style.backgroundColor = data.color;
    }
    if(data.logoBase64) {
        splashLogo.src = data.logoBase64;
        appLogo.src = data.logoBase64;
    }
    if(data.appTitle) {
        splashTitle.textContent = data.appTitle;
        appTitleEl.textContent = data.appTitle;
    }
    if(data.footerText) appFooter.textContent = data.footerText;
    if(data.font) document.documentElement.style.setProperty('--font-family', data.font);
    appFooter.style.display = data.footerHidden ? 'none' : 'flex';
}

/* Global Sync Listener to talk to other pages */
window.addEventListener('storage', (e) => {
    if (e.key === 'appearance') applyLiveChanges(JSON.parse(e.newValue));
    if (e.key === 'theme') {
        const isDark = e.newValue === 'dark';
        document.body.classList.toggle('dark', isDark);
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
});

initApp();

/* Helper for Syncing navigation */
function navigateWithSync(link) {
    if(!link) { Swal.fire('No link set'); return; }
    const a = JSON.parse(localStorage.getItem('appearance')) || {};
    const theme = localStorage.getItem('theme') || 'light';
    const separator = link.includes('?') ? '&' : '?';
    
    const syncUrl = `${link}${separator}theme=${theme}&color=${encodeURIComponent(a.color || '#2563eb')}&title=${encodeURIComponent(a.appTitle || 'QR Apps')}`;
    window.location.href = syncUrl;
}

/* ---------------- THEME & APPEARANCE ---------------- */
function toggleTheme(){
  const d = document.body.classList.toggle('dark');
  localStorage.setItem('theme', d ? 'dark' : 'light');
  themeIcon.className = d ? 'fas fa-sun' : 'fas fa-moon';
}

function openThemeChooser(){
  const a = JSON.parse(localStorage.getItem('appearance')) || { color:'#2563eb' };
  Swal.fire({
    title:'Theme Color',
    html:`<div style="display:flex;gap:10px;justify-content:center">
        <button class="c" data="#16a34a" style="background:#16a34a;width:40px;height:40px;border-radius:50%;border:none;cursor:pointer"></button>
        <button class="c" data="#92400e" style="background:#92400e;width:40px;height:40px;border-radius:50%;border:none;cursor:pointer"></button>
        <button class="c" data="#ea580c" style="background:#ea580c;width:40px;height:40px;border-radius:50%;border:none;cursor:pointer"></button>
        <button class="c" data="#7c3aed" style="background:#7c3aed;width:40px;height:40px;border-radius:50%;border:none;cursor:pointer"></button>
      </div><br>
      <input type="color" id="pick" value="${a.color}">`,
    showConfirmButton:false,
    didOpen(){
      document.querySelectorAll('.c').forEach(b=>{
        b.onclick=()=>{ updateAppearancePart('color', b.getAttribute('data')); };
      });
      document.getElementById('pick').oninput=e=>{ updateAppearancePart('color', e.target.value); };
    }
  });
}

function updateAppearancePart(key, val) {
    let a = JSON.parse(localStorage.getItem('appearance')) || {};
    a[key] = val;
    localStorage.setItem('appearance', JSON.stringify(a));
    applyLiveChanges(a);
}

function openAppearanceSettings(){
  const a = JSON.parse(localStorage.getItem('appearance')) || { color:'#2563eb', footerText:'© 2026 Farm System', footerHidden:false, appTitle:'QR Apps', font: "'Segoe UI', sans-serif" };
  Swal.fire({
    title:'Appearance Settings',
    html:`<div style="display:flex;flex-direction:column;gap:10px;text-align:left">
        <label>App Title</label><input id="atIn" value="${a.appTitle||''}" style="padding:8px">
        <label>Font Style</label><select id="afontIn" style="padding:8px;width:100%"><option value="'Segoe UI', sans-serif" ${a.font==="'Segoe UI', sans-serif"?'selected':''}>Sans-serif</option><option value="'Georgia', serif" ${a.font==="'Georgia', serif"?'selected':''}>Serif</option><option value="'Courier New', monospace" ${a.font==="'Courier New', monospace"?'selected':''}>Monospace</option></select>
        <label>Theme Color</label><input type="color" id="acIn" value="${a.color||'#2563eb'}" style="width:100%">
        <label>Logo</label><input type="file" id="alIn" accept="image/*">
        <label>Footer Text</label><input id="afIn" value="${a.footerText||''}" style="padding:8px">
        <label><input type="checkbox" id="ahIn" ${a.footerHidden?'checked':''}> Hide footer</label>
      </div>`,
    showCancelButton:true,
    preConfirm:()=>new Promise(res=>{
      const f=document.getElementById('alIn').files[0];
      const data={ appTitle:document.getElementById('atIn').value, font:document.getElementById('afontIn').value, color:document.getElementById('acIn').value, footerText:document.getElementById('afIn').value, footerHidden:document.getElementById('ahIn').checked };
      if(f){ const r=new FileReader(); r.onload=()=>{ data.logoBase64=r.result; res(data); }; r.readAsDataURL(f); } else { data.logoBase64=a.logoBase64; res(data); }
    })
  }).then(r=>{ if(r.isConfirmed){ localStorage.setItem('appearance', JSON.stringify(r.value)); applyLiveChanges(r.value); } });
}

/* ---------------- BACKUP & RESTORE ---------------- */
function exportData() {
    const data = {
        modules: JSON.parse(localStorage.getItem('modules') || '[]'),
        tools: JSON.parse(localStorage.getItem('tools') || '[]'),
        appearance: JSON.parse(localStorage.getItem('appearance') || '{}'),
        theme: localStorage.getItem('theme') || 'light'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm_app_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toggleDropdown();
}

/* ---------------- DATA RENDER ---------------- */
const allIcons = ['fas fa-qrcode','fas fa-barcode','fas fa-home','fas fa-user','fas fa-cog','fas fa-plus','fas fa-trash','fas fa-edit','fas fa-envelope','fas fa-phone','fas fa-heart','fas fa-star','fas fa-bell','fas fa-tractor','fas fa-seedling','fas fa-piggy-bank','fas fa-warehouse','fas fa-calendar-days','fas fa-baby','fas fa-dna','fas fa-syringe','fas fa-weighttree','fas fa-hand-holding-water','fas fa-wind','fas fa-leaf','fas fa-paw','fas fa-calculator'];

iconSelect.innerHTML = '';
allIcons.forEach(i=>{
    const o=document.createElement('option');
    o.value=i;
    o.textContent=i.replace('fas fa-','').replace(/-/g, ' ');
    iconSelect.appendChild(o);
});

function render(){
  modulesEl.innerHTML='';
  modules.forEach((m,i)=>{
    const div = document.createElement('div');
    div.className = 'box';
    div.innerHTML = `<i class="${m.icon}"></i><h3>${m.label}</h3><p>${m.desc}</p>`;
    div.onclick = ()=>{ navigateWithSync(m.link); };
    div.oncontextmenu = e=>{ e.preventDefault(); editItem('module',i); };
    modulesEl.appendChild(div);
  });
  toolsEl.innerHTML=`<div class="tool" onclick="openAdd('tool')"><i class="fas fa-plus"></i><span>Add tool</span></div>`;
  tools.forEach((t,i)=>{
    const div = document.createElement('div');
    div.className = 'tool';
    div.innerHTML = `<i class="${t.icon}"></i><span>${t.label}</span>`;
    div.onclick = ()=>{ navigateWithSync(t.link); };
    div.oncontextmenu = e=>{ e.preventDefault(); editItem('tool',i); };
    toolsEl.appendChild(div);
  });
}
render();

/* ---------------- CRUD ---------------- */
function openAdd(t){ 
  currentType = t; editIndex = null;
  iconSelect.value = allIcons[0]; labelInput.value = ''; descInput.value = ''; linkInput.value = ''; 
  modal.style.display = 'block'; 
}

function editItem(t, i){
  currentType = t; editIndex = i;
  const data = (t === 'module') ? modules[i] : tools[i];
  iconSelect.value = data.icon; labelInput.value = data.label; descInput.value = data.desc; linkInput.value = data.link;
  
  Swal.fire({
    title: 'Edit or Delete?', 
    showDenyButton: true, confirmButtonText: 'Edit', denyButtonText: 'Delete'
  }).then(r => {
    if(r.isDenied){
      Swal.fire({title: 'Delete?', showCancelButton: true}).then(x => {
        if(!x.isConfirmed) return;
        if(t === 'module') modules.splice(i, 1); else tools.splice(i, 1);
        saveToLocal(); render();
      });
    } else if(r.isConfirmed) modal.style.display = 'block';
  });
}

function save(){
  const obj = { icon: iconSelect.value, label: labelInput.value, desc: descInput.value, link: linkInput.value };
  if(editIndex !== null){
    if(currentType === 'module') modules[editIndex] = obj; else tools[editIndex] = obj;
  } else {
    if(currentType === 'module') modules.push(obj); else tools.push(obj);
  }
  saveToLocal(); modal.style.display = 'none'; render();
  Swal.fire('Saved','','success');
}

function saveToLocal(){
  localStorage.setItem('modules', JSON.stringify(modules));
  localStorage.setItem('tools', JSON.stringify(tools));
}

function closeModal(){ modal.style.display = 'none'; }
function toggleDropdown(){ const sd = document.getElementById('settingsDropdown'); sd.style.display = sd.style.display==='flex'?'none':'flex'; }
function askPassword(){ Swal.fire({title:'Enter Password', input:'password'}); }
