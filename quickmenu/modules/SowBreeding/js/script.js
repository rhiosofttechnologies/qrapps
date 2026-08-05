/* ---------------- APPEARANCE SYNC ---------------- */
function applySync() {
    const params = new URLSearchParams(window.location.search);
    const a = JSON.parse(localStorage.getItem('appearance')) || {};
    const theme = params.get('theme') || localStorage.getItem('theme') || 'light';
    const color = params.get('color') || a.color || '#2563eb';
    const title = params.get('title') || a.appTitle || 'Farm App';

    document.documentElement.style.setProperty('--primary', decodeURIComponent(color));
    document.body.classList.toggle('dark', theme === 'dark');
    const cleanTitle = decodeURIComponent(title);
    document.getElementById('appTitle').textContent = `Sow Records - ${cleanTitle}`;
}
window.addEventListener('storage', applySync);
applySync();

/* ---------------- DATA STORAGE ---------------- */
let records = JSON.parse(localStorage.getItem("stickyRecords")) || [];
let historyRecords = JSON.parse(localStorage.getItem("sowHistory")) || [];
let currentView = 'active';
let html5QrCode = null;

const save = () => {
    localStorage.setItem("stickyRecords", JSON.stringify(records));
    localStorage.setItem("sowHistory", JSON.stringify(historyRecords));
};

/* ---------------- SCANNER LOGIC ---------------- */
async function stopManualScanner() {
    if (html5QrCode) {
        if(html5QrCode.isScanning) await html5QrCode.stop();
        html5QrCode = null;
    }
}

async function startScanner(target) {
    await stopManualScanner();

    if (target === 'search') {
        await Swal.fire({
            title: 'Scan Pen QR',
            html: '<div id="reader" style="width:100%; min-height:250px; background:#000; border-radius:10px; overflow:hidden;"></div>',
            showConfirmButton: false,
            showCancelButton: true,
            didOpen: () => {
                html5QrCode = new Html5Qrcode("reader");
                html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
                    document.getElementById('searchInput').value = text;
                    render();
                    stopManualScanner().then(() => Swal.close());
                });
            },
            willClose: stopManualScanner
        });
    } else if (target === 'modal') {
        const overlay = document.createElement('div');
        overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:3000; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px;";
        overlay.innerHTML = `
            <div style="width:100%; max-width:400px; background:var(--card); padding:20px; border-radius:15px; text-align:center;">
                <h3 style="margin:0 0 15px 0; color:var(--text);">Scanning Pen QR...</h3>
                <div id="reader" style="width:100%; min-height:250px; background:#000; border-radius:10px; overflow:hidden;"></div>
                <button id="closeScan" style="margin-top:15px; width:100%; padding:12px; background:#dc2626; color:white; border:none; border-radius:8px; font-weight:bold;">Cancel Scan</button>
            </div>
        `;
        document.body.appendChild(overlay);

        html5QrCode = new Html5Qrcode("reader");
        document.getElementById('closeScan').onclick = async () => { await stopManualScanner(); overlay.remove(); };

        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
            const input = document.getElementById('sheet-qr');
            if(input) input.value = text;
            stopManualScanner().then(() => overlay.remove());
        }).catch(() => overlay.remove());
    }
}

/* ---------------- CORE UTILS ---------------- */
function getDaysSince(date) {
    const start = new Date(date).setHours(0,0,0,0);
    const today = new Date().setHours(0,0,0,0);
    return Math.floor((today - start) / 86400000);
}

function getOrdinalLabel(day) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = day % 100;
    return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]) + " Day";
}

function calcNotes(date){
    const dList = [21,42,90,100,115];
    const colors = ["#fff3a0","#ffd6a5","#fdffb6","#caffbf","#9bf6ff"];
    return dList.map((d,i) => {
        let nd = new Date(date); nd.setDate(nd.getDate() + d);
        return { day:d, date:nd.toISOString().split('T')[0], text:"", color:colors[i], done:false };
    });
}

/* ---------------- ANDROID-STYLE BOTTOM SHEET ---------------- */
function buildSheetFields(title, qr, date) {
    return `
        <div class="sheet-field">
            <label>Sow Name / ID</label>
            <input id="sheet-title" value="${title}" placeholder="e.g. Sow #204">
        </div>
        <div class="sheet-field">
            <label>Pen QR Tag</label>
            <div class="sheet-qr-row">
                <input id="sheet-qr" value="${qr}" placeholder="Scan or type pen tag">
                <button type="button" onclick="startScanner('modal')"><i class="fas fa-qrcode"></i></button>
            </div>
        </div>
        <div class="sheet-field">
            <label>Breeding Date</label>
            <input id="sheet-date" type="date" value="${date}">
        </div>
    `;
}

function openRecordSheet(headerTitle, title, qr, date, onSave) {
    closeBottomSheet(true);

    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.id = 'sheetBackdrop';

    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.id = 'bottomSheet';
    sheet.innerHTML = `
        <div class="sheet-handle-wrap" id="sheetHandle"><div class="sheet-handle"></div></div>
        <div class="sheet-header">${headerTitle}</div>
        <div class="sheet-body">${buildSheetFields(title, qr, date)}</div>
        <div class="sheet-footer">
            <button type="button" class="sheet-btn-cancel" onclick="closeBottomSheet()">Cancel</button>
            <button type="button" class="sheet-btn-save" id="sheetSaveBtn">Save</button>
        </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    document.body.style.overflow = 'hidden';

    backdrop.onclick = () => closeBottomSheet();

    document.getElementById('sheetSaveBtn').onclick = () => {
        const value = {
            title: document.getElementById('sheet-title').value,
            qr: document.getElementById('sheet-qr').value,
            date: document.getElementById('sheet-date').value
        };
        if (!value.date) {
            const dateInput = document.getElementById('sheet-date');
            dateInput.style.borderColor = '#dc2626';
            dateInput.focus();
            return;
        }
        closeBottomSheet();
        onSave(value);
    };

    // Drag-down-to-dismiss on the handle, Android bottom-sheet style
    let startY = 0, dragY = 0, dragging = false;
    const handle = document.getElementById('sheetHandle');

    const onDragStart = (y) => { dragging = true; startY = y; sheet.classList.add('dragging'); };
    const onDragMove = (y) => {
        if (!dragging) return;
        dragY = Math.max(0, y - startY);
        sheet.style.transform = `translateY(${dragY}px)`;
    };
    const onDragEnd = () => {
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove('dragging');
        if (dragY > 110) {
            closeBottomSheet();
        } else {
            sheet.style.transform = '';
        }
        dragY = 0;
    };

    handle.addEventListener('touchstart', e => onDragStart(e.touches[0].clientY), { passive: true });
    handle.addEventListener('touchmove', e => onDragMove(e.touches[0].clientY), { passive: true });
    handle.addEventListener('touchend', onDragEnd);
    handle.addEventListener('mousedown', e => onDragStart(e.clientY));
    window.addEventListener('mousemove', e => onDragMove(e.clientY));
    window.addEventListener('mouseup', onDragEnd);

    requestAnimationFrame(() => {
        backdrop.classList.add('show');
        sheet.classList.add('show');
    });
}

function closeBottomSheet(instant) {
    const backdrop = document.getElementById('sheetBackdrop');
    const sheet = document.getElementById('bottomSheet');
    if (!backdrop || !sheet) return;
    document.body.style.overflow = '';
    if (instant) { backdrop.remove(); sheet.remove(); return; }
    backdrop.classList.remove('show');
    sheet.classList.remove('show');
    setTimeout(() => { backdrop.remove(); sheet.remove(); }, 300);
}

/* ---------------- CRUD ---------------- */
function switchView(view) {
    currentView = view;
    document.getElementById('btnActive').classList.toggle('active', view === 'active');
    document.getElementById('btnHistory').classList.toggle('active', view === 'history');
    render();
}

function render(){
    const q = document.getElementById("searchInput").value.toLowerCase();
    const container = document.getElementById("records");
    container.innerHTML = "";
    const data = currentView === 'active' ? records : historyRecords;
    let shown = 0;

    data.forEach((r, i) => {
        if(!r.title.toLowerCase().includes(q) && !(r.qrCode && r.qrCode.toLowerCase().includes(q))) return;
        shown++;
        
        let daysPassed = getDaysSince(r.breedingDate);
        if(currentView === 'history' && daysPassed > 115) daysPassed = 115;
        const doneCount = r.notes.filter(n => n.done).length;
        const progress = (doneCount / 5) * 100;
        const eligible = currentView === 'active' && daysPassed >= 115;
        const qrIcon = (r.qrCode) ? '<i class="fas fa-qrcode qr-icon-on"></i>' : '<i class="fas fa-qrcode qr-icon-off"></i>';

        const rec = document.createElement("div");
        rec.className = `record ${r.collapsed ? 'collapsed' : ''}`;
        rec.innerHTML = `
            <div class="record-header" onclick="toggleRecord(${i})">
                <div class="record-main">
                    <div class="record-info">
                        <strong>${qrIcon} ${r.title}</strong>
                        <span class="day-badge">Day ${daysPassed} of 115</span>
                        <small class="qr-def">Pen: ${r.qrCode || 'No QR'}</small>
                        ${eligible ? '<br><span class="archive-badge">READY TO ARCHIVE</span>' : ''}
                    </div>
                    <div style="display:flex; gap:12px;">
                        <i class="fas fa-edit" onclick="event.stopPropagation(); editRecord(${i})"></i>
                        <i class="fas fa-trash" style="color:#dc2626" onclick="event.stopPropagation(); confirmDelete(${i})"></i>
                    </div>
                </div>
                <div class="progress-container"><div class="progress-bar" style="width:${progress}%"></div></div>
            </div>
            <div class="notes-grid"></div>
        `;

        const grid = rec.querySelector(".notes-grid");
        r.notes.forEach((n, ni) => {
            const card = document.createElement("div");
            card.className = "note-card";
            card.style.backgroundColor = n.color;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                    <b style="color:#333; font-size:10px;">${getOrdinalLabel(n.day)}</b>
                    ${n.done ? 
                        '<span style="background:#16a34a; color:#fff; font-size:8px; padding:2px 4px; border-radius:4px;">DONE</span>' : 
                        `<input type="checkbox" onclick="markNoteDone(${i}, ${ni})">`
                    }
                </div>
                <small style="color:#666">${new Date(n.date).toDateString()}</small>
                <textarea oninput="updateNote(${i}, ${ni}, this.value)" style="flex:1; border:none; resize:none; background:transparent; outline:none; font-size:11px; color:#333; width:100%;">${n.text}</textarea>
            `;
            grid.appendChild(card);
        });
        container.appendChild(rec);
    });

    if(shown === 0) {
        const noDataAtAll = data.length === 0;
        const isHistory = currentView === 'history';
        container.innerHTML = noDataAtAll
            ? (isHistory
                ? `<div class="empty-state">
                     <i class="fas fa-box-archive"></i>
                     <h3>No archived records</h3>
                     <p>Sows that reach Day 115 can be archived from the menu.</p>
                   </div>`
                : `<div class="empty-state">
                     <i class="fas fa-piggy-bank"></i>
                     <h3>No sow records yet</h3>
                     <p>Tap the + button to add your first breeding record.</p>
                   </div>`)
            : `<div class="empty-state">
                 <i class="fas fa-magnifying-glass"></i>
                 <h3>No matches found</h3>
                 <p>Try a different name or Pen QR.</p>
               </div>`;
    }
}

function openAddModal(){
    openRecordSheet('New Record', '', '', '', (value) => {
        records.push({ title: value.title, qrCode: value.qr, breedingDate: value.date, collapsed: true, notes: calcNotes(value.date) });
        save(); render();
    });
}

function editRecord(i){
    const data = currentView === 'active' ? records : historyRecords;
    const r = data[i];
    openRecordSheet('Edit Record', r.title, r.qrCode || '', r.breedingDate, (value) => {
        r.title = value.title; r.qrCode = value.qr;
        if(r.breedingDate !== value.date){ r.breedingDate = value.date; r.notes = calcNotes(value.date); }
        save(); render();
    });
}

function markNoteDone(ri, ni) { const data = currentView === 'active' ? records : historyRecords; data[ri].notes[ni].done = true; save(); render(); }
function toggleRecord(i) { const data = currentView === 'active' ? records : historyRecords; data[i].collapsed = !data[i].collapsed; save(); render(); }
function updateNote(ri, ni, val) { const data = currentView === 'active' ? records : historyRecords; data[ri].notes[ni].text = val; save(); }
function confirmDelete(i) { Swal.fire({title:'Delete?', showCancelButton:true, confirmButtonColor:'#dc2626'}).then(res => { if(res.isConfirmed){ if(currentView==='active')records.splice(i,1); else historyRecords.splice(i,1); save(); render(); }});}
function toggleMenu() { document.getElementById("dropdownMenu").classList.toggle("show"); }

function archiveCompleted() {
    const toArchive = records.filter(r => getDaysSince(r.breedingDate) >= 115);
    if (!toArchive.length) return Swal.fire("Notice", "Nothing to archive.", "info");
    historyRecords.push(...toArchive);
    records = records.filter(r => !toArchive.includes(r));
    save(); render();
}

function exportJSON() {
    const blob = new Blob([JSON.stringify({active:records, history:historyRecords})], {type: "application/json"});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "Sow_Records.json"; a.click();
}

function importJSON() {
    const inp = document.createElement('input'); inp.type = 'file';
    inp.onchange = e => {
        const reader = new FileReader();
        reader.onload = re => {
            const c = JSON.parse(re.target.result);
            records = c.active || []; historyRecords = c.history || [];
            save(); render();
        };
        reader.readAsText(e.target.files[0]);
    };
    inp.click();
}

render();