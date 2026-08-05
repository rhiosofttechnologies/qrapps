let data = JSON.parse(localStorage.getItem("sowData")) || {};
let html5QrCode, activeScanTarget, editSowKey, currentSow, editNoteIdx, isPigletNote;
const noteColors = ["#FEF9C3", "#DCFCE7", "#DBEAFE", "#FEE2E2", "#F3E8FF"];

/* --- THEME SYNC ENGINE --- */
function applyTheme() {
    const theme = localStorage.getItem('theme');
    const appearance = JSON.parse(localStorage.getItem('appearance')) || {};
    
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    
    if (appearance.color) {
        document.documentElement.style.setProperty('--primary', appearance.color);
        document.documentElement.style.setProperty('--primary-light', appearance.color + '1A');
    }
}
// Listen to focus and changes from main app
window.addEventListener('focus', applyTheme);
setInterval(applyTheme, 1000); // Polling for fast sync
applyTheme();

/* --- QR LOGIC --- */
function startScanner(target) {
    activeScanTarget = target;
    document.getElementById('qr-reader-container').style.display = 'flex';
    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
        if(activeScanTarget === 'search') { document.getElementById('searchInput').value = text; render(); }
        else { document.getElementById('qrId').value = text; }
        stopScanner();
    }).catch(() => {
        Swal.fire("Camera Error", "Check permissions or use HTTPS", "error");
        stopScanner();
    });
}

function stopScanner() {
    if(html5QrCode) {
        html5QrCode.stop().then(() => { 
            document.getElementById('qr-reader-container').style.display = 'none'; 
            html5QrCode = null;
        });
    } else {
        document.getElementById('qr-reader-container').style.display = 'none';
    }
}

/* --- CRUD LOGIC --- */
function saveRecord() {
    const name = document.getElementById('sowName').value;
    if(!name) return Swal.fire("Required", "Sow Name is needed", "warning");
    
    const r = {
        qrId: document.getElementById('qrId').value,
        bornDate: document.getElementById('bornDate').value,
        parity: document.getElementById('parity').value,
        alive: document.getElementById('alive').value,
        still: document.getElementById('still').value,
        mummified: document.getElementById('mummified').value || 0,
        wean: document.getElementById('wean').value,
        deaths: document.getElementById('deaths').value
    };

    if(editSowKey) {
        if(name !== editSowKey) { data[name] = data[editSowKey]; delete data[editSowKey]; }
        data[name].records[data[name].records.length-1] = r;
    } else {
        data[name] = data[name] || { records: [], notes: [], pigletNotes: [] };
        data[name].records.push(r);
        addDefaultPiglets(name, r.bornDate);
    }
    localStorage.setItem("sowData", JSON.stringify(data));
    closeModal(); render();
}

function addDefaultPiglets(sow, bDay) {
    if(!bDay) return;
    const add = (days) => { let d = new Date(bDay); d.setDate(d.getDate()+days); return d.toISOString().split('T')[0]; };
    data[sow].pigletNotes = [
        {date: add(3), text: "Iron 1st Dose", bg: "#FEF9C3"},
        {date: add(10), text: "B-Complex", bg: "#DCFCE7"},
        {date: add(14), text: "Iron 2nd Dose", bg: "#DBEAFE"}
    ];
}

/* --- NOTE/MEDICAL LOGIC --- */
function openNoteModal(s, isP, idx = null) {
    currentSow = s; isPigletNote = isP; editNoteIdx = idx;
    const n = idx !== null ? (isP ? data[s].pigletNotes[idx] : data[s].notes[idx]) : null;
    document.getElementById('noteDate').value = n ? n.date : new Date().toISOString().split('T')[0];
    document.getElementById('noteText').value = n ? n.text : "";
    document.getElementById('noteModalTitle').innerText = isP ? "Piglet Program" : "Medical Record";
    noteModal.classList.add('active'); overlay.classList.add('active');
}

function saveNote() {
    const target = isPigletNote ? 'pigletNotes' : 'notes';
    const n = { 
        date: document.getElementById('noteDate').value, 
        text: document.getElementById('noteText').value, 
        bg: noteColors[Math.floor(Math.random()*5)],
        color: "#1e293b" 
    };
    if(editNoteIdx !== null) data[currentSow][target][editNoteIdx] = n;
    else data[currentSow][target].push(n);
    localStorage.setItem("sowData", JSON.stringify(data));
    closeModal(); render();
}

function deleteNote(s, isP, idx, e) {
    e.stopPropagation();
    Swal.fire({title: 'Delete this note?', icon: 'warning', showCancelButton: true}).then(res => {
        if(res.isConfirmed) {
            const target = isP ? 'pigletNotes' : 'notes';
            data[s][target].splice(idx, 1);
            localStorage.setItem("sowData", JSON.stringify(data));
            render();
        }
    });
}

/* --- UI RENDER --- */
function render() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const list = document.getElementById("sowList"); list.innerHTML = "";
    let shown = 0;
    Object.keys(data).reverse().forEach(s => {
        const latest = data[s].records.at(-1) || {};
        const nameMatch = s.toLowerCase().includes(q);
        const qrMatch = latest.qrId && latest.qrId.toLowerCase().includes(q);

        if(nameMatch || qrMatch) {
            shown++;
            const id = "s" + s.replace(/\W/g, "");
            list.innerHTML += `
            <div class="sow-card">
                <div class="sow-header" onclick="toggle('${id}')">
                    <div><b>${s}</b><br>${latest.qrId ? `<span class="qr-tag-label"><i class="fas fa-tag"></i> ${latest.qrId}</span>` : ''}</div>
                    <div class="status-badge" style="background:var(--primary-light); color:var(--primary); padding:4px 10px; border-radius:10px; font-size:11px;">Parity ${latest.parity||0}</div>
                </div>
                <div class="quick-stats">
                    <div class="stat-item"><label>ALIVE</label><value>${latest.alive||0}</value></div>
                    <div class="stat-item"><label>STILL</label><value>${latest.still||0}</value></div>
                    <div class="stat-item"><label>MUMMY</label><value style="color:var(--warning)">${latest.mummified||0}</value></div>
                    <div class="stat-item"><label>WEAN</label><value>${latest.wean||0}</value></div>
                    <div class="stat-item"><label>DEATH</label><value style="color:var(--danger)">${latest.deaths||0}</value></div>
                </div>
                <div class="sow-body" id="${id}">
                    <div style="display:flex; gap:10px; margin-bottom:15px;">
                        <button class="primary-btn" onclick="editSow('${s}')" style="margin:0; font-size:12px; padding:10px; flex:1">Edit Sow</button>
                        <button class="primary-btn" onclick="deleteSow('${s}')" style="margin:0; font-size:12px; padding:10px; background:var(--danger); flex:1">Delete Sow</button>
                    </div>

                    <div class="section-label">History Logs</div>
                    ${data[s].records.map(r => `
                        <div class="record-pill">
                            <b>${r.bornDate || 'No Date'}</b> | P${r.parity} | A:${r.alive} S:${r.still} M:${r.mummified}
                        </div>
                    `).join('')}

                    <div class="section-label">Medical Records <button class="add-inline-btn" onclick="openNoteModal('${s}', false)">+ Add</button></div>
                    <div class="notes-grid">${data[s].notes.map((n, i) => `<div class="note-item" style="background:${n.bg}; color:#1e293b" onclick="openNoteModal('${s}', false, ${i})"><div class="note-actions"><i class="fas fa-trash" onclick="deleteNote('${s}', false, ${i}, event)"></i></div><b>${n.date}</b>${n.text}</div>`).join('')}</div>
                    
                    <div class="section-label">Piglet Program <button class="add-inline-btn" onclick="openNoteModal('${s}', true)">+ Add</button></div>
                    <div class="notes-grid">${data[s].pigletNotes.map((n, i) => `<div class="note-item" style="background:${n.bg}; color:#1e293b" onclick="openNoteModal('${s}', true, ${i})"><div class="note-actions"><i class="fas fa-trash" onclick="deleteNote('${s}', true, ${i}, event)"></i></div><b>${n.date}</b>${n.text}</div>`).join('')}</div>
                </div>
            </div>`;
        }
    });

    if(shown === 0) {
        const noDataAtAll = Object.keys(data).length === 0;
        list.innerHTML = noDataAtAll
            ? `<div class="empty-state">
                 <i class="fa-solid fa-piggy-bank"></i>
                 <h3>No sows added yet</h3>
                 <p>Tap the + button to add your first sow record.</p>
               </div>`
            : `<div class="empty-state">
                 <i class="fa-solid fa-magnifying-glass"></i>
                 <h3>No matches found</h3>
                 <p>Try a different name or QR code.</p>
               </div>`;
    }
}

function toggle(id){ const el=document.getElementById(id); el.style.display=el.style.display==='block'?'none':'block'; }
function closeModal(){ overlay.classList.remove('active'); recordModal.classList.remove('active'); noteModal.classList.remove('active'); }
function openAddModal(){ editSowKey=null; document.querySelectorAll('#recordModal input').forEach(i=>i.value=""); recordModal.classList.add('active'); overlay.classList.add('active'); }
function editSow(s){ editSowKey=s; const r=data[s].records.at(-1); document.getElementById('qrId').value=r.qrId || ""; document.getElementById('sowName').value=s; document.getElementById('bornDate').value=r.bornDate; document.getElementById('parity').value=r.parity; document.getElementById('alive').value=r.alive; document.getElementById('still').value=r.still; document.getElementById('mummified').value=r.mummified; document.getElementById('wean').value=r.wean; document.getElementById('deaths').value=r.deaths; recordModal.classList.add('active'); overlay.classList.add('active'); }
function deleteSow(s){ Swal.fire({title: 'Delete '+s+'?', text: "All history will be lost!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444'}).then(res => { if(res.isConfirmed){ delete data[s]; localStorage.setItem("sowData", JSON.stringify(data)); render(); }}); }

render();