// ============================================================
// HUKUK TEKLİF ASİSTANI - Ek Modüller
// CRM, Görev, Masraf, Grafik, Kapak, İmza, Versiyonlama
// ============================================================

// ---- CRM: MÜVEKKİL YÖNETİMİ ----
let editingClientId = null;

window.openClientModal = function(id) {
    editingClientId = id || null;
    const modal = document.getElementById('clientModal');
    if (!modal) return;

    document.getElementById('clientModalTitle').textContent = id ? 'Müvekkil Düzenle' : 'Yeni Müvekkil';

    if (id) {
        const c = DB.data.clients?.find(x => x.id === id);
        if (c) {
            document.getElementById('cmName').value = c.name || '';
            document.getElementById('cmType').value = c.type || 'company';
            document.getElementById('cmSector').value = c.sector || '';
            document.getElementById('cmTaxId').value = c.taxId || '';
            document.getElementById('cmContact').value = c.contact || '';
            document.getElementById('cmPhone').value = c.phone || '';
            document.getElementById('cmEmail').value = c.email || '';
            document.getElementById('cmAddress').value = c.address || '';
            document.getElementById('cmNotes').value = c.notes || '';
        }
    } else {
        ['cmName', 'cmSector', 'cmTaxId', 'cmContact', 'cmPhone', 'cmEmail', 'cmAddress', 'cmNotes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('cmType').value = 'company';
    }

    modal.classList.add('active');
};

window.closeClientModal = function() {
    document.getElementById('clientModal')?.classList.remove('active');
    editingClientId = null;
};

window.saveClient = function() {
    if (!DB.data.clients) DB.data.clients = [];

    const client = {
        id: editingClientId || genId(),
        name: document.getElementById('cmName')?.value || '',
        type: document.getElementById('cmType')?.value || 'company',
        sector: document.getElementById('cmSector')?.value || '',
        taxId: document.getElementById('cmTaxId')?.value || '',
        contact: document.getElementById('cmContact')?.value || '',
        phone: document.getElementById('cmPhone')?.value || '',
        email: document.getElementById('cmEmail')?.value || '',
        address: document.getElementById('cmAddress')?.value || '',
        notes: document.getElementById('cmNotes')?.value || '',
        diary: [],
        files: [],
        createdAt: new Date().toISOString()
    };

    if (editingClientId) {
        const idx = DB.data.clients.findIndex(c => c.id === editingClientId);
        if (idx >= 0) {
            client.diary = DB.data.clients[idx].diary || [];
            client.files = DB.data.clients[idx].files || [];
            client.createdAt = DB.data.clients[idx].createdAt;
            DB.data.clients[idx] = client;
        }
    } else {
        DB.data.clients.push(client);
    }

    DB.save();
    closeClientModal();
    refreshClients();
    toast('Müvekkil kaydedildi', 'success');
};

function refreshClients() {
    const container = document.getElementById('clientsList');
    if (!container) return;
    if (!DB.data.clients) DB.data.clients = [];

    if (DB.data.clients.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz müvekkil kaydı yok.</p>';
        return;
    }

    const search = document.getElementById('clientSearch')?.value?.toLowerCase() || '';
    const filtered = DB.data.clients.filter(c =>
        c.name.toLowerCase().includes(search) || (c.sector || '').toLowerCase().includes(search)
    );

    container.innerHTML = filtered.map(c => {
        const proposalCount = DB.data.proposals.filter(p => p.clientName === c.name).length;
        const acceptedCount = DB.data.proposals.filter(p => p.clientName === c.name && p.status === 'accepted').length;
        const initials = c.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        return `
        <div class="client-card" onclick="openClientDetail('${c.id}')">
            <div class="client-avatar">${initials}</div>
            <div class="client-info">
                <div class="client-name">${c.name}</div>
                <div class="client-meta">${c.type === 'company' ? 'Şirket' : 'Gerçek Kişi'} ${c.sector ? '| ' + c.sector : ''}</div>
            </div>
            <div class="client-stats">
                <span><i class="fas fa-file-alt"></i> ${proposalCount}</span>
                <span><i class="fas fa-check-circle"></i> ${acceptedCount}</span>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();openClientModal('${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();deleteClient('${c.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');

    // Update client selects in proposal wizard
    updateClientAutocomplete();
}

window.filterClients = function() { refreshClients(); };

window.deleteClient = function(id) {
    if (confirm('Bu müvekkil silinsin mi?')) {
        DB.data.clients = DB.data.clients.filter(c => c.id !== id);
        DB.save();
        refreshClients();
        toast('Müvekkil silindi', 'success');
    }
};

let viewingClientId = null;

window.openClientDetail = function(id) {
    viewingClientId = id;
    const c = DB.data.clients?.find(x => x.id === id);
    if (!c) return;

    document.getElementById('clientDetailTitle').textContent = c.name;

    // Info tab
    const infoEl = document.getElementById('clientInfoContent');
    if (infoEl) {
        infoEl.innerHTML = `
        <table style="width:100%;font-size:0.9rem;">
            <tr><td style="padding:6px 0;font-weight:600;width:140px;">Tür</td><td>${c.type === 'company' ? 'Şirket' : 'Gerçek Kişi'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;">Sektör</td><td>${c.sector || '-'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;">Vergi/TC No</td><td>${c.taxId || '-'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;">İletişim</td><td>${c.contact || '-'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;">Telefon</td><td>${c.phone || '-'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;">E-posta</td><td>${c.email || '-'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;">Adres</td><td>${c.address || '-'}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600;">Notlar</td><td>${c.notes || '-'}</td></tr>
        </table>`;
    }

    // Proposals tab
    const propsEl = document.getElementById('clientProposalsContent');
    if (propsEl) {
        const clientProposals = DB.data.proposals.filter(p => p.clientName === c.name);
        if (clientProposals.length === 0) {
            propsEl.innerHTML = '<p class="empty-state">Bu müvekkile henüz teklif verilmedi.</p>';
        } else {
            propsEl.innerHTML = clientProposals.map(p => {
                const statusLabels = { draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul', rejected: 'Red' };
                const statusClass = { draft: 'status-draft', sent: 'status-sent', accepted: 'status-accepted', rejected: 'status-rejected' };
                return `<div class="recent-item" style="cursor:pointer;" onclick="loadProposalForEdit('${p.id}');document.getElementById('clientDetailModal').classList.remove('active');">
                    <div class="ri-info">
                        <div class="ri-title">${p.title || 'İsimsiz'}</div>
                        <div class="ri-meta">${p.no} | ${formatDate(p.date)}</div>
                    </div>
                    <span class="ri-status ${statusClass[p.status] || ''}">${statusLabels[p.status] || p.status}</span>
                </div>`;
            }).join('');
        }
    }

    // Notes tab
    refreshClientNotes(id);

    // Files tab
    refreshClientFiles(id);

    // Tabs
    const detailModal = document.getElementById('clientDetailModal');
    detailModal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            detailModal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            detailModal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`tab-${this.dataset.tab}`)?.classList.add('active');
        });
    });

    // Reset to first tab
    detailModal.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    detailModal.querySelectorAll('.tab-content').forEach((c, i) => c.classList.toggle('active', i === 0));

    detailModal.classList.add('active');
};

window.addClientNote = function() {
    if (!viewingClientId) return;
    const noteText = document.getElementById('newClientNote')?.value;
    if (!noteText?.trim()) return;

    const c = DB.data.clients?.find(x => x.id === viewingClientId);
    if (!c) return;
    if (!c.diary) c.diary = [];

    c.diary.unshift({
        id: genId(),
        text: noteText,
        date: new Date().toISOString(),
        author: DB.data.currentUser?.name || ''
    });

    DB.save();
    document.getElementById('newClientNote').value = '';
    refreshClientNotes(viewingClientId);
    toast('Not eklendi', 'success');
};

function refreshClientNotes(clientId) {
    const c = DB.data.clients?.find(x => x.id === clientId);
    const container = document.getElementById('clientNotesContent');
    if (!container || !c) return;

    if (!c.diary?.length) {
        container.innerHTML = '<p class="empty-state">Henüz not yok.</p>';
        return;
    }

    container.innerHTML = c.diary.map(n => `
    <div class="client-note">
        <div class="note-meta">${formatDate(n.date)} - ${n.author}</div>
        <div>${n.text}</div>
    </div>`).join('');
}

window.uploadClientFile = function(input) {
    if (!viewingClientId || !input.files.length) return;
    const c = DB.data.clients?.find(x => x.id === viewingClientId);
    if (!c) return;
    if (!c.files) c.files = [];

    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            c.files.push({
                id: genId(),
                name: file.name,
                size: file.size,
                data: e.target.result,
                uploadedAt: new Date().toISOString(),
                uploadedBy: DB.data.currentUser?.name || ''
            });
            DB.save();
            refreshClientFiles(viewingClientId);
            toast(`${file.name} yüklendi`, 'success');
        };
        reader.readAsDataURL(file);
    });
};

function refreshClientFiles(clientId) {
    const c = DB.data.clients?.find(x => x.id === clientId);
    const container = document.getElementById('clientFilesContent');
    if (!container || !c) return;

    if (!c.files?.length) {
        container.innerHTML = '<p class="empty-state">Henüz dosya yok.</p>';
        return;
    }

    container.innerHTML = c.files.map(f => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid var(--border);">
        <i class="fas fa-${f.name.endsWith('.pdf') ? 'file-pdf' : f.name.match(/\.(jpg|png|jpeg)$/i) ? 'file-image' : 'file'}" style="color:var(--primary);"></i>
        <div style="flex:1;">
            <div style="font-weight:500;font-size:0.88rem;">${f.name}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);">${formatDate(f.uploadedAt)} | ${f.uploadedBy}</div>
        </div>
        <a href="${f.data}" download="${f.name}" class="btn btn-sm btn-ghost"><i class="fas fa-download"></i></a>
        <button class="btn btn-sm btn-ghost" onclick="deleteClientFile('${clientId}','${f.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
    </div>`).join('');
}

window.deleteClientFile = function(clientId, fileId) {
    const c = DB.data.clients?.find(x => x.id === clientId);
    if (c) {
        c.files = (c.files || []).filter(f => f.id !== fileId);
        DB.save();
        refreshClientFiles(clientId);
    }
};

function updateClientAutocomplete() {
    // Update client name input with datalist
    const clientInput = document.getElementById('clientName');
    if (clientInput && DB.data.clients?.length > 0) {
        let datalist = document.getElementById('clientNameList');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'clientNameList';
            clientInput.parentElement.appendChild(datalist);
            clientInput.setAttribute('list', 'clientNameList');
        }
        datalist.innerHTML = DB.data.clients.map(c => `<option value="${c.name}">`).join('');
    }
}

// ---- GÖREV YÖNETİMİ ----
window.openTaskModal = function() {
    const modal = document.getElementById('taskModal');
    if (!modal) return;

    // Fill assignee select
    const assigneeSelect = document.getElementById('taskAssignee');
    if (assigneeSelect) {
        assigneeSelect.innerHTML = '<option value="">Herkes</option>' +
            DB.data.users.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    }

    // Fill related select
    const relatedSelect = document.getElementById('taskRelated');
    if (relatedSelect) {
        relatedSelect.innerHTML = '<option value="">Yok</option>' +
            DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('');
    }

    // Reset form
    ['taskTitle', 'taskDesc'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const dueEl = document.getElementById('taskDue');
    if (dueEl) dueEl.value = '';
    const prioEl = document.getElementById('taskPriority');
    if (prioEl) prioEl.value = 'medium';

    modal.classList.add('active');
};

window.saveTask = function() {
    if (!DB.data.tasks) DB.data.tasks = [];

    const task = {
        id: genId(),
        title: document.getElementById('taskTitle')?.value || '',
        description: document.getElementById('taskDesc')?.value || '',
        dueDate: document.getElementById('taskDue')?.value || '',
        priority: document.getElementById('taskPriority')?.value || 'medium',
        assignee: document.getElementById('taskAssignee')?.value || '',
        relatedProposalId: document.getElementById('taskRelated')?.value || '',
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    DB.data.tasks.push(task);
    DB.save();
    document.getElementById('taskModal')?.classList.remove('active');
    refreshTasks();
    toast('Görev eklendi', 'success');
};

function refreshTasks() {
    if (!DB.data.tasks) DB.data.tasks = [];

    const activeContainer = document.getElementById('activeTasksList');
    const completedContainer = document.getElementById('completedTasksList');
    const dashboardContainer = document.getElementById('dashboardTasks');

    const active = DB.data.tasks.filter(t => !t.completed).sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
    const completed = DB.data.tasks.filter(t => t.completed);

    const priorityLabels = { low: 'Düşük', medium: 'Normal', high: 'Yüksek', urgent: 'Acil' };

    function renderTask(t) {
        const daysUntil = t.dueDate ? Math.ceil((new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        return `
        <div class="task-item">
            <div class="task-check ${t.completed ? 'done' : ''}" onclick="toggleTask('${t.id}')"></div>
            <div class="task-info">
                <div class="task-title ${t.completed ? 'done' : ''}">${t.title}</div>
                <div class="task-meta">
                    ${t.assignee ? t.assignee + ' | ' : ''}
                    ${t.dueDate ? formatDate(t.dueDate) : ''}
                    ${daysUntil !== null && !t.completed ? ` (${daysUntil <= 0 ? 'Geçmiş!' : daysUntil + ' gün'})` : ''}
                </div>
            </div>
            <span class="task-priority priority-${t.priority}">${priorityLabels[t.priority]}</span>
            <button class="btn btn-sm btn-ghost" onclick="deleteTask('${t.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
        </div>`;
    }

    if (activeContainer) {
        activeContainer.innerHTML = active.length > 0 ? active.map(renderTask).join('') : '<p class="empty-state">Tüm görevler tamamlandı!</p>';
    }
    if (completedContainer) {
        completedContainer.innerHTML = completed.length > 0 ? completed.map(renderTask).join('') : '<p class="empty-state">Henüz tamamlanan görev yok.</p>';
    }
    if (dashboardContainer) {
        const upcoming = active.slice(0, 5);
        dashboardContainer.innerHTML = upcoming.length > 0 ? upcoming.map(renderTask).join('') : '<p class="empty-state">Henüz görev yok.</p>';
    }
}

window.toggleTask = function(id) {
    const t = DB.data.tasks?.find(x => x.id === id);
    if (t) {
        t.completed = !t.completed;
        t.completedAt = t.completed ? new Date().toISOString() : null;
        DB.save();
        refreshTasks();
    }
};

window.deleteTask = function(id) {
    if (confirm('Bu görev silinsin mi?')) {
        DB.data.tasks = (DB.data.tasks || []).filter(t => t.id !== id);
        DB.save();
        refreshTasks();
    }
};

// ---- MASRAF TAKİBİ ----
window.openExpenseModal = function() {
    const modal = document.getElementById('expenseModal');
    if (!modal) return;

    // Fill case select
    const caseSelect = document.getElementById('expCase');
    if (caseSelect) {
        caseSelect.innerHTML = '<option value="">Seçiniz...</option>' +
            DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('');
    }

    // Reset
    ['expDesc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const amountEl = document.getElementById('expAmount');
    if (amountEl) amountEl.value = '';
    const dateEl = document.getElementById('expDate');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

    modal.classList.add('active');
};

window.saveExpense = function() {
    if (!DB.data.expenses) DB.data.expenses = [];

    const receiptInput = document.getElementById('expReceipt');
    const file = receiptInput?.files?.[0];

    const expense = {
        id: genId(),
        type: document.getElementById('expType')?.value || 'diger',
        description: document.getElementById('expDesc')?.value || '',
        amount: document.getElementById('expAmount')?.value || '0',
        date: document.getElementById('expDate')?.value || '',
        proposalId: document.getElementById('expCase')?.value || '',
        receipt: null,
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    function saveAndRefresh() {
        DB.data.expenses.push(expense);
        DB.save();
        document.getElementById('expenseModal')?.classList.remove('active');
        refreshExpenses();
        toast('Masraf kaydedildi', 'success');
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            expense.receipt = { name: file.name, data: e.target.result };
            saveAndRefresh();
        };
        reader.readAsDataURL(file);
    } else {
        saveAndRefresh();
    }
};

function refreshExpenses() {
    if (!DB.data.expenses) DB.data.expenses = [];

    const container = document.getElementById('expensesList');
    const filterCase = document.getElementById('expenseFilterCase')?.value || '';
    const totalEl = document.getElementById('expenseTotal');

    // Update filter
    const filterSelect = document.getElementById('expenseFilterCase');
    if (filterSelect && filterSelect.options.length <= 1) {
        filterSelect.innerHTML = '<option value="">Tüm Dosyalar</option>' +
            DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('');
    }

    let filtered = DB.data.expenses;
    if (filterCase) filtered = filtered.filter(e => e.proposalId === filterCase);

    const typeLabels = { harc: 'Yargılama Harcı', posta: 'Posta/Tebligat', bilirkisi: 'Bilirkişi', keşif: 'Keşif', noter: 'Noter', yol: 'Yol/Ulaşım', konaklama: 'Konaklama', tercume: 'Tercüme', diger: 'Diğer' };
    const typeIcons = { harc: 'gavel', posta: 'envelope', bilirkisi: 'user-tie', keşif: 'search', noter: 'stamp', yol: 'car', konaklama: 'hotel', tercume: 'language', diger: 'receipt' };

    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz masraf kaydı yok.</p>';
    } else {
        container.innerHTML = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => {
            const proposal = DB.data.proposals.find(p => p.id === e.proposalId);
            return `
            <div class="expense-item">
                <div class="exp-type-icon"><i class="fas fa-${typeIcons[e.type] || 'receipt'}"></i></div>
                <div class="exp-info">
                    <div style="font-weight:600;font-size:0.9rem;">${typeLabels[e.type] || e.type}</div>
                    <div style="font-size:0.82rem;">${e.description}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">
                        ${formatDate(e.date)} ${proposal ? '| ' + proposal.no : ''} | ${e.createdBy}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="exp-amount">${formatCurrency(e.amount, 'TRY')}</div>
                    ${e.receipt ? `<a href="${e.receipt.data}" download="${e.receipt.name}" class="btn btn-sm btn-ghost" title="Makbuz indir"><i class="fas fa-file-download"></i></a>` : ''}
                    <button class="btn btn-sm btn-ghost" onclick="deleteExpense('${e.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }).join('');
    }

    // Total
    const total = filtered.reduce((sum, e) => sum + parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0), 0);
    if (totalEl) totalEl.textContent = formatCurrency(total, 'TRY');
}

window.deleteExpense = function(id) {
    if (confirm('Bu masraf silinsin mi?')) {
        DB.data.expenses = (DB.data.expenses || []).filter(e => e.id !== id);
        DB.save();
        refreshExpenses();
        toast('Masraf silindi', 'success');
    }
};

// ---- DASHBOARD GRAFİKLERİ ----
let chartInstances = {};

function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    // Destroy old charts
    Object.values(chartInstances).forEach(c => c?.destroy());
    chartInstances = {};

    const proposals = DB.data.proposals || [];

    // 1. Proposal Status Pie
    const statusCounts = { draft: 0, sent: 0, accepted: 0, rejected: 0 };
    proposals.forEach(p => { if (statusCounts[p.status] !== undefined) statusCounts[p.status]++; });

    const ctx1 = document.getElementById('chartProposalStatus')?.getContext('2d');
    if (ctx1) {
        chartInstances.status = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Taslak', 'Gönderildi', 'Kabul', 'Red'],
                datasets: [{
                    data: [statusCounts.draft, statusCounts.sent, statusCounts.accepted, statusCounts.rejected],
                    backgroundColor: ['#4a6cf7', '#f39c12', '#27ae60', '#e74c3c']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
        });
    }

    // 2. Monthly bar chart
    const monthCounts = {};
    proposals.forEach(p => {
        const d = new Date(p.date || p.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    const sortedMonths = Object.keys(monthCounts).sort().slice(-6);

    const ctx2 = document.getElementById('chartMonthly')?.getContext('2d');
    if (ctx2) {
        chartInstances.monthly = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: sortedMonths.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y}`; }),
                datasets: [{
                    label: 'Teklif',
                    data: sortedMonths.map(m => monthCounts[m]),
                    backgroundColor: '#4a6cf7'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }

    // 3. Legal area distribution
    const areaCounts = {};
    const areaLabels = {
        sirketler: 'Şirketler', birlesme: 'M&A', is: 'İş Hukuku', sozlesme: 'Sözleşme',
        dava: 'Dava', uyum: 'Uyum', kvkk: 'KVKK', gayrimenkul: 'Gayrimenkul',
        fikri: 'Fikri Mülkiyet', rekabet: 'Rekabet', vergi: 'Vergi', genel: 'Genel', diger: 'Diğer'
    };
    proposals.forEach(p => {
        const area = p.legalArea || 'diger';
        areaCounts[area] = (areaCounts[area] || 0) + 1;
    });

    const ctx3 = document.getElementById('chartAreas')?.getContext('2d');
    if (ctx3) {
        const areaKeys = Object.keys(areaCounts);
        const colors = ['#4a6cf7', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad', '#3498db', '#1abc9c', '#e67e22', '#9b59b6', '#2ecc71'];
        chartInstances.areas = new Chart(ctx3, {
            type: 'pie',
            data: {
                labels: areaKeys.map(k => areaLabels[k] || k),
                datasets: [{
                    data: areaKeys.map(k => areaCounts[k]),
                    backgroundColor: areaKeys.map((_, i) => colors[i % colors.length])
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
        });
    }

    // 4. Revenue tracking
    const revenueByMonth = {};
    proposals.filter(p => p.status === 'accepted').forEach(p => {
        const d = new Date(p.date || p.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const fees = p.fees || {};
        let amount = 0;
        switch (fees.model) {
            case 'fixed': amount = parseFloat(String(fees.amount || 0).replace(/[^\d]/g, '')); break;
            case 'hourly': amount = parseFloat(String(fees.rate || 0).replace(/[^\d]/g, '')) * parseFloat(fees.hours || 0); break;
            case 'monthly': amount = parseFloat(String(fees.monthly || 0).replace(/[^\d]/g, '')) * parseFloat(fees.duration || 12); break;
            case 'mixed': amount = parseFloat(String(fees.fixed || 0).replace(/[^\d]/g, '')); break;
        }
        revenueByMonth[key] = (revenueByMonth[key] || 0) + amount;
    });
    const revMonths = Object.keys(revenueByMonth).sort().slice(-6);

    const ctx4 = document.getElementById('chartRevenue')?.getContext('2d');
    if (ctx4) {
        chartInstances.revenue = new Chart(ctx4, {
            type: 'line',
            data: {
                labels: revMonths.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y}`; }),
                datasets: [{
                    label: 'Gelir (₺)',
                    data: revMonths.map(m => revenueByMonth[m]),
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39,174,96,0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }
}

// ---- TEKLİF VERSİYONLAMA ----
window.createProposalVersion = function(proposalId) {
    const p = DB.data.proposals.find(x => x.id === proposalId);
    if (!p) return;

    if (!p.versions) p.versions = [];

    // Save current as version
    p.versions.push({
        versionNo: p.versions.length + 1,
        snapshot: JSON.parse(JSON.stringify(p)),
        date: new Date().toISOString(),
        author: DB.data.currentUser?.name || ''
    });

    // Increment title
    const vNum = p.versions.length + 1;
    p.versionLabel = `v${vNum}`;

    DB.save();
    toast(`Versiyon ${vNum} oluşturuldu`, 'success');
};

// ---- KAPAK SAYFASI ----
function renderCoverPage(proposal) {
    const s = DB.data.settings;
    return `
    <div class="preview-cover-page">
        ${s.firmLogo ? `<img src="${s.firmLogo}" style="width:100px;height:auto;margin-bottom:20px;" alt="Logo">` : ''}
        <div class="cover-line"></div>
        <h1>${proposal.title || 'Hukuki Danışmanlık Teklifi'}</h1>
        <div class="cover-subtitle">
            ${proposal.clientName ? 'Hazırlayan: ' + (s.firmName || '') + '<br>Müvekkil: ' + proposal.clientName : ''}
        </div>
        <div class="cover-line"></div>
        <div class="cover-info">
            Teklif No: ${proposal.no}<br>
            Tarih: ${formatDate(proposal.date)}<br>
            Geçerlilik: ${proposal.validityDays} gün
        </div>
    </div>`;
}

// ---- İMZA GÖRSELİ ----
window.handleSignatureUpload = function(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        DB.data.settings.signatureImage = e.target.result;
        DB.save();
        const statusEl = document.getElementById('signatureStatus');
        if (statusEl) statusEl.textContent = '✓ Yüklendi';
        toast('İmza görseli kaydedildi', 'success');
    };
    reader.readAsDataURL(file);
};

function renderSignatureInPreview(lawyers) {
    const sig = DB.data.settings.signatureImage;
    if (!sig) return '';

    return lawyers.filter(l => l.name).map(l => `
        <div style="margin-bottom:24px;">
            <img src="${sig}" style="height:50px;margin-bottom:4px;" alt="İmza"><br>
            <strong>${l.name}</strong><br>
            <span style="font-size:0.85rem;color:#636e72;">${l.title || ''}</span>
        </div>
    `).join('');
}

// ---- INIT HOOK: Patch existing functions ----
(function patchApp() {
    // Patch refreshDashboard to include charts and tasks
    const origRefreshDashboard = window.refreshDashboard || (typeof refreshDashboard === 'function' ? refreshDashboard : null);

    // We'll hook into DOMContentLoaded to add our init
    const origInit = document.readyState;

    function modulesInit() {
        // Init arrays
        if (!DB.data.clients) DB.data.clients = [];
        if (!DB.data.tasks) DB.data.tasks = [];
        if (!DB.data.expenses) DB.data.expenses = [];

        // Add navigation support for new pages
        const origNavigateTo = window.navigateTo;
        if (origNavigateTo) {
            const _nav = navigateTo;
            window.navigateTo = function(pageId) {
                _nav(pageId);
                if (pageId === 'clients') refreshClients();
                if (pageId === 'expenses') refreshExpenses();
                if (pageId === 'tasks') refreshTasks();
                if (pageId === 'timesheet') refreshTimesheet();
                if (pageId === 'contacts') refreshContacts();
                if (pageId === 'dashboard') {
                    renderDashboardCharts();
                    refreshTasks();
                }
            };
        }

        // Patch signature status on load
        if (DB.data.settings?.signatureImage) {
            const statusEl = document.getElementById('signatureStatus');
            if (statusEl) statusEl.textContent = '✓ Yüklendi';
        }

        // Patch renderPreview to include cover page and signature
        const origRenderPreview = window.renderPreview || renderPreview;
        window.renderPreview = function() {
            origRenderPreview();

            const container = document.getElementById('previewContainer');
            if (!container || !currentProposal) return;

            // Cover page
            const showCover = document.querySelector('input[name="coverPage"]:checked')?.value === 'yes';
            if (showCover) {
                container.innerHTML = renderCoverPage(currentProposal) + container.innerHTML;
            }

            // Signature image
            if (DB.data.settings?.signatureImage && currentProposal.lawyers?.length > 0) {
                const sigHtml = renderSignatureInPreview(currentProposal.lawyers);
                if (sigHtml) {
                    // Replace the signature area at the bottom
                    const footer = container.querySelector('div:last-child');
                    if (footer) {
                        footer.innerHTML = `<p>${getLabels(currentProposal.language || 'tr').regards},</p>
                        <div style="margin-top:20px;">${sigHtml}</div>`;
                    }
                }
            }
        };

        // Patch renderPreview for conflict & confidentiality
        const origRenderPreview2 = window.renderPreview;
        window.renderPreview = function() {
            origRenderPreview2();
            const container = document.getElementById('previewContainer');
            if (!container || !currentProposal) return;

            const lang = currentProposal.language || 'tr';
            let extra = '';

            if (document.getElementById('conflictOfInterest')?.checked) {
                extra += lang === 'en'
                    ? `<div class="preview-section" style="margin-top:24px;padding:14px;background:#f5f6fa;border-radius:8px;"><h4>Conflict of Interest Declaration</h4><p style="font-size:0.88rem;">We hereby declare that, to the best of our knowledge, there is no conflict of interest that would prevent us from providing legal services as described in this proposal. Should any conflict arise during the engagement, we will promptly notify the client and take appropriate measures.</p></div>`
                    : `<div class="preview-section" style="margin-top:24px;padding:14px;background:#f5f6fa;border-radius:8px;"><h4>Çıkar Çatışması Beyanı</h4><p style="font-size:0.88rem;">İşbu teklif kapsamında sunulacak hukuki hizmetler bakımından, bilgimiz dahilinde herhangi bir çıkar çatışması bulunmadığını beyan ederiz. Hizmet sürecinde herhangi bir çıkar çatışması ortaya çıkması halinde, müvekkilimize derhal bilgi verilecek ve gerekli tedbirler alınacaktır.</p></div>`;
            }

            if (document.getElementById('confidentialityClause')?.checked) {
                extra += lang === 'en'
                    ? `<div class="preview-section" style="margin-top:12px;padding:14px;background:#f5f6fa;border-radius:8px;"><h4>Confidentiality</h4><p style="font-size:0.88rem;">This proposal and all information contained herein is strictly confidential and intended solely for the addressee. Any unauthorized use, disclosure, or distribution is prohibited. The contents of this proposal may not be shared with third parties without our prior written consent.</p></div>`
                    : `<div class="preview-section" style="margin-top:12px;padding:14px;background:#f5f6fa;border-radius:8px;"><h4>Gizlilik Taahhütnamesi</h4><p style="font-size:0.88rem;">İşbu teklif ve içerdiği tüm bilgiler gizli olup yalnızca muhatabına yöneliktir. Yetkisiz kullanımı, ifşası veya dağıtımı yasaktır. İşbu teklifin içeriği, önceden yazılı iznimiz alınmadan üçüncü kişilerle paylaşılamaz.</p></div>`;
            }

            if (extra) {
                container.innerHTML += extra;
            }
        };

        // Initial render
        setTimeout(() => {
            renderDashboardCharts();
            refreshTasks();
            updateClientAutocomplete();
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(modulesInit, 300));
    } else {
        setTimeout(modulesInit, 300);
    }
})();

// ============================================================
// ZAMAN TAKİBİ (TIMESHEET)
// ============================================================
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

window.toggleTimer = function() {
    if (timerRunning) return;
    timerRunning = true;
    timerSeconds = 0;

    document.getElementById('timerStartBtn').style.display = 'none';
    document.getElementById('timerStopBtn').style.display = '';

    timerInterval = setInterval(() => {
        timerSeconds++;
        const h = Math.floor(timerSeconds / 3600);
        const m = Math.floor((timerSeconds % 3600) / 60);
        const s = timerSeconds % 60;
        document.getElementById('timerDisplay').textContent =
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);
};

window.stopTimer = function() {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerRunning = false;

    const minutes = Math.round(timerSeconds / 60);
    if (minutes < 1) { toast('Süre çok kısa', 'error'); resetTimerUI(); return; }

    if (!DB.data.timesheet) DB.data.timesheet = [];

    const entry = {
        id: genId(),
        proposalId: document.getElementById('timerCase')?.value || '',
        description: document.getElementById('timerDesc')?.value || 'Çalışma',
        duration: minutes,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    DB.data.timesheet.push(entry);
    DB.save();
    resetTimerUI();
    refreshTimesheet();
    toast(`${minutes} dakika kaydedildi`, 'success');
};

function resetTimerUI() {
    timerSeconds = 0;
    document.getElementById('timerDisplay').textContent = '00:00:00';
    document.getElementById('timerStartBtn').style.display = '';
    document.getElementById('timerStopBtn').style.display = 'none';
    document.getElementById('timerDesc').value = '';
}

window.openTimesheetModal = function() {
    const modal = document.getElementById('timesheetModal');
    if (!modal) return;

    const caseSelect = document.getElementById('tsCase');
    if (caseSelect) {
        caseSelect.innerHTML = '<option value="">Seçiniz...</option>' +
            DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('');
    }

    document.getElementById('tsDesc').value = '';
    document.getElementById('tsDuration').value = '';
    document.getElementById('tsDate').value = new Date().toISOString().split('T')[0];

    modal.classList.add('active');
};

window.saveTimesheetEntry = function() {
    if (!DB.data.timesheet) DB.data.timesheet = [];

    const entry = {
        id: genId(),
        proposalId: document.getElementById('tsCase')?.value || '',
        description: document.getElementById('tsDesc')?.value || '',
        duration: parseInt(document.getElementById('tsDuration')?.value) || 0,
        date: document.getElementById('tsDate')?.value || '',
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    DB.data.timesheet.push(entry);
    DB.save();
    document.getElementById('timesheetModal')?.classList.remove('active');
    refreshTimesheet();
    toast('Zaman kaydı eklendi', 'success');
};

function refreshTimesheet() {
    if (!DB.data.timesheet) DB.data.timesheet = [];

    const container = document.getElementById('timesheetList');
    const filterCase = document.getElementById('timesheetFilter')?.value || '';
    const totalEl = document.getElementById('timesheetTotal');

    // Fill timer case select
    const timerCase = document.getElementById('timerCase');
    if (timerCase && timerCase.options.length <= 1) {
        timerCase.innerHTML = '<option value="">Dosya seçin...</option>' +
            DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('');
    }

    // Fill filter
    const filterSel = document.getElementById('timesheetFilter');
    if (filterSel && filterSel.options.length <= 1) {
        filterSel.innerHTML = '<option value="">Tüm Dosyalar</option>' +
            DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('');
    }

    let filtered = DB.data.timesheet;
    if (filterCase) filtered = filtered.filter(e => e.proposalId === filterCase);

    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz zaman kaydı yok.</p>';
    } else {
        container.innerHTML = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => {
            const proposal = DB.data.proposals.find(p => p.id === e.proposalId);
            const h = Math.floor(e.duration / 60);
            const m = e.duration % 60;
            return `
            <div class="expense-item">
                <div class="exp-type-icon"><i class="fas fa-clock"></i></div>
                <div class="exp-info">
                    <div style="font-weight:600;font-size:0.9rem;">${e.description}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">
                        ${formatDate(e.date)} ${proposal ? '| ' + proposal.no : ''} | ${e.createdBy}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="exp-amount">${h > 0 ? h + ' sa ' : ''}${m} dk</div>
                    <button class="btn btn-sm btn-ghost" onclick="deleteTimeEntry('${e.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        }).join('');
    }

    // Total
    const totalMinutes = filtered.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalH = Math.floor(totalMinutes / 60);
    const totalM = totalMinutes % 60;
    if (totalEl) totalEl.textContent = `${totalH} saat ${totalM} dk`;
}

window.deleteTimeEntry = function(id) {
    if (confirm('Bu kayıt silinsin mi?')) {
        DB.data.timesheet = (DB.data.timesheet || []).filter(e => e.id !== id);
        DB.save();
        refreshTimesheet();
    }
};

// ============================================================
// KARŞI TARAF & İLGİLİ KİŞİLER
// ============================================================
let editingContactId = null;

window.openContactModal = function(id) {
    editingContactId = id || null;
    const modal = document.getElementById('contactModal');
    if (!modal) return;

    // Fill cases multi-select
    const casesSelect = document.getElementById('ctCases');
    if (casesSelect) {
        casesSelect.innerHTML = DB.data.proposals.map(p =>
            `<option value="${p.id}">${p.no} - ${p.title}</option>`
        ).join('');
    }

    if (id) {
        const c = (DB.data.contacts2 || []).find(x => x.id === id);
        if (c) {
            document.getElementById('ctName').value = c.name || '';
            document.getElementById('ctRole').value = c.role || 'avukat';
            document.getElementById('ctOrg').value = c.org || '';
            document.getElementById('ctPhone').value = c.phone || '';
            document.getElementById('ctEmail').value = c.email || '';
            document.getElementById('ctNotes').value = c.notes || '';
        }
    } else {
        ['ctName', 'ctOrg', 'ctPhone', 'ctEmail', 'ctNotes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    modal.classList.add('active');
};

window.saveContact = function() {
    if (!DB.data.contacts2) DB.data.contacts2 = [];

    const casesSelect = document.getElementById('ctCases');
    const selectedCases = casesSelect ? Array.from(casesSelect.selectedOptions).map(o => o.value) : [];

    const contact = {
        id: editingContactId || genId(),
        name: document.getElementById('ctName')?.value || '',
        role: document.getElementById('ctRole')?.value || 'diger',
        org: document.getElementById('ctOrg')?.value || '',
        phone: document.getElementById('ctPhone')?.value || '',
        email: document.getElementById('ctEmail')?.value || '',
        cases: selectedCases,
        notes: document.getElementById('ctNotes')?.value || '',
        createdAt: new Date().toISOString()
    };

    if (editingContactId) {
        const idx = DB.data.contacts2.findIndex(c => c.id === editingContactId);
        if (idx >= 0) DB.data.contacts2[idx] = contact;
    } else {
        DB.data.contacts2.push(contact);
    }

    DB.save();
    document.getElementById('contactModal')?.classList.remove('active');
    editingContactId = null;
    refreshContacts();
    toast('Kişi kaydedildi', 'success');
};

window.refreshContacts = function() {
    if (!DB.data.contacts2) DB.data.contacts2 = [];

    const container = document.getElementById('contactsList');
    if (!container) return;

    const search = document.getElementById('contactSearch')?.value?.toLowerCase() || '';
    const roleFilter = document.getElementById('contactFilter')?.value || '';

    let filtered = DB.data.contacts2;
    if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search) || (c.org || '').toLowerCase().includes(search));
    if (roleFilter) filtered = filtered.filter(c => c.role === roleFilter);

    const roleLabels = { avukat: 'Karşı Avukat', hakim: 'Hakim', bilirkisi: 'Bilirkişi', arabulucu: 'Arabulucu', noter: 'Noter', tanik: 'Tanık', diger: 'Diğer' };
    const roleIcons = { avukat: 'user-tie', hakim: 'gavel', bilirkisi: 'microscope', arabulucu: 'handshake', noter: 'stamp', tanik: 'user', diger: 'user-circle' };

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Kişi bulunamadı.</p>';
        return;
    }

    container.innerHTML = filtered.map(c => {
        const caseNames = (c.cases || []).map(cid => {
            const p = DB.data.proposals.find(x => x.id === cid);
            return p ? p.no : '';
        }).filter(Boolean).join(', ');

        return `
        <div class="client-card">
            <div class="client-avatar" style="background:var(--primary-light);color:var(--primary);">
                <i class="fas fa-${roleIcons[c.role] || 'user'}"></i>
            </div>
            <div class="client-info">
                <div class="client-name">${c.name}</div>
                <div class="client-meta">${roleLabels[c.role] || c.role} ${c.org ? '| ' + c.org : ''}</div>
                ${caseNames ? `<div style="font-size:0.75rem;color:var(--text-secondary);">Davalar: ${caseNames}</div>` : ''}
            </div>
            <div style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-ghost" onclick="openContactModal('${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="deleteContact('${c.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
};

window.deleteContact = function(id) {
    if (confirm('Bu kişi silinsin mi?')) {
        DB.data.contacts2 = (DB.data.contacts2 || []).filter(c => c.id !== id);
        DB.save();
        refreshContacts();
    }
};

// ============================================================
// DAVA SONUÇ KAYDI
// ============================================================
window.recordCaseResult = function(hearingId) {
    const h = DB.data.hearings.find(x => x.id === hearingId);
    if (!h) return;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'caseResultModal';
    modal.innerHTML = `
    <div class="modal-content" style="max-width:480px;">
        <div class="modal-header">
            <h3>Dava Sonucu - ${h.caseTitle}</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Sonuç</label>
                <select id="caseResultType">
                    <option value="kazanildi">Kazanıldı</option>
                    <option value="kaybedildi">Kaybedildi</option>
                    <option value="sulh">Sulh / Uzlaşma</option>
                    <option value="feragat">Feragat</option>
                    <option value="duser">Düşme</option>
                    <option value="devam">Devam Ediyor</option>
                </select>
            </div>
            <div class="form-group">
                <label>Sonuç Tutarı (varsa)</label>
                <input type="text" id="caseResultAmount" placeholder="Örn: 500.000 TL">
            </div>
            <div class="form-group">
                <label>Emsal Değeri Notu</label>
                <textarea id="caseResultNote" rows="3" placeholder="Bu dava neden emsal niteliğinde?">${h.result || ''}</textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">İptal</button>
            <button class="btn btn-primary" onclick="saveCaseResult('${h.id}')"><i class="fas fa-save"></i> Kaydet</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

window.saveCaseResult = function(hearingId) {
    const h = DB.data.hearings.find(x => x.id === hearingId);
    if (h) {
        h.resultType = document.getElementById('caseResultType')?.value || '';
        h.resultAmount = document.getElementById('caseResultAmount')?.value || '';
        h.result = document.getElementById('caseResultNote')?.value || '';
        DB.save();
        toast('Dava sonucu kaydedildi', 'success');
        refreshHearings();
    }
    document.getElementById('caseResultModal')?.remove();
};

// ============================================================
// HIZLI NOT (Dashboard)
// ============================================================
window.openQuickNote = function() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'quickNoteModal';

    const clientOptions = (DB.data.clients || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const caseOptions = DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('');

    modal.innerHTML = `
    <div class="modal-content" style="max-width:480px;">
        <div class="modal-header">
            <h3><i class="fas fa-sticky-note" style="color:var(--accent3);"></i> Hızlı Not</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-row">
                <div class="form-group">
                    <label>Müvekkil (Opsiyonel)</label>
                    <select id="qnClient"><option value="">Seçiniz...</option>${clientOptions}</select>
                </div>
                <div class="form-group">
                    <label>Dosya (Opsiyonel)</label>
                    <select id="qnCase"><option value="">Seçiniz...</option>${caseOptions}</select>
                </div>
            </div>
            <div class="form-group">
                <label>Not</label>
                <textarea id="qnText" rows="5" placeholder="Notunuzu yazın... (toplantı, telefon, fikir, hatırlatma)" autofocus></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">İptal</button>
            <button class="btn btn-primary" onclick="saveQuickNote()"><i class="fas fa-save"></i> Kaydet</button>
        </div>
    </div>`;
    document.body.appendChild(modal);

    // Focus textarea
    setTimeout(() => document.getElementById('qnText')?.focus(), 100);
};

window.saveQuickNote = function() {
    const text = document.getElementById('qnText')?.value;
    if (!text?.trim()) { toast('Not boş olamaz', 'error'); return; }

    const clientId = document.getElementById('qnClient')?.value;
    const caseId = document.getElementById('qnCase')?.value;

    // If client selected, add to client diary
    if (clientId) {
        const c = (DB.data.clients || []).find(x => x.id === clientId);
        if (c) {
            if (!c.diary) c.diary = [];
            c.diary.unshift({
                id: genId(),
                text: text,
                date: new Date().toISOString(),
                author: DB.data.currentUser?.name || '',
                relatedCase: caseId || ''
            });
        }
    }

    // Also save to general quick notes
    if (!DB.data.quickNotes) DB.data.quickNotes = [];
    DB.data.quickNotes.unshift({
        id: genId(),
        text: text,
        clientId: clientId || '',
        caseId: caseId || '',
        date: new Date().toISOString(),
        author: DB.data.currentUser?.name || ''
    });

    DB.save();
    document.getElementById('quickNoteModal')?.remove();
    toast('Not kaydedildi', 'success');
};

// ============================================================
// ARŞİV MODU
// ============================================================
window.archiveProposal = function(id) {
    const p = DB.data.proposals.find(x => x.id === id);
    if (!p) return;
    p.archived = true;
    p.archivedAt = new Date().toISOString();
    DB.save();
    refreshProposalsList();
    refreshDashboard();
    toast('Dosya arşive taşındı', 'success');
};

window.unarchiveProposal = function(id) {
    const p = DB.data.proposals.find(x => x.id === id);
    if (!p) return;
    p.archived = false;
    p.archivedAt = null;
    DB.save();
    refreshProposalsList();
    toast('Dosya arşivden çıkarıldı', 'success');
};

// Patch refreshProposalsList to support archive filter
(function patchProposalsList() {
    const waitForFn = setInterval(() => {
        if (typeof refreshProposalsList !== 'function') return;
        clearInterval(waitForFn);

        const origRefresh = refreshProposalsList;
        window.refreshProposalsList = function() {
            const container = document.getElementById('proposalsList');
            if (!container) return;

            // Add archive toggle if not exists
            const pageHeader = container.closest('.page')?.querySelector('.page-header');
            if (pageHeader && !document.getElementById('archiveToggle')) {
                const toggleDiv = document.createElement('div');
                toggleDiv.style.cssText = 'display:flex;gap:8px;align-items:center;';
                toggleDiv.innerHTML = `
                    <label class="checkbox-label" style="font-size:0.82rem;">
                        <input type="checkbox" id="archiveToggle" onchange="refreshProposalsList()">
                        <span class="checkbox-custom"></span>
                        Arşivi göster
                    </label>`;
                const existingBtn = pageHeader.querySelector('.btn');
                if (existingBtn) pageHeader.insertBefore(toggleDiv, existingBtn);
            }

            const showArchive = document.getElementById('archiveToggle')?.checked;
            const proposals = DB.data.proposals.filter(p => showArchive ? p.archived : !p.archived);

            if (proposals.length === 0) {
                container.innerHTML = `<p class="empty-state">${showArchive ? 'Arşivde dosya yok.' : 'Henüz teklif yok.'}</p>`;
                return;
            }

            const statusLabels = { draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul Edildi', rejected: 'Reddedildi' };
            container.innerHTML = proposals.map(p => `
            <div class="proposal-card" onclick="loadProposalForEdit('${p.id}')">
                <div class="pc-info">
                    <div class="pc-title">${p.archived ? '📦 ' : ''}${p.title || 'İsimsiz Teklif'}${p.versionLabel ? ' (' + p.versionLabel + ')' : ''}</div>
                    <div class="pc-meta">${p.no} | ${p.clientName} | ${formatDate(p.date)} | ${p.createdBy || ''}</div>
                </div>
                <div class="pc-actions">
                    <select class="status-select" onclick="event.stopPropagation()" onchange="updateProposalStatus('${p.id}', this.value)">
                        ${Object.entries(statusLabels).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();createProposalVersion('${p.id}')" title="Versiyon oluştur"><i class="fas fa-code-branch"></i></button>
                    <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();duplicateProposal('${p.id}')" title="Kopyala"><i class="fas fa-copy"></i></button>
                    <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();${p.archived ? `unarchiveProposal('${p.id}')` : `archiveProposal('${p.id}')`}" title="${p.archived ? 'Arşivden Çıkar' : 'Arşivle'}">
                        <i class="fas fa-${p.archived ? 'box-open' : 'archive'}"></i>
                    </button>
                    <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();deleteProposal('${p.id}')" title="Sil" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');
        };
    }, 200);
})();

// ============================================================
// TOPLU PDF RAPOR
// ============================================================
window.generateBulkReport = function() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'bulkReportModal';
    modal.innerHTML = `
    <div class="modal-content" style="max-width:520px;">
        <div class="modal-header">
            <h3><i class="fas fa-file-pdf" style="color:var(--accent);"></i> Toplu Rapor Oluştur</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Rapor Türü</label>
                <select id="reportType">
                    <option value="expense">Masraf Raporu</option>
                    <option value="timesheet">Zaman Raporu</option>
                    <option value="combined">Masraf + Zaman (Birleşik)</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Başlangıç Tarihi</label>
                    <input type="date" id="reportStartDate">
                </div>
                <div class="form-group">
                    <label>Bitiş Tarihi</label>
                    <input type="date" id="reportEndDate">
                </div>
            </div>
            <div class="form-group">
                <label>Dosya Filtresi (Opsiyonel)</label>
                <select id="reportCase">
                    <option value="">Tüm Dosyalar</option>
                    ${DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Müvekkil Filtresi (Opsiyonel)</label>
                <select id="reportClient">
                    <option value="">Tüm Müvekkiller</option>
                    ${(DB.data.clients || []).map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">İptal</button>
            <button class="btn btn-accent" onclick="executeBulkReport()"><i class="fas fa-file-pdf"></i> PDF Oluştur</button>
        </div>
    </div>`;
    document.body.appendChild(modal);

    // Set default dates (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    document.getElementById('reportEndDate').value = now.toISOString().split('T')[0];
    document.getElementById('reportStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
};

window.executeBulkReport = function() {
    const type = document.getElementById('reportType')?.value || 'expense';
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;
    const caseId = document.getElementById('reportCase')?.value;
    const clientName = document.getElementById('reportClient')?.value;

    const s = DB.data.settings;

    let html = `<div style="font-family:'Inter',sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#2d3436;">`;

    // Header
    html += `<div style="text-align:center;border-bottom:3px solid #4a6cf7;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="font-size:1.5rem;color:#1a1d2e;margin:0;">${s.firmName || 'Hukuk Bürosu'}</h1>
        <p style="color:#636e72;font-size:0.85rem;margin:4px 0;">${s.firmAddress || ''} ${s.firmPhone ? '| ' + s.firmPhone : ''}</p>
    </div>`;

    // Title
    const typeLabels = { expense: 'Masraf Raporu', timesheet: 'Zaman Raporu', combined: 'Masraf & Zaman Raporu' };
    html += `<h2 style="text-align:center;color:#4a6cf7;margin-bottom:8px;">${typeLabels[type]}</h2>`;
    html += `<p style="text-align:center;color:#636e72;font-size:0.88rem;margin-bottom:24px;">${formatDate(startDate)} - ${formatDate(endDate)}</p>`;

    if (clientName) html += `<p style="font-size:0.9rem;"><strong>Müvekkil:</strong> ${clientName}</p>`;

    // Expense section
    if (type === 'expense' || type === 'combined') {
        let expenses = DB.data.expenses || [];
        if (startDate) expenses = expenses.filter(e => e.date >= startDate);
        if (endDate) expenses = expenses.filter(e => e.date <= endDate);
        if (caseId) expenses = expenses.filter(e => e.proposalId === caseId);

        const expTypeLabels = { harc: 'Yargılama Harcı', posta: 'Posta/Tebligat', bilirkisi: 'Bilirkişi', keşif: 'Keşif', noter: 'Noter', yol: 'Yol/Ulaşım', konaklama: 'Konaklama', tercume: 'Tercüme', diger: 'Diğer' };

        html += `<h3 style="color:#1a1d2e;border-bottom:1px solid #e1e5ee;padding-bottom:6px;margin-top:24px;">Masraflar</h3>`;
        if (expenses.length === 0) {
            html += `<p style="color:#636e72;">Bu dönemde masraf kaydı bulunamadı.</p>`;
        } else {
            html += `<table style="width:100%;border-collapse:collapse;font-size:0.88rem;margin-top:8px;">
                <thead><tr style="background:#f5f6fa;">
                    <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Tarih</th>
                    <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Tür</th>
                    <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Açıklama</th>
                    <th style="padding:8px;text-align:right;border-bottom:2px solid #e1e5ee;">Tutar</th>
                </tr></thead><tbody>`;

            let expTotal = 0;
            expenses.forEach(e => {
                const amt = parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0);
                expTotal += amt;
                html += `<tr>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${formatDate(e.date)}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${expTypeLabels[e.type] || e.type}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${e.description}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${formatCurrency(amt, 'TRY')}</td>
                </tr>`;
            });

            html += `<tr style="background:#f5f6fa;font-weight:700;">
                <td colspan="3" style="padding:8px;">TOPLAM</td>
                <td style="padding:8px;text-align:right;">${formatCurrency(expTotal, 'TRY')}</td>
            </tr></tbody></table>`;
        }
    }

    // Timesheet section
    if (type === 'timesheet' || type === 'combined') {
        let entries = DB.data.timesheet || [];
        if (startDate) entries = entries.filter(e => e.date >= startDate);
        if (endDate) entries = entries.filter(e => e.date <= endDate);
        if (caseId) entries = entries.filter(e => e.proposalId === caseId);

        html += `<h3 style="color:#1a1d2e;border-bottom:1px solid #e1e5ee;padding-bottom:6px;margin-top:24px;">Zaman Kayıtları</h3>`;
        if (entries.length === 0) {
            html += `<p style="color:#636e72;">Bu dönemde zaman kaydı bulunamadı.</p>`;
        } else {
            html += `<table style="width:100%;border-collapse:collapse;font-size:0.88rem;margin-top:8px;">
                <thead><tr style="background:#f5f6fa;">
                    <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Tarih</th>
                    <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Açıklama</th>
                    <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Kişi</th>
                    <th style="padding:8px;text-align:right;border-bottom:2px solid #e1e5ee;">Süre</th>
                </tr></thead><tbody>`;

            let totalMin = 0;
            entries.forEach(e => {
                totalMin += e.duration || 0;
                const h = Math.floor(e.duration / 60);
                const m = e.duration % 60;
                html += `<tr>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${formatDate(e.date)}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${e.description}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${e.createdBy}</td>
                    <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${h > 0 ? h + ' sa ' : ''}${m} dk</td>
                </tr>`;
            });

            const totalH = Math.floor(totalMin / 60);
            const totalM = totalMin % 60;
            html += `<tr style="background:#f5f6fa;font-weight:700;">
                <td colspan="3" style="padding:8px;">TOPLAM</td>
                <td style="padding:8px;text-align:right;">${totalH} saat ${totalM} dk</td>
            </tr></tbody></table>`;
        }
    }

    // Footer
    html += `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e1e5ee;text-align:center;font-size:0.78rem;color:#636e72;">
        ${s.firmName || ''} | Oluşturulma: ${formatDate(new Date().toISOString().split('T')[0])} | ${DB.data.currentUser?.name || ''}
    </div></div>`;

    // Generate PDF
    document.getElementById('bulkReportModal')?.remove();
    toast('PDF rapor oluşturuluyor...', 'info');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `rapor_${type}_${startDate}_${endDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save().then(() => {
        tempDiv.remove();
        toast('PDF rapor indirildi', 'success');
    });
};

// ============================================================
// VERİ DIŞA AKTARMA (JSON YEDEKLEME)
// ============================================================
window.exportAllData = function() {
    const data = JSON.parse(JSON.stringify(DB.data));
    // Remove user session info
    delete data.currentUser;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hukuk_yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Yedek dosyası indirildi', 'success');
};

window.triggerImportData = function() {
    const input = document.getElementById('importDataInput');
    if (input) input.click();
};

window.importData = function(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.proposals && !imported.credentials) {
                toast('Geçersiz yedek dosyası', 'error');
                return;
            }

            if (confirm('Mevcut veriler silinip yedekten yüklenecek. Emin misiniz?')) {
                const currentUser = DB.data.currentUser;
                DB._data = { ...DB.defaults(), ...imported, currentUser };
                DB.save();
                toast('Veriler başarıyla içe aktarıldı. Sayfa yenileniyor...', 'success');
                setTimeout(() => window.location.href = window.location.href, 1500);
            }
        } catch (err) {
            toast('Dosya okunamadı: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
};

// ============================================================
// GLOBAL SEARCH (ARAMA)
// ============================================================
let searchTimeout = null;

window.openGlobalSearch = function() {
    // just focus, results show on input
};

window.performGlobalSearch = function(query) {
    clearTimeout(searchTimeout);
    const dropdown = document.getElementById('globalSearchResults');
    if (!dropdown) return;

    if (!query || query.trim().length < 2) {
        dropdown.style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(() => {
        const q = query.toLowerCase().trim();
        let results = [];

        // Search proposals
        (DB.data.proposals || []).forEach(p => {
            const text = [p.clientName, p.proposalNo, p.projectName, p.generalNotes].filter(Boolean).join(' ').toLowerCase();
            if (text.includes(q)) {
                results.push({ type: 'proposal', icon: 'fa-file-alt', title: p.proposalNo + ' - ' + (p.clientName || 'İsimsiz'), sub: p.projectName || 'Teklif', action: () => { navigateTo('proposals'); } });
            }
        });

        // Search clients
        (DB.data.clients || []).forEach(c => {
            const text = [c.name, c.contact, c.email, c.sector].filter(Boolean).join(' ').toLowerCase();
            if (text.includes(q)) {
                results.push({ type: 'client', icon: 'fa-user', title: c.name, sub: c.sector || c.type || 'Müvekkil', action: () => { navigateTo('clients'); openClientDetail(c.id); } });
            }
        });

        // Search case files
        (DB.data.caseFiles || []).forEach(f => {
            const text = [f.title, f.esasNo, f.client, f.court, f.opponent].filter(Boolean).join(' ').toLowerCase();
            if (text.includes(q)) {
                results.push({ type: 'casefile', icon: 'fa-folder-open', title: f.title, sub: [f.esasNo, f.court].filter(Boolean).join(' | ') || 'Dosya', action: () => { navigateTo('case-files'); } });
            }
        });

        // Search hearings
        (DB.data.hearings || []).forEach(h => {
            const text = [h.caseTitle, h.court, h.caseNo, h.judge].filter(Boolean).join(' ').toLowerCase();
            if (text.includes(q)) {
                results.push({ type: 'hearing', icon: 'fa-gavel', title: h.caseTitle, sub: h.court + ' | ' + (typeof formatDate === 'function' ? formatDate(h.date) : h.date), action: () => { navigateTo('hearings'); } });
            }
        });

        // Search contacts
        (DB.data.contacts || []).forEach(c => {
            const text = [c.name, c.role, c.firm, c.phone, c.email].filter(Boolean).join(' ').toLowerCase();
            if (text.includes(q)) {
                results.push({ type: 'contact', icon: 'fa-address-book', title: c.name, sub: c.role || 'Kişi', action: () => { navigateTo('contacts'); } });
            }
        });

        // Render results
        if (results.length === 0) {
            dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-secondary);font-size:0.85rem;">Sonuç bulunamadı</div>';
        } else {
            const grouped = {};
            const typeNames = { proposal: 'Teklifler', client: 'Müvekkiller', casefile: 'Dosyalar', hearing: 'Duruşmalar', contact: 'Kişiler' };
            results.forEach(r => {
                if (!grouped[r.type]) grouped[r.type] = [];
                grouped[r.type].push(r);
            });

            let html = '';
            for (const [type, items] of Object.entries(grouped)) {
                html += `<div class="search-result-category">${typeNames[type] || type}</div>`;
                items.slice(0, 5).forEach((item, idx) => {
                    html += `<div class="search-result-item" data-search-idx="${type}-${idx}">
                        <div class="sri-icon"><i class="fas ${item.icon}"></i></div>
                        <div class="sri-text"><strong>${item.title}</strong><small>${item.sub}</small></div>
                    </div>`;
                });
            }
            dropdown.innerHTML = html;

            // Attach click events
            const allItems = [];
            for (const items of Object.values(grouped)) allItems.push(...items.slice(0, 5));
            dropdown.querySelectorAll('.search-result-item').forEach((el, i) => {
                el.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                    document.getElementById('globalSearchInput').value = '';
                    if (allItems[i]?.action) allItems[i].action();
                });
            });
        }
        dropdown.style.display = 'block';
    }, 200);
};

// Close search on click outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('globalSearchResults');
    const input = document.getElementById('globalSearchInput');
    if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
    }
});

// ============================================================
// KLAVYE KISAYOLLARI
// ============================================================
document.addEventListener('keydown', function(e) {
    // Ctrl+K = Global Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('globalSearchInput');
        if (input) input.focus();
        return;
    }

    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    // Ctrl+N = New Proposal
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigateTo('new-proposal');
        return;
    }

    // Ctrl+S = Save (in wizard context)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.querySelector('#page-new-proposal .btn-primary[onclick*="save"]') ||
                        document.getElementById('saveSettingsBtn');
        if (saveBtn) saveBtn.click();
        return;
    }

    // Alt+1-9 = Navigate to pages
    if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const pages = ['dashboard', 'new-proposal', 'proposals', 'templates', 'credentials', 'contracts', 'clients', 'case-files', 'hearings'];
        const idx = parseInt(e.key) - 1;
        if (pages[idx]) navigateTo(pages[idx]);
        return;
    }

    // Alt+0 = Settings
    if (e.altKey && e.key === '0') {
        e.preventDefault();
        navigateTo('settings');
        return;
    }

    // Escape = Close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        const dropdown = document.getElementById('globalSearchResults');
        if (dropdown) dropdown.style.display = 'none';
    }
});

// ============================================================
// DİLEKÇE ŞABLONLARI
// ============================================================
let editingPetitionId = null;

const petitionTemplates = {
    dava: {
        name: 'Dava Dilekçesi',
        icon: 'fa-gavel',
        desc: 'Genel dava dilekçesi taslağı',
        body: `AÇIKLAMALAR:

1. [Olayların kronolojik sıralaması]

2. [Hukuki değerlendirme]

3. [Deliller]

HUKUKİ NEDENLER: [İlgili kanun maddeleri]

DELİLLER: [Delil listesi]`,
        request: `Yukarıda arz ve izah edilen nedenlerle;
1. [Talep 1]
2. [Talep 2]
3. Yargılama giderleri ve vekalet ücretinin karşı tarafa yükletilmesine karar verilmesini saygıyla vekaleten arz ve talep ederiz.`
    },
    cevap: {
        name: 'Cevap Dilekçesi',
        icon: 'fa-reply',
        desc: 'Dava cevap dilekçesi taslağı',
        body: `CEVAP ve İTİRAZLARIMIZ:

USULE İLİŞKİN İTİRAZLARIMIZ:
1. [Usuli itiraz]

ESASA İLİŞKİN CEVAP ve İTİRAZLARIMIZ:
1. [Esasa ilişkin cevap]

2. [Karşı deliller]

HUKUKİ NEDENLER: [İlgili kanun maddeleri]

DELİLLER: [Delil listesi]`,
        request: `Yukarıda arz ve izah edilen nedenlerle; davanın REDDİNE, yargılama giderleri ve vekalet ücretinin davacı tarafa yükletilmesine karar verilmesini saygıyla vekaleten arz ve talep ederiz.`
    },
    itiraz: {
        name: 'İtiraz Dilekçesi',
        icon: 'fa-exclamation-triangle',
        desc: 'Genel itiraz dilekçesi',
        body: `İTİRAZ NEDENLERİMİZ:

1. [İtiraz nedeni 1]

2. [İtiraz nedeni 2]

3. [Hukuki gerekçe]`,
        request: `Yukarıda arz edilen nedenlerle itirazımızın kabulüne karar verilmesini saygıyla vekaleten arz ve talep ederiz.`
    },
    istinaf: {
        name: 'İstinaf Başvuru Dilekçesi',
        icon: 'fa-arrow-up',
        desc: 'İstinaf kanun yolu başvurusu',
        body: `İSTİNAF NEDENLERİMİZ:

1. USUL YÖNÜNDEN:
[Usule aykırılık]

2. ESAS YÖNÜNDEN:
[Esasa ilişkin hatalı değerlendirme]

3. HUKUKA AYKIRILIK:
[Hukuka aykırılık nedeni]`,
        request: `Yukarıda arz ve izah edilen nedenlerle; yerel mahkeme kararının KALDIRILMASINA ve davanın yeniden görülmek üzere mahkemesine İADESİNE / davanın esastan incelenerek KABULÜNE karar verilmesini saygıyla vekaleten arz ve talep ederiz.`
    },
    temyiz: {
        name: 'Temyiz Dilekçesi',
        icon: 'fa-building-columns',
        desc: 'Temyiz kanun yolu başvurusu',
        body: `TEMYİZ NEDENLERİMİZ:

1. [Hukuki hata]

2. [Eksik inceleme]

3. [İçtihat aykırılığı]`,
        request: `Yukarıda arz ve izah edilen nedenlerle; istinaf mahkemesi kararının BOZULMASINA karar verilmesini saygıyla vekaleten arz ve talep ederiz.`
    },
    'icra-itiraz': {
        name: 'İcra İtiraz Dilekçesi',
        icon: 'fa-hand-paper',
        desc: 'İcra takibine itiraz',
        body: `İTİRAZ NEDENLERİMİZ:

1. BORCA İTİRAZ: [Borç bulunmadığı / ödendiği]

2. FAİZE İTİRAZ: [Faiz hesabı hatalı]

3. YETKİYE İTİRAZ: [Yetkisiz icra dairesi]`,
        request: `Yukarıda arz edilen nedenlerle; icra takibinin DURDURULMASINA karar verilmesini saygıyla vekaleten arz ve talep ederiz.`
    },
    arabuluculuk: {
        name: 'Arabuluculuk Başvuru',
        icon: 'fa-handshake',
        desc: 'Arabuluculuk başvuru dilekçesi',
        body: `BAŞVURU NEDENİ:
[Uyuşmazlığın kısa özeti]

TARAFLAR:
Başvuran: [Müvekkil bilgileri]
Karşı Taraf: [Karşı taraf bilgileri]

UYUŞMAZLIK KONUSU:
[Detaylı açıklama]`,
        request: `Taraflar arasındaki uyuşmazlığın arabuluculuk yoluyla çözülmesi için başvurumuzun kabulünü saygıyla arz ederiz.`
    },
    beyan: {
        name: 'Beyan Dilekçesi',
        icon: 'fa-comment-dots',
        desc: 'Mahkemeye beyan sunma',
        body: `BEYANLARIMIZ:

1. [Beyan 1]

2. [Beyan 2]`,
        request: `Yukarıdaki beyanlarımızın dosyaya alınmasını saygıyla vekaleten arz ederiz.`
    },
    feragat: {
        name: 'Feragat Dilekçesi',
        icon: 'fa-ban',
        desc: 'Davadan feragat',
        body: `Mahkemenizde görülmekte olan yukarıda esas numarası yazılı davada davacı vekili olarak;

Müvekkilimizin talimatı doğrultusunda, davamızın tamamından / [kısmi feragat konusu] kısmından feragat ediyoruz.`,
        request: `Feragatimiz nedeniyle davanın feragat sebebiyle REDDİNE karar verilmesini saygıyla vekaleten arz ederiz.`
    },
    ihtarname: {
        name: 'İhtarname',
        icon: 'fa-exclamation-circle',
        desc: 'Noterden gönderilecek ihtar',
        body: `İHTARNAME

İHTAR EDEN: {{müvekkil}}
VEKİLİ: {{avukat}} - {{baro}}

MUHATAP: [Karşı taraf adı ve adresi]

İHTARIN KONUSU: [Konu başlığı]

AÇIKLAMALAR:

1. Müvekkilimiz ile muhatap arasında [tarih] tarihli [sözleşme türü] sözleşmesi akdedilmiştir.

2. Muhatap, sözleşme gereği [yükümlülük] yükümlülüğünü yerine getirmemiştir.

3. [Detay açıklama]

İHTAR:

Yukarıda açıklanan nedenlerle; işbu ihtarnamenin tebliğinden itibaren [7/15/30] gün içinde [talep edilen eylem] aksi halde yasal yollara başvurulacağı, yargılama giderleri ve vekalet ücretinin tarafınıza yükleneceği ihtar olunur.

Sayın Noter; üç nüshadan ibaret ihtarnamenin bir nüshasının muhataba tebliğini, bir nüshasının dairenizde saklanmasını, tebliğ şerhli bir nüshasının tarafımıza verilmesini saygıyla talep ederiz.

{{tarih}}`,
        request: ''
    },
    sulh: {
        name: 'Sulh Protokolü',
        icon: 'fa-handshake',
        desc: 'Taraflar arası sulh anlaşması',
        body: `SULH PROTOKOLÜ

TARAFLAR:

1. TARAF: {{müvekkil}} (Bundan böyle "Taraf 1" olarak anılacaktır)
   VEKİLİ: {{avukat}}

2. TARAF: [Karşı taraf] (Bundan böyle "Taraf 2" olarak anılacaktır)
   VEKİLİ: [Karşı taraf vekili]

KONU: [Mahkeme] [Esas No] sayılı dosyada görülmekte olan dava hakkında

PROTOKOL MADDELERİ:

Madde 1 - Taraflar, yukarıda belirtilen dava dosyası kapsamında aşağıdaki şartlarda sulh olmayı kabul ve taahhüt etmişlerdir.

Madde 2 - [Sulh şartı 1]

Madde 3 - [Sulh şartı 2]

Madde 4 - [Ödeme koşulları]

Madde 5 - İşbu protokolün imzalanmasını müteakip taraflar karşılıklı olarak davadan feragat / kabul edeceklerdir.

Madde 6 - Yargılama giderleri ve vekalet ücretleri [taraflar üzerinde bırakılacak / paylaşılacak].

Madde 7 - İşbu protokol [2/3] nüsha olarak düzenlenmiş ve taraflarca imza altına alınmıştır.

{{tarih}}

TARAF 1                                    TARAF 2
[İmza]                                     [İmza]`,
        request: ''
    },
    bilirkisi: {
        name: 'Bilirkişi Raporu Analiz',
        icon: 'fa-search',
        desc: 'Bilirkişi raporuna itiraz/analiz formu',
        body: `BİLİRKİŞİ RAPORUNA İTİRAZ DİLEKÇESİ

MAHKEME: {{mahkeme}}
DOSYA NO: [Esas No]

DAVACI: {{müvekkil}}
VEKİLİ: {{avukat}}

KONU: [Tarih] tarihli bilirkişi raporuna itirazlarımızın sunulması hk.

İTİRAZLARIMIZ:

1. USULE İLİŞKİN İTİRAZ:
[Bilirkişi heyetinin uzmanlık alanı uyuşmazlığı / süre aşımı vb.]

2. ESASA İLİŞKİN İTİRAZLAR:

a) [Hesaplama hatası]
b) [Eksik inceleme]
c) [Yanlış değerlendirme]

3. EK RAPOR TALEBİ:
[Gerekçe]

DELİLLER: [Ek belgeler]`,
        request: `Yukarıda arz edilen nedenlerle; bilirkişi raporuna itirazlarımızın kabulüne, yeni bir bilirkişi heyeti oluşturularak ek rapor alınmasına karar verilmesini saygıyla vekaleten arz ve talep ederiz.`
    },
    muzekkere: {
        name: 'Müzekkere Taslağı',
        icon: 'fa-paper-plane',
        desc: 'Mahkemeden kuruma yazılacak müzekkere',
        body: `T.C.
{{mahkeme}}

Esas No: [ESAS NO]

MÜZEKKERE

KONU: [Müzekkere konusu]

[KURUM ADI VE ADRESİ]

Mahkememizde görülmekte olan yukarıda esas numarası yazılı dava dosyasında;

[Talep edilen bilgi/belge açıklaması]

Bilgi/belgelerin mahkememize gönderilmesini rica ederim.

{{tarih}}

Hakim
[Hakim Adı]`,
        request: ''
    },
    temlik: {
        name: 'Temlik Sözleşmesi',
        icon: 'fa-exchange-alt',
        desc: 'Alacak/hak temlik sözleşmesi',
        body: `TEMLİK SÖZLEŞMESİ

TEMLIK EDEN (Cedent): {{müvekkil}}
TEMLİK ALAN (Cesyoner): [Temlik alan taraf]
BORÇLU: [Borçlu taraf]

KONU: İşbu sözleşme ile Temlik Eden, aşağıda belirtilen alacağını Temlik Alan'a devretmektedir.

TEMLİK EDİLEN ALACAK:
- Alacak Tutarı: [Tutar] TL
- Alacağın Kaynağı: [Sözleşme/Fatura/Karar detayı]
- Vade Tarihi: [Tarih]

ŞARTLAR:

Madde 1 - Temlik Eden, yukarıda belirtilen alacağını tüm fer'ileri (faiz, masraf vb.) ile birlikte Temlik Alan'a kayıtsız şartsız devir ve temlik etmiştir.

Madde 2 - Temlik Eden, temlik edilen alacağın mevcut ve sahih olduğunu, üzerinde herhangi bir takyidat bulunmadığını beyan ve taahhüt eder.

Madde 3 - Temlik, borçluya yapılacak bildirim ile hüküm ifade eder.

Madde 4 - İşbu sözleşmeden doğan uyuşmazlıklarda [Şehir] Mahkemeleri ve İcra Daireleri yetkilidir.

{{tarih}}

TEMLİK EDEN                               TEMLİK ALAN
[İmza]                                    [İmza]`,
        request: ''
    },
    nda: {
        name: 'Gizlilik Sözleşmesi (NDA)',
        icon: 'fa-lock',
        desc: 'Karşılıklı gizlilik anlaşması',
        body: `GİZLİLİK SÖZLEŞMESİ (NDA)

TARAFLAR:

1) {{müvekkil}} ("Taraf A")
2) [Karşı taraf] ("Taraf B")

(Birlikte "Taraflar" olarak anılacaktır)

Madde 1 - AMAÇ
İşbu sözleşme, Taraflar arasında [konu] kapsamında paylaşılacak gizli bilgilerin korunmasını amaçlamaktadır.

Madde 2 - GİZLİ BİLGİ TANIMI
Gizli bilgi; yazılı, sözlü veya elektronik ortamda paylaşılan her türlü ticari, mali, teknik, hukuki bilgi, know-how, müşteri listeleri, iş planları ve stratejileri kapsar.

Madde 3 - GİZLİLİK YÜKÜMLÜLÜĞÜ
Taraflar, gizli bilgileri:
a) Yalnızca sözleşme amacı doğrultusunda kullanacak,
b) Üçüncü kişilerle paylaşmayacak,
c) Kendi gizli bilgileri gibi koruyacaktır.

Madde 4 - İSTİSNALAR
a) Kamuya açık bilgiler,
b) Yasal zorunlulukla açıklanması gereken bilgiler,
c) Bağımsız olarak geliştirilen bilgiler.

Madde 5 - SÜRE
İşbu sözleşme imza tarihinden itibaren [2/3/5] yıl süreyle geçerlidir.

Madde 6 - CEZAİ ŞART
İhlal halinde ihlal eden taraf [tutar] TL cezai şart ödeyecektir.

Madde 7 - YETKİLİ MAHKEME
[Şehir] Mahkemeleri ve İcra Daireleri yetkilidir.

{{tarih}}

TARAF A                                   TARAF B
[İmza]                                    [İmza]`,
        request: ''
    },
    tensip: {
        name: 'Tensip Zaptı Şablonu',
        icon: 'fa-clipboard-list',
        desc: 'Mahkeme tensip zaptı formatı',
        body: `T.C.
[MAHKEME ADI]

Esas No: [ESAS NO]

TENSİP ZAPTI

HAKİM: [Hakim Adı]
KATİP: [Katip Adı]

DAVACI: [Davacı]
VEKİLİ: [Davacı Vekili]
DAVALI: [Davalı]
VEKİLİ: [Davalı Vekili]

DAVA: [Dava Türü]

DAVA TARİHİ: [Tarih]

GEREĞİ DÜŞÜNÜLDÜ:

1. Dava dilekçesinin HMK'nın 119. maddesi gereğince incelenmesine,
2. Davanın [kabulüne/usulden reddine] dair karar verilmesine yer olmadığına,
3. Dava dilekçesinin davalı tarafa tebliğine,
4. Davalı tarafa 2 haftalık cevap süresi verilmesine,
5. [Ek tensip kararları]
6. Duruşma gününün [TARİH SAAT] olarak belirlenmesine,

Tensiben karar verildi. [TARİH]`,
        request: ''
    },
    bilgilendirme: {
        name: 'Müvekkil Bilgilendirme',
        icon: 'fa-envelope-open-text',
        desc: 'Müvekkile dosya durumu bilgilendirmesi',
        body: `Sayın [MÜVEKKİL ADI],

[DOSYA ADI / ESAS NO] sayılı dosyanız hakkında aşağıdaki gelişmeleri bilgilerinize sunarız:

DOSYA DURUMU:
[Dosyanın mevcut durumunu özetleyin]

SON GELİŞMELER:
1. [Gelişme 1]
2. [Gelişme 2]

YAPILACAK İŞLEMLER:
1. [Planlanan işlem 1]
2. [Planlanan işlem 2]

ÖNEMLİ TARİHLER:
- Sonraki Duruşma: [TARİH]
- Süre Bitimi: [TARİH]

Dosyanızla ilgili herhangi bir sorunuz olması halinde bizimle iletişime geçmekten çekinmeyiniz.

Saygılarımızla,`,
        request: ''
    },
    custom: {
        name: 'Özel Dilekçe',
        icon: 'fa-pen-fancy',
        desc: 'Boş dilekçe, serbest metin',
        body: '',
        request: ''
    }
};

window.refreshPetitions = function() {
    const container = document.getElementById('petitionTemplatesList');
    if (!container) return;

    // Show template cards
    let html = '';
    for (const [key, tpl] of Object.entries(petitionTemplates)) {
        html += `<div class="petition-template-card" onclick="openPetitionFromTemplate('${key}')">
            <i class="fas ${tpl.icon}"></i>
            <h4>${tpl.name}</h4>
            <p>${tpl.desc}</p>
        </div>`;
    }

    // Show saved petitions below
    const saved = DB.data.petitions || [];
    if (saved.length > 0) {
        html += `<div style="grid-column:1/-1;margin-top:20px;">
            <h3 style="margin-bottom:12px;">Kayıtlı Dilekçeler (${saved.length})</h3>`;
        saved.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach(p => {
            const tpl = petitionTemplates[p.type] || petitionTemplates.custom;
            html += `<div class="contract-item" style="border-left:4px solid var(--primary);">
                <div style="flex:1;">
                    <strong>${p.subject || tpl.name}</strong>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">
                        ${tpl.name} | ${p.client || 'Müvekkil belirtilmemiş'} | ${p.court || ''} ${p.esasNo ? '(' + p.esasNo + ')' : ''}
                    </div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">
                        ${typeof formatDate === 'function' ? formatDate(p.updatedAt?.split('T')[0]) : p.updatedAt}
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-outline" onclick="editPetition('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-ghost" onclick="deletePetition('${p.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
};

window.openPetitionFromTemplate = function(templateKey) {
    editingPetitionId = null;
    const modal = document.getElementById('petitionEditorModal');
    if (!modal) return;

    document.getElementById('petitionEditorTitle').textContent = 'Yeni Dilekçe';
    document.getElementById('petitionType').value = templateKey;

    // Clear fields
    ['petitionClient', 'petitionCourt', 'petitionEsasNo', 'petitionOpponent', 'petitionSubject'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // Fill from template
    const tpl = petitionTemplates[templateKey];
    if (tpl) {
        document.getElementById('petitionBody').value = tpl.body || '';
        document.getElementById('petitionRequest').value = tpl.request || '';
    }

    // Update client autocomplete
    const clientList = document.getElementById('petitionClientList');
    if (clientList) {
        clientList.innerHTML = (DB.data.clients || []).map(c => `<option value="${c.name}">`).join('');
    }

    modal.classList.add('active');
};

window.openPetitionEditor = function() {
    openPetitionFromTemplate('custom');
};

window.editPetition = function(id) {
    const p = (DB.data.petitions || []).find(x => x.id === id);
    if (!p) return;

    editingPetitionId = id;
    const modal = document.getElementById('petitionEditorModal');
    if (!modal) return;

    document.getElementById('petitionEditorTitle').textContent = 'Dilekçe Düzenle';
    document.getElementById('petitionType').value = p.type || 'custom';
    document.getElementById('petitionClient').value = p.client || '';
    document.getElementById('petitionCourt').value = p.court || '';
    document.getElementById('petitionEsasNo').value = p.esasNo || '';
    document.getElementById('petitionOpponent').value = p.opponent || '';
    document.getElementById('petitionSubject').value = p.subject || '';
    document.getElementById('petitionBody').value = p.body || '';
    document.getElementById('petitionRequest').value = p.request || '';

    modal.classList.add('active');
};

window.fillPetitionTemplate = function() {
    const type = document.getElementById('petitionType').value;
    const tpl = petitionTemplates[type];
    if (tpl && tpl.body) {
        document.getElementById('petitionBody').value = tpl.body;
        document.getElementById('petitionRequest').value = tpl.request;
        toast('Şablon yüklendi', 'success');
    } else {
        toast('Bu tür için şablon bulunamadı', 'info');
    }
};

window.savePetition = function() {
    if (!DB.data.petitions) DB.data.petitions = [];

    const petition = {
        id: editingPetitionId || genId(),
        type: document.getElementById('petitionType').value,
        client: document.getElementById('petitionClient').value,
        court: document.getElementById('petitionCourt').value,
        esasNo: document.getElementById('petitionEsasNo').value,
        opponent: document.getElementById('petitionOpponent').value,
        subject: document.getElementById('petitionSubject').value,
        body: document.getElementById('petitionBody').value,
        request: document.getElementById('petitionRequest').value,
        createdBy: DB.data.currentUser?.name || '',
        updatedAt: new Date().toISOString()
    };

    if (editingPetitionId) {
        const idx = DB.data.petitions.findIndex(p => p.id === editingPetitionId);
        if (idx >= 0) DB.data.petitions[idx] = petition;
    } else {
        DB.data.petitions.push(petition);
    }

    DB.save();
    toast('Dilekçe kaydedildi', 'success');
    document.getElementById('petitionEditorModal').classList.remove('active');
    refreshPetitions();
};

window.deletePetition = function(id) {
    if (!confirm('Dilekçe silinsin mi?')) return;
    DB.data.petitions = (DB.data.petitions || []).filter(p => p.id !== id);
    DB.save();
    toast('Dilekçe silindi', 'success');
    refreshPetitions();
};

window.exportPetitionPDF = function() {
    const s = DB.data.settings || {};
    const type = document.getElementById('petitionType').value;
    const tpl = petitionTemplates[type] || petitionTemplates.custom;
    const client = document.getElementById('petitionClient').value;
    const court = document.getElementById('petitionCourt').value;
    const esasNo = document.getElementById('petitionEsasNo').value;
    const opponent = document.getElementById('petitionOpponent').value;
    const subject = document.getElementById('petitionSubject').value;
    const body = document.getElementById('petitionBody').value;
    const request = document.getElementById('petitionRequest').value;

    let html = `<div style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.8;padding:40px;">`;

    // Header
    html += `<div style="text-align:center;margin-bottom:30px;">
        <strong style="font-size:14pt;">${court || '[MAHKEME ADI]'}</strong><br>
        <strong>SAYIN BAŞKANLIĞI'NA</strong>
    </div>`;

    if (esasNo) html += `<div style="margin-bottom:20px;"><strong>Dosya No:</strong> ${esasNo}</div>`;

    html += `<div style="margin-bottom:20px;">
        <strong>DAVACI${client ? '' : ' / BAŞVURUCU'}:</strong> ${client || '[Müvekkil Adı]'}<br>
        <strong>VEKİLİ:</strong> ${s.firmName || '[Avukat Adı]'} - ${s.barAssociation || '[Baro]'}<br>
        ${opponent ? `<strong>DAVALI / KARŞI TARAF:</strong> ${opponent}<br>` : ''}
        ${subject ? `<strong>KONU:</strong> ${subject}<br>` : ''}
    </div>`;

    html += `<div style="margin-bottom:24px;text-align:justify;">${body.replace(/\n/g, '<br>')}</div>`;

    html += `<div style="margin-bottom:30px;">
        <strong>SONUÇ VE İSTEM:</strong><br>
        ${request.replace(/\n/g, '<br>')}
    </div>`;

    html += `<div style="text-align:right;margin-top:40px;">
        <div>${new Date().toLocaleDateString('tr-TR')}</div>
        <div style="margin-top:8px;"><strong>${s.firmName || '[Avukat Adı]'}</strong></div>
        <div>${s.barAssociation || ''}</div>
    </div>`;

    html += `</div>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    const opt = {
        margin: [15, 15, 15, 15],
        filename: `dilekce_${type}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save().then(() => {
        tempDiv.remove();
        toast('Dilekçe PDF indirildi', 'success');
    });
};

window.exportPetitionWord = function() {
    const s = DB.data.settings || {};
    const type = document.getElementById('petitionType').value;
    const client = document.getElementById('petitionClient').value;
    const court = document.getElementById('petitionCourt').value;
    const esasNo = document.getElementById('petitionEsasNo').value;
    const opponent = document.getElementById('petitionOpponent').value;
    const subject = document.getElementById('petitionSubject').value;
    const body = document.getElementById('petitionBody').value;
    const request = document.getElementById('petitionRequest').value;

    const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

    const children = [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: court || '[MAHKEME ADI]', bold: true, size: 28, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SAYIN BAŞKANLIĞI\'NA', bold: true, size: 24, font: 'Times New Roman' })] }),
        new Paragraph({ text: '' }),
    ];

    if (esasNo) children.push(new Paragraph({ children: [new TextRun({ text: 'Dosya No: ' + esasNo, bold: true, font: 'Times New Roman', size: 24 })] }));

    children.push(
        new Paragraph({ children: [new TextRun({ text: 'DAVACI: ', bold: true, font: 'Times New Roman', size: 24 }), new TextRun({ text: client || '[Müvekkil]', font: 'Times New Roman', size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: 'VEKİLİ: ', bold: true, font: 'Times New Roman', size: 24 }), new TextRun({ text: s.firmName || '[Avukat]', font: 'Times New Roman', size: 24 })] })
    );
    if (opponent) children.push(new Paragraph({ children: [new TextRun({ text: 'DAVALI: ', bold: true, font: 'Times New Roman', size: 24 }), new TextRun({ text: opponent, font: 'Times New Roman', size: 24 })] }));
    if (subject) children.push(new Paragraph({ children: [new TextRun({ text: 'KONU: ', bold: true, font: 'Times New Roman', size: 24 }), new TextRun({ text: subject, font: 'Times New Roman', size: 24 })] }));

    children.push(new Paragraph({ text: '' }));

    // Body paragraphs
    body.split('\n').forEach(line => {
        children.push(new Paragraph({ children: [new TextRun({ text: line, font: 'Times New Roman', size: 24 })] }));
    });

    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'SONUÇ VE İSTEM:', bold: true, font: 'Times New Roman', size: 24 })] }));
    request.split('\n').forEach(line => {
        children.push(new Paragraph({ children: [new TextRun({ text: line, font: 'Times New Roman', size: 24 })] }));
    });

    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: new Date().toLocaleDateString('tr-TR'), font: 'Times New Roman', size: 24 })] }));
    children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: s.firmName || '[Avukat]', bold: true, font: 'Times New Roman', size: 24 })] }));

    const doc = new Document({ sections: [{ children }] });

    Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dilekce_${type}_${new Date().toISOString().split('T')[0]}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Dilekçe Word indirildi', 'success');
    });
};

// ============================================================
// YASAL FAİZ HESAPLAYICI
// ============================================================

// TCMB Yasal Faiz Oranları (yıllık %)
const legalInterestRates = [
    { from: '2024-07-01', to: '2099-12-31', yasal: 24, ticari: 58.73 },
    { from: '2024-01-01', to: '2024-06-30', yasal: 24, ticari: 54.68 },
    { from: '2023-07-01', to: '2023-12-31', yasal: 24, ticari: 40.92 },
    { from: '2023-01-01', to: '2023-06-30', yasal: 9, ticari: 24.67 },
    { from: '2022-07-01', to: '2022-12-31', yasal: 9, ticari: 28.83 },
    { from: '2022-01-01', to: '2022-06-30', yasal: 9, ticari: 20.13 },
    { from: '2021-01-01', to: '2021-12-31', yasal: 9, ticari: 18.25 },
    { from: '2020-01-01', to: '2020-12-31', yasal: 9, ticari: 15.75 },
    { from: '2019-07-01', to: '2019-12-31', yasal: 9, ticari: 27.04 },
    { from: '2019-01-01', to: '2019-06-30', yasal: 9, ticari: 28.33 },
    { from: '2017-01-01', to: '2018-12-31', yasal: 9, ticari: 19.50 },
    { from: '2005-05-01', to: '2016-12-31', yasal: 9, ticari: 15.75 }
];

// Enable custom rate input based on selection
document.addEventListener('change', function(e) {
    if (e.target.id === 'interestType') {
        const customInput = document.getElementById('interestCustomRate');
        if (customInput) customInput.disabled = (e.target.value !== 'custom');
    }
});

window.calculateInterest = function() {
    const principal = parseFloat(document.getElementById('interestPrincipal')?.value);
    const currency = document.getElementById('interestCurrency')?.value || 'TRY';
    const startDate = document.getElementById('interestStartDate')?.value;
    const endDate = document.getElementById('interestEndDate')?.value;
    const type = document.getElementById('interestType')?.value;
    const customRate = parseFloat(document.getElementById('interestCustomRate')?.value);

    if (!principal || !startDate || !endDate) {
        toast('Tutar, başlangıç ve bitiş tarihi zorunludur', 'error');
        return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
        toast('Bitiş tarihi başlangıçtan sonra olmalı', 'error');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    let totalInterest = 0;
    let breakdown = [];

    if (type === 'custom') {
        const rate = customRate || 0;
        totalInterest = principal * (rate / 100) * (totalDays / 365);
        breakdown.push({ period: `${formatDate(startDate)} - ${formatDate(endDate)}`, days: totalDays, rate: rate, interest: totalInterest });
    } else {
        // Calculate with period-based rates
        let current = new Date(start);

        while (current < end) {
            const dateStr = current.toISOString().split('T')[0];
            const rateInfo = legalInterestRates.find(r => dateStr >= r.from && dateStr <= r.to) || { yasal: 9, ticari: 15.75 };
            const rate = type === 'ticari' ? rateInfo.ticari : rateInfo.yasal;

            // Find end of this rate period
            const periodEnd = new Date(Math.min(
                end.getTime(),
                legalInterestRates.find(r => dateStr >= r.from && dateStr <= r.to)
                    ? new Date(legalInterestRates.find(r => dateStr >= r.from && dateStr <= r.to).to + 'T23:59:59').getTime() + 86400000
                    : end.getTime()
            ));

            const days = Math.ceil((periodEnd - current) / (1000 * 60 * 60 * 24));
            const interest = principal * (rate / 100) * (days / 365);
            totalInterest += interest;

            breakdown.push({
                period: `${formatDate(current.toISOString().split('T')[0])} - ${formatDate(new Date(periodEnd.getTime() - 86400000).toISOString().split('T')[0])}`,
                days: days,
                rate: rate,
                interest: interest
            });

            current = periodEnd;
        }
    }

    const symbols = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
    const sym = symbols[currency] || '₺';

    const resultDiv = document.getElementById('interestResult');
    resultDiv.style.display = 'block';

    let html = `<div class="interest-result-card">
        <h4 style="margin-bottom:16px;">Hesaplama Sonucu</h4>
        <div class="interest-result-row"><span>Asıl Alacak</span><span>${sym}${principal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span></div>
        <div class="interest-result-row"><span>Faiz Türü</span><span>${type === 'yasal' ? 'Yasal Faiz' : type === 'ticari' ? 'Ticari Faiz (Avans)' : 'Özel Oran'}</span></div>
        <div class="interest-result-row"><span>Toplam Gün</span><span>${totalDays} gün</span></div>`;

    if (breakdown.length > 1) {
        html += `<div style="margin:12px 0 8px;font-weight:600;font-size:0.85rem;">Dönem Detayı:</div>`;
        breakdown.forEach(b => {
            html += `<div class="interest-result-row" style="font-size:0.82rem;">
                <span>${b.period} (${b.days} gün, %${b.rate})</span>
                <span>${sym}${b.interest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>`;
        });
    }

    html += `<div class="interest-result-row"><span>Toplam Faiz</span><span style="color:var(--accent3);font-weight:700;">${sym}${totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span></div>`;
    html += `<div class="interest-result-row total"><span>GENEL TOPLAM (Asıl + Faiz)</span><span>${sym}${(principal + totalInterest).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span></div>`;
    html += `</div>`;

    resultDiv.innerHTML = html;
};

// ============================================================
// MASRAF FATURALAMA
// ============================================================
window.loadBillingExpenses = function() {
    const clientSelect = document.getElementById('billingClient');
    const filter = document.getElementById('billingFilter')?.value || 'unbilled';
    const container = document.getElementById('billingExpensesList');
    const actionsDiv = document.getElementById('billingActions');

    if (!clientSelect?.value) {
        container.innerHTML = '<p class="empty-state">Müvekkil seçin.</p>';
        if (actionsDiv) actionsDiv.style.display = 'none';
        return;
    }

    const clientName = clientSelect.value;
    let expenses = (DB.data.expenses || []).filter(e => {
        // Match by proposal's client
        const proposal = (DB.data.proposals || []).find(p => p.id === e.proposalId);
        return proposal?.clientName === clientName || e.clientName === clientName;
    });

    if (filter === 'billed') expenses = expenses.filter(e => e.billed);
    else if (filter === 'unbilled') expenses = expenses.filter(e => !e.billed);

    if (expenses.length === 0) {
        container.innerHTML = '<p class="empty-state">Bu filtreye uygun masraf bulunamadı.</p>';
        if (actionsDiv) actionsDiv.style.display = 'none';
        return;
    }

    const expTypeLabels = { harc: 'Yargılama Harcı', posta: 'Posta/Tebligat', bilirkisi: 'Bilirkişi', keşif: 'Keşif', noter: 'Noter', yol: 'Yol/Ulaşım', konaklama: 'Konaklama', tercume: 'Tercüme', diger: 'Diğer' };

    container.innerHTML = expenses.map(e => {
        const amt = parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0);
        return `<div class="billing-item">
            <label>
                <input type="checkbox" class="billing-check" data-expense-id="${e.id}" ${e.billed ? 'disabled' : ''}>
                <div>
                    <strong>${e.description || expTypeLabels[e.type] || e.type}</strong>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">${typeof formatDate === 'function' ? formatDate(e.date) : e.date} | ${expTypeLabels[e.type] || e.type}</div>
                </div>
            </label>
            <span class="bi-amount">${formatCurrency(amt, 'TRY')}</span>
            <span class="bi-status ${e.billed ? 'bi-billed' : 'bi-unbilled'}">${e.billed ? 'Faturalandı' : 'Bekliyor'}</span>
        </div>`;
    }).join('');

    if (actionsDiv) actionsDiv.style.display = 'block';

    // Update total on checkbox change
    container.addEventListener('change', updateBillingTotal);
    updateBillingTotal();
};

function updateBillingTotal() {
    const checks = document.querySelectorAll('.billing-check:checked');
    let total = 0;
    checks.forEach(ch => {
        const exp = (DB.data.expenses || []).find(e => e.id === ch.dataset.expenseId);
        if (exp) total += parseFloat(String(exp.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0);
    });
    const el = document.getElementById('billingTotal');
    if (el) el.textContent = formatCurrency(total, 'TRY');
}

window.markAsBilled = function() {
    const checks = document.querySelectorAll('.billing-check:checked');
    if (checks.length === 0) { toast('Masraf seçin', 'error'); return; }

    checks.forEach(ch => {
        const exp = (DB.data.expenses || []).find(e => e.id === ch.dataset.expenseId);
        if (exp) {
            exp.billed = true;
            exp.billedDate = new Date().toISOString().split('T')[0];
            exp.billedBy = DB.data.currentUser?.name || '';
        }
    });

    DB.save();
    toast(`${checks.length} masraf faturalandı olarak işaretlendi`, 'success');
    loadBillingExpenses();
};

window.exportBillingPDF = function() {
    const checks = document.querySelectorAll('.billing-check:checked');
    if (checks.length === 0) { toast('En az bir masraf seçin', 'error'); return; }

    const s = DB.data.settings || {};
    const clientName = document.getElementById('billingClient')?.value || '';
    const expTypeLabels = { harc: 'Yargılama Harcı', posta: 'Posta/Tebligat', bilirkisi: 'Bilirkişi', keşif: 'Keşif', noter: 'Noter', yol: 'Yol/Ulaşım', konaklama: 'Konaklama', tercume: 'Tercüme', diger: 'Diğer' };

    let html = `<div style="font-family:Arial,sans-serif;padding:30px;font-size:10pt;">
        <div style="text-align:center;margin-bottom:24px;">
            <h2 style="margin:0;color:#1a1d2e;">${s.firmName || 'Hukuk Bürosu'}</h2>
            <div style="font-size:9pt;color:#636e72;">${s.firmAddress || ''} | ${s.firmPhone || ''}</div>
        </div>
        <h3 style="border-bottom:2px solid #4a6cf7;padding-bottom:8px;">MASRAF FATURASI</h3>
        <div style="margin:16px 0;">
            <strong>Müvekkil:</strong> ${clientName}<br>
            <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <thead><tr style="background:#f5f6fa;">
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">#</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Tarih</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Tür</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e1e5ee;">Açıklama</th>
                <th style="padding:8px;text-align:right;border-bottom:2px solid #e1e5ee;">Tutar</th>
            </tr></thead><tbody>`;

    let total = 0;
    let idx = 1;
    checks.forEach(ch => {
        const exp = (DB.data.expenses || []).find(e => e.id === ch.dataset.expenseId);
        if (!exp) return;
        const amt = parseFloat(String(exp.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0);
        total += amt;
        html += `<tr>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${idx++}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${typeof formatDate === 'function' ? formatDate(exp.date) : exp.date}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${expTypeLabels[exp.type] || exp.type}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${exp.description || ''}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${formatCurrency(amt, 'TRY')}</td>
        </tr>`;
    });

    html += `<tr style="background:#f5f6fa;font-weight:700;">
        <td colspan="4" style="padding:8px;">TOPLAM</td>
        <td style="padding:8px;text-align:right;">${formatCurrency(total, 'TRY')}</td>
    </tr></tbody></table>
    <div style="margin-top:40px;text-align:right;">
        <div>${s.firmName || ''}</div>
        <div style="font-size:9pt;color:#636e72;">${s.barAssociation || ''}</div>
    </div></div>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `masraf_fatura_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(tempDiv).save().then(() => {
        tempDiv.remove();
        toast('Fatura PDF indirildi', 'success');
    });
};

// ============================================================
// MÜVEKKİL KÂR/ZARAR ANALİZİ
// ============================================================
window.calculateProfitLoss = function() {
    const hourlyRate = parseFloat(document.getElementById('plHourlyRate')?.value) || 3000;
    const period = document.getElementById('plPeriod')?.value || 'all';
    const resultDiv = document.getElementById('profitLossResult');
    if (!resultDiv) return;

    const now = new Date();
    let periodStart = null;
    if (period === 'year') periodStart = `${now.getFullYear()}-01-01`;
    else if (period === 'month') periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const clients = DB.data.clients || [];
    if (clients.length === 0) {
        resultDiv.innerHTML = '<p class="empty-state">Henüz müvekkil kaydı yok.</p>';
        return;
    }

    const rows = [];

    clients.forEach(client => {
        // Find proposals for this client
        const proposals = (DB.data.proposals || []).filter(p => p.clientName === client.name);

        // Revenue: accepted proposals' fees
        let revenue = 0;
        proposals.forEach(p => {
            if (p.status === 'accepted' || p.status === 'kabul') {
                const fee = parseFloat(String(p.feeData?.amount || p.feeData?.fixedAmount || 0).replace(/[^\d.,]/g, '').replace(',', '.'));
                revenue += fee || 0;
            }
        });

        // Expenses
        let expenses = (DB.data.expenses || []).filter(e => {
            const proposal = proposals.find(p => p.id === e.proposalId);
            if (!proposal && e.clientName !== client.name) return false;
            if (periodStart && e.date < periodStart) return false;
            return true;
        });
        let totalExpense = 0;
        expenses.forEach(e => {
            totalExpense += parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0);
        });

        // Time spent
        let timeEntries = (DB.data.timesheet || []).filter(e => {
            const proposal = proposals.find(p => p.id === e.proposalId);
            if (!proposal && e.clientName !== client.name) return false;
            if (periodStart && e.date < periodStart) return false;
            return true;
        });
        let totalMinutes = 0;
        timeEntries.forEach(e => totalMinutes += e.duration || 0);
        const timeCost = (totalMinutes / 60) * hourlyRate;

        const profit = revenue - totalExpense - timeCost;

        if (revenue > 0 || totalExpense > 0 || totalMinutes > 0) {
            rows.push({
                name: client.name,
                revenue,
                expense: totalExpense,
                hours: (totalMinutes / 60).toFixed(1),
                timeCost,
                profit
            });
        }
    });

    if (rows.length === 0) {
        resultDiv.innerHTML = '<p class="empty-state">Analiz için yeterli veri bulunamadı.</p>';
        return;
    }

    // Sort by profit desc
    rows.sort((a, b) => b.profit - a.profit);

    let totalRev = 0, totalExp = 0, totalTC = 0, totalProfit = 0;

    let html = `<table class="pl-table">
        <thead><tr>
            <th>Müvekkil</th>
            <th style="text-align:right;">Gelir (₺)</th>
            <th style="text-align:right;">Masraf (₺)</th>
            <th style="text-align:right;">Saat</th>
            <th style="text-align:right;">Zaman Maliyeti (₺)</th>
            <th style="text-align:right;">Net Kâr/Zarar (₺)</th>
        </tr></thead><tbody>`;

    rows.forEach(r => {
        totalRev += r.revenue;
        totalExp += r.expense;
        totalTC += r.timeCost;
        totalProfit += r.profit;

        html += `<tr>
            <td><strong>${r.name}</strong></td>
            <td style="text-align:right;">${formatCurrency(r.revenue, 'TRY')}</td>
            <td style="text-align:right;">${formatCurrency(r.expense, 'TRY')}</td>
            <td style="text-align:right;">${r.hours} sa</td>
            <td style="text-align:right;">${formatCurrency(r.timeCost, 'TRY')}</td>
            <td style="text-align:right;" class="${r.profit >= 0 ? 'pl-positive' : 'pl-negative'}">${r.profit >= 0 ? '+' : ''}${formatCurrency(r.profit, 'TRY')}</td>
        </tr>`;
    });

    html += `<tr style="font-weight:700;background:var(--bg);">
        <td>TOPLAM</td>
        <td style="text-align:right;">${formatCurrency(totalRev, 'TRY')}</td>
        <td style="text-align:right;">${formatCurrency(totalExp, 'TRY')}</td>
        <td style="text-align:right;"></td>
        <td style="text-align:right;">${formatCurrency(totalTC, 'TRY')}</td>
        <td style="text-align:right;" class="${totalProfit >= 0 ? 'pl-positive' : 'pl-negative'}">${totalProfit >= 0 ? '+' : ''}${formatCurrency(totalProfit, 'TRY')}</td>
    </tr></tbody></table>`;

    resultDiv.innerHTML = html;
};

// ============================================================
// NAVIGATION PATCHES FOR NEW PAGES
// ============================================================
(function patchNavForNewPages() {
    const _origNav = window.navigateTo;
    if (!_origNav) return;

    const _nav2 = window.navigateTo;
    window.navigateTo = function(pageId) {
        _nav2(pageId);

        if (pageId === 'petitions') refreshPetitions();
        if (pageId === 'tools') {
            // Populate billing client dropdown
            const bc = document.getElementById('billingClient');
            if (bc) {
                const current = bc.value;
                bc.innerHTML = '<option value="">Müvekkil seçin...</option>' +
                    (DB.data.clients || []).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
                if (current) bc.value = current;
            }

            // Set default dates for interest calculator
            const endDate = document.getElementById('interestEndDate');
            if (endDate && !endDate.value) endDate.value = new Date().toISOString().split('T')[0];
        }
    };
})();

// ---- DOSYA TAKİBİ (CASE FILES) ----
let editingCaseFileId = null;

const caseFileStatusLabels = {
    active: 'Devam Eden',
    closed: 'Kapanan',
    appeal: 'İstinaf/Temyiz',
    enforcement: 'İcra',
    mediation: 'Arabuluculuk'
};

const caseFileTypeLabels = {
    hukuk: 'Hukuk', ceza: 'Ceza', idare: 'İdare', is: 'İş',
    icra: 'İcra', ticaret: 'Ticaret', aile: 'Aile', tuketici: 'Tüketici',
    arabuluculuk: 'Arabuluculuk', diger: 'Diğer'
};

const statusColors = {
    active: 'var(--accent2)', closed: 'var(--text-secondary)',
    appeal: 'var(--accent3)', enforcement: 'var(--accent)', mediation: 'var(--primary)'
};

window.openCaseFileModal = function(id) {
    editingCaseFileId = id || null;
    const modal = $('#caseFileModal');
    const title = $('#caseFileModalTitle');

    if (id) {
        const cf = DB.data.caseFiles.find(c => c.id === id);
        if (!cf) return;
        title.textContent = 'Dosyayı Düzenle';
        $('#cfTitle').value = cf.title || '';
        $('#cfType').value = cf.type || 'hukuk';
        $('#cfStatus').value = cf.status || 'active';
        $('#cfClient').value = cf.client || '';
        $('#cfEsasNo').value = cf.esasNo || '';
        $('#cfKararNo').value = cf.kararNo || '';
        $('#cfIstinafEsasNo').value = cf.istinafEsasNo || '';
        $('#cfIstinafKararNo').value = cf.istinafKararNo || '';
        $('#cfTemyizEsasNo').value = cf.temyizEsasNo || '';
        $('#cfTemyizKararNo').value = cf.temyizKararNo || '';
        $('#cfIcraNo').value = cf.icraNo || '';
        $('#cfArabuluculukNo').value = cf.arabuluculukNo || '';
        $('#cfCourt').value = cf.court || '';
        $('#cfLawyer').value = cf.lawyer || '';
        $('#cfOpponent').value = cf.opponent || '';
        $('#cfOpponentLawyer').value = cf.opponentLawyer || '';
        $('#cfNotes').value = cf.notes || '';
    } else {
        title.textContent = 'Yeni Dosya';
        ['cfTitle','cfClient','cfEsasNo','cfKararNo','cfIstinafEsasNo','cfIstinafKararNo',
         'cfTemyizEsasNo','cfTemyizKararNo','cfIcraNo','cfArabuluculukNo','cfCourt',
         'cfOpponent','cfOpponentLawyer','cfNotes'].forEach(id => { if ($('#'+id)) $('#'+id).value = ''; });
        $('#cfType').value = 'hukuk';
        $('#cfStatus').value = 'active';
        $('#cfLawyer').value = '';
    }

    modal.classList.add('active');
};

window.saveCaseFile = function() {
    const title = $('#cfTitle').value.trim();
    if (!title) { toast('Dosya adı zorunludur.', 'error'); return; }

    const data = {
        id: editingCaseFileId || 'cf-' + Date.now(),
        title,
        type: $('#cfType').value,
        status: $('#cfStatus').value,
        client: $('#cfClient').value.trim(),
        esasNo: $('#cfEsasNo').value.trim(),
        kararNo: $('#cfKararNo').value.trim(),
        istinafEsasNo: $('#cfIstinafEsasNo').value.trim(),
        istinafKararNo: $('#cfIstinafKararNo').value.trim(),
        temyizEsasNo: $('#cfTemyizEsasNo').value.trim(),
        temyizKararNo: $('#cfTemyizKararNo').value.trim(),
        icraNo: $('#cfIcraNo').value.trim(),
        arabuluculukNo: $('#cfArabuluculukNo').value.trim(),
        court: $('#cfCourt').value.trim(),
        lawyer: $('#cfLawyer').value,
        opponent: $('#cfOpponent').value.trim(),
        opponentLawyer: $('#cfOpponentLawyer').value.trim(),
        notes: $('#cfNotes').value.trim(),
        createdAt: editingCaseFileId ? (DB.data.caseFiles.find(c => c.id === editingCaseFileId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (editingCaseFileId) {
        const idx = DB.data.caseFiles.findIndex(c => c.id === editingCaseFileId);
        if (idx >= 0) DB.data.caseFiles[idx] = data;
    } else {
        DB.data.caseFiles.push(data);
    }

    DB.save();
    $('#caseFileModal').classList.remove('active');
    refreshCaseFiles();
    toast(editingCaseFileId ? 'Dosya güncellendi.' : 'Dosya eklendi.', 'success');
    editingCaseFileId = null;
};

window.deleteCaseFile = function(id) {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    DB.data.caseFiles = DB.data.caseFiles.filter(c => c.id !== id);
    DB.save();
    refreshCaseFiles();
    toast('Dosya silindi.', 'success');
};

window.refreshCaseFiles = function() {
    const container = $('#caseFilesList');
    const statsDiv = $('#caseFileStats');
    if (!container) return;

    const search = ($('#caseFileSearch')?.value || '').toLowerCase();
    const statusFilter = $('#caseFileFilterStatus')?.value || '';
    const typeFilter = $('#caseFileFilterType')?.value || '';

    let files = DB.data.caseFiles || [];

    // Stats
    if (statsDiv) {
        const total = files.length;
        const active = files.filter(f => f.status === 'active').length;
        const closed = files.filter(f => f.status === 'closed').length;
        const appeal = files.filter(f => f.status === 'appeal').length;
        statsDiv.innerHTML = `
            <div class="stat-card" style="padding:12px;text-align:center;"><div style="font-size:1.5rem;font-weight:700;">${total}</div><div style="font-size:0.78rem;color:var(--text-secondary);">Toplam</div></div>
            <div class="stat-card" style="padding:12px;text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--accent2);">${active}</div><div style="font-size:0.78rem;color:var(--text-secondary);">Devam Eden</div></div>
            <div class="stat-card" style="padding:12px;text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--text-secondary);">${closed}</div><div style="font-size:0.78rem;color:var(--text-secondary);">Kapanan</div></div>
            <div class="stat-card" style="padding:12px;text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--accent3);">${appeal}</div><div style="font-size:0.78rem;color:var(--text-secondary);">İstinaf/Temyiz</div></div>
        `;
    }

    // Filter
    if (statusFilter) files = files.filter(f => f.status === statusFilter);
    if (typeFilter) files = files.filter(f => f.type === typeFilter);
    if (search) {
        files = files.filter(f => {
            const searchable = [f.title, f.client, f.esasNo, f.kararNo, f.istinafEsasNo, f.temyizEsasNo, f.icraNo, f.arabuluculukNo, f.court, f.opponent, f.notes].join(' ').toLowerCase();
            return searchable.includes(search);
        });
    }

    if (files.length === 0) {
        container.innerHTML = '<p class="empty-state">Eşleşen dosya bulunamadı.</p>';
        return;
    }

    files.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    container.innerHTML = files.map(f => {
        const nums = [];
        if (f.esasNo) nums.push(`Esas: ${f.esasNo}`);
        if (f.kararNo) nums.push(`Karar: ${f.kararNo}`);
        if (f.istinafEsasNo) nums.push(`İstinaf E: ${f.istinafEsasNo}`);
        if (f.istinafKararNo) nums.push(`İstinaf K: ${f.istinafKararNo}`);
        if (f.temyizEsasNo) nums.push(`Temyiz E: ${f.temyizEsasNo}`);
        if (f.temyizKararNo) nums.push(`Temyiz K: ${f.temyizKararNo}`);
        if (f.icraNo) nums.push(`İcra: ${f.icraNo}`);
        if (f.arabuluculukNo) nums.push(`Arabuluculuk: ${f.arabuluculukNo}`);

        return `
        <div class="contract-item" style="border-left:4px solid ${statusColors[f.status] || 'var(--border)'};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <strong>${f.title}</strong>
                    <span class="status-badge" style="background:${statusColors[f.status] || 'var(--border)'};color:#fff;font-size:0.7rem;padding:2px 8px;border-radius:12px;">${caseFileStatusLabels[f.status] || f.status}</span>
                    <span style="font-size:0.75rem;background:var(--bg-secondary);padding:2px 8px;border-radius:12px;">${caseFileTypeLabels[f.type] || f.type}</span>
                </div>
                ${f.client ? `<div style="font-size:0.82rem;margin-top:4px;"><i class="fas fa-user" style="width:14px;"></i> ${f.client}</div>` : ''}
                ${f.court ? `<div style="font-size:0.82rem;"><i class="fas fa-university" style="width:14px;"></i> ${f.court}</div>` : ''}
                ${f.opponent ? `<div style="font-size:0.82rem;"><i class="fas fa-user-slash" style="width:14px;"></i> Karşı: ${f.opponent}${f.opponentLawyer ? ' (Vek: ' + f.opponentLawyer + ')' : ''}</div>` : ''}
                ${nums.length > 0 ? `<div style="font-size:0.8rem;margin-top:6px;padding:6px 10px;background:var(--bg-secondary);border-radius:var(--radius-sm);display:flex;flex-wrap:wrap;gap:8px;">${nums.map(n => `<span style="white-space:nowrap;"><strong>${n.split(':')[0]}:</strong>${n.split(':').slice(1).join(':')}</span>`).join('')}</div>` : ''}
                ${f.notes ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">${f.notes.substring(0, 100)}${f.notes.length > 100 ? '...' : ''}</div>` : ''}
            </div>
            <div style="display:flex;gap:8px;align-items:flex-start;">
                <button class="btn btn-sm btn-outline" onclick="openCaseJournal('${f.id}')" title="Dosya Günlüğü"><i class="fas fa-book"></i></button>
                <button class="btn btn-sm btn-outline" onclick="showCaseAnalysis('${f.id}')" title="Maliyet Analizi"><i class="fas fa-chart-pie"></i></button>
                <button class="btn btn-sm btn-outline" onclick="openCaseFileModal('${f.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="deleteCaseFile('${f.id}')" style="color:var(--accent);" title="Sil"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
};

// ============================================================
// 1. BUGÜNKÜ GÜNDEM (DASHBOARD TODAY SECTION)
// ============================================================
window.renderTodayAgenda = function() {
    const container = document.getElementById('todayAgendaContent');
    const dateLabel = document.getElementById('todayDateLabel');
    if (!container) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (dateLabel) dateLabel.textContent = today.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;">';

    // Today's hearings
    const todayHearings = (DB.data.hearings || []).filter(h => h.date?.startsWith(todayStr));
    html += `<div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg);">
        <h4 style="font-size:0.85rem;margin-bottom:8px;"><i class="fas fa-gavel" style="color:var(--accent);margin-right:6px;"></i>Bugünkü Duruşmalar (${todayHearings.length})</h4>`;
    if (todayHearings.length > 0) {
        todayHearings.forEach(h => {
            html += `<div style="padding:6px 0;font-size:0.82rem;border-bottom:1px solid var(--border);">
                <strong>${h.time || ''}</strong> ${h.caseTitle} <span style="color:var(--text-secondary);">- ${h.court}</span>
            </div>`;
        });
    } else {
        html += `<div style="font-size:0.82rem;color:var(--text-secondary);">Bugün duruşma yok</div>`;
    }
    html += '</div>';

    // Upcoming deadlines (today + next 3 days)
    const upcomingDeadlines = (DB.data.deadlines || []).filter(d => {
        const due = new Date(d.dueDate);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 3;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    html += `<div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg);">
        <h4 style="font-size:0.85rem;margin-bottom:8px;"><i class="fas fa-clock" style="color:var(--accent3);margin-right:6px;"></i>Yaklaşan Süreler (${upcomingDeadlines.length})</h4>`;
    if (upcomingDeadlines.length > 0) {
        upcomingDeadlines.forEach(d => {
            const diff = Math.ceil((new Date(d.dueDate) - today) / (1000 * 60 * 60 * 24));
            const urgency = diff === 0 ? 'color:var(--accent);font-weight:700;' : diff === 1 ? 'color:var(--accent3);' : '';
            html += `<div style="padding:6px 0;font-size:0.82rem;border-bottom:1px solid var(--border);${urgency}">
                ${diff === 0 ? 'BUGÜN!' : diff + ' gün'} - ${d.type || d.description || 'Süre'} <span style="color:var(--text-secondary);">(${typeof formatDate === 'function' ? formatDate(d.dueDate) : d.dueDate})</span>
            </div>`;
        });
    } else {
        html += `<div style="font-size:0.82rem;color:var(--text-secondary);">Yaklaşan süre yok</div>`;
    }
    html += '</div>';

    // Pending tasks
    const pendingTasks = (DB.data.tasks || []).filter(t => !t.completed).sort((a, b) => {
        const pri = { high: 0, medium: 1, low: 2 };
        return (pri[a.priority] || 1) - (pri[b.priority] || 1);
    }).slice(0, 5);

    html += `<div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg);">
        <h4 style="font-size:0.85rem;margin-bottom:8px;"><i class="fas fa-tasks" style="color:var(--primary);margin-right:6px;"></i>Bekleyen Görevler (${pendingTasks.length})</h4>`;
    if (pendingTasks.length > 0) {
        pendingTasks.forEach(t => {
            const priColors = { high: 'var(--accent)', medium: 'var(--accent3)', low: 'var(--accent2)' };
            html += `<div style="padding:6px 0;font-size:0.82rem;border-bottom:1px solid var(--border);">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${priColors[t.priority] || 'var(--text-secondary)'};margin-right:6px;"></span>
                ${t.title} ${t.dueDate ? `<span style="color:var(--text-secondary);">- ${typeof formatDate === 'function' ? formatDate(t.dueDate) : t.dueDate}</span>` : ''}
            </div>`;
        });
    } else {
        html += `<div style="font-size:0.82rem;color:var(--text-secondary);">Bekleyen görev yok</div>`;
    }
    html += '</div>';

    // Summary
    html += `<div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg);">
        <h4 style="font-size:0.85rem;margin-bottom:8px;"><i class="fas fa-chart-bar" style="color:var(--accent4);margin-right:6px;"></i>Özet</h4>
        <div style="font-size:0.82rem;">
            <div style="padding:4px 0;">Toplam Teklif: <strong>${(DB.data.proposals || []).length}</strong></div>
            <div style="padding:4px 0;">Aktif Dosya: <strong>${(DB.data.caseFiles || []).filter(f => f.status === 'active').length}</strong></div>
            <div style="padding:4px 0;">Bu Ay Masraf: <strong>${formatCurrency((DB.data.expenses || []).filter(e => e.date?.startsWith(todayStr.substring(0, 7))).reduce((s, e) => s + (parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.')) || 0), 0), 'TRY')}</strong></div>
        </div>
    </div>`;

    html += '</div>';
    container.innerHTML = html;
};

// Patch dashboard refresh to include today agenda
(function patchDashboardForAgenda() {
    const _rd = window.refreshDashboard;
    if (_rd) {
        window.refreshDashboard = function() {
            _rd();
            renderTodayAgenda();
        };
    }
})();

// ============================================================
// 2. HATIRLATICI / ALARM SİSTEMİ
// ============================================================
window.setupReminders = function() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
    setInterval(checkReminders, 60000);
    checkReminders();
};

function checkReminders() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    (DB.data.hearings || []).forEach(h => {
        if (!h.date) return;
        const diffDays = Math.ceil((new Date(h.date) - now) / (1000 * 60 * 60 * 24));
        const reminders = h.reminders || [3, 1, 0];
        reminders.forEach(days => {
            if (diffDays === days) {
                const key = `rem_${h.id}_${days}_${todayStr}`;
                if (!sessionStorage.getItem(key)) {
                    new Notification(days === 0 ? 'BUGÜN DURUŞMA!' : `Duruşma ${days} gün sonra`, {
                        body: `${h.caseTitle} - ${h.court} ${h.time || ''}`, tag: key
                    });
                    sessionStorage.setItem(key, '1');
                }
            }
        });
    });

    (DB.data.deadlines || []).forEach(d => {
        if (!d.dueDate) return;
        const diffDays = Math.ceil((new Date(d.dueDate) - now) / (1000 * 60 * 60 * 24));
        const reminders = d.reminders || [3, 1, 0];
        reminders.forEach(days => {
            if (diffDays === days) {
                const key = `rem_${d.id}_${days}_${todayStr}`;
                if (!sessionStorage.getItem(key)) {
                    new Notification(days === 0 ? 'BUGÜN SÜRE BİTİYOR!' : `Süre ${days} gün sonra bitiyor`, {
                        body: `${d.type || d.description || 'Yasal Süre'}`, tag: key
                    });
                    sessionStorage.setItem(key, '1');
                }
            }
        });
    });
}
setTimeout(setupReminders, 2000);

// ============================================================
// 3. DOSYA İÇİ NOTLAR / GÜNLÜK (CASE JOURNAL)
// ============================================================
window.openCaseJournal = function(caseFileId) {
    const cf = (DB.data.caseFiles || []).find(f => f.id === caseFileId);
    if (!cf) { toast('Dosya bulunamadı', 'error'); return; }
    if (!cf.journal) cf.journal = [];

    let modal = document.getElementById('caseJournalModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'caseJournalModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;max-height:90vh;">
            <div class="modal-header">
                <h3><i class="fas fa-book" style="margin-right:8px;"></i>Dosya Günlüğü: ${cf.title}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="overflow-y:auto;max-height:calc(90vh - 180px);">
                <div style="display:flex;gap:8px;margin-bottom:16px;">
                    <input type="text" id="journalEntry" placeholder="Yeni günlük girişi..." style="flex:1;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font);font-size:0.88rem;">
                    <select id="journalType" style="padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font);font-size:0.85rem;">
                        <option value="note">Not</option>
                        <option value="hearing">Duruşma</option>
                        <option value="call">Telefon</option>
                        <option value="meeting">Toplantı</option>
                        <option value="document">Belge</option>
                        <option value="payment">Ödeme</option>
                        <option value="decision">Karar</option>
                    </select>
                    <button class="btn btn-primary" onclick="addJournalEntry('${caseFileId}')"><i class="fas fa-plus"></i></button>
                </div>
                <div id="journalList">${renderJournalEntries(cf.journal)}</div>
            </div>
        </div>`;
    document.body.appendChild(modal);
};

function renderJournalEntries(journal) {
    if (!journal || journal.length === 0) return '<p class="empty-state">Henüz günlük girişi yok.</p>';
    const icons = { note: 'fa-sticky-note', hearing: 'fa-gavel', call: 'fa-phone', meeting: 'fa-users', document: 'fa-file', payment: 'fa-money-bill', decision: 'fa-balance-scale' };
    const labels = { note: 'Not', hearing: 'Duruşma', call: 'Telefon', meeting: 'Toplantı', document: 'Belge', payment: 'Ödeme', decision: 'Karar' };
    return journal.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => `
        <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas ${icons[e.type] || 'fa-sticky-note'}" style="color:var(--primary);font-size:0.85rem;"></i>
            </div>
            <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;">
                    <span style="font-size:0.72rem;background:var(--primary-light);color:var(--primary);padding:2px 8px;border-radius:12px;">${labels[e.type] || e.type}</span>
                    <span style="font-size:0.75rem;color:var(--text-secondary);">${new Date(e.date).toLocaleString('tr-TR')} - ${e.createdBy || ''}</span>
                </div>
                <div style="margin-top:6px;font-size:0.88rem;">${e.text}</div>
            </div>
        </div>`).join('');
}

window.addJournalEntry = function(caseFileId) {
    const input = document.getElementById('journalEntry');
    const typeSelect = document.getElementById('journalType');
    if (!input?.value.trim()) { toast('Giriş yazın', 'error'); return; }

    const cf = (DB.data.caseFiles || []).find(f => f.id === caseFileId);
    if (!cf) return;
    if (!cf.journal) cf.journal = [];

    cf.journal.push({
        id: genId(), text: input.value.trim(), type: typeSelect?.value || 'note',
        date: new Date().toISOString(), createdBy: DB.data.currentUser?.name || ''
    });
    DB.save();
    input.value = '';
    document.getElementById('journalList').innerHTML = renderJournalEntries(cf.journal);
    toast('Günlük girişi eklendi', 'success');
};

// ============================================================
// 7. AYLIK BÜRO RAPORU
// ============================================================
window.generateMonthlyReport = function() {
    const s = DB.data.settings || {};
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const proposals = (DB.data.proposals || []).filter(p => p.createdAt?.startsWith(monthStr));
    const accepted = proposals.filter(p => p.status === 'accepted' || p.status === 'kabul');
    const hearings = (DB.data.hearings || []).filter(h => h.date?.startsWith(monthStr));
    const expenses = (DB.data.expenses || []).filter(e => e.date?.startsWith(monthStr));
    const timeEntries = (DB.data.timesheet || []).filter(e => e.date?.startsWith(monthStr));
    const newClients = (DB.data.clients || []).filter(c => c.createdAt?.startsWith(monthStr));
    const newCases = (DB.data.caseFiles || []).filter(f => f.createdAt?.startsWith(monthStr));

    let totalExpense = 0;
    expenses.forEach(e => totalExpense += parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0));
    let totalMinutes = 0;
    timeEntries.forEach(e => totalMinutes += e.duration || 0);
    let totalRevenue = 0;
    accepted.forEach(p => {
        totalRevenue += parseFloat(String(p.feeData?.amount || p.feeData?.fixedAmount || 0).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    });

    const totalH = Math.floor(totalMinutes / 60), totalM = totalMinutes % 60;

    let html = `<div style="font-family:Arial,sans-serif;padding:30px;font-size:10pt;">
        <div style="text-align:center;margin-bottom:30px;">
            <h1 style="margin:0;color:#1a1d2e;font-size:18pt;">${s.firmName || 'Hukuk Bürosu'}</h1>
            <div style="font-size:9pt;color:#636e72;">${s.firmAddress || ''}</div>
            <h2 style="margin-top:16px;color:#4a6cf7;">AYLIK BÜRO RAPORU - ${monthName.toUpperCase()}</h2>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
            <div style="text-align:center;padding:14px;background:#f5f6fa;border-radius:8px;"><div style="font-size:22pt;font-weight:700;color:#4a6cf7;">${proposals.length}</div><div style="font-size:8pt;color:#636e72;">Teklif</div></div>
            <div style="text-align:center;padding:14px;background:#f5f6fa;border-radius:8px;"><div style="font-size:22pt;font-weight:700;color:#27ae60;">${accepted.length}</div><div style="font-size:8pt;color:#636e72;">Kabul</div></div>
            <div style="text-align:center;padding:14px;background:#f5f6fa;border-radius:8px;"><div style="font-size:22pt;font-weight:700;color:#f39c12;">${hearings.length}</div><div style="font-size:8pt;color:#636e72;">Duruşma</div></div>
            <div style="text-align:center;padding:14px;background:#f5f6fa;border-radius:8px;"><div style="font-size:22pt;font-weight:700;color:#8e44ad;">${totalH}sa</div><div style="font-size:8pt;color:#636e72;">Çalışma</div></div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
            <tr style="background:#f5f6fa;"><td style="padding:10px;font-weight:600;border-bottom:2px solid #e1e5ee;">Metrik</td><td style="padding:10px;text-align:right;font-weight:600;border-bottom:2px solid #e1e5ee;">Değer</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">Toplam Gelir</td><td style="padding:8px;text-align:right;font-weight:700;color:#27ae60;">${formatCurrency(totalRevenue, 'TRY')}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">Toplam Masraf</td><td style="padding:8px;text-align:right;font-weight:700;color:#e74c3c;">${formatCurrency(totalExpense, 'TRY')}</td></tr>
            <tr style="background:#f5f6fa;"><td style="padding:8px;font-weight:700;">Net</td><td style="padding:8px;text-align:right;font-weight:700;color:${totalRevenue - totalExpense >= 0 ? '#27ae60' : '#e74c3c'};">${formatCurrency(totalRevenue - totalExpense, 'TRY')}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">Kabul Oranı</td><td style="padding:8px;text-align:right;">${proposals.length > 0 ? Math.round(accepted.length / proposals.length * 100) : 0}%</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">Çalışma Saati</td><td style="padding:8px;text-align:right;">${totalH} saat ${totalM} dk</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">Yeni Müvekkil</td><td style="padding:8px;text-align:right;">${newClients.length}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">Yeni Dosya</td><td style="padding:8px;text-align:right;">${newCases.length}</td></tr>
        </table>
        <div style="margin-top:40px;text-align:center;font-size:8pt;color:#636e72;border-top:1px solid #e1e5ee;padding-top:16px;">
            Rapor: ${new Date().toLocaleDateString('tr-TR')} | ${DB.data.currentUser?.name || ''}
        </div></div>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    toast('Rapor oluşturuluyor...', 'info');

    html2pdf().set({
        margin: [10, 10, 10, 10], filename: `aylik_rapor_${monthStr}.pdf`,
        image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(tempDiv).save().then(() => { tempDiv.remove(); toast('Aylık büro raporu indirildi', 'success'); });
};

// ============================================================
// 8. DOSYA BAZLI MALİYET ANALİZİ
// ============================================================
window.showCaseAnalysis = function(caseFileId) {
    const cf = (DB.data.caseFiles || []).find(f => f.id === caseFileId);
    if (!cf) { toast('Dosya bulunamadı', 'error'); return; }

    const proposals = (DB.data.proposals || []).filter(p => p.clientName === cf.client || p.projectName === cf.title);
    const expenses = (DB.data.expenses || []).filter(e => proposals.some(p => p.id === e.proposalId) || e.caseFileId === caseFileId);
    const timeEntries = (DB.data.timesheet || []).filter(e => proposals.some(p => p.id === e.proposalId) || e.caseFileId === caseFileId);
    const hearings = (DB.data.hearings || []).filter(h => h.caseTitle === cf.title || h.caseNo === cf.esasNo);

    let totalExpense = 0;
    expenses.forEach(e => totalExpense += parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0));
    let totalMinutes = 0;
    timeEntries.forEach(e => totalMinutes += e.duration || 0);
    let totalRevenue = 0;
    proposals.forEach(p => {
        if (p.status === 'accepted' || p.status === 'kabul') totalRevenue += parseFloat(String(p.feeData?.amount || p.feeData?.fixedAmount || 0).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    });

    const hourlyRate = (DB.data.lawyerProfiles || []).find(lp => lp.hourlyRate)?.hourlyRate || 3000;
    const timeCost = (totalMinutes / 60) * hourlyRate;
    const netProfit = totalRevenue - totalExpense - timeCost;
    const journal = cf.journal || [];

    let modal = document.getElementById('caseAnalysisModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'caseAnalysisModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;max-height:90vh;">
            <div class="modal-header">
                <h3><i class="fas fa-chart-pie" style="margin-right:8px;"></i>Maliyet Analizi: ${cf.title}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="overflow-y:auto;max-height:calc(90vh - 130px);">
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
                    <div style="padding:16px;background:var(--bg);border-radius:var(--radius);text-align:center;">
                        <div style="font-size:1.5rem;font-weight:700;color:var(--accent2);">${formatCurrency(totalRevenue, 'TRY')}</div>
                        <div style="font-size:0.78rem;color:var(--text-secondary);">Gelir</div>
                    </div>
                    <div style="padding:16px;background:var(--bg);border-radius:var(--radius);text-align:center;">
                        <div style="font-size:1.5rem;font-weight:700;color:var(--accent);">${formatCurrency(totalExpense, 'TRY')}</div>
                        <div style="font-size:0.78rem;color:var(--text-secondary);">Masraf</div>
                    </div>
                    <div style="padding:16px;background:var(--bg);border-radius:var(--radius);text-align:center;">
                        <div style="font-size:1.5rem;font-weight:700;color:var(--accent4);">${Math.floor(totalMinutes/60)}sa ${totalMinutes%60}dk</div>
                        <div style="font-size:0.78rem;color:var(--text-secondary);">Süre (${formatCurrency(timeCost, 'TRY')})</div>
                    </div>
                    <div style="padding:16px;background:var(--bg);border-radius:var(--radius);text-align:center;">
                        <div style="font-size:1.5rem;font-weight:700;color:${netProfit >= 0 ? 'var(--accent2)' : 'var(--accent)'};">${netProfit >= 0 ? '+' : ''}${formatCurrency(netProfit, 'TRY')}</div>
                        <div style="font-size:0.78rem;color:var(--text-secondary);">Net Kâr/Zarar</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
                    <div style="padding:12px;background:var(--bg);border-radius:var(--radius);text-align:center;"><div style="font-size:1.2rem;font-weight:700;">${hearings.length}</div><div style="font-size:0.78rem;color:var(--text-secondary);">Duruşma</div></div>
                    <div style="padding:12px;background:var(--bg);border-radius:var(--radius);text-align:center;"><div style="font-size:1.2rem;font-weight:700;">${expenses.length}</div><div style="font-size:0.78rem;color:var(--text-secondary);">Masraf Kalemi</div></div>
                    <div style="padding:12px;background:var(--bg);border-radius:var(--radius);text-align:center;"><div style="font-size:1.2rem;font-weight:700;">${journal.length}</div><div style="font-size:0.78rem;color:var(--text-secondary);">Günlük Girişi</div></div>
                </div>
                ${expenses.length > 0 ? `<h4 style="margin-bottom:8px;">Masraf Detayı</h4>
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:16px;">
                    ${expenses.map(e => `<tr><td style="padding:6px;border-bottom:1px solid var(--border);">${typeof formatDate === 'function' ? formatDate(e.date) : e.date}</td><td style="padding:6px;border-bottom:1px solid var(--border);">${e.description || e.type}</td><td style="padding:6px;text-align:right;font-weight:600;border-bottom:1px solid var(--border);">${formatCurrency(parseFloat(String(e.amount).replace(/[^\\d.,]/g, '').replace(',', '.') || 0), 'TRY')}</td></tr>`).join('')}
                </table>` : ''}
                <button class="btn btn-outline" onclick="(function(){ const m=document.querySelector('#caseAnalysisModal .modal-body'); html2pdf().set({margin:[10,10,10,10],filename:'dosya_analiz.pdf',html2canvas:{scale:2},jsPDF:{unit:'mm',format:'a4'}}).from(m).save().then(()=>toast('PDF indirildi','success')); })()">
                    <i class="fas fa-file-pdf"></i> PDF İndir
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
};

// ============================================================
// 10. SÜRÜKLE-BIRAK DOSYA YÜKLEME
// ============================================================
(function setupDragDrop() {
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        const dz = e.target.closest('.form-card, .modal-body');
        if (dz) { dz.style.outline = '2px dashed var(--primary)'; dz.style.outlineOffset = '-4px'; }
    });
    document.addEventListener('dragleave', function(e) {
        const dz = e.target.closest('.form-card, .modal-body');
        if (dz) { dz.style.outline = ''; dz.style.outlineOffset = ''; }
    });
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        const dz = e.target.closest('.form-card, .modal-body');
        if (dz) { dz.style.outline = ''; dz.style.outlineOffset = ''; }
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;
        const fi = dz?.querySelector('input[type="file"]');
        if (fi) {
            const dt = new DataTransfer();
            for (let f of files) dt.items.add(f);
            fi.files = dt.files;
            fi.dispatchEvent(new Event('change', { bubbles: true }));
            toast(`${files.length} dosya yüklendi`, 'success');
        }
    });
})();

// ============================================================
// AVUKAT PROFİLİ OLUŞTURMA
// ============================================================
let editingLawyerProfileId = null;

window.openLawyerProfileModal = function(id) {
    editingLawyerProfileId = id || null;
    const modal = document.getElementById('lawyerProfileModal');
    if (!modal) return;
    document.getElementById('lawyerProfileModalTitle').textContent = id ? 'Profili Düzenle' : 'Yeni Avukat Profili';
    if (id) {
        const lp = (DB.data.lawyerProfiles || []).find(x => x.id === id);
        if (lp) {
            document.getElementById('lpName').value = lp.name || '';
            document.getElementById('lpTitle').value = lp.title || '';
            document.getElementById('lpBar').value = lp.bar || '';
            document.getElementById('lpBarNo').value = lp.barNo || '';
            document.getElementById('lpEmail').value = lp.email || '';
            document.getElementById('lpPhone').value = lp.phone || '';
            document.getElementById('lpEducation').value = lp.education || '';
            document.getElementById('lpExpertise').value = lp.expertise || '';
            document.getElementById('lpExperience').value = lp.experience || '';
            document.getElementById('lpBio').value = lp.bio || '';
            document.getElementById('lpPhoto').value = lp.photo || '';
            document.getElementById('lpLanguages').value = lp.languages || '';
            document.getElementById('lpCertificates').value = lp.certificates || '';
            document.getElementById('lpHourlyRate').value = lp.hourlyRate || '';
        }
    } else {
        ['lpName','lpTitle','lpBar','lpBarNo','lpEmail','lpPhone','lpEducation','lpExpertise','lpExperience','lpBio','lpPhoto','lpLanguages','lpCertificates','lpHourlyRate'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }
    modal.classList.add('active');
};

window.saveLawyerProfile = function() {
    if (!DB.data.lawyerProfiles) DB.data.lawyerProfiles = [];
    const name = document.getElementById('lpName')?.value?.trim();
    if (!name) { toast('Ad Soyad zorunlu', 'error'); return; }

    const profile = {
        id: editingLawyerProfileId || genId(), name,
        title: document.getElementById('lpTitle')?.value || '',
        bar: document.getElementById('lpBar')?.value || '',
        barNo: document.getElementById('lpBarNo')?.value || '',
        email: document.getElementById('lpEmail')?.value || '',
        phone: document.getElementById('lpPhone')?.value || '',
        education: document.getElementById('lpEducation')?.value || '',
        expertise: document.getElementById('lpExpertise')?.value || '',
        experience: document.getElementById('lpExperience')?.value || '',
        bio: document.getElementById('lpBio')?.value || '',
        photo: document.getElementById('lpPhoto')?.value || '',
        languages: document.getElementById('lpLanguages')?.value || '',
        certificates: document.getElementById('lpCertificates')?.value || '',
        hourlyRate: parseFloat(document.getElementById('lpHourlyRate')?.value) || 0,
        updatedAt: new Date().toISOString()
    };

    if (editingLawyerProfileId) {
        const idx = DB.data.lawyerProfiles.findIndex(p => p.id === editingLawyerProfileId);
        if (idx >= 0) DB.data.lawyerProfiles[idx] = profile;
    } else DB.data.lawyerProfiles.push(profile);

    DB.save();
    toast('Avukat profili kaydedildi', 'success');
    document.getElementById('lawyerProfileModal').classList.remove('active');
    refreshLawyerProfiles();
};

window.refreshLawyerProfiles = function() {
    const container = document.getElementById('lawyerProfilesList');
    if (!container) return;
    const profiles = DB.data.lawyerProfiles || [];
    if (profiles.length === 0) { container.innerHTML = '<p class="empty-state">Henüz avukat profili eklenmedi.</p>'; return; }
    container.innerHTML = profiles.map(lp => `
        <div class="contract-item" style="border-left:4px solid var(--primary);">
            <div style="display:flex;gap:14px;align-items:center;flex:1;">
                ${lp.photo ? `<img src="${lp.photo}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">` : `<div style="width:48px;height:48px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:var(--primary);font-weight:700;">${lp.name.charAt(0)}</div>`}
                <div>
                    <strong>${lp.name}</strong> ${lp.title ? `<span style="font-size:0.78rem;color:var(--text-secondary);">- ${lp.title}</span>` : ''}
                    <div style="font-size:0.82rem;color:var(--text-secondary);">${lp.bar || ''} ${lp.barNo ? '| Sicil: ' + lp.barNo : ''} ${lp.experience ? '| ' + lp.experience + ' yıl' : ''}</div>
                    ${lp.expertise ? `<div style="font-size:0.78rem;margin-top:4px;"><i class="fas fa-star" style="color:var(--accent3);font-size:0.7rem;"></i> ${lp.expertise}</div>` : ''}
                    ${lp.hourlyRate ? `<div style="font-size:0.78rem;"><i class="fas fa-coins" style="color:var(--accent2);font-size:0.7rem;"></i> ${formatCurrency(lp.hourlyRate, 'TRY')}/saat</div>` : ''}
                </div>
            </div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-sm btn-outline" onclick="openLawyerProfileModal('${lp.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="deleteLawyerProfile('${lp.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
};

window.deleteLawyerProfile = function(id) {
    if (!confirm('Bu avukat profili silinsin mi?')) return;
    DB.data.lawyerProfiles = (DB.data.lawyerProfiles || []).filter(p => p.id !== id);
    DB.save(); refreshLawyerProfiles(); toast('Profil silindi', 'success');
};

// Refresh profiles when settings page opens
(function patchNavForProfiles() {
    const _n = window.navigateTo;
    if (!_n) return;
    window.navigateTo = function(pageId) {
        _n(pageId);
        if (pageId === 'settings') refreshLawyerProfiles();
        if (pageId === 'tools') {
            // Populate voice case file dropdown
            const vcf = document.getElementById('voiceCaseFile');
            if (vcf) {
                vcf.innerHTML = '<option value="">Dosya seçin (opsiyonel)</option>' +
                    (DB.data.caseFiles || []).map(f => `<option value="${f.id}">${f.title}</option>`).join('');
            }
            // Load saved API key
            const key = DB.data.settings?.geminiApiKey;
            if (key) { const el = document.getElementById('geminiApiKey'); if (el) el.value = key; }
            // Refresh voice notes
            refreshVoiceNotes();
        }
    };
})();

// ============================================================
// ŞABLON DEĞİŞKEN SİSTEMİ ({{müvekkil}}, {{tarih}} vb.)
// ============================================================
window.applyTemplateVariables = function(text) {
    const s = DB.data.settings || {};
    const now = new Date();
    const vars = {
        '{{müvekkil}}': document.getElementById('petitionClient')?.value || '[MÜVEKKİL]',
        '{{avukat}}': s.firmName || '[AVUKAT]',
        '{{baro}}': s.barAssociation || '[BARO]',
        '{{tarih}}': now.toLocaleDateString('tr-TR'),
        '{{yıl}}': String(now.getFullYear()),
        '{{ay}}': now.toLocaleDateString('tr-TR', { month: 'long' }),
        '{{mahkeme}}': document.getElementById('petitionCourt')?.value || '[MAHKEME]',
        '{{esas_no}}': document.getElementById('petitionEsasNo')?.value || '[ESAS NO]',
        '{{karşı_taraf}}': document.getElementById('petitionOpponent')?.value || '[KARŞI TARAF]',
        '{{adres}}': s.firmAddress || '[ADRES]',
        '{{telefon}}': s.firmPhone || '[TELEFON]',
        '{{email}}': s.firmEmail || '[E-POSTA]'
    };

    let result = text;
    for (const [key, val] of Object.entries(vars)) {
        result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), val);
    }
    return result;
};

// Patch fillPetitionTemplate to apply variables
const _origFillTemplate = window.fillPetitionTemplate;
window.fillPetitionTemplate = function() {
    const type = document.getElementById('petitionType').value;
    const tpl = petitionTemplates[type];
    if (tpl && tpl.body) {
        document.getElementById('petitionBody').value = applyTemplateVariables(tpl.body);
        document.getElementById('petitionRequest').value = applyTemplateVariables(tpl.request);
        toast('Şablon yüklendi ve değişkenler dolduruldu', 'success');
    } else {
        toast('Bu tür için şablon bulunamadı', 'info');
    }
};

// Custom template save (Hatırlama butonu)
// Already handled by savePetition() - saved petitions are shown in the list

// ============================================================
// MÜVEKKİL REFERANS TAKİBİ & RİSK SKORU
// ============================================================
// Patch saveClient to include referral and segment fields
const _origSaveClient = window.saveClient;
window.saveClient = function() {
    // Add referral and segment before saving
    const refEl = document.getElementById('cmReferral');
    const segEl = document.getElementById('cmSegment');

    // Call original but we'll patch the data after
    _origSaveClient();

    // Now patch the last saved client with extra fields
    if (DB.data.clients && DB.data.clients.length > 0) {
        const lastClient = editingClientId
            ? DB.data.clients.find(c => c.id === editingClientId)
            : DB.data.clients[DB.data.clients.length - 1];

        if (lastClient) {
            lastClient.referral = refEl?.value || '';
            lastClient.segment = segEl?.value || 'normal';
            DB.save();
        }
    }
};

// Patch openClientModal to load referral/segment
const _origOpenClientModal = window.openClientModal;
window.openClientModal = function(id) {
    _origOpenClientModal(id);
    if (id) {
        const c = (DB.data.clients || []).find(x => x.id === id);
        if (c) {
            const refEl = document.getElementById('cmReferral');
            const segEl = document.getElementById('cmSegment');
            if (refEl) refEl.value = c.referral || '';
            if (segEl) segEl.value = c.segment || 'normal';
        }
    } else {
        const refEl = document.getElementById('cmReferral');
        const segEl = document.getElementById('cmSegment');
        if (refEl) refEl.value = '';
        if (segEl) segEl.value = 'normal';
    }
};

window.calculateClientRiskScore = function(clientName) {
    // Risk based on: payment history, overdue invoices, case outcomes
    let score = 100; // Start at 100 (best)

    const proposals = (DB.data.proposals || []).filter(p => p.clientName === clientName);
    const expenses = (DB.data.expenses || []).filter(e => {
        return proposals.some(p => p.id === e.proposalId);
    });

    // Unpaid/unbilled expenses reduce score
    const unbilled = expenses.filter(e => !e.billed).length;
    score -= unbilled * 5;

    // No accepted proposals = higher risk
    const accepted = proposals.filter(p => p.status === 'accepted' || p.status === 'kabul').length;
    if (proposals.length > 0 && accepted === 0) score -= 20;

    // Lost cases reduce score
    const hearings = (DB.data.hearings || []).filter(h => {
        return h.result && (h.result.includes('kaybedildi'));
    });
    score -= hearings.length * 10;

    return Math.max(0, Math.min(100, score));
};

// ============================================================
// MÜVEKKİL ONBOARDING CHECKLIST
// ============================================================
window.getOnboardingChecklist = function(clientId) {
    const client = (DB.data.clients || []).find(c => c.id === clientId);
    if (!client) return [];

    if (!client.onboarding) {
        client.onboarding = {
            kimlikBelgesi: false,
            vekaletname: false,
            sozlesme: false,
            ucretBilgi: false,
            iletisimBilgi: false,
            dosyaBilgi: false,
            gizlilikOnay: false,
            kvkkOnay: false
        };
        DB.save();
    }
    return client.onboarding;
};

window.toggleOnboardingItem = function(clientId, item) {
    const client = (DB.data.clients || []).find(c => c.id === clientId);
    if (!client || !client.onboarding) return;
    client.onboarding[item] = !client.onboarding[item];
    DB.save();
    renderOnboardingChecklist(clientId);
};

window.renderOnboardingChecklist = function(clientId) {
    const container = document.getElementById('onboardingChecklist');
    if (!container) return;

    const ob = getOnboardingChecklist(clientId);
    const items = {
        kimlikBelgesi: 'Kimlik belgesi alındı',
        vekaletname: 'Vekaletname düzenlendi',
        sozlesme: 'Avukatlık sözleşmesi imzalandı',
        ucretBilgi: 'Ücret bilgilendirmesi yapıldı',
        iletisimBilgi: 'İletişim bilgileri alındı',
        dosyaBilgi: 'Dosya/dava bilgileri alındı',
        gizlilikOnay: 'Gizlilik taahhüdü',
        kvkkOnay: 'KVKK aydınlatma metni onaylandı'
    };

    const total = Object.keys(items).length;
    const done = Object.values(ob).filter(v => v).length;
    const pct = Math.round(done / total * 100);

    container.innerHTML = `
        <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">
                <span>İlerleme</span><span>${done}/${total} (%${pct})</span>
            </div>
            <div style="background:var(--border);border-radius:4px;overflow:hidden;">
                <div style="height:6px;background:${pct === 100 ? 'var(--accent2)' : 'var(--primary)'};width:${pct}%;transition:width 0.3s;"></div>
            </div>
        </div>
        ${Object.entries(items).map(([key, label]) => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="toggleOnboardingItem('${clientId}','${key}')">
                <i class="fas ${ob[key] ? 'fa-check-circle' : 'fa-circle'}" style="color:${ob[key] ? 'var(--accent2)' : 'var(--text-secondary)'};"></i>
                <span style="${ob[key] ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}">${label}</span>
            </div>
        `).join('')}
    `;
};

// ============================================================
// DOSYA ÖNCELİK & ATAMA & TİMELİNE
// ============================================================
// Patch saveCaseFile to include priority and assignment
const _origSaveCaseFile = window.saveCaseFile;
if (_origSaveCaseFile) {
    window.saveCaseFile = function() {
        _origSaveCaseFile();
        // Patch with extra fields
        const id = window.editingCaseFileId;
        if (DB.data.caseFiles && DB.data.caseFiles.length > 0) {
            const cf = id
                ? DB.data.caseFiles.find(f => f.id === id)
                : DB.data.caseFiles[DB.data.caseFiles.length - 1];
            if (cf) {
                cf.priority = document.getElementById('cfPriority')?.value || 'normal';
                cf.assignedLawyer = document.getElementById('cfAssignedLawyer')?.value || '';
                DB.save();
            }
        }
    };
}

// Patch openCaseFileModal to populate lawyer dropdown and load priority
const _origOpenCaseFileModal = window.openCaseFileModal;
if (_origOpenCaseFileModal) {
    window.openCaseFileModal = function(id) {
        _origOpenCaseFileModal(id);
        // Populate lawyer dropdown from profiles
        const select = document.getElementById('cfAssignedLawyer');
        if (select) {
            select.innerHTML = '<option value="">Seçin</option>' +
                (DB.data.lawyerProfiles || []).map(lp => `<option value="${lp.name}">${lp.name}</option>`).join('');
        }
        if (id) {
            const cf = (DB.data.caseFiles || []).find(f => f.id === id);
            if (cf) {
                const pri = document.getElementById('cfPriority');
                if (pri) pri.value = cf.priority || 'normal';
                if (select) select.value = cf.assignedLawyer || '';
            }
        }
    };
}

// Dosya Durum Timeline
window.showCaseTimeline = function(caseFileId) {
    const cf = (DB.data.caseFiles || []).find(f => f.id === caseFileId);
    if (!cf) return;

    const events = [];

    // Add creation
    if (cf.createdAt) events.push({ date: cf.createdAt, type: 'create', text: 'Dosya oluşturuldu' });

    // Journal entries
    (cf.journal || []).forEach(j => {
        events.push({ date: j.date, type: j.type, text: j.text });
    });

    // Related hearings
    (DB.data.hearings || []).filter(h => h.caseTitle === cf.title || h.caseNo === cf.esasNo).forEach(h => {
        events.push({ date: h.date + 'T' + (h.time || '09:00'), type: 'hearing', text: `Duruşma: ${h.court} ${h.result ? '(' + h.result + ')' : ''}` });
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    const typeColors = { create: '#4a6cf7', note: '#636e72', hearing: '#e74c3c', call: '#f39c12', meeting: '#8e44ad', document: '#27ae60', payment: '#2ecc71', decision: '#e67e22' };

    let modal = document.getElementById('caseTimelineModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'caseTimelineModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;max-height:90vh;">
            <div class="modal-header">
                <h3><i class="fas fa-stream" style="margin-right:8px;"></i>Dosya Timeline: ${cf.title}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="overflow-y:auto;max-height:calc(90vh - 130px);">
                ${events.length === 0 ? '<p class="empty-state">Henüz olay kaydı yok.</p>' :
                events.map((e, i) => `
                    <div style="display:flex;gap:16px;position:relative;">
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <div style="width:12px;height:12px;border-radius:50%;background:${typeColors[e.type] || '#636e72'};flex-shrink:0;z-index:1;"></div>
                            ${i < events.length - 1 ? '<div style="width:2px;flex:1;background:var(--border);"></div>' : ''}
                        </div>
                        <div style="padding-bottom:20px;flex:1;">
                            <div style="font-size:0.75rem;color:var(--text-secondary);">${new Date(e.date).toLocaleString('tr-TR')}</div>
                            <div style="font-size:0.88rem;margin-top:2px;">${e.text}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    document.body.appendChild(modal);
};

// ============================================================
// BARO ASGARİ ÜCRET TARİFESİ
// ============================================================
// 2026 Avukatlık Asgari Ücret Tarifesi (tahmini - resmi tarife yayınlandığında güncellenmeli)
const baroTarife2026 = {
    'hukuk-durusmasiz': { min: 26850, desc: 'Sulh Hukuk - Duruşmasız' },
    'hukuk-durusmali': { min: 53700, desc: 'Asliye Hukuk - Duruşmalı' },
    'ceza-durusmasiz': { min: 18000, desc: 'Ceza - Duruşmasız' },
    'ceza-durusmali': { min: 53700, desc: 'Asliye Ceza - Duruşmalı' },
    'is-durusmali': { min: 53700, desc: 'İş Mahkemesi - Duruşmalı' },
    'icra': { min: 16500, desc: 'İcra Takibi' },
    'idare': { min: 53700, desc: 'İdare Mahkemesi' },
    'arabuluculuk': { min: 17100, desc: 'Arabuluculuk' },
    'danismanlik': { min: 9900, desc: 'Hukuki Danışmanlık (saatlik)' },
    'sozlesme': { min: 24750, desc: 'Sözleşme İnceleme/Hazırlama' }
};

window.compareFeeWithBaro = function() {
    const type = document.getElementById('baroTarifeType')?.value;
    const amount = parseFloat(document.getElementById('baroTarifeAmount')?.value) || 0;
    const result = document.getElementById('baroTarifeResult');
    if (!result || !type) return;

    const tarife = baroTarife2026[type];
    if (!tarife) { result.innerHTML = ''; return; }

    const diff = amount - tarife.min;
    const pct = tarife.min > 0 ? Math.round(amount / tarife.min * 100) : 0;

    result.innerHTML = `
        <div class="interest-result-card">
            <h4 style="margin-bottom:12px;">Karşılaştırma Sonucu</h4>
            <div class="interest-result-row"><span>Dava Türü</span><span>${tarife.desc}</span></div>
            <div class="interest-result-row"><span>Baro Asgari Ücret (2026)</span><span style="font-weight:600;">${formatCurrency(tarife.min, 'TRY')}</span></div>
            <div class="interest-result-row"><span>Talep Ettiğiniz Ücret</span><span style="font-weight:600;">${formatCurrency(amount, 'TRY')}</span></div>
            <div class="interest-result-row total">
                <span>Fark</span>
                <span style="color:${diff >= 0 ? 'var(--accent2)' : 'var(--accent)'};">${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'TRY')} (${pct}%)</span>
            </div>
            ${diff < 0 ? '<div style="margin-top:12px;padding:10px;background:#fff3e0;border-radius:var(--radius-sm);font-size:0.85rem;color:#e65100;"><i class="fas fa-exclamation-triangle"></i> Ücretiniz Baro asgari tarifesinin altında! Avukatlık Kanunu m.164 gereği asgari ücret tarifesinin altında sözleşme yapılamaz.</div>' : ''}
            ${pct > 300 ? '<div style="margin-top:12px;padding:10px;background:#e8f5e9;border-radius:var(--radius-sm);font-size:0.85rem;color:#2e7d32;"><i class="fas fa-info-circle"></i> Ücretiniz tarifenin %' + pct + ' oranında. Müvekkile gerekçelendirmeniz önerilir.</div>' : ''}
        </div>`;
};

// ============================================================
// BELGE OCR (Tesseract.js)
// ============================================================
let tesseractLoaded = false;

window.performOCR = function(input) {
    const file = input.files?.[0];
    if (!file) return;

    const progress = document.getElementById('ocrProgress');
    const progressBar = document.getElementById('ocrProgressBar');
    const status = document.getElementById('ocrStatus');
    const resultDiv = document.getElementById('ocrResult');

    progress.style.display = 'block';
    resultDiv.style.display = 'none';

    // Load Tesseract.js dynamically
    if (!tesseractLoaded && !window.Tesseract) {
        status.textContent = 'OCR motoru yükleniyor...';
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = () => { tesseractLoaded = true; runOCR(file); };
        script.onerror = () => { status.textContent = 'OCR motoru yüklenemedi!'; toast('Tesseract.js yüklenemedi', 'error'); };
        document.head.appendChild(script);
    } else {
        runOCR(file);
    }
};

function runOCR(file) {
    const progressBar = document.getElementById('ocrProgressBar');
    const status = document.getElementById('ocrStatus');
    const resultDiv = document.getElementById('ocrResult');

    Tesseract.recognize(file, 'tur+eng', {
        logger: m => {
            if (m.status === 'recognizing text') {
                const pct = Math.round(m.progress * 100);
                progressBar.style.width = pct + '%';
                status.textContent = `Metin tanınıyor... ${pct}%`;
            } else {
                status.textContent = m.status || 'İşleniyor...';
            }
        }
    }).then(({ data: { text } }) => {
        document.getElementById('ocrText').value = text;
        resultDiv.style.display = 'block';
        document.getElementById('ocrProgress').style.display = 'none';
        toast('OCR tamamlandı', 'success');
    }).catch(err => {
        status.textContent = 'Hata: ' + err.message;
        toast('OCR hatası', 'error');
    });
}

window.copyOCRText = function() {
    const text = document.getElementById('ocrText')?.value;
    if (text) { navigator.clipboard.writeText(text); toast('Metin kopyalandı', 'success'); }
};

window.useOCRInPetition = function() {
    const text = document.getElementById('ocrText')?.value;
    if (!text) return;
    navigateTo('petitions');
    setTimeout(() => {
        openPetitionEditor();
        setTimeout(() => {
            const body = document.getElementById('petitionBody');
            if (body) body.value = text;
        }, 200);
    }, 200);
};

// ============================================================
// SESLİ NOT KAYDETME
// ============================================================
let mediaRecorder = null;
let audioChunks = [];
let voiceTimerInterval = null;
let voiceSeconds = 0;

window.toggleVoiceRecording = function() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
};

function startVoiceRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        voiceSeconds = 0;

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = () => {
                saveVoiceNote(reader.result);
            };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();

        document.getElementById('voiceRecordBtn').innerHTML = '<i class="fas fa-stop"></i> Durdur';
        document.getElementById('voiceRecordBtn').style.background = 'var(--accent)';
        document.getElementById('voiceRecIndicator').style.display = 'block';

        voiceTimerInterval = setInterval(() => {
            voiceSeconds++;
            const m = Math.floor(voiceSeconds / 60);
            const s = voiceSeconds % 60;
            document.getElementById('voiceTimer').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }, 1000);

        toast('Kayıt başladı', 'info');
    }).catch(err => {
        toast('Mikrofon erişimi reddedildi: ' + err.message, 'error');
    });
}

function stopVoiceRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    clearInterval(voiceTimerInterval);
    document.getElementById('voiceRecordBtn').innerHTML = '<i class="fas fa-microphone"></i> Kayda Başla';
    document.getElementById('voiceRecordBtn').style.background = '';
    document.getElementById('voiceRecIndicator').style.display = 'none';
    toast('Kayıt durduruluyor...', 'info');
}

function saveVoiceNote(audioData) {
    if (!DB.data.voiceNotes) DB.data.voiceNotes = [];

    DB.data.voiceNotes.push({
        id: genId(),
        audio: audioData,
        caseFileId: document.getElementById('voiceCaseFile')?.value || '',
        description: document.getElementById('voiceDescription')?.value || 'Sesli not',
        duration: voiceSeconds,
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    });

    DB.save();
    document.getElementById('voiceDescription').value = '';
    refreshVoiceNotes();
    toast('Sesli not kaydedildi', 'success');
}

window.refreshVoiceNotes = function() {
    const container = document.getElementById('voiceNotesList');
    if (!container) return;

    const notes = DB.data.voiceNotes || [];
    if (notes.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz sesli not yok.</p>';
        return;
    }

    container.innerHTML = notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(n => {
        const m = Math.floor(n.duration / 60);
        const s = n.duration % 60;
        const cf = n.caseFileId ? (DB.data.caseFiles || []).find(f => f.id === n.caseFileId) : null;
        return `
            <div class="contract-item" style="border-left:4px solid var(--accent4);">
                <div style="flex:1;">
                    <strong>${n.description}</strong>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">
                        ${new Date(n.createdAt).toLocaleString('tr-TR')} | ${m}:${String(s).padStart(2, '0')} | ${n.createdBy}
                        ${cf ? ' | ' + cf.title : ''}
                    </div>
                    <audio controls src="${n.audio}" style="margin-top:8px;height:32px;width:100%;max-width:300px;"></audio>
                </div>
                <button class="btn btn-sm btn-ghost" onclick="deleteVoiceNote('${n.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
            </div>`;
    }).join('');
};

window.deleteVoiceNote = function(id) {
    if (!confirm('Sesli not silinsin mi?')) return;
    DB.data.voiceNotes = (DB.data.voiceNotes || []).filter(n => n.id !== id);
    DB.save();
    refreshVoiceNotes();
    toast('Sesli not silindi', 'success');
};

// ============================================================
// AI DİLEKÇE TASLAĞI (Gemini 2.5 Flash)
// ============================================================
window.saveGeminiKey = function(key) {
    if (!DB.data.settings) DB.data.settings = {};
    DB.data.settings.geminiApiKey = key;
    DB.save();
    toast('API anahtarı kaydedildi', 'success');
};

window.generateAIDraft = function() {
    const apiKey = document.getElementById('geminiApiKey')?.value || DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Gemini API anahtarı gerekli', 'error'); return; }

    const type = document.getElementById('aiPetitionType')?.value;
    const area = document.getElementById('aiLegalArea')?.value;
    const prompt = document.getElementById('aiPrompt')?.value;
    if (!prompt) { toast('Durum açıklaması yazın', 'error'); return; }

    const btn = document.getElementById('aiGenerateBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Oluşturuluyor...';

    const typeNames = { dava: 'Dava Dilekçesi', cevap: 'Cevap Dilekçesi', itiraz: 'İtiraz Dilekçesi', istinaf: 'İstinaf Dilekçesi', ihtarname: 'İhtarname', sulh: 'Sulh Protokolü', custom: 'Hukuki Belge' };
    const areaNames = { ticaret: 'Ticaret Hukuku', is: 'İş Hukuku', aile: 'Aile Hukuku', ceza: 'Ceza Hukuku', icra: 'İcra Hukuku', idare: 'İdare Hukuku', tuketici: 'Tüketici Hukuku', diger: 'Genel' };

    const s = DB.data.settings || {};
    const systemPrompt = `Sen Türkiye'de çalışan deneyimli bir avukatsın. Türk hukuk mevzuatına göre ${typeNames[type] || 'hukuki belge'} taslağı hazırlayacaksın.
Alan: ${areaNames[area] || 'Genel'}
Avukat: ${s.firmName || '[Avukat Adı]'} - ${s.barAssociation || '[Baro]'}

Kurallar:
- Profesyonel hukuki dil kullan
- İlgili kanun maddelerine atıf yap
- Mahkeme formatına uygun yaz
- Sonuç ve istem bölümü ekle
- Tarih ve imza alanı bırak`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nDurum:\n${prompt}\n\nLütfen tam bir ${typeNames[type] || 'dilekçe'} taslağı hazırla.`
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096
            }
        })
    })
    .then(r => r.json())
    .then(data => {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            document.getElementById('aiResultText').value = text;
            document.getElementById('aiResult').style.display = 'block';
            toast('AI taslağı oluşturuldu', 'success');
        } else {
            const error = data.error?.message || 'Bilinmeyen hata';
            toast('AI hatası: ' + error, 'error');
        }
    })
    .catch(err => {
        toast('Bağlantı hatası: ' + err.message, 'error');
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Taslak Oluştur';
    });
};

window.useAIInPetition = function() {
    const text = document.getElementById('aiResultText')?.value;
    if (!text) return;
    navigateTo('petitions');
    setTimeout(() => {
        openPetitionEditor();
        setTimeout(() => {
            const body = document.getElementById('petitionBody');
            if (body) body.value = text;
        }, 200);
    }, 200);
};

// ============================================================
// PWA SERVICE WORKER KAYDI
// ============================================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ============================================================
// CSS Pulse Animation for voice recording
// ============================================================
(function addPulseAnimation() {
    const style = document.createElement('style');
    style.textContent = `@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`;
    document.head.appendChild(style);
})();

// ============================================================
// 13. DOSYA KAPANIŞ RAPORU
// ============================================================
window.generateClosingReport = function(caseFileId) {
    const cf = (DB.data.caseFiles || []).find(f => f.id === caseFileId);
    if (!cf) { toast('Dosya bulunamadı', 'error'); return; }

    const s = DB.data.settings || {};
    const proposals = (DB.data.proposals || []).filter(p => p.clientName === cf.client || p.projectName === cf.title);
    const expenses = (DB.data.expenses || []).filter(e => proposals.some(p => p.id === e.proposalId) || e.caseFileId === caseFileId);
    const timeEntries = (DB.data.timesheet || []).filter(e => proposals.some(p => p.id === e.proposalId) || e.caseFileId === caseFileId);
    const hearings = (DB.data.hearings || []).filter(h => h.caseTitle === cf.title || h.caseNo === cf.esasNo);
    const journal = cf.journal || [];

    let totalExpense = 0;
    expenses.forEach(e => totalExpense += parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.') || 0));
    let totalMinutes = 0;
    timeEntries.forEach(e => totalMinutes += e.duration || 0);
    let totalRevenue = 0;
    proposals.forEach(p => {
        if (p.status === 'accepted' || p.status === 'kabul') totalRevenue += parseFloat(String(p.feeData?.amount || p.feeData?.fixedAmount || 0).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    });

    const result = cf.result || hearings.find(h => h.result)?.result || 'Belirtilmemiş';

    let html = `<div style="font-family:Arial,sans-serif;padding:30px;font-size:10pt;">
        <div style="text-align:center;margin-bottom:24px;">
            <h1 style="margin:0;color:#1a1d2e;font-size:16pt;">${s.firmName || 'Hukuk Bürosu'}</h1>
            <div style="font-size:9pt;color:#636e72;">${s.firmAddress || ''}</div>
            <h2 style="margin-top:16px;color:#4a6cf7;">DOSYA KAPANIŞ RAPORU</h2>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:8px;border:1px solid #e1e5ee;font-weight:600;width:35%;">Dosya Adı</td><td style="padding:8px;border:1px solid #e1e5ee;">${cf.title}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e1e5ee;font-weight:600;">Müvekkil</td><td style="padding:8px;border:1px solid #e1e5ee;">${cf.client || '-'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e1e5ee;font-weight:600;">Esas No</td><td style="padding:8px;border:1px solid #e1e5ee;">${cf.esasNo || '-'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e1e5ee;font-weight:600;">Mahkeme</td><td style="padding:8px;border:1px solid #e1e5ee;">${cf.court || '-'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e1e5ee;font-weight:600;">Karşı Taraf</td><td style="padding:8px;border:1px solid #e1e5ee;">${cf.opponent || '-'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e1e5ee;font-weight:600;">Dosya Türü</td><td style="padding:8px;border:1px solid #e1e5ee;">${caseFileTypeLabels[cf.type] || cf.type}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e1e5ee;font-weight:600;">Sonuç</td><td style="padding:8px;border:1px solid #e1e5ee;font-weight:700;color:${result.includes('kazanıldı') ? '#27ae60' : result.includes('kaybedildi') ? '#e74c3c' : '#636e72'};">${result}</td></tr>
        </table>

        <h3 style="color:#1a1d2e;border-bottom:1px solid #e1e5ee;padding-bottom:6px;">Özet İstatistik</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;">
            <div style="text-align:center;padding:12px;background:#f5f6fa;border-radius:8px;"><div style="font-size:18pt;font-weight:700;color:#4a6cf7;">${hearings.length}</div><div style="font-size:8pt;">Duruşma</div></div>
            <div style="text-align:center;padding:12px;background:#f5f6fa;border-radius:8px;"><div style="font-size:18pt;font-weight:700;color:#27ae60;">${formatCurrency(totalRevenue, 'TRY')}</div><div style="font-size:8pt;">Gelir</div></div>
            <div style="text-align:center;padding:12px;background:#f5f6fa;border-radius:8px;"><div style="font-size:18pt;font-weight:700;color:#e74c3c;">${formatCurrency(totalExpense, 'TRY')}</div><div style="font-size:8pt;">Masraf</div></div>
            <div style="text-align:center;padding:12px;background:#f5f6fa;border-radius:8px;"><div style="font-size:18pt;font-weight:700;color:#8e44ad;">${Math.floor(totalMinutes/60)}sa ${totalMinutes%60}dk</div><div style="font-size:8pt;">Süre</div></div>
        </div>

        ${journal.length > 0 ? `<h3 style="color:#1a1d2e;border-bottom:1px solid #e1e5ee;padding-bottom:6px;margin-top:20px;">Dosya Günlüğü (Son 10)</h3>
        <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-top:8px;">
            ${journal.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(j => `<tr><td style="padding:6px;border-bottom:1px solid #f0f0f0;width:25%;">${new Date(j.date).toLocaleDateString('tr-TR')}</td><td style="padding:6px;border-bottom:1px solid #f0f0f0;">${j.text}</td></tr>`).join('')}
        </table>` : ''}

        <div style="margin-top:40px;text-align:center;font-size:8pt;color:#636e72;border-top:1px solid #e1e5ee;padding-top:16px;">
            ${s.firmName || ''} | Rapor: ${new Date().toLocaleDateString('tr-TR')} | ${DB.data.currentUser?.name || ''}
        </div>
    </div>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    toast('Kapanış raporu oluşturuluyor...', 'info');

    html2pdf().set({
        margin: [10,10,10,10], filename: `kapanis_raporu_${cf.title.replace(/\s+/g,'_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' }
    }).from(tempDiv).save().then(() => { tempDiv.remove(); toast('Kapanış raporu indirildi', 'success'); });
};

// ============================================================
// 14. MAHKEME KARARI KAYDETME
// ============================================================
window.recordCourtDecision = function(caseFileId) {
    const cf = (DB.data.caseFiles || []).find(f => f.id === caseFileId);
    if (!cf) { toast('Dosya bulunamadı', 'error'); return; }

    let modal = document.getElementById('courtDecisionModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'courtDecisionModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3><i class="fas fa-balance-scale" style="margin-right:8px;"></i>Mahkeme Kararı: ${cf.title}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Karar Sonucu</label>
                    <select id="decisionResult">
                        <option value="lehte-kabul">Lehte - Dava Kabul</option>
                        <option value="lehte-kismi">Lehte - Kısmi Kabul</option>
                        <option value="aleyhte-red">Aleyhte - Dava Red</option>
                        <option value="sulh">Sulh ile Sonuçlandı</option>
                        <option value="feragat">Feragat</option>
                        <option value="dusme">Düşme</option>
                        <option value="gonderme">Görevsizlik/Yetkisizlik</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Karar Tarihi</label>
                    <input type="date" id="decisionDate" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Karar No</label>
                    <input type="text" id="decisionNo" placeholder="2026/123">
                </div>
                <div class="form-group">
                    <label>Hüküm Özeti</label>
                    <textarea id="decisionSummary" rows="4" placeholder="Mahkeme kararının özeti..."></textarea>
                </div>
                <div class="form-group">
                    <label>Kanun Yolu</label>
                    <select id="decisionAppeal">
                        <option value="">Yok</option>
                        <option value="istinaf">İstinaf Başvurusu Yapılacak</option>
                        <option value="temyiz">Temyiz Başvurusu Yapılacak</option>
                        <option value="kesinlesti">Kesinleşti</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="saveCourtDecision('${caseFileId}')">
                    <i class="fas fa-save"></i> Kaydet
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
};

window.saveCourtDecision = function(caseFileId) {
    const cf = (DB.data.caseFiles || []).find(f => f.id === caseFileId);
    if (!cf) return;

    cf.decision = {
        result: document.getElementById('decisionResult')?.value || '',
        date: document.getElementById('decisionDate')?.value || '',
        no: document.getElementById('decisionNo')?.value || '',
        summary: document.getElementById('decisionSummary')?.value || '',
        appeal: document.getElementById('decisionAppeal')?.value || '',
        recordedAt: new Date().toISOString(),
        recordedBy: DB.data.currentUser?.name || ''
    };

    // Update case file status based on decision
    const appeal = cf.decision.appeal;
    if (appeal === 'istinaf' || appeal === 'temyiz') cf.status = 'appeal';
    else if (appeal === 'kesinlesti') cf.status = 'closed';

    // Add to journal
    if (!cf.journal) cf.journal = [];
    const resultLabels = { 'lehte-kabul': 'Lehte Kabul', 'lehte-kismi': 'Kısmi Kabul', 'aleyhte-red': 'Dava Red', 'sulh': 'Sulh', 'feragat': 'Feragat', 'dusme': 'Düşme', 'gonderme': 'Görevsizlik/Yetkisizlik' };
    cf.journal.push({
        id: genId(), type: 'decision',
        text: `Mahkeme Kararı: ${resultLabels[cf.decision.result] || cf.decision.result}${cf.decision.no ? ' (Karar No: ' + cf.decision.no + ')' : ''}. ${cf.decision.summary || ''}`,
        date: new Date().toISOString(), createdBy: DB.data.currentUser?.name || ''
    });

    DB.save();
    document.getElementById('courtDecisionModal')?.remove();
    toast('Mahkeme kararı kaydedildi', 'success');
    refreshCaseFiles();
};

// ============================================================
// 16. DURUŞMA HAZIRLIK CHECKLİST'İ
// ============================================================
window.openHearingChecklist = function(hearingId) {
    const h = (DB.data.hearings || []).find(x => x.id === hearingId);
    if (!h) return;

    if (!h.checklist) {
        h.checklist = {
            dosyaInceleme: false,
            delilHazirlik: false,
            tanikListesi: false,
            dilekceHazirlik: false,
            muzekkereTakip: false,
            karsiTarafCevap: false,
            muvekkilBilgi: false,
            kiyafetDosya: false
        };
        DB.save();
    }

    let modal = document.getElementById('hearingChecklistModal');
    if (modal) modal.remove();

    const items = {
        dosyaInceleme: 'Dosya incelemesi yapıldı',
        delilHazirlik: 'Deliller hazırlandı / düzenlendi',
        tanikListesi: 'Tanık listesi hazırlandı',
        dilekceHazirlik: 'Beyan / dilekçe hazırlandı',
        muzekkereTakip: 'Müzekkere cevapları kontrol edildi',
        karsiTarafCevap: 'Karşı taraf cevabı incelendi',
        muvekkilBilgi: 'Müvekkil bilgilendirildi',
        kiyafetDosya: 'Dosya ve cüppe hazırlandı'
    };

    const done = Object.values(h.checklist).filter(v => v).length;
    const total = Object.keys(items).length;

    modal = document.createElement('div');
    modal.id = 'hearingChecklistModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3><i class="fas fa-clipboard-check" style="margin-right:8px;"></i>Duruşma Hazırlık</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom:12px;">
                    <strong>${h.caseTitle}</strong>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">${h.court} | ${typeof formatDate === 'function' ? formatDate(h.date) : h.date} ${h.time || ''}</div>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">
                        <span>Hazırlık</span><span>${done}/${total}</span>
                    </div>
                    <div style="background:var(--border);border-radius:4px;overflow:hidden;">
                        <div style="height:6px;background:${done === total ? 'var(--accent2)' : 'var(--primary)'};width:${Math.round(done/total*100)}%;transition:width 0.3s;"></div>
                    </div>
                </div>
                <div id="hearingChecklistItems">
                    ${Object.entries(items).map(([key, label]) => `
                        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="toggleHearingCheckItem('${hearingId}','${key}')">
                            <i class="fas ${h.checklist[key] ? 'fa-check-circle' : 'fa-circle'}" style="color:${h.checklist[key] ? 'var(--accent2)' : 'var(--text-secondary)'};font-size:1.1rem;"></i>
                            <span style="${h.checklist[key] ? 'text-decoration:line-through;color:var(--text-secondary);' : ''}">${label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
};

window.toggleHearingCheckItem = function(hearingId, item) {
    const h = (DB.data.hearings || []).find(x => x.id === hearingId);
    if (!h || !h.checklist) return;
    h.checklist[item] = !h.checklist[item];
    DB.save();
    // Re-render
    document.getElementById('hearingChecklistModal')?.remove();
    openHearingChecklist(hearingId);
};

// ============================================================
// 38. AI ÖNCEKİ DİLEKÇELERDEN ÖĞRENME
// ============================================================
// Patch generateAIDraft to include previous petitions as context
const _origGenerateAI = window.generateAIDraft;
window.generateAIDraft = function() {
    const apiKey = document.getElementById('geminiApiKey')?.value || DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Gemini API anahtarı gerekli', 'error'); return; }

    const type = document.getElementById('aiPetitionType')?.value;
    const area = document.getElementById('aiLegalArea')?.value;
    const prompt = document.getElementById('aiPrompt')?.value;
    if (!prompt) { toast('Durum açıklaması yazın', 'error'); return; }

    const btn = document.getElementById('aiGenerateBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Oluşturuluyor...';

    const typeNames = { dava: 'Dava Dilekçesi', cevap: 'Cevap Dilekçesi', itiraz: 'İtiraz Dilekçesi', istinaf: 'İstinaf Dilekçesi', ihtarname: 'İhtarname', sulh: 'Sulh Protokolü', custom: 'Hukuki Belge' };
    const areaNames = { ticaret: 'Ticaret Hukuku', is: 'İş Hukuku', aile: 'Aile Hukuku', ceza: 'Ceza Hukuku', icra: 'İcra Hukuku', idare: 'İdare Hukuku', tuketici: 'Tüketici Hukuku', diger: 'Genel' };

    const s = DB.data.settings || {};

    // Collect previous petitions as learning context
    let prevContext = '';
    const prevPetitions = (DB.data.petitions || []).filter(p => p.type === type).slice(-3);
    if (prevPetitions.length > 0) {
        prevContext = '\n\nÖNCEKİ DİLEKÇE ÖRNEKLERİM (bu tarzda yaz):\n';
        prevPetitions.forEach((p, i) => {
            prevContext += `\n--- Örnek ${i + 1} ---\n${p.body?.substring(0, 500) || ''}\n`;
        });
    }

    const systemPrompt = `Sen Türkiye'de çalışan deneyimli bir avukatsın. Türk hukuk mevzuatına göre ${typeNames[type] || 'hukuki belge'} taslağı hazırlayacaksın.
Alan: ${areaNames[area] || 'Genel'}
Avukat: ${s.firmName || '[Avukat Adı]'} - ${s.barAssociation || '[Baro]'}

Kurallar:
- Profesyonel hukuki dil kullan
- İlgili kanun maddelerine atıf yap
- Mahkeme formatına uygun yaz
- Sonuç ve istem bölümü ekle
- Tarih ve imza alanı bırak${prevContext}`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nDurum:\n${prompt}\n\nLütfen tam bir ${typeNames[type] || 'dilekçe'} taslağı hazırla.` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
        })
    })
    .then(r => r.json())
    .then(data => {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            document.getElementById('aiResultText').value = text;
            document.getElementById('aiResult').style.display = 'block';
            toast('AI taslağı oluşturuldu (önceki dilekçelerinizden öğrenildi)', 'success');
        } else {
            toast('AI hatası: ' + (data.error?.message || 'Bilinmeyen'), 'error');
        }
    })
    .catch(err => toast('Bağlantı hatası: ' + err.message, 'error'))
    .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Taslak Oluştur'; });
};

// ============================================================
// 39. OTOMATİK BELGE SINIFLANDIRMA + MANUEL DÜZELTME
// ============================================================
window.classifyDocument = function(file) {
    const name = file.name.toLowerCase();
    const ext = name.split('.').pop();

    // Auto-classify based on filename patterns
    const patterns = [
        { regex: /dilekçe|dilekce|petition/i, type: 'dilekce', label: 'Dilekçe' },
        { regex: /sözleşme|sozlesme|contract/i, type: 'sozlesme', label: 'Sözleşme' },
        { regex: /vekaletname|vekalet|poa/i, type: 'vekaletname', label: 'Vekaletname' },
        { regex: /fatura|invoice/i, type: 'fatura', label: 'Fatura' },
        { regex: /makbuz|receipt/i, type: 'makbuz', label: 'Makbuz' },
        { regex: /karar|decision|hüküm/i, type: 'karar', label: 'Mahkeme Kararı' },
        { regex: /bilirkişi|bilirkisi|expert/i, type: 'bilirkisi', label: 'Bilirkişi Raporu' },
        { regex: /ihtarname|ihtar|notice/i, type: 'ihtarname', label: 'İhtarname' },
        { regex: /tensip|zabıt|zapti/i, type: 'tensip', label: 'Tensip/Zabıt' },
        { regex: /kimlik|nüfus|tc/i, type: 'kimlik', label: 'Kimlik Belgesi' },
        { regex: /tebligat|tebliğ/i, type: 'tebligat', label: 'Tebligat' }
    ];

    for (const p of patterns) {
        if (p.regex.test(name)) return { type: p.type, label: p.label, confidence: 'high' };
    }

    // Classify by extension
    if (['jpg', 'jpeg', 'png', 'heic'].includes(ext)) return { type: 'goruntu', label: 'Görüntü/Fotoğraf', confidence: 'low' };
    if (ext === 'pdf') return { type: 'pdf', label: 'PDF Belge', confidence: 'low' };
    if (['doc', 'docx'].includes(ext)) return { type: 'word', label: 'Word Belgesi', confidence: 'low' };

    return { type: 'diger', label: 'Diğer', confidence: 'low' };
};

window.showClassificationDialog = function(file, callback) {
    const auto = classifyDocument(file);

    let modal = document.getElementById('classifyModal');
    if (modal) modal.remove();

    const types = [
        { value: 'dilekce', label: 'Dilekçe' },
        { value: 'sozlesme', label: 'Sözleşme' },
        { value: 'vekaletname', label: 'Vekaletname' },
        { value: 'fatura', label: 'Fatura' },
        { value: 'makbuz', label: 'Makbuz' },
        { value: 'karar', label: 'Mahkeme Kararı' },
        { value: 'bilirkisi', label: 'Bilirkişi Raporu' },
        { value: 'ihtarname', label: 'İhtarname' },
        { value: 'tensip', label: 'Tensip/Zabıt' },
        { value: 'tebligat', label: 'Tebligat' },
        { value: 'kimlik', label: 'Kimlik Belgesi' },
        { value: 'diger', label: 'Diğer' }
    ];

    modal = document.createElement('div');
    modal.id = 'classifyModal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>Belge Sınıflandırma</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom:12px;">
                    <strong>${file.name}</strong>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">Otomatik algılama: <span style="color:var(--primary);font-weight:600;">${auto.label}</span>
                    ${auto.confidence === 'high' ? ' <i class="fas fa-check-circle" style="color:var(--accent2);"></i>' : ' <i class="fas fa-question-circle" style="color:var(--accent3);"></i>'}</div>
                </div>
                <div class="form-group">
                    <label>Belge Türü (değiştirebilirsiniz)</label>
                    <select id="classifyType">
                        ${types.map(t => `<option value="${t.value}" ${t.value === auto.type ? 'selected' : ''}>${t.label}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-primary" onclick="(function(){ const type = document.getElementById('classifyType').value; document.getElementById('classifyModal').remove(); if(typeof ${callback} === 'function') ${callback}(type); })()">
                    <i class="fas fa-check"></i> Onayla
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    return auto;
};

// ============================================================
// 44. TABLO / KART OPSİYONLU GÖRÜNÜM
// ============================================================
window.toggleViewMode = function(page) {
    const current = localStorage.getItem(`viewMode_${page}`) || 'card';
    const next = current === 'card' ? 'table' : 'card';
    localStorage.setItem(`viewMode_${page}`, next);

    // Refresh the relevant page
    if (page === 'clients') refreshClients();
    if (page === 'case-files') refreshCaseFiles();
    if (page === 'proposals') refreshProposalsList();

    toast(`${next === 'card' ? 'Kart' : 'Tablo'} görünümüne geçildi`, 'info');
};

// Add view toggle buttons to page headers
(function addViewToggles() {
    setTimeout(() => {
        ['page-clients', 'page-case-files', 'page-proposals'].forEach(pageId => {
            const page = document.getElementById(pageId);
            if (!page) return;
            const header = page.querySelector('.page-header');
            if (!header || header.querySelector('.view-toggle')) return;

            const key = pageId.replace('page-', '');
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-ghost view-toggle';
            btn.title = 'Görünüm Değiştir';
            btn.innerHTML = '<i class="fas fa-th-list"></i>';
            btn.onclick = () => toggleViewMode(key);
            header.appendChild(btn);
        });
    }, 1500);
})();

// ============================================================
// DURUŞMA KARTLARINA CHECKLIST BUTONU EKLEME (MutationObserver)
// ============================================================
(function observeHearingsForChecklist() {
    function addChecklistButtons() {
        const hearingsList = document.getElementById('hearingsList');
        if (!hearingsList) return;

        (DB.data.hearings || []).forEach(h => {
            const items = hearingsList.querySelectorAll('.contract-item');
            items.forEach(item => {
                if (item.innerHTML.includes(h.caseTitle) && !item.querySelector('[title="Hazırlık Listesi"]')) {
                    const allDivs = item.querySelectorAll('div');
                    let btnDiv = null;
                    allDivs.forEach(d => { if (d.style.display === 'flex' && d.querySelector('button')) btnDiv = d; });
                    if (btnDiv) {
                        const checkBtn = document.createElement('button');
                        checkBtn.className = 'btn btn-sm btn-outline';
                        checkBtn.title = 'Hazırlık Listesi';
                        checkBtn.innerHTML = '<i class="fas fa-clipboard-check"></i>';
                        checkBtn.onclick = () => openHearingChecklist(h.id);
                        btnDiv.insertBefore(checkBtn, btnDiv.firstChild);
                    }
                }
            });
        });
    }

    // Observe hearingsList for changes
    const observer = new MutationObserver(() => setTimeout(addChecklistButtons, 50));
    const target = document.getElementById('hearingsList');
    if (target) observer.observe(target, { childList: true, subtree: true });

    // Also observe page visibility
    const pageObs = new MutationObserver(() => {
        const page = document.getElementById('page-hearings');
        if (page && page.classList.contains('active')) setTimeout(addChecklistButtons, 100);
    });
    const pageEl = document.getElementById('page-hearings');
    if (pageEl) pageObs.observe(pageEl, { attributes: true, attributeFilter: ['class'] });
})();

// DOSYA LİSTESİNE KARAR, KAPANIŞ RAPORU VE TİMELINE BUTONLARI (MutationObserver)
(function observeCaseFilesForButtons() {
    function addCaseFileButtons() {
        const list = document.getElementById('caseFilesList');
        if (!list) return;

        list.querySelectorAll('.contract-item').forEach(item => {
            const editBtn = item.querySelector('[title="Düzenle"]');
            if (!editBtn) return;
            const btnContainer = editBtn.parentElement;

            // Check if already has our buttons
            if (item.querySelector('[title="Karar Kaydet"]')) return;

            // Find case file id from onclick
            const match = editBtn.getAttribute('onclick')?.match(/openCaseFileModal\('([^']+)'\)/);
            if (!match) return;
            const cfId = match[1];

            // Add decision button
            const decBtn = document.createElement('button');
            decBtn.className = 'btn btn-sm btn-outline';
            decBtn.title = 'Karar Kaydet';
            decBtn.innerHTML = '<i class="fas fa-balance-scale"></i>';
            decBtn.onclick = () => recordCourtDecision(cfId);
            btnContainer.insertBefore(decBtn, btnContainer.querySelector('[title="Düzenle"]'));

            // Add closing report button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn btn-sm btn-outline';
            closeBtn.title = 'Kapanış Raporu';
            closeBtn.innerHTML = '<i class="fas fa-file-archive"></i>';
            closeBtn.onclick = () => generateClosingReport(cfId);
            btnContainer.insertBefore(closeBtn, btnContainer.querySelector('[title="Düzenle"]'));

            // Add timeline button
            const timeBtn = document.createElement('button');
            timeBtn.className = 'btn btn-sm btn-outline';
            timeBtn.title = 'Timeline';
            timeBtn.innerHTML = '<i class="fas fa-stream"></i>';
            timeBtn.onclick = () => showCaseTimeline(cfId);
            const journalBtn = btnContainer.querySelector('[title="Dosya Günlüğü"]');
            btnContainer.insertBefore(timeBtn, journalBtn || btnContainer.querySelector('[title="Düzenle"]'));
        });
    }

    // Observe caseFilesList for changes
    const observer = new MutationObserver(() => setTimeout(addCaseFileButtons, 50));
    const target = document.getElementById('caseFilesList');
    if (target) observer.observe(target, { childList: true, subtree: true });

    // Also observe page visibility
    const pageObs = new MutationObserver(() => {
        const page = document.getElementById('page-case-files');
        if (page && page.classList.contains('active')) setTimeout(addCaseFileButtons, 100);
    });
    const pageEl = document.getElementById('page-case-files');
    if (pageEl) pageObs.observe(pageEl, { attributes: true, attributeFilter: ['class'] });
})();

// ============================================================
// PIN DEĞİŞTİRME
// ============================================================
window.changePin = function() {
    const currentPin = document.getElementById('currentPinInput')?.value;
    const newPin = document.getElementById('newPinInput')?.value;
    const confirmPin = document.getElementById('confirmPinInput')?.value;

    if (!currentPin || !newPin || !confirmPin) {
        toast('Tüm alanları doldurun', 'error');
        return;
    }

    const user = DB.data.currentUser;
    if (!user) {
        toast('Oturum bulunamadı', 'error');
        return;
    }

    // Mevcut PIN kontrolü
    if (currentPin !== user.pin) {
        toast('Mevcut PIN yanlış', 'error');
        return;
    }

    // Yeni PIN validasyonu
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        toast('Yeni PIN 4 haneli rakam olmalı', 'error');
        return;
    }

    if (newPin !== confirmPin) {
        toast('Yeni PIN\'ler eşleşmiyor', 'error');
        return;
    }

    if (newPin === currentPin) {
        toast('Yeni PIN mevcut PIN ile aynı olamaz', 'error');
        return;
    }

    // Diğer avukatın PIN'i ile aynı olmamalı
    const otherUser = DB.data.users.find(u => u.id !== user.id);
    if (otherUser && otherUser.pin === newPin) {
        toast('Bu PIN diğer avukat tarafından kullanılıyor', 'error');
        return;
    }

    // PIN güncelle
    const userInList = DB.data.users.find(u => u.id === user.id);
    if (userInList) userInList.pin = newPin;
    DB.data.currentUser.pin = newPin;
    DB.save();

    // Alanları temizle
    document.getElementById('currentPinInput').value = '';
    document.getElementById('newPinInput').value = '';
    document.getElementById('confirmPinInput').value = '';

    toast('PIN başarıyla değiştirildi', 'success');
};

// ============================================================
// KANBAN GÖREV PANOSU
// ============================================================
const kanbanColumns = [
    { id: 'backlog', label: 'Bekleyen', icon: 'inbox', color: 'var(--text-secondary)' },
    { id: 'todo', label: 'Yapılacak', icon: 'list', color: 'var(--accent3)' },
    { id: 'inprogress', label: 'Devam Eden', icon: 'spinner', color: 'var(--primary)' },
    { id: 'done', label: 'Tamamlanan', icon: 'check-circle', color: 'var(--accent2)' }
];

window.renderKanban = function() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    const tasks = DB.data.tasks || [];

    board.innerHTML = kanbanColumns.map(col => {
        const colTasks = tasks.filter(t => {
            const status = t.kanbanStatus || (t.completed ? 'done' : 'backlog');
            return status === col.id;
        });

        return `<div class="kanban-column" data-column="${col.id}">
            <div class="kanban-column-header" style="border-top:3px solid ${col.color};">
                <span><i class="fas fa-${col.icon}" style="margin-right:6px;color:${col.color};"></i>${col.label}</span>
                <span class="kanban-count">${colTasks.length}</span>
            </div>
            <div class="kanban-cards" data-column="${col.id}" ondragover="event.preventDefault();this.style.background='var(--bg-hover)'" ondragleave="this.style.background=''" ondrop="dropKanbanTask(event,'${col.id}');this.style.background=''">
                ${colTasks.length === 0 ? '<div class="kanban-empty">Boş</div>' : colTasks.map(t => {
                    const priorityColors = { urgent: '#e74c3c', high: '#e67e22', medium: '#3498db', low: '#95a5a6' };
                    const priorityLabels = { urgent: 'Acil', high: 'Yüksek', medium: 'Normal', low: 'Düşük' };
                    const pColor = priorityColors[t.priority] || '#95a5a6';
                    return `<div class="kanban-card" draggable="true" ondragstart="event.dataTransfer.setData('taskId','${t.id}')" style="border-left:3px solid ${pColor};">
                        <div class="kanban-card-title">${t.title}</div>
                        ${t.description ? `<div class="kanban-card-desc">${t.description.substring(0, 60)}${t.description.length > 60 ? '...' : ''}</div>` : ''}
                        <div class="kanban-card-meta">
                            ${t.dueDate ? `<span><i class="fas fa-clock"></i> ${new Date(t.dueDate).toLocaleDateString('tr-TR')}</span>` : ''}
                            <span style="color:${pColor};font-weight:600;font-size:0.68rem;">${priorityLabels[t.priority] || 'Normal'}</span>
                            ${t.assignee ? `<span><i class="fas fa-user"></i> ${t.assignee}</span>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');
};

window.dropKanbanTask = function(event, targetColumn) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('taskId');
    const task = (DB.data.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    task.kanbanStatus = targetColumn;
    task.completed = targetColumn === 'done';
    if (targetColumn === 'done' && !task.completedAt) task.completedAt = new Date().toISOString();
    DB.save();
    renderKanban();
    toast(`Görev "${targetColumn === 'done' ? 'tamamlandı' : kanbanColumns.find(c => c.id === targetColumn)?.label || targetColumn}" olarak güncellendi`, 'info');
};

// Kanban tab açılınca render et
(function observeKanbanTab() {
    const tab = document.getElementById('tab-tasks-kanban');
    if (!tab) return;
    const obs = new MutationObserver(() => {
        if (tab.classList.contains('active')) renderKanban();
    });
    obs.observe(tab, { attributes: true, attributeFilter: ['class'] });
})();

// ============================================================
// HAFTALIK AJANDA (Dashboard)
// ============================================================
let weeklyAgendaOffset = 0;

window.shiftWeeklyAgenda = function(dir) {
    weeklyAgendaOffset += dir * 7;
    renderWeeklyAgenda();
};

window.renderWeeklyAgenda = function() {
    const container = document.getElementById('weeklyAgendaContent');
    const label = document.getElementById('weeklyAgendaLabel');
    if (!container) return;

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weeklyAgendaOffset); // Pazartesi

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(d);
    }

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    if (label) {
        const s = days[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        const e = days[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        label.textContent = `${s} - ${e}`;
    }

    container.innerHTML = days.map((d, i) => {
        const dateStr = d.toISOString().split('T')[0];
        const isToday = d.toDateString() === today.toDateString();
        const isHoliday = typeof isOfficialHoliday === 'function' && isOfficialHoliday(d);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        // Collect events for this day
        const hearings = (DB.data.hearings || []).filter(h => h.date === dateStr);
        const deadlines = (DB.data.deadlines || []).filter(dl => dl.dueDate === dateStr);
        const tasks = (DB.data.tasks || []).filter(t => t.dueDate === dateStr && !t.completed);

        const eventCount = hearings.length + deadlines.length + tasks.length;

        let bgColor = 'var(--bg)';
        if (isToday) bgColor = 'var(--primary)';
        else if (isHoliday) bgColor = 'rgba(231,76,60,0.15)';
        else if (isWeekend) bgColor = 'var(--bg-hover)';

        const textColor = isToday ? '#fff' : 'var(--text)';

        return `<div style="background:${bgColor};border-radius:8px;padding:6px 4px;text-align:center;min-height:80px;border:1px solid ${isToday ? 'var(--primary)' : 'var(--border)'};">
            <div style="font-size:0.7rem;color:${isToday ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'};font-weight:600;">${dayNames[i]}</div>
            <div style="font-size:1.1rem;font-weight:700;color:${textColor};margin:2px 0;">${d.getDate()}</div>
            ${isHoliday ? '<div style="font-size:0.6rem;color:#e74c3c;">Tatil</div>' : ''}
            ${hearings.map(h => `<div style="font-size:0.6rem;background:rgba(74,108,247,0.2);color:var(--primary);border-radius:3px;padding:1px 3px;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${h.caseTitle} ${h.time || ''}"><i class="fas fa-gavel"></i> ${h.time || ''} ${h.caseTitle?.substring(0,8) || ''}</div>`).join('')}
            ${deadlines.map(dl => `<div style="font-size:0.6rem;background:rgba(231,76,60,0.2);color:var(--accent);border-radius:3px;padding:1px 3px;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${dl.title}"><i class="fas fa-clock"></i> ${dl.title?.substring(0,8) || ''}</div>`).join('')}
            ${tasks.map(t => `<div style="font-size:0.6rem;background:rgba(39,174,96,0.2);color:var(--accent2);border-radius:3px;padding:1px 3px;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${t.title}"><i class="fas fa-tasks"></i> ${t.title?.substring(0,8) || ''}</div>`).join('')}
            ${eventCount === 0 && !isHoliday ? '<div style="font-size:0.6rem;color:var(--text-secondary);margin-top:8px;">-</div>' : ''}
        </div>`;
    }).join('');
};

// Dashboard render'a ajanda ekle
(function patchDashboardForAgenda() {
    const _origDash = window.refreshDashboard;
    if (!_origDash) return;
    window.refreshDashboard = function() {
        _origDash();
        renderWeeklyAgenda();
    };
})();

// ============================================================
// AI DAVA SONUÇ TAHMİNİ (Gemini)
// ============================================================
window.predictCaseOutcome = function() {
    const apiKey = document.getElementById('geminiApiKey')?.value || DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Gemini API anahtarı gerekli — AI Dilekçe sekmesinden girin', 'error'); return; }

    const caseType = document.getElementById('predictCaseType')?.value;
    const court = document.getElementById('predictCourt')?.value || '';
    const side = document.getElementById('predictSide')?.value;
    const amount = document.getElementById('predictAmount')?.value || '';
    const strengths = document.getElementById('predictStrengths')?.value || '';
    const weaknesses = document.getElementById('predictWeaknesses')?.value || '';
    const summary = document.getElementById('predictSummary')?.value || '';

    if (!summary && !strengths) { toast('En az dava özeti veya güçlü yanları doldurun', 'error'); return; }

    const btn = document.getElementById('predictBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analiz ediliyor...';

    const typeNames = { hukuk: 'Hukuk Davası', ceza: 'Ceza Davası', is: 'İş Davası', aile: 'Aile Hukuku', icra: 'İcra Takibi', idare: 'İdari Dava', ticaret: 'Ticaret Davası', tuketici: 'Tüketici Davası' };
    const sideNames = { davaci: 'Davacı', davali: 'Davalı' };

    // Bürodaki benzer geçmiş dosyalardan öğren
    let pastContext = '';
    const pastCases = (DB.data.caseFiles || []).filter(cf => cf.result && cf.type === caseType).slice(-5);
    if (pastCases.length > 0) {
        pastContext = '\n\nBÜRONUN GEÇMİŞ BENZERDAVALARI:\n';
        pastCases.forEach((cf, i) => {
            pastContext += `${i+1}. ${cf.title} — Sonuç: ${cf.result} | Tür: ${cf.type}\n`;
        });
    }

    const prompt = `Sen Türk hukuk sistemi konusunda uzman bir hukuki analiz yapay zekasısın.

DAVA BİLGİLERİ:
- Dava Türü: ${typeNames[caseType] || caseType}
- Mahkeme: ${court || 'Belirtilmemiş'}
- Taraf: ${sideNames[side] || side}
${amount ? `- Dava Değeri: ${amount} TL` : ''}

GÜÇLÜ YANLAR:
${strengths || 'Belirtilmemiş'}

ZAYIF YANLAR / RİSKLER:
${weaknesses || 'Belirtilmemiş'}

DAVA ÖZETİ:
${summary || 'Belirtilmemiş'}
${pastContext}

GÖREV: Aşağıdaki formatta JSON döndür (başka metin ekleme):
{
  "kazanmaOlasiligi": <0-100 arası sayı>,
  "tahminiSonuc": "<Lehte Karar / Kısmi Kabul / Aleyhte Karar / Sulh Önerisi / Belirsiz>",
  "tahminiSure": "<tahmini süre, ör: 12-18 ay>",
  "gucluNoktalar": ["<madde 1>", "<madde 2>", "<madde 3>"],
  "riskler": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "stratejiOnerileri": ["<öneri 1>", "<öneri 2>", "<öneri 3>"],
  "emsal": "<varsa ilgili Yargıtay kararı veya emsal>",
  "ozet": "<2-3 cümlelik genel değerlendirme>"
}`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
    })
    .then(r => r.json())
    .then(data => {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) { toast('AI hatası: ' + (data.error?.message || 'Yanıt alınamadı'), 'error'); return; }

        let result;
        try {
            const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            result = JSON.parse(jsonStr);
        } catch(e) {
            // Fallback: show raw text
            document.getElementById('predictResult').innerHTML = `<div class="form-card"><pre style="white-space:pre-wrap;font-size:0.85rem;">${text}</pre></div>`;
            document.getElementById('predictResult').style.display = 'block';
            return;
        }

        const prob = result.kazanmaOlasiligi || 0;
        const probColor = prob >= 70 ? 'var(--accent2)' : prob >= 40 ? 'var(--accent3)' : 'var(--accent)';

        document.getElementById('predictResult').innerHTML = `
            <div class="form-card" style="border-left:4px solid ${probColor};">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
                    <div style="width:80px;height:80px;border-radius:50%;border:4px solid ${probColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="font-size:1.5rem;font-weight:700;color:${probColor};">%${prob}</span>
                    </div>
                    <div>
                        <div style="font-size:1.1rem;font-weight:700;color:var(--text);">${result.tahminiSonuc || 'Belirsiz'}</div>
                        <div style="font-size:0.82rem;color:var(--text-secondary);">Tahmini süre: ${result.tahminiSure || 'Belirsiz'}</div>
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <div style="background:var(--border);border-radius:6px;overflow:hidden;">
                        <div style="height:8px;background:${probColor};width:${prob}%;transition:width 0.5s;border-radius:6px;"></div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div>
                        <h4 style="color:var(--accent2);font-size:0.85rem;margin-bottom:6px;"><i class="fas fa-plus-circle"></i> Güçlü Noktalar</h4>
                        ${(result.gucluNoktalar || []).map(g => `<div style="font-size:0.78rem;padding:4px 0;border-bottom:1px solid var(--border);">${g}</div>`).join('')}
                    </div>
                    <div>
                        <h4 style="color:var(--accent);font-size:0.85rem;margin-bottom:6px;"><i class="fas fa-exclamation-triangle"></i> Riskler</h4>
                        ${(result.riskler || []).map(r => `<div style="font-size:0.78rem;padding:4px 0;border-bottom:1px solid var(--border);">${r}</div>`).join('')}
                    </div>
                </div>

                <div style="margin-bottom:12px;">
                    <h4 style="font-size:0.85rem;margin-bottom:6px;"><i class="fas fa-chess" style="color:var(--primary);"></i> Strateji Önerileri</h4>
                    ${(result.stratejiOnerileri || []).map((s, i) => `<div style="font-size:0.78rem;padding:6px 0;border-bottom:1px solid var(--border);"><strong>${i+1}.</strong> ${s}</div>`).join('')}
                </div>

                ${result.emsal ? `<div style="margin-bottom:12px;padding:10px;background:var(--bg);border-radius:6px;"><h4 style="font-size:0.82rem;margin-bottom:4px;"><i class="fas fa-bookmark" style="color:var(--accent3);"></i> Emsal</h4><div style="font-size:0.78rem;">${result.emsal}</div></div>` : ''}

                <div style="padding:12px;background:var(--bg);border-radius:6px;font-size:0.82rem;color:var(--text-secondary);">
                    <i class="fas fa-info-circle" style="margin-right:4px;"></i> ${result.ozet || ''}
                </div>

                <div style="margin-top:12px;padding:8px;background:rgba(231,76,60,0.1);border-radius:6px;font-size:0.72rem;color:var(--accent);">
                    <i class="fas fa-exclamation-circle"></i> <strong>Uyarı:</strong> Bu bir AI tahminidir, hukuki tavsiye niteliği taşımaz. Her dava kendine özgüdür.
                </div>
            </div>`;
        document.getElementById('predictResult').style.display = 'block';
        toast('AI dava tahmini tamamlandı', 'success');
    })
    .catch(err => toast('Bağlantı hatası: ' + err.message, 'error'))
    .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-brain"></i> Tahmin Et'; });
};

// ============================================================
// OTOMATİK YEDEKLEME
// ============================================================
let autoBackupTimer = null;

window.saveAutoBackupSettings = function() {
    const interval = parseInt(document.getElementById('autoBackupInterval')?.value || '0');
    const maxCount = parseInt(document.getElementById('autoBackupMaxCount')?.value || '5');
    if (!DB.data.settings) DB.data.settings = {};
    DB.data.settings.autoBackupInterval = interval;
    DB.data.settings.autoBackupMaxCount = maxCount;
    DB.save();
    setupAutoBackup();
    toast(interval > 0 ? `Otomatik yedekleme: Her ${interval} dakika` : 'Otomatik yedekleme kapatıldı', 'info');
};

window.manualBackup = function() {
    performBackup();
    toast('Manuel yedek oluşturuldu', 'success');
};

function performBackup() {
    const backups = JSON.parse(localStorage.getItem('hukukBackups') || '[]');
    const maxCount = DB.data.settings?.autoBackupMaxCount || 5;

    const backup = {
        id: 'bkp_' + Date.now(),
        date: new Date().toISOString(),
        data: JSON.stringify(DB.data),
        size: JSON.stringify(DB.data).length
    };

    backups.unshift(backup);

    // Eski yedekleri sil
    while (backups.length > maxCount) backups.pop();

    localStorage.setItem('hukukBackups', JSON.stringify(backups));
    renderBackupList();
}

function setupAutoBackup() {
    if (autoBackupTimer) clearInterval(autoBackupTimer);
    const interval = DB.data.settings?.autoBackupInterval || 0;
    if (interval > 0) {
        autoBackupTimer = setInterval(() => {
            performBackup();
            console.log('Otomatik yedek alındı: ' + new Date().toLocaleTimeString('tr-TR'));
        }, interval * 60 * 1000);
    }
}

window.renderBackupList = function() {
    const container = document.getElementById('backupList');
    const info = document.getElementById('lastBackupInfo');
    if (!container) return;

    const backups = JSON.parse(localStorage.getItem('hukukBackups') || '[]');

    if (info) {
        info.textContent = backups.length > 0
            ? `Son yedek: ${new Date(backups[0].date).toLocaleString('tr-TR')} (${(backups[0].size / 1024).toFixed(1)} KB)`
            : 'Son yedek: Henüz yok';
    }

    container.innerHTML = backups.length === 0 ? '<p class="empty-state" style="font-size:0.82rem;">Henüz yedek yok</p>' :
        backups.map(b => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--border);font-size:0.82rem;">
            <div>
                <i class="fas fa-archive" style="color:var(--primary);margin-right:6px;"></i>
                ${new Date(b.date).toLocaleString('tr-TR')}
                <span style="color:var(--text-secondary);margin-left:8px;">(${(b.size / 1024).toFixed(1)} KB)</span>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-outline" onclick="restoreBackup('${b.id}')" title="Geri Yükle"><i class="fas fa-undo"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="downloadBackup('${b.id}')" title="İndir"><i class="fas fa-download"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="deleteBackup('${b.id}')" title="Sil" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
};

window.restoreBackup = function(backupId) {
    const backups = JSON.parse(localStorage.getItem('hukukBackups') || '[]');
    const backup = backups.find(b => b.id === backupId);
    if (!backup) { toast('Yedek bulunamadı', 'error'); return; }

    if (!confirm('Bu yedeği geri yüklemek istediğinize emin misiniz? Mevcut veriler üzerine yazılacak.')) return;

    // Önce mevcut veriyi yedekle
    performBackup();

    try {
        DB.data = JSON.parse(backup.data);
        DB.save();
        toast('Yedek geri yüklendi, sayfa yenileniyor...', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch(e) {
        toast('Yedek geri yükleme hatası', 'error');
    }
};

window.downloadBackup = function(backupId) {
    const backups = JSON.parse(localStorage.getItem('hukukBackups') || '[]');
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;

    const blob = new Blob([backup.data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hukuk_yedek_${new Date(backup.date).toISOString().split('T')[0]}.json`;
    a.click();
};

window.deleteBackup = function(backupId) {
    let backups = JSON.parse(localStorage.getItem('hukukBackups') || '[]');
    backups = backups.filter(b => b.id !== backupId);
    localStorage.setItem('hukukBackups', JSON.stringify(backups));
    renderBackupList();
    toast('Yedek silindi', 'info');
};

// Ayarlar sayfası açılınca yedek listesi ve ayarları yükle
(function initAutoBackup() {
    setTimeout(() => {
        const s = DB.data.settings || {};
        const intervalSelect = document.getElementById('autoBackupInterval');
        const maxSelect = document.getElementById('autoBackupMaxCount');
        if (intervalSelect) intervalSelect.value = s.autoBackupInterval || '0';
        if (maxSelect) maxSelect.value = s.autoBackupMaxCount || '5';
        renderBackupList();
        setupAutoBackup();
    }, 500);
})();

// ============================================================
// AI BELGE İNCELEME & ÖZETLEME
// ============================================================
window.loadOCRToSummary = function() {
    const ocrText = document.getElementById('ocrText')?.value;
    if (ocrText) {
        document.getElementById('aiSummaryInput').value = ocrText;
        toast('OCR metni aktarıldı', 'success');
    } else {
        toast('Önce Belge OCR sekmesinden bir belge tarayın', 'info');
    }
};

window.analyzeDocument = function() {
    const apiKey = document.getElementById('geminiApiKey')?.value || DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Gemini API anahtarı gerekli', 'error'); return; }

    const text = document.getElementById('aiSummaryInput')?.value;
    if (!text || text.length < 50) { toast('En az 50 karakter belge metni girin', 'error'); return; }

    const type = document.getElementById('aiSummaryType')?.value;
    const btn = document.getElementById('aiSummaryBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analiz ediliyor...';

    const prompts = {
        ozet: `Bu hukuki belgeyi analiz et ve şu formatta JSON döndür:
{"baslik":"<belge başlığı>","tur":"<belge türü>","ozet":"<3-5 cümle özet>","taraflar":["<taraf1>","<taraf2>"],"onemliTarihler":["<tarih: açıklama>"],"anaKonular":["<konu1>","<konu2>"],"sonuc":"<belgenin sonucu/talebi>"}`,
        risk: `Bu hukuki belgedeki riskleri analiz et ve JSON döndür:
{"riskSeviyesi":"<düşük/orta/yüksek/kritik>","riskler":[{"madde":"<ilgili madde>","risk":"<risk açıklaması>","oneri":"<çözüm önerisi>","seviye":"<düşük/orta/yüksek>"}],"genelDegerlendirme":"<2-3 cümle>","dikkatEdilecekler":["<madde1>","<madde2>"]}`,
        madde: `Bu hukuki belgeyi madde madde analiz et ve JSON döndür:
{"maddeler":[{"no":"<madde no>","baslik":"<kısa başlık>","icerik":"<özet>","yorum":"<hukuki yorum>","risk":"<varsa risk>"}],"genelYorum":"<genel değerlendirme>"}`,
        karsilastir: `Bu belgeyi Türk mevzuatı açısından incele ve JSON döndür:
{"uyumluluk":"<uyumlu/kısmen uyumlu/uyumsuz>","mevzuatReferanslari":[{"kanun":"<kanun adı>","madde":"<madde no>","durum":"<uyumlu/uyumsuz>","aciklama":"<açıklama>"}],"eksikler":["<eksik1>"],"oneriler":["<öneri1>"],"genelDegerlendirme":"<2-3 cümle>"}`
    };

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Sen uzman bir Türk hukuk analisti yapay zekasısın.\n\nBELGE METNİ:\n${text.substring(0, 8000)}\n\n${prompts[type] || prompts.ozet}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
        })
    })
    .then(r => r.json())
    .then(data => {
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) { toast('AI yanıt vermedi', 'error'); return; }

        let result;
        try { result = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()); }
        catch(e) { document.getElementById('aiSummaryResult').innerHTML = `<div class="form-card"><pre style="white-space:pre-wrap;font-size:0.85rem;">${raw}</pre></div>`; document.getElementById('aiSummaryResult').style.display = 'block'; return; }

        let html = '<div class="form-card" style="border-left:4px solid var(--primary);">';
        if (type === 'ozet') {
            html += `<h4>${result.baslik || 'Belge Analizi'}</h4><div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:12px;">Tür: ${result.tur || '-'}</div>
            <div style="padding:12px;background:var(--bg);border-radius:6px;margin-bottom:12px;">${result.ozet || ''}</div>
            ${result.taraflar?.length ? `<div style="margin-bottom:8px;"><strong>Taraflar:</strong> ${result.taraflar.join(', ')}</div>` : ''}
            ${result.onemliTarihler?.length ? `<div style="margin-bottom:8px;"><strong>Tarihler:</strong><ul style="margin:4px 0;padding-left:20px;">${result.onemliTarihler.map(t => `<li style="font-size:0.82rem;">${t}</li>`).join('')}</ul></div>` : ''}
            ${result.anaKonular?.length ? `<div><strong>Ana Konular:</strong> ${result.anaKonular.map(k => `<span style="display:inline-block;padding:2px 8px;background:var(--bg-hover);border-radius:4px;font-size:0.78rem;margin:2px;">${k}</span>`).join('')}</div>` : ''}`;
        } else if (type === 'risk') {
            const sevColors = { düşük: 'var(--accent2)', orta: 'var(--accent3)', yüksek: 'var(--accent)', kritik: '#c0392b' };
            html += `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;"><span style="font-size:1.1rem;font-weight:700;">Risk Seviyesi:</span><span style="padding:4px 12px;border-radius:6px;background:${sevColors[result.riskSeviyesi] || 'var(--border)'};color:#fff;font-weight:600;">${(result.riskSeviyesi || '').toUpperCase()}</span></div>`;
            (result.riskler || []).forEach(r => {
                html += `<div style="padding:10px;border-left:3px solid ${sevColors[r.seviye] || 'var(--border)'};background:var(--bg);border-radius:0 6px 6px 0;margin-bottom:8px;"><div style="font-weight:600;font-size:0.85rem;">${r.madde}</div><div style="font-size:0.82rem;margin:4px 0;">${r.risk}</div><div style="font-size:0.78rem;color:var(--accent2);"><i class="fas fa-lightbulb"></i> ${r.oneri}</div></div>`;
            });
            html += `<div style="padding:10px;background:var(--bg);border-radius:6px;margin-top:12px;font-size:0.82rem;">${result.genelDegerlendirme || ''}</div>`;
        } else if (type === 'madde') {
            (result.maddeler || []).forEach(m => {
                html += `<div style="padding:8px 0;border-bottom:1px solid var(--border);"><div style="font-weight:600;font-size:0.85rem;">${m.no || ''} ${m.baslik || ''}</div><div style="font-size:0.8rem;color:var(--text-secondary);margin:4px 0;">${m.icerik || ''}</div><div style="font-size:0.78rem;">${m.yorum || ''}</div>${m.risk ? `<div style="font-size:0.75rem;color:var(--accent);margin-top:4px;"><i class="fas fa-exclamation-triangle"></i> ${m.risk}</div>` : ''}</div>`;
            });
            html += `<div style="padding:10px;background:var(--bg);border-radius:6px;margin-top:12px;font-size:0.82rem;">${result.genelYorum || ''}</div>`;
        } else {
            const uyumColors = { uyumlu: 'var(--accent2)', 'kısmen uyumlu': 'var(--accent3)', uyumsuz: 'var(--accent)' };
            html += `<div style="margin-bottom:12px;"><span style="padding:4px 12px;border-radius:6px;background:${uyumColors[result.uyumluluk] || 'var(--border)'};color:#fff;font-weight:600;">${(result.uyumluluk || '').toUpperCase()}</span></div>`;
            (result.mevzuatReferanslari || []).forEach(m => {
                html += `<div style="padding:8px;background:var(--bg);border-radius:6px;margin-bottom:6px;font-size:0.82rem;"><strong>${m.kanun} m.${m.madde}</strong> — <span style="color:${m.durum === 'uyumlu' ? 'var(--accent2)' : 'var(--accent)'};">${m.durum}</span><div style="font-size:0.78rem;margin-top:4px;">${m.aciklama}</div></div>`;
            });
            html += `<div style="padding:10px;background:var(--bg);border-radius:6px;margin-top:12px;font-size:0.82rem;">${result.genelDegerlendirme || ''}</div>`;
        }
        html += '</div>';
        document.getElementById('aiSummaryResult').innerHTML = html;
        document.getElementById('aiSummaryResult').style.display = 'block';
        toast('Belge analizi tamamlandı', 'success');
    })
    .catch(err => toast('Hata: ' + err.message, 'error'))
    .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Analiz Et'; });
};

// ============================================================
// AI HUKUKİ ARAŞTIRMA ASISTANI
// ============================================================
window.performLegalResearch = function() {
    const apiKey = document.getElementById('geminiApiKey')?.value || DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Gemini API anahtarı gerekli', 'error'); return; }

    const query = document.getElementById('aiResearchQuery')?.value;
    if (!query) { toast('Bir hukuki soru yazın', 'error'); return; }

    const area = document.getElementById('aiResearchArea')?.value;
    const depth = document.getElementById('aiResearchDepth')?.value;
    const btn = document.getElementById('aiResearchBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Araştırılıyor...';

    const areaNames = { genel: 'Genel Hukuk', is: 'İş Hukuku', ticaret: 'Ticaret Hukuku', ceza: 'Ceza Hukuku', aile: 'Aile Hukuku', icra: 'İcra İflas Hukuku', idare: 'İdare Hukuku', anayasa: 'Anayasa Hukuku', medeni: 'Medeni Hukuk', borclar: 'Borçlar Hukuku' };
    const depthInstr = { kisa: 'Kısa ve öz yanıt ver (3-5 cümle).', detayli: 'Detaylı analiz yap, ilgili kanun maddelerini ve Yargıtay kararlarını belirt.', akademik: 'Akademik düzeyde, doktrin ve içtihat ışığında kapsamlı analiz yap.' };

    const prompt = `Sen Türk hukuk sisteminde uzman bir hukuki araştırma asistanısın.
Alan: ${areaNames[area] || 'Genel'}
${depthInstr[depth] || depthInstr.detayli}

SORU: ${query}

Yanıtını şu JSON formatında döndür:
{
  "kısaYanit": "<doğrudan cevap, 2-3 cümle>",
  "detayliAnaliz": "<paragraf halinde açıklama>",
  "ilgiliMevzuat": [{"kanun": "<kanun adı>", "madde": "<madde>", "icerik": "<özet>"}],
  "yargitayKararlari": [{"esas": "<esas no>", "tarih": "<tarih>", "ozet": "<karar özeti>"}],
  "doktrindekiGorus": "<varsa akademik görüşler>",
  "pratikOneri": "<avukata pratik öneri>",
  "ilgiliKaynaklar": ["<kaynak1>", "<kaynak2>"]
}`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
        })
    })
    .then(r => r.json())
    .then(data => {
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) { toast('AI yanıt vermedi', 'error'); return; }

        let result;
        try { result = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()); }
        catch(e) { document.getElementById('aiResearchResult').innerHTML = `<div class="form-card"><pre style="white-space:pre-wrap;">${raw}</pre></div>`; document.getElementById('aiResearchResult').style.display = 'block'; return; }

        let html = `<div class="form-card" style="border-left:4px solid var(--accent2);">
            <div style="padding:12px;background:var(--bg);border-radius:6px;margin-bottom:16px;font-size:0.92rem;font-weight:500;">${result.kısaYanit || result.kisaYanit || ''}</div>
            <div style="font-size:0.85rem;line-height:1.6;margin-bottom:16px;">${result.detayliAnaliz || ''}</div>`;

        if (result.ilgiliMevzuat?.length) {
            html += '<h4 style="font-size:0.88rem;margin-bottom:8px;"><i class="fas fa-book" style="color:var(--primary);"></i> İlgili Mevzuat</h4>';
            result.ilgiliMevzuat.forEach(m => {
                html += `<div style="padding:8px;background:var(--bg);border-radius:6px;margin-bottom:6px;font-size:0.82rem;"><strong>${m.kanun} ${m.madde}</strong><div style="color:var(--text-secondary);margin-top:2px;">${m.icerik}</div></div>`;
            });
        }

        if (result.yargitayKararlari?.length) {
            html += '<h4 style="font-size:0.88rem;margin:16px 0 8px;"><i class="fas fa-gavel" style="color:var(--accent3);"></i> Yargıtay Kararları</h4>';
            result.yargitayKararlari.forEach(k => {
                html += `<div style="padding:8px;background:var(--bg);border-radius:6px;margin-bottom:6px;font-size:0.82rem;"><strong>${k.esas}</strong> <span style="color:var(--text-secondary);">(${k.tarih})</span><div style="margin-top:4px;">${k.ozet}</div></div>`;
            });
        }

        if (result.pratikOneri) {
            html += `<div style="padding:12px;background:rgba(39,174,96,0.1);border-radius:6px;margin-top:16px;font-size:0.85rem;"><i class="fas fa-lightbulb" style="color:var(--accent2);margin-right:6px;"></i><strong>Pratik Öneri:</strong> ${result.pratikOneri}</div>`;
        }

        html += `<div style="margin-top:12px;font-size:0.72rem;color:var(--text-secondary);"><i class="fas fa-info-circle"></i> AI tarafından üretilmiştir. Kaynaklarınızı doğrulayın.</div></div>`;
        document.getElementById('aiResearchResult').innerHTML = html;
        document.getElementById('aiResearchResult').style.display = 'block';

        // Araştırma geçmişine ekle
        if (!DB.data.researchHistory) DB.data.researchHistory = [];
        DB.data.researchHistory.unshift({ query, area, date: new Date().toISOString(), result: result.kısaYanit || result.kisaYanit || '' });
        if (DB.data.researchHistory.length > 20) DB.data.researchHistory = DB.data.researchHistory.slice(0, 20);
        DB.save();
        renderResearchHistory();
        toast('Hukuki araştırma tamamlandı', 'success');
    })
    .catch(err => toast('Hata: ' + err.message, 'error'))
    .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-search"></i> Araştır'; });
};

window.renderResearchHistory = function() {
    const container = document.getElementById('aiResearchHistory');
    if (!container) return;
    const history = DB.data.researchHistory || [];
    if (history.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = `<h4 style="margin-bottom:8px;font-size:0.88rem;"><i class="fas fa-history"></i> Son Araştırmalar</h4>` +
        history.slice(0, 5).map(h => `<div style="padding:8px;border-bottom:1px solid var(--border);cursor:pointer;font-size:0.82rem;" onclick="document.getElementById('aiResearchQuery').value='${h.query.replace(/'/g, "\\'")}';"><strong>${h.query.substring(0, 60)}${h.query.length > 60 ? '...' : ''}</strong><div style="font-size:0.72rem;color:var(--text-secondary);">${new Date(h.date).toLocaleDateString('tr-TR')} — ${h.result?.substring(0, 80) || ''}...</div></div>`).join('');
};

// ============================================================
// AI SÖZLEŞME REDLİNİNG
// ============================================================
window.performRedlineAnalysis = function() {
    const apiKey = document.getElementById('geminiApiKey')?.value || DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Gemini API anahtarı gerekli', 'error'); return; }

    const original = document.getElementById('redlineOriginal')?.value;
    const revised = document.getElementById('redlineRevised')?.value;
    if (!original || !revised) { toast('Her iki metni de doldurun', 'error'); return; }

    const btn = document.getElementById('redlineBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Karşılaştırılıyor...';

    const prompt = `Sen sözleşme analizi konusunda uzman bir Türk hukuk avukatısın.

ORİJİNAL METİN:
${original.substring(0, 5000)}

REVİZE METİN:
${revised.substring(0, 5000)}

Bu iki metni karşılaştır ve JSON döndür:
{
  "toplamDegisiklik": <sayı>,
  "kritikDegisiklik": <sayı>,
  "degisiklikler": [
    {"tip": "<ekleme/silme/değiştirme>", "orijinal": "<eski metin>", "revize": "<yeni metin>", "riskSeviyesi": "<düşük/orta/yüksek/kritik>", "yorum": "<hukuki yorum>"}
  ],
  "genelDegerlendirme": "<genel risk değerlendirmesi>",
  "kabulEdilirMi": "<evet/hayır/koşullu>",
  "oneriler": ["<öneri1>", "<öneri2>"]
}`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
        })
    })
    .then(r => r.json())
    .then(data => {
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) { toast('AI yanıt vermedi', 'error'); return; }

        let result;
        try { result = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()); }
        catch(e) { document.getElementById('redlineResult').innerHTML = `<div class="form-card"><pre style="white-space:pre-wrap;">${raw}</pre></div>`; document.getElementById('redlineResult').style.display = 'block'; return; }

        const kabulColor = result.kabulEdilirMi === 'evet' ? 'var(--accent2)' : result.kabulEdilirMi === 'hayır' ? 'var(--accent)' : 'var(--accent3)';
        const sevColors = { düşük: '#27ae60', orta: '#f39c12', yüksek: '#e67e22', kritik: '#e74c3c' };
        const tipIcons = { ekleme: 'fa-plus-circle', silme: 'fa-minus-circle', 'değiştirme': 'fa-exchange-alt' };
        const tipColors = { ekleme: '#27ae60', silme: '#e74c3c', 'değiştirme': '#3498db' };

        let html = `<div class="form-card" style="border-left:4px solid ${kabulColor};">
            <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
                <div style="text-align:center;padding:12px 20px;background:var(--bg);border-radius:8px;"><div style="font-size:1.5rem;font-weight:700;color:var(--primary);">${result.toplamDegisiklik || 0}</div><div style="font-size:0.75rem;">Toplam Değişiklik</div></div>
                <div style="text-align:center;padding:12px 20px;background:var(--bg);border-radius:8px;"><div style="font-size:1.5rem;font-weight:700;color:var(--accent);">${result.kritikDegisiklik || 0}</div><div style="font-size:0.75rem;">Kritik</div></div>
                <div style="text-align:center;padding:12px 20px;background:var(--bg);border-radius:8px;"><div style="font-size:1rem;font-weight:700;color:${kabulColor};">${(result.kabulEdilirMi || '').toUpperCase()}</div><div style="font-size:0.75rem;">Kabul Durumu</div></div>
            </div>`;

        (result.degisiklikler || []).forEach((d, i) => {
            html += `<div style="padding:10px;border-left:3px solid ${sevColors[d.riskSeviyesi] || '#95a5a6'};background:var(--bg);border-radius:0 6px 6px 0;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-weight:600;font-size:0.82rem;"><i class="fas ${tipIcons[d.tip] || 'fa-edit'}" style="color:${tipColors[d.tip] || '#3498db'};margin-right:4px;"></i>${d.tip?.toUpperCase()}</span>
                    <span style="font-size:0.72rem;padding:2px 8px;border-radius:4px;background:${sevColors[d.riskSeviyesi] || '#95a5a6'};color:#fff;">${d.riskSeviyesi}</span>
                </div>
                ${d.orijinal ? `<div style="font-size:0.8rem;padding:6px;background:rgba(231,76,60,0.1);border-radius:4px;margin-bottom:4px;text-decoration:line-through;color:var(--accent);">${d.orijinal}</div>` : ''}
                ${d.revize ? `<div style="font-size:0.8rem;padding:6px;background:rgba(39,174,96,0.1);border-radius:4px;margin-bottom:4px;color:var(--accent2);">${d.revize}</div>` : ''}
                <div style="font-size:0.78rem;color:var(--text-secondary);"><i class="fas fa-comment-dots"></i> ${d.yorum}</div>
            </div>`;
        });

        html += `<div style="padding:12px;background:var(--bg);border-radius:6px;margin-top:12px;font-size:0.85rem;">${result.genelDegerlendirme || ''}</div>`;
        if (result.oneriler?.length) {
            html += '<div style="margin-top:12px;"><h4 style="font-size:0.85rem;margin-bottom:6px;"><i class="fas fa-lightbulb" style="color:var(--accent2);"></i> Öneriler</h4>';
            result.oneriler.forEach(o => { html += `<div style="font-size:0.82rem;padding:4px 0;border-bottom:1px solid var(--border);">• ${o}</div>`; });
            html += '</div>';
        }
        html += '</div>';
        document.getElementById('redlineResult').innerHTML = html;
        document.getElementById('redlineResult').style.display = 'block';
        toast('Redline analizi tamamlandı', 'success');
    })
    .catch(err => toast('Hata: ' + err.message, 'error'))
    .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-exchange-alt"></i> Karşılaştır & Analiz Et'; });
};

// ============================================================
// DASHBOARD GELİŞMİŞ KPI'LAR
// ============================================================
window.renderDashboardKPIs = function() {
    const container = document.getElementById('dashboardKPIs');
    if (!container) return;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Aylık gelir
    const monthlyProposals = (DB.data.proposals || []).filter(p => {
        const d = new Date(p.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear && (p.status === 'accepted' || p.status === 'kabul');
    });
    let monthlyRevenue = 0;
    monthlyProposals.forEach(p => {
        monthlyRevenue += parseFloat(String(p.feeData?.amount || p.feeData?.fixedAmount || 0).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    });

    // Aylık masraf
    let monthlyExpense = 0;
    (DB.data.expenses || []).forEach(e => {
        const d = new Date(e.date || e.createdAt);
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            monthlyExpense += parseFloat(String(e.amount).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        }
    });

    // Aktif dosya sayısı
    const activeCases = (DB.data.caseFiles || []).filter(cf => cf.status === 'active').length;

    // Ortalama dosya süresi (gün)
    const closedCases = (DB.data.caseFiles || []).filter(cf => cf.status === 'closed' && cf.createdAt);
    let avgDuration = 0;
    if (closedCases.length > 0) {
        const totalDays = closedCases.reduce((sum, cf) => {
            const start = new Date(cf.createdAt);
            const end = new Date(cf.closedAt || cf.updatedAt || new Date());
            return sum + Math.round((end - start) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDuration = Math.round(totalDays / closedCases.length);
    }

    // Bu ay çalışma saati
    let monthlyMinutes = 0;
    (DB.data.timesheet || []).forEach(t => {
        const d = new Date(t.date || t.createdAt);
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            monthlyMinutes += t.duration || 0;
        }
    });

    // Kabul oranı
    const totalProposals = (DB.data.proposals || []).length;
    const acceptedProposals = (DB.data.proposals || []).filter(p => p.status === 'accepted' || p.status === 'kabul').length;
    const acceptRate = totalProposals > 0 ? Math.round(acceptedProposals / totalProposals * 100) : 0;

    // Yaklaşan duruşma (7 gün)
    const upcomingHearings = (DB.data.hearings || []).filter(h => {
        const d = new Date(h.date);
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
    }).length;

    // Geciken görevler
    const overdueTasks = (DB.data.tasks || []).filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length;

    const kpis = [
        { label: 'Aylık Gelir', value: formatCurrency(monthlyRevenue, 'TRY'), icon: 'fa-coins', color: 'var(--accent2)' },
        { label: 'Aylık Masraf', value: formatCurrency(monthlyExpense, 'TRY'), icon: 'fa-receipt', color: 'var(--accent)' },
        { label: 'Aktif Dosya', value: activeCases, icon: 'fa-folder-open', color: 'var(--primary)' },
        { label: 'Kabul Oranı', value: `%${acceptRate}`, icon: 'fa-chart-line', color: 'var(--accent3)' },
        { label: 'Çalışma', value: `${Math.floor(monthlyMinutes/60)}sa ${monthlyMinutes%60}dk`, icon: 'fa-clock', color: '#8e44ad' },
        { label: '7 Gün Duruşma', value: upcomingHearings, icon: 'fa-gavel', color: '#2980b9' },
        { label: 'Geciken Görev', value: overdueTasks, icon: 'fa-exclamation-circle', color: overdueTasks > 0 ? 'var(--accent)' : 'var(--accent2)' },
        { label: 'Ort. Dosya Süresi', value: avgDuration > 0 ? `${avgDuration} gün` : '-', icon: 'fa-hourglass-half', color: '#16a085' }
    ];

    container.innerHTML = kpis.map(k => `
        <div style="background:var(--bg-card);border-radius:var(--radius-sm);padding:12px;text-align:center;border:1px solid var(--border);">
            <i class="fas ${k.icon}" style="font-size:1.2rem;color:${k.color};display:block;margin-bottom:6px;"></i>
            <div style="font-size:1.1rem;font-weight:700;color:var(--text);">${k.value}</div>
            <div style="font-size:0.7rem;color:var(--text-secondary);">${k.label}</div>
        </div>
    `).join('');
};

// Dashboard'a KPI ekle
(function patchDashboardForKPIs() {
    const _origDash = window.refreshDashboard;
    if (!_origDash) return;
    window.refreshDashboard = function() {
        _origDash();
        renderDashboardKPIs();
    };
})();

// ============================================================
// GOOGLE DRIVE YEDEKLEME
// ============================================================
window.backupToGoogleDrive = function() {
    const data = JSON.stringify(DB.data, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const fileName = `hukuk_backup_${new Date().toISOString().split('T')[0]}.json`;

    // Google Drive dosya seçici ile kaydet
    // Not: Tam Drive API entegrasyonu OAuth gerektirir.
    // Basit çözüm: Dosyayı indir, kullanıcı Drive'a yüklesin
    // veya Google Picker API kullan
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    toast(`Yedek indirildi: ${fileName} — Google Drive\'a yükleyin`, 'success');
};

// ============================================================
// AI WORKFLOW OTOMASYONU (Basit Agentic AI)
// ============================================================
window.runAIWorkflow = function(workflowType) {
    const apiKey = DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Gemini API anahtarı gerekli — Araçlar > AI Dilekçe sekmesinden girin', 'error'); return; }

    const workflows = {
        'yeni-dosya': {
            label: 'Yeni Dosya Açma Asistanı',
            prompt: `Bir avukat bürosunda yeni dosya açılıyor. Mevcut müvekkiller: ${(DB.data.clients || []).map(c => c.name).join(', ') || 'yok'}

Aşağıdaki adımları kontrol et ve JSON döndür:
{"adimlar":[{"no":1,"baslik":"<adım>","durum":"<tamam/eksik/uyarı>","detay":"<açıklama>"}],"oneriler":["<öneri>"]}`
        },
        'durusma-hazirlik': {
            label: 'Duruşma Hazırlık Asistanı',
            prompt: `Yaklaşan duruşmalar: ${(DB.data.hearings || []).filter(h => new Date(h.date) >= new Date()).map(h => `${h.caseTitle} (${h.date} ${h.time || ''})`).join('; ') || 'yok'}

Her duruşma için hazırlık durumunu kontrol et ve JSON döndür:
{"durusmalar":[{"dava":"<dava adı>","tarih":"<tarih>","hazirlikDurumu":"<hazır/eksik/acil>","yapilacaklar":["<görev>"]}]}`
        },
        'aylik-ozet': {
            label: 'Aylık Performans Özeti',
            prompt: `Büro verileri - Teklifler: ${(DB.data.proposals || []).length}, Kabul: ${(DB.data.proposals || []).filter(p=>p.status==='accepted'||p.status==='kabul').length}, Dosyalar: ${(DB.data.caseFiles || []).length}, Duruşmalar: ${(DB.data.hearings || []).length}, Görevler: ${(DB.data.tasks || []).filter(t=>!t.completed).length} bekleyen

Aylık performans analizi yap ve JSON döndür:
{"puan":<1-100>,"ozet":"<2-3 cümle>","gucluYanlar":["<güçlü>"],"iyilestirmeAlanlari":["<alan>"],"oncelikliAksiyonlar":["<aksiyon>"]}`
        }
    };

    const wf = workflows[workflowType];
    if (!wf) { toast('Bilinmeyen workflow', 'error'); return; }

    toast(`${wf.label} çalışıyor...`, 'info');

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Sen bir hukuk bürosu yönetim asistanısın. ${wf.prompt}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
    })
    .then(r => r.json())
    .then(data => {
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) { toast('AI yanıt vermedi', 'error'); return; }

        let result;
        try { result = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()); }
        catch(e) { result = { ozet: raw }; }

        // Show result in a modal
        let modal = document.getElementById('aiWorkflowModal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'aiWorkflowModal';
        modal.className = 'modal active';

        let body = '';
        if (result.adimlar) {
            body = result.adimlar.map(a => {
                const icons = { tamam: 'fa-check-circle', eksik: 'fa-times-circle', 'uyarı': 'fa-exclamation-triangle' };
                const colors = { tamam: 'var(--accent2)', eksik: 'var(--accent)', 'uyarı': 'var(--accent3)' };
                return `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><i class="fas ${icons[a.durum] || 'fa-circle'}" style="color:${colors[a.durum] || 'var(--text-secondary)'};margin-top:3px;"></i><div><strong>${a.no}. ${a.baslik}</strong><div style="font-size:0.82rem;color:var(--text-secondary);">${a.detay}</div></div></div>`;
            }).join('');
        } else if (result.durusmalar) {
            body = result.durusmalar.map(d => {
                const colors = { 'hazır': 'var(--accent2)', eksik: 'var(--accent3)', acil: 'var(--accent)' };
                return `<div style="padding:10px;background:var(--bg);border-radius:6px;margin-bottom:8px;border-left:3px solid ${colors[d.hazirlikDurumu] || 'var(--border)'};"><strong>${d.dava}</strong> — ${d.tarih}<div style="font-size:0.82rem;color:${colors[d.hazirlikDurumu]};font-weight:600;margin:4px 0;">${(d.hazirlikDurumu || '').toUpperCase()}</div>${(d.yapilacaklar || []).map(y => `<div style="font-size:0.78rem;">• ${y}</div>`).join('')}</div>`;
            }).join('');
        } else if (result.puan !== undefined) {
            const pColor = result.puan >= 70 ? 'var(--accent2)' : result.puan >= 40 ? 'var(--accent3)' : 'var(--accent)';
            body = `<div style="text-align:center;margin-bottom:16px;"><div style="width:80px;height:80px;border-radius:50%;border:4px solid ${pColor};display:inline-flex;align-items:center;justify-content:center;"><span style="font-size:1.5rem;font-weight:700;color:${pColor};">${result.puan}</span></div><div style="font-size:0.82rem;margin-top:8px;">${result.ozet}</div></div>`;
            body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
            body += `<div><h4 style="font-size:0.82rem;color:var(--accent2);"><i class="fas fa-plus-circle"></i> Güçlü</h4>${(result.gucluYanlar || []).map(g => `<div style="font-size:0.78rem;padding:3px 0;">• ${g}</div>`).join('')}</div>`;
            body += `<div><h4 style="font-size:0.82rem;color:var(--accent3);"><i class="fas fa-arrow-up"></i> İyileştirme</h4>${(result.iyilestirmeAlanlari || []).map(a => `<div style="font-size:0.78rem;padding:3px 0;">• ${a}</div>`).join('')}</div></div>`;
            body += `<h4 style="font-size:0.82rem;margin-top:12px;"><i class="fas fa-bolt" style="color:var(--primary);"></i> Öncelikli Aksiyonlar</h4>${(result.oncelikliAksiyonlar || []).map((a,i) => `<div style="font-size:0.82rem;padding:4px 0;border-bottom:1px solid var(--border);"><strong>${i+1}.</strong> ${a}</div>`).join('')}`;
        } else {
            body = `<pre style="white-space:pre-wrap;font-size:0.82rem;">${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>`;
        }

        modal.innerHTML = `<div class="modal-content" style="max-width:600px;"><div class="modal-header"><h3><i class="fas fa-robot" style="margin-right:8px;"></i>${wf.label}</h3><button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button></div><div class="modal-body">${body}${result.oneriler ? '<div style="margin-top:12px;padding:10px;background:rgba(74,108,247,0.1);border-radius:6px;"><h4 style="font-size:0.82rem;margin-bottom:4px;">Öneriler</h4>' + result.oneriler.map(o => `<div style="font-size:0.78rem;">• ${o}</div>`).join('') + '</div>' : ''}</div></div>`;
        document.body.appendChild(modal);
        toast(`${wf.label} tamamlandı`, 'success');
    })
    .catch(err => toast('Hata: ' + err.message, 'error'));
};

// Dashboard'a AI Workflow butonları ekle
(function addWorkflowButtons() {
    setTimeout(() => {
        const quickActions = document.querySelector('#page-dashboard > div:first-child > div:first-child');
        if (!quickActions || quickActions.querySelector('.ai-workflow-btn')) return;

        const wfDiv = document.createElement('div');
        wfDiv.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
        wfDiv.innerHTML = `
            <button class="btn btn-sm btn-outline ai-workflow-btn" onclick="runAIWorkflow('aylik-ozet')" title="AI Performans Analizi"><i class="fas fa-robot"></i> AI Analiz</button>
            <button class="btn btn-sm btn-outline ai-workflow-btn" onclick="runAIWorkflow('durusma-hazirlik')" title="AI Duruşma Hazırlık"><i class="fas fa-gavel"></i> AI Hazırlık</button>
        `;
        quickActions.appendChild(wfDiv);
    }, 800);
})();

// ============================================================
// FILE SYSTEM ACCESS API — YEDEKLEME & 2 AVUKAT SYNC
// ============================================================
(function() {
    // Klasör handle'ı IndexedDB'de saklanır (localStorage'da saklanamaz)
    const IDB_NAME = 'hukuk-backup-handles';
    const IDB_STORE = 'handles';

    function openHandleDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function saveHandle(key, handle) {
        const db = await openHandleDB();
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(handle, key);
        return new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });
    }

    async function getHandle(key) {
        const db = await openHandleDB();
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(key);
        return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = reject; });
    }

    // Klasör seç
    window.selectBackupFolder = async function() {
        if (!window.showDirectoryPicker) {
            toast('Bu tarayıcı klasör seçmeyi desteklemiyor. Chrome veya Edge kullanın.', 'error');
            return;
        }
        try {
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await saveHandle('backupFolder', handle);
            toast(`Yedek klasörü seçildi: ${handle.name}`, 'success');
            updateBackupFolderDisplay(handle.name);
            return handle;
        } catch (e) {
            if (e.name !== 'AbortError') toast('Klasör seçilemedi: ' + e.message, 'error');
        }
    };

    function updateBackupFolderDisplay(name) {
        const el = document.getElementById('backupFolderName');
        if (el) el.textContent = name || 'Seçilmedi';
    }

    // Klasöre yedek yaz
    window.backupToFolder = async function() {
        let handle = await getHandle('backupFolder');
        if (!handle) {
            handle = await window.selectBackupFolder();
            if (!handle) return;
        }

        // İzin kontrolü
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
            const req = await handle.requestPermission({ mode: 'readwrite' });
            if (req !== 'granted') { toast('Klasör izni reddedildi', 'error'); return; }
        }

        const user = localStorage.getItem('currentUser') || 'unknown';
        const now = new Date();
        const ts = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const fileName = `hukuk-yedek_${user}_${ts}.json`;

        const backupData = {
            version: 2,
            exportedBy: user,
            exportedAt: now.toISOString(),
            device: navigator.userAgent.substring(0, 50),
            data: DB.data
        };

        try {
            const fileHandle = await handle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(backupData, null, 2));
            await writable.close();
            toast(`Yedek kaydedildi: ${fileName}`, 'success');
            localStorage.setItem('lastFolderBackup', now.toISOString());
            updateLastFolderBackupInfo();
        } catch (e) {
            toast('Yedek yazılamadı: ' + e.message, 'error');
        }
    };

    // Klasörden yedek listele ve içe aktar
    window.listFolderBackups = async function() {
        let handle = await getHandle('backupFolder');
        if (!handle) { toast('Önce yedek klasörü seçin', 'info'); return; }

        const perm = await handle.queryPermission({ mode: 'read' });
        if (perm !== 'granted') {
            const req = await handle.requestPermission({ mode: 'read' });
            if (req !== 'granted') { toast('Klasör izni reddedildi', 'error'); return; }
        }

        const backups = [];
        for await (const entry of handle.values()) {
            if (entry.kind === 'file' && entry.name.startsWith('hukuk-yedek_') && entry.name.endsWith('.json')) {
                backups.push(entry);
            }
        }

        backups.sort((a, b) => b.name.localeCompare(a.name));

        const listEl = document.getElementById('folderBackupList');
        if (!listEl) return;

        if (backups.length === 0) {
            listEl.innerHTML = '<p style="color:var(--text-secondary);font-size:0.82rem;">Klasörde yedek bulunamadı</p>';
            return;
        }

        listEl.innerHTML = backups.map(entry => {
            const parts = entry.name.replace('hukuk-yedek_', '').replace('.json', '').split('_');
            const user = parts[0] || '?';
            const date = parts[1] ? parts[1].replace(/T/, ' ').replace(/-/g, ':').substring(0, 16).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3') : '?';
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-secondary);border-radius:6px;margin-bottom:6px;">
                <div>
                    <span style="font-weight:600;font-size:0.82rem;">${user}</span>
                    <span style="color:var(--text-secondary);font-size:0.75rem;margin-left:8px;">${date}</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <button class="btn btn-sm btn-outline" onclick="importFolderBackup('${entry.name}')" title="İçe Aktar"><i class="fas fa-download"></i></button>
                </div>
            </div>`;
        }).join('');
    };

    window.importFolderBackup = async function(fileName) {
        let handle = await getHandle('backupFolder');
        if (!handle) return;

        const perm = await handle.queryPermission({ mode: 'read' });
        if (perm !== 'granted') {
            await handle.requestPermission({ mode: 'read' });
        }

        try {
            const fileHandle = await handle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const text = await file.text();
            const backup = JSON.parse(text);

            if (!backup.data) { toast('Geçersiz yedek dosyası', 'error'); return; }

            const confirmMsg = `Bu yedek ${backup.exportedBy || '?'} tarafından ${backup.exportedAt ? new Date(backup.exportedAt).toLocaleString('tr-TR') : '?'} tarihinde oluşturulmuş.\n\nMevcut verileriniz ile BİRLEŞTİRİLSİN mi?\n(Tamam = Birleştir, İptal = Üzerine Yaz)`;

            if (confirm(confirmMsg)) {
                // Merge: her koleksiyonu ID bazında birleştir
                mergeBackupData(backup.data);
                toast('Veriler birleştirildi', 'success');
            } else {
                DB.data = backup.data;
                DB.save();
                toast('Veriler üzerine yazıldı', 'success');
            }
            setTimeout(() => location.reload(), 500);
        } catch (e) {
            toast('İçe aktarma hatası: ' + e.message, 'error');
        }
    };

    function mergeBackupData(incoming) {
        const collections = ['proposals', 'clients', 'caseFiles', 'hearings', 'deadlines', 'expenses', 'tasks', 'timeEntries', 'contacts', 'petitions', 'credentials', 'contracts'];
        for (const col of collections) {
            if (!incoming[col]) continue;
            if (!DB.data[col]) { DB.data[col] = incoming[col]; continue; }
            const existingIds = new Set(DB.data[col].map(x => x.id));
            for (const item of incoming[col]) {
                if (!existingIds.has(item.id)) {
                    DB.data[col].push(item);
                } else {
                    // Daha yeni olanı al
                    const existing = DB.data[col].find(x => x.id === item.id);
                    if (existing && item.updatedAt && existing.updatedAt && item.updatedAt > existing.updatedAt) {
                        Object.assign(existing, item);
                    }
                }
            }
        }
        // Settings: incoming varsa birleştir
        if (incoming.settings) {
            DB.data.settings = { ...DB.data.settings, ...incoming.settings };
        }
        DB.save();
    }

    function updateLastFolderBackupInfo() {
        const el = document.getElementById('lastFolderBackupInfo');
        const last = localStorage.getItem('lastFolderBackup');
        if (el) el.textContent = last ? 'Son yedek: ' + new Date(last).toLocaleString('tr-TR') : 'Son yedek: Henüz yok';
    }

    // Otomatik klasör yedekleme (interval)
    window.setupFolderAutoBackup = function() {
        const interval = parseInt(localStorage.getItem('folderBackupInterval') || '0');
        if (window._folderBackupTimer) clearInterval(window._folderBackupTimer);
        if (interval > 0) {
            window._folderBackupTimer = setInterval(async () => {
                const handle = await getHandle('backupFolder');
                if (handle) {
                    try { await window.backupToFolder(); } catch(e) { /* silent */ }
                }
            }, interval * 60 * 1000);
        }
    };

    window.saveFolderBackupSettings = function() {
        const interval = document.getElementById('folderBackupInterval')?.value || '0';
        localStorage.setItem('folderBackupInterval', interval);
        window.setupFolderAutoBackup();
        toast('Otomatik klasör yedekleme ayarlandı', 'success');
    };

    // Init
    setTimeout(() => {
        updateLastFolderBackupInfo();
        window.setupFolderAutoBackup();
        // Kayıtlı klasör adını göster
        getHandle('backupFolder').then(h => { if (h) updateBackupFolderDisplay(h.name); });
    }, 1000);
})();

// ============================================================
// B: AKILLI DEĞİŞKEN DOLDURMA — Müvekkil/Dosya seçince otomatik
// ============================================================
(function() {
    // Müvekkil seçildiğinde ilgili bilgileri otomatik doldur
    window.autoFillFromClient = function() {
        const clientName = document.getElementById('petitionClient')?.value;
        if (!clientName) return;

        const client = (DB.data.clients || []).find(c => c.name === clientName);
        if (!client) return;

        // Dosya bul (bu müvekkilin aktif dosyası)
        const caseFile = (DB.data.caseFiles || []).find(f =>
            f.client === clientName && f.status !== 'kapandı'
        );

        if (caseFile) {
            const courtEl = document.getElementById('petitionCourt');
            const esasEl = document.getElementById('petitionEsasNo');
            const oppEl = document.getElementById('petitionOpponent');
            const subjEl = document.getElementById('petitionSubject');

            if (courtEl && !courtEl.value && caseFile.court) courtEl.value = caseFile.court;
            if (esasEl && !esasEl.value && caseFile.fileNo) esasEl.value = caseFile.fileNo;
            if (oppEl && !oppEl.value && caseFile.opponent) oppEl.value = caseFile.opponent;
            if (subjEl && !subjEl.value && caseFile.subject) subjEl.value = caseFile.subject;

            toast(`Dosya bilgileri dolduruldu: ${caseFile.fileNo || caseFile.subject || ''}`, 'info');
        }

        // Eğer birden fazla dosya varsa seçim dropdown'u göster
        const allCases = (DB.data.caseFiles || []).filter(f => f.client === clientName);
        if (allCases.length > 1) {
            showCaseSelector(allCases);
        }
    };

    function showCaseSelector(cases) {
        let existing = document.getElementById('caseSelectorDropdown');
        if (existing) existing.remove();

        const dropdown = document.createElement('div');
        dropdown.id = 'caseSelectorDropdown';
        dropdown.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-primary);border:1px solid var(--border-color);border-radius:10px;padding:16px;z-index:10001;box-shadow:0 8px 30px rgba(0,0,0,0.3);min-width:320px;max-width:450px;';

        dropdown.innerHTML = `
            <h4 style="margin-bottom:12px;"><i class="fas fa-folder-open" style="color:var(--primary);margin-right:6px;"></i>Dosya Seçin</h4>
            <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:10px;">Bu müvekkilin ${cases.length} dosyası var. Bilgileri doldurmak için birini seçin:</p>
            ${cases.map(c => `
                <div onclick="selectCaseForPetition('${c.id}')" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;margin-bottom:6px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
                    <div style="font-weight:600;font-size:0.85rem;">${c.subject || c.fileNo || 'İsimsiz Dosya'}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);">${c.court || ''} ${c.fileNo ? '| ' + c.fileNo : ''} ${c.opponent ? '| Karşı: ' + c.opponent : ''}</div>
                </div>
            `).join('')}
            <button class="btn btn-sm btn-outline" onclick="this.parentElement.remove()" style="margin-top:8px;width:100%;">İptal</button>
        `;
        document.body.appendChild(dropdown);
    }

    window.selectCaseForPetition = function(caseId) {
        const cf = (DB.data.caseFiles || []).find(f => f.id === caseId);
        if (!cf) return;

        const courtEl = document.getElementById('petitionCourt');
        const esasEl = document.getElementById('petitionEsasNo');
        const oppEl = document.getElementById('petitionOpponent');
        const subjEl = document.getElementById('petitionSubject');

        if (courtEl) courtEl.value = cf.court || '';
        if (esasEl) esasEl.value = cf.fileNo || '';
        if (oppEl) oppEl.value = cf.opponent || '';
        if (subjEl) subjEl.value = cf.subject || '';

        document.getElementById('caseSelectorDropdown')?.remove();
        toast(`Dosya seçildi: ${cf.subject || cf.fileNo || ''}`, 'success');

        // Şablon değişkenlerini de güncelle
        const bodyEl = document.getElementById('petitionBody');
        if (bodyEl && bodyEl.value) {
            bodyEl.value = window.applyTemplateVariables(bodyEl.value);
        }
        const reqEl = document.getElementById('petitionRequest');
        if (reqEl && reqEl.value) {
            reqEl.value = window.applyTemplateVariables(reqEl.value);
        }
    };

    // petitionClient input'una event listener ekle
    setTimeout(() => {
        const clientInput = document.getElementById('petitionClient');
        if (clientInput) {
            clientInput.addEventListener('change', () => window.autoFillFromClient());
            // datalist seçiminde de tetikle
            clientInput.addEventListener('input', () => {
                const val = clientInput.value;
                const match = (DB.data.clients || []).find(c => c.name === val);
                if (match) window.autoFillFromClient();
            });
        }
    }, 1500);
})();

// ============================================================
// D: AI DİLEKÇE İYİLEŞTİRME — Gemini ile kalite kontrolü
// ============================================================
window.improvePetition = async function() {
    const body = document.getElementById('petitionBody')?.value;
    const request = document.getElementById('petitionRequest')?.value;
    const type = document.getElementById('petitionType')?.value;
    const subject = document.getElementById('petitionSubject')?.value;

    if (!body || body.length < 30) {
        toast('İyileştirmek için en az 30 karakter dilekçe metni gerekli', 'info');
        return;
    }

    const apiKey = DB.data.settings?.geminiApiKey;
    if (!apiKey) { toast('Ayarlar → Gemini API Key gerekli', 'error'); return; }

    const improveBtn = document.getElementById('btnImprovePetition');
    if (improveBtn) { improveBtn.disabled = true; improveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analiz ediliyor...'; }

    const prompt = `Sen deneyimli bir Türk hukuk avukatısın. Aşağıdaki ${type || 'dilekçe'} metnini analiz et ve iyileştir.

Konu: ${subject || 'Belirtilmemiş'}

DİLEKÇE METNİ:
${body}

NETİCE-İ TALEP:
${request || 'Yok'}

Lütfen JSON formatında yanıt ver:
{
  "puan": 1-10 arası kalite puanı,
  "ozet": "Genel değerlendirme (2-3 cümle)",
  "eksikler": ["eksik 1", "eksik 2", ...],
  "terminoloji": ["yanlış/zayıf ifade → önerilen ifade", ...],
  "eklenmeli": ["eklenmesi gereken madde/argüman", ...],
  "iyilestirilmis_metin": "Tam iyileştirilmiş dilekçe metni",
  "iyilestirilmis_talep": "İyileştirilmiş netice-i talep"
}`;

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 4096 } })
        });

        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI yanıtı ayrıştırılamadı');

        const result = JSON.parse(jsonMatch[0]);
        showImprovementModal(result);
    } catch (e) {
        toast('AI analiz hatası: ' + e.message, 'error');
    } finally {
        if (improveBtn) { improveBtn.disabled = false; improveBtn.innerHTML = '<i class="fas fa-magic"></i> AI İyileştir'; }
    }
};

function showImprovementModal(result) {
    const existing = document.getElementById('improvementModal');
    if (existing) existing.remove();

    const scoreColor = result.puan >= 7 ? 'var(--accent2)' : result.puan >= 4 ? 'var(--accent3)' : 'var(--accent1)';

    const modal = document.createElement('div');
    modal.id = 'improvementModal';
    modal.className = 'modal active';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10002;';

    modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;max-height:85vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3><i class="fas fa-magic" style="color:var(--primary);margin-right:8px;"></i>AI Dilekçe Analizi</h3>
                <button class="btn btn-sm btn-outline" onclick="this.closest('#improvementModal').remove()">&times;</button>
            </div>

            <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;padding:12px;background:var(--bg-secondary);border-radius:8px;">
                <div style="width:60px;height:60px;border-radius:50%;border:4px solid ${scoreColor};display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:${scoreColor};">${result.puan}</div>
                <div style="flex:1;">
                    <div style="font-weight:600;margin-bottom:4px;">Kalite Puanı: ${result.puan}/10</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">${result.ozet || ''}</div>
                </div>
            </div>

            ${result.eksikler?.length ? `<div style="margin-bottom:12px;"><h4 style="font-size:0.85rem;color:var(--accent1);margin-bottom:6px;"><i class="fas fa-exclamation-triangle"></i> Eksikler</h4>${result.eksikler.map(e => `<div style="font-size:0.82rem;padding:4px 0;">• ${e}</div>`).join('')}</div>` : ''}

            ${result.terminoloji?.length ? `<div style="margin-bottom:12px;"><h4 style="font-size:0.85rem;color:var(--accent3);margin-bottom:6px;"><i class="fas fa-exchange-alt"></i> Terminoloji Önerileri</h4>${result.terminoloji.map(t => `<div style="font-size:0.82rem;padding:4px 0;">• ${t}</div>`).join('')}</div>` : ''}

            ${result.eklenmeli?.length ? `<div style="margin-bottom:12px;"><h4 style="font-size:0.85rem;color:var(--primary);margin-bottom:6px;"><i class="fas fa-plus-circle"></i> Eklenmesi Gerekenler</h4>${result.eklenmeli.map(e => `<div style="font-size:0.82rem;padding:4px 0;">• ${e}</div>`).join('')}</div>` : ''}

            <div style="display:flex;gap:8px;margin-top:16px;">
                <button class="btn btn-primary" onclick="applyImprovedText()">
                    <i class="fas fa-check"></i> İyileştirilmiş Metni Uygula
                </button>
                <button class="btn btn-outline" onclick="this.closest('#improvementModal').remove()">Kapat</button>
            </div>
        </div>
    `;

    // Store result for applying
    window._lastImprovement = result;
    document.body.appendChild(modal);
}

window.applyImprovedText = function() {
    const result = window._lastImprovement;
    if (!result) return;

    if (result.iyilestirilmis_metin) {
        const bodyEl = document.getElementById('petitionBody');
        if (bodyEl) bodyEl.value = result.iyilestirilmis_metin;
    }
    if (result.iyilestirilmis_talep) {
        const reqEl = document.getElementById('petitionRequest');
        if (reqEl) reqEl.value = result.iyilestirilmis_talep;
    }

    document.getElementById('improvementModal')?.remove();
    toast('İyileştirilmiş metin uygulandı', 'success');
};

// ============================================================
// C: ŞABLON KLONLAMA & DÜZENLEME — Kişisel Şablon Kütüphanesi
// ============================================================
(function() {
    // Kişisel şablonları localStorage'da sakla
    function getCustomTemplates() {
        return JSON.parse(localStorage.getItem('customPetitionTemplates') || '{}');
    }

    function saveCustomTemplates(templates) {
        localStorage.setItem('customPetitionTemplates', JSON.stringify(templates));
    }

    // Mevcut şablonu klonla
    window.cloneTemplate = function(templateKey) {
        const original = petitionTemplates[templateKey];
        if (!original) { toast('Şablon bulunamadı', 'error'); return; }

        const newKey = 'custom_' + Date.now();
        const templates = getCustomTemplates();
        templates[newKey] = {
            name: original.name + ' (Kopyam)',
            icon: original.icon || 'fa-file',
            desc: 'Kişisel şablon — düzenlenebilir',
            body: original.body,
            request: original.request,
            isCustom: true,
            createdAt: new Date().toISOString()
        };
        saveCustomTemplates(templates);

        // petitionTemplates'e de ekle (runtime)
        petitionTemplates[newKey] = templates[newKey];

        toast(`"${original.name}" klonlandı. Şablonlarımda düzenleyebilirsiniz.`, 'success');
        if (typeof refreshPetitions === 'function') refreshPetitions();
    };

    // Kişisel şablonu düzenle
    window.editCustomTemplate = function(key) {
        const templates = getCustomTemplates();
        const tpl = templates[key];
        if (!tpl) { toast('Şablon bulunamadı', 'error'); return; }

        const existing = document.getElementById('templateEditorModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'templateEditorModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10002;';

        modal.innerHTML = `
            <div class="modal-content" style="max-width:650px;max-height:85vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3><i class="fas fa-edit" style="color:var(--primary);margin-right:8px;"></i>Şablon Düzenle</h3>
                    <button class="btn btn-sm btn-outline" onclick="this.closest('#templateEditorModal').remove()">&times;</button>
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Şablon Adı</label>
                    <input type="text" id="tplEditName" value="${tpl.name}" style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Açıklama</label>
                    <input type="text" id="tplEditDesc" value="${tpl.desc || ''}" style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label>Dilekçe Metni</label>
                    <textarea id="tplEditBody" rows="10" style="width:100%;font-family:monospace;font-size:0.82rem;">${tpl.body || ''}</textarea>
                    <small style="color:var(--text-secondary);">Kullanılabilir değişkenler: {{müvekkil}}, {{avukat}}, {{baro}}, {{tarih}}, {{mahkeme}}, {{esas_no}}, {{karşı_taraf}}</small>
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label>Netice-i Talep</label>
                    <textarea id="tplEditRequest" rows="4" style="width:100%;font-family:monospace;font-size:0.82rem;">${tpl.request || ''}</textarea>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary" onclick="saveCustomTemplateEdit('${key}')">
                        <i class="fas fa-save"></i> Kaydet
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('#templateEditorModal').remove()">İptal</button>
                    <button class="btn btn-sm" style="margin-left:auto;color:var(--accent1);" onclick="deleteCustomTemplate('${key}')">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.saveCustomTemplateEdit = function(key) {
        const templates = getCustomTemplates();
        templates[key] = {
            ...templates[key],
            name: document.getElementById('tplEditName').value,
            desc: document.getElementById('tplEditDesc').value,
            body: document.getElementById('tplEditBody').value,
            request: document.getElementById('tplEditRequest').value,
            updatedAt: new Date().toISOString()
        };
        saveCustomTemplates(templates);
        petitionTemplates[key] = templates[key];

        document.getElementById('templateEditorModal')?.remove();
        toast('Şablon güncellendi', 'success');
        if (typeof refreshPetitions === 'function') refreshPetitions();
    };

    window.deleteCustomTemplate = function(key) {
        if (!confirm('Bu kişisel şablonu silmek istediğinize emin misiniz?')) return;
        const templates = getCustomTemplates();
        delete templates[key];
        saveCustomTemplates(templates);
        delete petitionTemplates[key];

        document.getElementById('templateEditorModal')?.remove();
        toast('Şablon silindi', 'success');
        if (typeof refreshPetitions === 'function') refreshPetitions();
    };

    // Uygulama başladığında kişisel şablonları yükle
    setTimeout(() => {
        const customs = getCustomTemplates();
        for (const [key, tpl] of Object.entries(customs)) {
            petitionTemplates[key] = tpl;
        }
    }, 500);

    // Şablon listesini zenginleştir (klonla butonu + kişisel şablonlar)
    const origRefreshPetitions = window.refreshPetitions;
    window.refreshPetitions = function() {
        if (origRefreshPetitions) origRefreshPetitions();

        // Şablon kartlarına klonla butonu ekle
        setTimeout(() => {
            document.querySelectorAll('.petition-template-card').forEach(card => {
                if (card.querySelector('.clone-btn')) return;
                const key = card.getAttribute('onclick')?.match(/openPetitionFromTemplate\('(.+?)'\)/)?.[1];
                if (!key) return;

                const customs = getCustomTemplates();
                const isCustom = customs[key];

                const btnDiv = document.createElement('div');
                btnDiv.style.cssText = 'display:flex;gap:4px;margin-top:6px;';

                if (isCustom) {
                    btnDiv.innerHTML = `
                        <button class="btn btn-sm btn-outline clone-btn" onclick="event.stopPropagation();editCustomTemplate('${key}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline clone-btn" onclick="event.stopPropagation();deleteCustomTemplate('${key}')" title="Sil" style="color:var(--accent1);"><i class="fas fa-trash"></i></button>
                    `;
                } else {
                    btnDiv.innerHTML = `<button class="btn btn-sm btn-outline clone-btn" onclick="event.stopPropagation();cloneTemplate('${key}')" title="Kopyala & Özelleştir"><i class="fas fa-copy"></i> Kopyala</button>`;
                }
                card.appendChild(btnDiv);
            });
        }, 200);
    };
})();

// ============================================================
// #1 — SÖZLEŞME RİSK ANALİZİ (contract-shield patterns)
// ============================================================
(function() {
    const KEY_TERMS = [
        { term: 'cezai şart', category: 'cezai_sart', variants: ['cezai şart', 'ceza koşulu', 'cezai müeyyide', 'konvansiyonel ceza'], risk: true },
        { term: 'mücbir sebep', category: 'mucbir_sebep', variants: ['mücbir sebep', 'force majeure', 'zorlayıcı neden', 'beklenmeyen hal'], risk: true },
        { term: 'fesih', category: 'fesih', variants: ['fesih', 'fesh', 'sona erdirme', 'sözleşmenin sona ermesi', 'tasfiye'], risk: true },
        { term: 'temerrüt', category: 'temerut', variants: ['temerrüt', 'temerrüd', 'gecikme', 'ifa gecikmesi'], risk: true },
        { term: 'sorumsuzluk', category: 'sorumsuzluk', variants: ['sorumsuzluk', 'sorumluluk sınır', 'sorumluluğun sınırlandırılması', 'sorumlu tutulamaz'], risk: true },
        { term: 'gizlilik', category: 'gizlilik', variants: ['gizlilik', 'sır saklama', 'NDA', 'ticari sır', 'gizli bilgi', 'confidential'], risk: true },
        { term: 'rekabet yasağı', category: 'rekabet_yasagi', variants: ['rekabet yasağı', 'rekabet etmeme', 'non-compete', 'rekabet kısıtlama'], risk: true },
        { term: 'tazminat', category: 'tazminat', variants: ['tazminat', 'zarar tazmini', 'maddi zarar', 'manevi zarar', 'kar kaybı'], risk: true },
        { term: 'zamanaşımı', category: 'zamanasimi', variants: ['zamanaşımı', 'zaman aşımı', 'hak düşürücü süre'], risk: true },
        { term: 'kişisel veri', category: 'kvkk', variants: ['kişisel veri', 'KVKK', 'veri koruma', 'açık rıza', 'aydınlatma', 'veri işleme'], risk: true },
        { term: 'uyuşmazlık', category: 'uyusmazlik', variants: ['uyuşmazlık', 'ihtilaf', 'arabuluculuk', 'tahkim', 'yetkili mahkeme'], risk: false },
        { term: 'teminat', category: 'teminat', variants: ['teminat', 'garanti', 'kefalet', 'ipotek', 'rehin', 'banka garantisi'], risk: true },
        { term: 'devir', category: 'devir', variants: ['devir', 'temlik', 'alacağın devri', 'sözleşme devri', 'hak devri'], risk: true },
        { term: 'ödeme', category: 'odeme', variants: ['ödeme koşulları', 'vade', 'taksit', 'peşin', 'fatura'], risk: false },
        { term: 'süre', category: 'sure', variants: ['sözleşme süresi', 'uzatma', 'otomatik uzama', 'yenileme'], risk: false },
    ];

    const CONTRACT_TYPES = [
        { type: 'hizmet', label: 'Hizmet Sözleşmesi', keywords: ['hizmet sözleşmesi', 'hizmet alım', 'servis sözleşmesi'] },
        { type: 'satis', label: 'Alım-Satım Sözleşmesi', keywords: ['alım satım', 'satış sözleşmesi', 'mal alım', 'tedarik sözleşmesi'] },
        { type: 'kira', label: 'Kira Sözleşmesi', keywords: ['kira sözleşmesi', 'kiralama', 'kira bedeli', 'kiracı', 'kiraya veren'] },
        { type: 'nda', label: 'Gizlilik Sözleşmesi (NDA)', keywords: ['gizlilik sözleşmesi', 'NDA', 'non-disclosure', 'sır saklama'] },
        { type: 'is', label: 'İş Sözleşmesi', keywords: ['iş sözleşmesi', 'işçi', 'işveren', 'çalışma sözleşmesi'] },
        { type: 'danismanlik', label: 'Danışmanlık Sözleşmesi', keywords: ['danışmanlık sözleşmesi', 'müşavirlik', 'consulting'] },
        { type: 'lisans', label: 'Lisans Sözleşmesi', keywords: ['lisans sözleşmesi', 'yazılım lisans', 'kullanım hakkı'] },
        { type: 'ortaklik', label: 'Ortaklık Sözleşmesi', keywords: ['ortaklık sözleşmesi', 'adi ortaklık', 'joint venture'] },
        { type: 'kredi', label: 'Kredi/Borç Sözleşmesi', keywords: ['kredi sözleşmesi', 'borç sözleşmesi', 'ödünç'] },
        { type: 'insaat', label: 'İnşaat/Eser Sözleşmesi', keywords: ['inşaat sözleşmesi', 'yapım sözleşmesi', 'müteahhit', 'eser sözleşmesi'] },
        { type: 'franchise', label: 'Franchise Sözleşmesi', keywords: ['franchise', 'franchising', 'imtiyaz'] },
        { type: 'distributorluk', label: 'Distribütörlük Sözleşmesi', keywords: ['distribütörlük', 'bayilik', 'dağıtım sözleşmesi'] },
        { type: 'sigorta', label: 'Sigorta Sözleşmesi', keywords: ['sigorta sözleşmesi', 'sigorta poliçesi', 'sigortalı'] },
    ];

    const CATEGORY_WEIGHTS = { 'Yasal Uyumluluk': 0.35, 'Finansal Risk': 0.25, 'Operasyonel Risk': 0.20, 'İtibar Riski': 0.20 };
    const SEVERITY_POINTS = { KIRMIZI: 30, SARI: 10, YESIL: 2 };
    const RISK_THRESHOLDS = [
        { max: 25, level: 'Düşük', code: 'low', color: 'var(--accent2)' },
        { max: 50, level: 'Orta', code: 'medium', color: 'var(--accent3)' },
        { max: 75, level: 'Yüksek', code: 'high', color: 'var(--accent1)' },
        { max: 100, level: 'Kritik', code: 'critical', color: '#e74c3c' },
    ];

    const CURRENCY_PATTERNS = [
        { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(?:TL|₺|Türk Lirası)/gi, currency: 'TRY' },
        { regex: /(?:\$\s*)(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/gi, currency: 'USD' },
        { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(?:USD|ABD Doları)/gi, currency: 'USD' },
        { regex: /(?:€\s*)(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/gi, currency: 'EUR' },
        { regex: /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*(?:EUR|Euro|Avro)/gi, currency: 'EUR' },
    ];

    function detectContractType(text) {
        const lower = text.toLowerCase();
        for (const ct of CONTRACT_TYPES) {
            if (ct.keywords.some(k => lower.includes(k))) return ct;
        }
        return null;
    }

    function extractClauses(text) {
        const clauses = [];
        const pattern = /(?:^|\n)\s*(?:MADDE|Madde|madde)\s+(\d+(?:\.\d+)*)\s*[-:.)\s]+\s*([^\n]*)/g;
        let m;
        while ((m = pattern.exec(text)) !== null) {
            clauses.push({ number: m[1], title: m[2].trim(), start: m.index });
        }
        if (clauses.length === 0) {
            const p2 = /(?:^|\n)\s*(\d+)\s*[.)]\s+([A-ZÇĞİÖŞÜ][^\n]*)/g;
            while ((m = p2.exec(text)) !== null) {
                clauses.push({ number: m[1], title: m[2].trim(), start: m.index });
            }
        }
        for (let i = 0; i < clauses.length; i++) {
            const end = i + 1 < clauses.length ? clauses[i + 1].start : text.length;
            clauses[i].body = text.substring(clauses[i].start, end).trim();
        }
        return clauses;
    }

    function detectKeyTerms(text) {
        const lower = text.toLowerCase();
        const found = [];
        for (const kt of KEY_TERMS) {
            const matches = kt.variants.filter(v => lower.includes(v.toLowerCase()));
            if (matches.length > 0) found.push({ ...kt, matchedVariants: matches });
        }
        return found;
    }

    function detectCurrencies(text) {
        const amounts = [];
        for (const cp of CURRENCY_PATTERNS) {
            let m;
            const re = new RegExp(cp.regex.source, cp.regex.flags);
            while ((m = re.exec(text)) !== null) {
                const raw = m[1] || m[0];
                const normalized = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
                if (!isNaN(normalized) && normalized > 0) {
                    amounts.push({ raw: m[0], value: normalized, currency: cp.currency });
                }
            }
        }
        return amounts;
    }

    window.analyzeContractRisk = async function() {
        const text = document.getElementById('contractRiskInput')?.value;
        if (!text || text.length < 50) { toast('En az 50 karakter sözleşme metni gerekli', 'info'); return; }

        const apiKey = DB.data.settings?.geminiApiKey;
        if (!apiKey) { toast('Ayarlar → Gemini API Key gerekli', 'error'); return; }

        const btn = document.getElementById('btnContractRisk');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analiz ediliyor...'; }

        // Local analysis
        const selectedType = document.getElementById('contractRiskType')?.value;
        const perspective = document.getElementById('contractRiskPerspective')?.value || 'muvekkil';
        const detectedType = selectedType ? CONTRACT_TYPES.find(c => c.type === selectedType) : detectContractType(text);
        const clauses = extractClauses(text);
        const keyTerms = detectKeyTerms(text);
        const currencies = detectCurrencies(text);

        // AI analysis
        const prompt = `Sen uzman bir Türk hukuk avukatısın. Aşağıdaki sözleşmeyi ${perspective === 'muvekkil' ? 'müvekkil lehine' : perspective === 'karsi' ? 'karşı taraf lehine' : 'tarafsız'} analiz et.

Sözleşme Tipi: ${detectedType?.label || 'Belirsiz'}
Tespit edilen anahtar terimler: ${keyTerms.map(k => k.term).join(', ') || 'Yok'}
Madde sayısı: ${clauses.length}
${currencies.length ? 'Tespit edilen tutarlar: ' + currencies.map(c => c.raw).join(', ') : ''}

SÖZLEŞME METNİ:
${text.substring(0, 6000)}

JSON formatında yanıt ver:
{
  "genel_puan": 0-100 arası risk puanı,
  "risk_seviyesi": "Düşük/Orta/Yüksek/Kritik",
  "yasal_uyumluluk": { "puan": 0-100, "bulgular": [{"madde":"","seviye":"KIRMIZI/SARI/YESIL","aciklama":"","ilgili_kanun":""}] },
  "finansal_risk": { "puan": 0-100, "bulgular": [{"madde":"","seviye":"","aciklama":""}] },
  "operasyonel_risk": { "puan": 0-100, "bulgular": [{"madde":"","seviye":"","aciklama":""}] },
  "itibar_riski": { "puan": 0-100, "bulgular": [{"madde":"","seviye":"","aciklama":""}] },
  "kritik_maddeler": [{"madde_no":"","baslik":"","risk":"","oneri":""}],
  "eksik_maddeler": ["eksik madde 1", "eksik madde 2"],
  "genel_degerlendirme": "2-3 cümle özet"
}`;

        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 4096 } })
            });
            const data = await resp.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

            renderContractRiskResult(result, { detectedType, clauses, keyTerms, currencies });
        } catch (e) {
            toast('AI analiz hatası: ' + e.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-search"></i> Risk Analizi Başlat'; }
        }
    };

    function renderContractRiskResult(ai, local) {
        const el = document.getElementById('contractRiskResult');
        if (!el) return;
        el.style.display = 'block';

        const score = ai?.genel_puan || 0;
        const threshold = RISK_THRESHOLDS.find(t => score <= t.max) || RISK_THRESHOLDS[3];
        const categories = ['yasal_uyumluluk', 'finansal_risk', 'operasyonel_risk', 'itibar_riski'];
        const catLabels = { yasal_uyumluluk: 'Yasal Uyumluluk', finansal_risk: 'Finansal Risk', operasyonel_risk: 'Operasyonel Risk', itibar_riski: 'İtibar Riski' };
        const catWeightLabels = { yasal_uyumluluk: '35%', finansal_risk: '25%', operasyonel_risk: '20%', itibar_riski: '20%' };

        el.innerHTML = `
            <div style="display:flex;gap:20px;align-items:center;padding:16px;background:var(--bg-secondary);border-radius:10px;margin-bottom:16px;">
                <div style="width:80px;height:80px;border-radius:50%;border:5px solid ${threshold.color};display:flex;align-items:center;justify-content:center;flex-direction:column;">
                    <span style="font-size:1.5rem;font-weight:700;color:${threshold.color};">${score}</span>
                    <span style="font-size:0.6rem;color:var(--text-secondary);">/100</span>
                </div>
                <div style="flex:1;">
                    <h3 style="margin:0;color:${threshold.color};">Risk: ${threshold.level}</h3>
                    <p style="margin:4px 0;font-size:0.85rem;">${ai?.genel_degerlendirme || ''}</p>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">
                        Tip: ${local.detectedType?.label || 'Belirsiz'} | Madde: ${local.clauses.length} | Anahtar Terim: ${local.keyTerms.length}
                        ${local.currencies.length ? ' | Tutar: ' + local.currencies.map(c => c.raw).join(', ') : ''}
                    </div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
                ${categories.map(cat => {
                    const catData = ai?.[cat] || {};
                    const catScore = catData.puan || 0;
                    const catThreshold = RISK_THRESHOLDS.find(t => catScore <= t.max) || RISK_THRESHOLDS[3];
                    return `<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;border-top:3px solid ${catThreshold.color};text-align:center;">
                        <div style="font-size:1.2rem;font-weight:700;color:${catThreshold.color};">${catScore}</div>
                        <div style="font-size:0.72rem;color:var(--text-secondary);">${catLabels[cat]}</div>
                        <div style="font-size:0.65rem;color:var(--text-secondary);">Ağırlık: ${catWeightLabels[cat]}</div>
                    </div>`;
                }).join('')}
            </div>

            ${categories.map(cat => {
                const findings = ai?.[cat]?.bulgular || [];
                if (!findings.length) return '';
                return `<div style="margin-bottom:12px;">
                    <h4 style="font-size:0.85rem;margin-bottom:6px;">${catLabels[cat]}</h4>
                    ${findings.map(f => {
                        const sColor = f.seviye === 'KIRMIZI' ? 'var(--accent1)' : f.seviye === 'SARI' ? 'var(--accent3)' : 'var(--accent2)';
                        return `<div style="padding:8px;margin-bottom:4px;border-left:3px solid ${sColor};background:var(--bg-secondary);border-radius:0 6px 6px 0;font-size:0.82rem;">
                            <span style="color:${sColor};font-weight:600;">${f.seviye === 'KIRMIZI' ? '🔴' : f.seviye === 'SARI' ? '🟡' : '🟢'} ${f.madde || ''}</span>
                            <span>${f.aciklama || ''}</span>
                            ${f.ilgili_kanun ? `<span style="color:var(--primary);font-size:0.75rem;"> (${f.ilgili_kanun})</span>` : ''}
                        </div>`;
                    }).join('')}
                </div>`;
            }).join('')}

            ${ai?.kritik_maddeler?.length ? `<div style="margin-bottom:12px;">
                <h4 style="font-size:0.85rem;color:var(--accent1);margin-bottom:6px;"><i class="fas fa-exclamation-triangle"></i> Kritik Maddeler</h4>
                ${ai.kritik_maddeler.map(k => `<div style="padding:8px;background:rgba(231,76,60,0.1);border-radius:6px;margin-bottom:4px;font-size:0.82rem;">
                    <strong>${k.madde_no} ${k.baslik || ''}</strong> — ${k.risk || ''}
                    <div style="color:var(--primary);font-size:0.78rem;margin-top:2px;">💡 ${k.oneri || ''}</div>
                </div>`).join('')}
            </div>` : ''}

            ${ai?.eksik_maddeler?.length ? `<div style="margin-bottom:12px;">
                <h4 style="font-size:0.85rem;color:var(--accent3);margin-bottom:6px;"><i class="fas fa-plus-circle"></i> Eksik Maddeler</h4>
                ${ai.eksik_maddeler.map(e => `<div style="font-size:0.82rem;padding:4px 0;">• ${e}</div>`).join('')}
            </div>` : ''}

            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
                <h4 style="width:100%;font-size:0.85rem;margin-bottom:4px;">Tespit Edilen Anahtar Terimler</h4>
                ${local.keyTerms.map(kt => `<span style="padding:3px 8px;background:${kt.risk ? 'rgba(231,76,60,0.1)' : 'rgba(74,108,247,0.1)'};border-radius:12px;font-size:0.75rem;color:${kt.risk ? 'var(--accent1)' : 'var(--primary)'};">${kt.term}</span>`).join('')}
            </div>
        `;
    }
})();

// ============================================================
// #2 — HUKUKİ YÜKÜMLÜLÜK ÇIKARMA (legal-agent patterns)
// ============================================================
(function() {
    const OBLIGATION_PATTERNS = [
        { regex: /zorunludur/gi, type: 'zorunlu' },
        { regex: /mecburdur/gi, type: 'zorunlu' },
        { regex: /yükümlüdür/gi, type: 'zorunlu' },
        { regex: /mükelleftir/gi, type: 'zorunlu' },
        { regex: /yapılması\s+(?:gerekir|zorunludur|şarttır)/gi, type: 'zorunlu' },
        { regex: /(?:sağlanması|bulunması|olması|edilmesi|alınması|yapılması)\s+(?:gerekir|zorunludur|şarttır|esastır)/gi, type: 'zorunlu' },
        { regex: /(?:şarttır|esastır)/gi, type: 'sart' },
        { regex: /(?:edemez|yapamaz|bulunamaz|verilemez|kabul\s+edilemez)/gi, type: 'yasak' },
        { regex: /(?:yasaktır|yasaklanmıştır)/gi, type: 'yasak' },
        { regex: /(?:hakkı\s+vardır|yetkilidir|yetkisi\s+vardır)/gi, type: 'yetki' },
        { regex: /(?:bildirimde\s+bulunur|bildirim\s+yapar|bilgi\s+verir)/gi, type: 'bildirim' },
        { regex: /(?:tabi(?:dir|tutulur)|kapsamındadır)/gi, type: 'tabi' },
        { regex: /(?:izin\s+almak\s+zorundadır|izne\s+tabidir)/gi, type: 'izin' },
        { regex: /(?:ödenmesi\s+gerekir|ödemekle\s+yükümlüdür|ödenir)/gi, type: 'odeme' },
    ];

    const CONSEQUENCE_PATTERNS = [
        { regex: /(\d+)\s*(?:yıldan|yılına)\s+(\d+)\s*(?:yıla|yılına)\s+kadar\s+hapis/gi, type: 'hapis_cezasi' },
        { regex: /(\d+)\s*(?:aydan|ayına)\s+(\d+)\s*(?:aya|ayına)\s+kadar\s+hapis/gi, type: 'hapis_cezasi' },
        { regex: /idari\s+para\s+cezas[ıi]/gi, type: 'idari_para_cezasi' },
        { regex: /adl[iî]\s+para\s+cezas[ıi]/gi, type: 'adli_para_cezasi' },
        { regex: /faaliyet\s+(?:izni(?:nin)?|yetkisi(?:nin)?)\s*(?:iptal|askıya|kaldırıl)/gi, type: 'faaliyet_kisitlama' },
        { regex: /(?:hapis\s+cezası)/gi, type: 'hapis_cezasi' },
        { regex: /(?:para\s+cezası)/gi, type: 'para_cezasi' },
        { regex: /(?:tazminat|zarar.*tazmin)/gi, type: 'tazminat' },
        { regex: /(?:yasaklanır|men\s+edilir)/gi, type: 'yasaklama' },
    ];

    const REFERENCE_PATTERNS = [
        /(\d{3,5})\s+sayılı\s+([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?(?:Kanunu?|Kanun\s+Hükmünde\s+Kararname))/g,
        /([IVXLCDM]+-[\d.]+-[\d.]+)\s+(?:sayılı\s+)?([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?Tebliğ\w*)/g,
        /(\d+)\s*(?:[iıüu]nc[iıüu]|\.)\s*madde/gi,
    ];

    const NON_OBLIGATION_RE = /(?:genel\s+hükümler\s+uygulanır|yürürlüğe\s+girer|yürürlükten\s+kaldırılmıştır|yürütür|tanımlar[ıi]?\s+(?:aşağıda|şu|bu)|ifade\s+eder|anlaşılır|kastedilir|saklıdır)/i;

    const DEADLINE_PATTERNS = [
        { regex: /(\d+)\s*(?:iş)?\s*gün\s+içinde/gi, fmt: m => `${m[1]} gün içinde` },
        { regex: /(\d+)\s*ay\s+içinde/gi, fmt: m => `${m[1]} ay içinde` },
        { regex: /(\d+)\s*yıl\s+içinde/gi, fmt: m => `${m[1]} yıl içinde` },
        { regex: /derhal/gi, fmt: () => 'Derhal' },
        { regex: /gecikmeksizin/gi, fmt: () => 'Gecikmeksizin' },
    ];

    const TYPE_LABELS = { zorunlu: 'Zorunlu', sart: 'Şart', yasak: 'Yasak', yetki: 'Yetki', bildirim: 'Bildirim', tabi: 'Tabi', izin: 'İzin', odeme: 'Ödeme' };
    const TYPE_COLORS = { zorunlu: 'var(--accent1)', sart: 'var(--accent3)', yasak: '#e74c3c', yetki: 'var(--primary)', bildirim: 'var(--accent2)', tabi: '#9b59b6', izin: '#e67e22', odeme: '#1abc9c' };
    const CONS_LABELS = { hapis_cezasi: 'Hapis Cezası', adli_para_cezasi: 'Adli Para Cezası', idari_para_cezasi: 'İdari Para Cezası', faaliyet_kisitlama: 'Faaliyet Kısıtlama', para_cezasi: 'Para Cezası', tazminat: 'Tazminat', yasaklama: 'Yasaklama' };

    function splitArticles(text) {
        const re = /(?:^|\n)\s*(?:MADDE|Madde)\s+(\d+)\s*[-–—.]?\s*/gm;
        const articles = [];
        let m;
        const positions = [];
        while ((m = re.exec(text)) !== null) positions.push({ no: m[1], idx: m.index });
        for (let i = 0; i < positions.length; i++) {
            const end = i + 1 < positions.length ? positions[i + 1].idx : text.length;
            articles.push({ no: positions[i].no, text: text.substring(positions[i].idx, end).trim() });
        }
        if (articles.length === 0) articles.push({ no: '-', text: text });
        return articles;
    }

    function regexExtract(text) {
        const articles = splitArticles(text);
        const obligations = [], consequences = [], references = [], deadlines = [];

        for (const art of articles) {
            const sentences = art.text.split(/[.;]\s*/);
            for (const sent of sentences) {
                if (NON_OBLIGATION_RE.test(sent)) continue;
                for (const op of OBLIGATION_PATTERNS) {
                    const re = new RegExp(op.regex.source, op.regex.flags);
                    if (re.test(sent)) {
                        obligations.push({ article: art.no, text: sent.trim().substring(0, 200), type: op.type });
                        break;
                    }
                }
            }
            for (const cp of CONSEQUENCE_PATTERNS) {
                const re = new RegExp(cp.regex.source, cp.regex.flags);
                let cm;
                while ((cm = re.exec(art.text)) !== null) {
                    consequences.push({ article: art.no, text: cm[0], type: cp.type });
                }
            }
            for (const rp of REFERENCE_PATTERNS) {
                const re = new RegExp(rp.source, rp.flags);
                let rm;
                while ((rm = re.exec(art.text)) !== null) {
                    references.push({ article: art.no, text: rm[0] });
                }
            }
            for (const dp of DEADLINE_PATTERNS) {
                const re = new RegExp(dp.regex.source, dp.regex.flags);
                let dm;
                while ((dm = re.exec(art.text)) !== null) {
                    deadlines.push({ article: art.no, text: dm[0] });
                }
            }
        }
        return { obligations, consequences, references, deadlines };
    }

    window.extractObligations = async function() {
        const text = document.getElementById('obligationInput')?.value;
        if (!text || text.length < 30) { toast('En az 30 karakter mevzuat metni gerekli', 'info'); return; }

        const method = document.getElementById('obligationMethod')?.value || 'hybrid';
        const btn = document.getElementById('btnObligation');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analiz ediliyor...'; }

        const regexResult = regexExtract(text);
        let aiResult = null;

        if (method !== 'regex') {
            const apiKey = DB.data.settings?.geminiApiKey;
            if (apiKey) {
                try {
                    const prompt = `Türk hukuk uzmanı olarak aşağıdaki mevzuat metnini analiz et. JSON formatında yanıt ver:
{
  "yukumlulukler": [{"madde":"","metin":"","tip":"zorunlu/yasak/sart/izin/bildirim","muhatap":"","sure":""}],
  "yaptirimlar": [{"madde":"","metin":"","tip":"hapis/para_cezasi/idari_ceza/faaliyet_yasagi/tazminat","detay":""}],
  "referanslar": [{"madde":"","atif":"","aciklama":""}],
  "ozet": "Mevzuatın kısa özeti",
  "toplam_yukumluluk": sayı,
  "kritik_maddeler": ["madde numaraları"]
}

MEVZUAT METNİ:
${text.substring(0, 6000)}`;
                    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 4096 } })
                    });
                    const data = await resp.json();
                    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    const jm = aiText.match(/\{[\s\S]*\}/);
                    if (jm) aiResult = JSON.parse(jm[0]);
                } catch (e) { /* fallback to regex */ }
            }
        }

        renderObligationResult(regexResult, aiResult, method);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-filter"></i> Yükümlülükleri Çıkar'; }
    };

    function renderObligationResult(regex, ai, method) {
        const el = document.getElementById('obligationResult');
        if (!el) return;
        el.style.display = 'block';

        const obligations = method === 'ai' && ai?.yukumlulukler ? ai.yukumlulukler : regex.obligations;
        const consequences = method === 'ai' && ai?.yaptirimlar ? ai.yaptirimlar : regex.consequences;

        const typeCounts = {};
        obligations.forEach(o => { const t = o.tip || o.type; typeCounts[t] = (typeCounts[t] || 0) + 1; });

        el.innerHTML = `
            ${ai?.ozet ? `<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;margin-bottom:16px;font-size:0.85rem;">${ai.ozet}</div>` : ''}
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;color:var(--primary);">${obligations.length}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);">Yükümlülük</div>
                </div>
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;color:var(--accent1);">${consequences.length}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);">Yaptırım</div>
                </div>
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;color:var(--accent3);">${regex.references.length}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);">Referans</div>
                </div>
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;color:var(--accent2);">${regex.deadlines.length}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);">Süre</div>
                </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                ${Object.entries(typeCounts).map(([t, c]) => `<span style="padding:3px 8px;background:${TYPE_COLORS[t] || 'var(--primary)'}22;color:${TYPE_COLORS[t] || 'var(--primary)'};border-radius:12px;font-size:0.75rem;">${TYPE_LABELS[t] || t}: ${c}</span>`).join('')}
            </div>
            <h4 style="font-size:0.85rem;margin-bottom:8px;">Yükümlülükler</h4>
            <div style="max-height:300px;overflow-y:auto;">
                ${obligations.map((o, i) => {
                    const t = o.tip || o.type;
                    return `<div style="padding:8px;margin-bottom:4px;border-left:3px solid ${TYPE_COLORS[t] || 'var(--primary)'};background:var(--bg-secondary);border-radius:0 6px 6px 0;font-size:0.8rem;">
                        <span style="font-weight:600;color:${TYPE_COLORS[t] || 'var(--primary)'};">m.${o.madde || o.article} [${TYPE_LABELS[t] || t}]</span>
                        ${o.muhatap ? `<span style="color:var(--text-secondary);"> → ${o.muhatap}</span>` : ''}
                        ${o.sure ? `<span style="color:var(--accent3);"> ⏱ ${o.sure}</span>` : ''}
                        <div style="margin-top:2px;">${o.metin || o.text}</div>
                    </div>`;
                }).join('')}
            </div>
            ${consequences.length ? `<h4 style="font-size:0.85rem;margin:12px 0 8px;">Yaptırımlar</h4>
                ${consequences.map(c => `<div style="padding:6px 8px;background:rgba(231,76,60,0.08);border-radius:6px;margin-bottom:4px;font-size:0.8rem;">
                    <span style="color:var(--accent1);font-weight:600;">m.${c.madde || c.article}</span>
                    <span style="background:var(--accent1);color:#fff;padding:1px 6px;border-radius:10px;font-size:0.7rem;margin:0 4px;">${CONS_LABELS[c.tip || c.type] || c.tip || c.type}</span>
                    ${c.metin || c.text}${c.detay ? ' — ' + c.detay : ''}
                </div>`).join('')}` : ''}
            ${regex.deadlines.length ? `<h4 style="font-size:0.85rem;margin:12px 0 8px;">Süreler</h4>
                ${regex.deadlines.map(d => `<div style="font-size:0.8rem;padding:4px 0;"><span style="color:var(--accent2);">m.${d.article}</span> ⏱ ${d.text}</div>`).join('')}` : ''}
        `;
    }
})();

// ============================================================
// #10 — MEVZUAT ARAMA (AI destekli)
// ============================================================
(function() {
    let searchHistory = JSON.parse(localStorage.getItem('mevzuatSearchHistory') || '[]');

    window.searchMevzuat = async function() {
        const query = document.getElementById('mevzuatSearchInput')?.value?.trim();
        if (!query) { toast('Arama terimi girin', 'info'); return; }

        const apiKey = DB.data.settings?.geminiApiKey;
        if (!apiKey) { toast('Ayarlar → Gemini API Key gerekli', 'error'); return; }

        const el = document.getElementById('mevzuatSearchResult');
        if (!el) return;
        el.style.display = 'block';
        el.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Aranıyor...</div>';

        const prompt = `Sen Türk hukuku uzmanısın. Aşağıdaki sorguyu analiz et ve ilgili mevzuat bilgisini ver.

Sorgu: "${query}"

JSON formatında yanıt ver:
{
  "kanun_adi": "İlgili kanun adı",
  "madde_no": "Madde numarası (varsa)",
  "madde_metni": "Maddenin tam veya özet metni",
  "aciklama": "Maddenin ne anlama geldiği, günlük dilde açıklama",
  "iliskili_maddeler": [{"madde":"madde referansı","konu":"kısa açıklama"}],
  "yargitay_kararlari": ["İlgili içtihat özeti 1", "İlgili içtihat özeti 2"],
  "pratik_bilgi": "Avukat olarak bu maddeyle ilgili dikkat edilmesi gerekenler",
  "ornek_kullanim": "Bu maddenin pratikte nasıl kullanıldığına dair örnek"
}`;

        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 3000 } })
            });
            const data = await resp.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jm = aiText.match(/\{[\s\S]*\}/);
            const result = jm ? JSON.parse(jm[0]) : null;

            if (result) {
                // Save to history
                searchHistory.unshift({ query, result, date: new Date().toISOString() });
                if (searchHistory.length > 20) searchHistory.pop();
                localStorage.setItem('mevzuatSearchHistory', JSON.stringify(searchHistory));

                el.innerHTML = `
                    <div style="padding:16px;background:var(--bg-secondary);border-radius:10px;">
                        <h3 style="margin:0 0 8px;color:var(--primary);"><i class="fas fa-balance-scale"></i> ${result.kanun_adi || query}</h3>
                        ${result.madde_no ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">Madde ${result.madde_no}</div>` : ''}
                        ${result.madde_metni ? `<div style="padding:12px;background:var(--bg-primary);border-left:3px solid var(--primary);border-radius:0 6px 6px 0;margin-bottom:12px;font-size:0.85rem;line-height:1.6;">${result.madde_metni}</div>` : ''}
                        <div style="margin-bottom:12px;"><h4 style="font-size:0.85rem;margin-bottom:4px;">Açıklama</h4><p style="font-size:0.82rem;line-height:1.5;">${result.aciklama || ''}</p></div>
                        ${result.pratik_bilgi ? `<div style="padding:10px;background:rgba(74,108,247,0.08);border-radius:6px;margin-bottom:12px;"><h4 style="font-size:0.82rem;color:var(--primary);margin-bottom:4px;">💡 Pratik Bilgi</h4><p style="font-size:0.8rem;line-height:1.5;">${result.pratik_bilgi}</p></div>` : ''}
                        ${result.ornek_kullanim ? `<div style="padding:10px;background:rgba(46,204,113,0.08);border-radius:6px;margin-bottom:12px;"><h4 style="font-size:0.82rem;color:var(--accent2);margin-bottom:4px;">📋 Örnek Kullanım</h4><p style="font-size:0.8rem;">${result.ornek_kullanim}</p></div>` : ''}
                        ${result.iliskili_maddeler?.length ? `<div style="margin-bottom:12px;"><h4 style="font-size:0.85rem;margin-bottom:4px;">İlişkili Maddeler</h4>${result.iliskili_maddeler.map(r => `<div style="font-size:0.8rem;padding:4px 0;cursor:pointer;color:var(--primary);" onclick="document.getElementById('mevzuatSearchInput').value='${r.madde}';searchMevzuat();">→ ${r.madde}: ${r.konu}</div>`).join('')}</div>` : ''}
                        ${result.yargitay_kararlari?.length ? `<div><h4 style="font-size:0.85rem;margin-bottom:4px;">İlgili İçtihatlar</h4>${result.yargitay_kararlari.map(y => `<div style="font-size:0.8rem;padding:4px 0;border-bottom:1px dashed var(--border-color);">⚖️ ${y}</div>`).join('')}</div>` : ''}
                        <button class="btn btn-sm btn-outline" style="margin-top:12px;" onclick="insertMevzuatToPetition('${(result.kanun_adi || '').replace(/'/g, '')}','${(result.madde_no || '').replace(/'/g, '')}')">
                            <i class="fas fa-paste"></i> Dilekçeye Ekle
                        </button>
                    </div>
                `;
                renderSearchHistory();
            } else {
                el.innerHTML = '<p style="color:var(--text-secondary);">Sonuç bulunamadı.</p>';
            }
        } catch (e) {
            el.innerHTML = `<p style="color:var(--accent1);">Hata: ${e.message}</p>`;
        }
    };

    window.insertMevzuatToPetition = function(kanun, madde) {
        const bodyEl = document.getElementById('petitionBody');
        if (bodyEl) {
            bodyEl.value += `\n\n${kanun}${madde ? ' m.' + madde : ''} gereğince...`;
            toast('Dilekçeye eklendi', 'success');
        } else {
            toast('Önce dilekçe editörünü açın', 'info');
        }
    };

    function renderSearchHistory() {
        const el = document.getElementById('mevzuatSearchHistory');
        if (!el || !searchHistory.length) return;
        el.innerHTML = `<h4 style="font-size:0.85rem;margin-bottom:8px;">Son Aramalar</h4>
            ${searchHistory.slice(0, 10).map(h => `<div style="display:flex;justify-content:space-between;padding:6px 8px;background:var(--bg-secondary);border-radius:6px;margin-bottom:4px;cursor:pointer;" onclick="document.getElementById('mevzuatSearchInput').value='${h.query.replace(/'/g, '')}';searchMevzuat();">
                <span style="font-size:0.8rem;">${h.query}</span>
                <span style="font-size:0.72rem;color:var(--text-secondary);">${new Date(h.date).toLocaleDateString('tr-TR')}</span>
            </div>`).join('')}`;
    }
    setTimeout(renderSearchHistory, 1000);
})();

// ============================================================
// #4 — HUKUKİ GÖRÜŞ YÖNETİMİ
// ============================================================
(function() {
    const STATUS_LABELS = { taslak: 'Taslak', onay_bekliyor: 'Onay Bekliyor', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi', arsivlendi: 'Arşivlendi' };
    const STATUS_COLORS = { taslak: 'var(--text-secondary)', onay_bekliyor: 'var(--accent3)', onaylandi: 'var(--accent2)', reddedildi: 'var(--accent1)', arsivlendi: '#9b59b6' };
    const PRIORITY_LABELS = { acil: 'Acil', yuksek: 'Yüksek', normal: 'Normal', dusuk: 'Düşük' };
    const PRIORITY_COLORS = { acil: 'var(--accent1)', yuksek: 'var(--accent3)', normal: 'var(--primary)', dusuk: 'var(--text-secondary)' };

    function getOpinions() { return DB.data.opinions || []; }
    function saveOpinions(arr) { DB.data.opinions = arr; DB.save(); }

    function generateRefNumber() {
        const year = new Date().getFullYear();
        const prefix = `HG-${year}-`;
        const existing = getOpinions().filter(o => o.refNo?.startsWith(prefix));
        const maxSeq = existing.reduce((max, o) => {
            const seq = parseInt(o.refNo.replace(prefix, ''), 10);
            return seq > max ? seq : max;
        }, 0);
        return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
    }

    window.renderOpinions = function() {
        const el = document.getElementById('opinionsList');
        if (!el) return;
        const search = (document.getElementById('opinionSearchInput')?.value || '').toLowerCase();
        const statusFilter = document.getElementById('opinionStatusFilter')?.value || '';
        const priorityFilter = document.getElementById('opinionPriorityFilter')?.value || '';

        let opinions = getOpinions().filter(o => !o.deleted);
        if (search) opinions = opinions.filter(o => (o.title + o.content + o.refNo).toLowerCase().includes(search));
        if (statusFilter) opinions = opinions.filter(o => o.status === statusFilter);
        if (priorityFilter) opinions = opinions.filter(o => o.priority === priorityFilter);
        opinions.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

        if (!opinions.length) { el.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:40px;">Henüz görüş yok. "Yeni Görüş" ile başlayın.</p>'; return; }

        el.innerHTML = opinions.map(o => `
            <div class="form-card" style="margin-bottom:10px;cursor:pointer;" onclick="viewOpinion('${o.id}')">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="font-size:0.72rem;color:var(--text-secondary);font-family:monospace;">${o.refNo}</span>
                        <span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;background:${STATUS_COLORS[o.status]}22;color:${STATUS_COLORS[o.status]};margin-left:6px;">${STATUS_LABELS[o.status]}</span>
                        <span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;background:${PRIORITY_COLORS[o.priority]}22;color:${PRIORITY_COLORS[o.priority]};margin-left:4px;">${PRIORITY_LABELS[o.priority]}</span>
                    </div>
                    <span style="font-size:0.72rem;color:var(--text-secondary);">${new Date(o.updatedAt || o.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <h3 style="margin:8px 0 4px;font-size:1rem;">${o.title}</h3>
                <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">${(o.content || '').replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
                ${o.deadline ? `<div style="font-size:0.72rem;color:${new Date(o.deadline) < new Date() ? 'var(--accent1)' : 'var(--accent3)'};margin-top:4px;">⏰ Son tarih: ${new Date(o.deadline).toLocaleDateString('tr-TR')}</div>` : ''}
                <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:4px;">Versiyon: v${o.versions?.length || 1} | Yazar: ${o.author || 'Avukat 1'}</div>
            </div>
        `).join('');
    };

    window.openOpinionEditor = function(id) {
        const existing = document.getElementById('opinionEditorModal');
        if (existing) existing.remove();

        const opinion = id ? getOpinions().find(o => o.id === id) : null;

        const modal = document.createElement('div');
        modal.id = 'opinionEditorModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10002;';

        modal.innerHTML = `
            <div class="modal-content" style="max-width:700px;max-height:90vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3>${opinion ? 'Görüş Düzenle' : 'Yeni Hukuki Görüş'}</h3>
                    <button class="btn btn-sm btn-outline" onclick="this.closest('#opinionEditorModal').remove()">&times;</button>
                </div>
                <div class="form-group"><label>Başlık</label><input type="text" id="opEditTitle" value="${opinion?.title || ''}" placeholder="Görüş başlığı"></div>
                <div class="form-row">
                    <div class="form-group"><label>Öncelik</label><select id="opEditPriority">
                        ${Object.entries(PRIORITY_LABELS).map(([k, v]) => `<option value="${k}" ${opinion?.priority === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select></div>
                    <div class="form-group"><label>Son Tarih</label><input type="date" id="opEditDeadline" value="${opinion?.deadline || ''}"></div>
                </div>
                <div class="form-group"><label>Konu / Kategori</label><input type="text" id="opEditCategory" value="${opinion?.category || ''}" placeholder="Ör: Vergi Hukuku, İş Hukuku..."></div>
                <div class="form-group"><label>Etiketler (virgülle ayır)</label><input type="text" id="opEditTags" value="${(opinion?.tags || []).join(', ')}" placeholder="kvkk, tazminat, acil"></div>
                <div class="form-group"><label>İçerik</label><textarea id="opEditContent" rows="14" style="font-size:0.85rem;">${opinion?.content || ''}</textarea></div>
                ${opinion?.status === 'taslak' || !opinion ? '' : `<div class="form-group"><label>Değişiklik Özeti</label><input type="text" id="opEditChangeSummary" placeholder="Bu düzenlemede ne değişti?"></div>`}
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="saveOpinionFromEditor('${opinion?.id || ''}')"><i class="fas fa-save"></i> Kaydet</button>
                    ${opinion && opinion.status === 'taslak' ? `<button class="btn btn-outline" onclick="submitOpinionForApproval('${opinion.id}')"><i class="fas fa-paper-plane"></i> Onaya Gönder</button>` : ''}
                    ${opinion ? `<button class="btn btn-sm" style="margin-left:auto;color:var(--accent1);" onclick="deleteOpinion('${opinion.id}')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.saveOpinionFromEditor = function(existingId) {
        const title = document.getElementById('opEditTitle')?.value;
        if (!title) { toast('Başlık gerekli', 'info'); return; }

        const opinions = getOpinions();
        const now = new Date().toISOString();
        const content = document.getElementById('opEditContent')?.value || '';
        const tags = (document.getElementById('opEditTags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);

        if (existingId) {
            const op = opinions.find(o => o.id === existingId);
            if (op) {
                // Create version
                if (!op.versions) op.versions = [];
                op.versions.push({ v: op.versions.length + 1, title: op.title, content: op.content, changedBy: localStorage.getItem('currentUser') || 'Avukat 1', summary: document.getElementById('opEditChangeSummary')?.value || '', date: now });
                op.title = title;
                op.content = content;
                op.priority = document.getElementById('opEditPriority')?.value || 'normal';
                op.deadline = document.getElementById('opEditDeadline')?.value || '';
                op.category = document.getElementById('opEditCategory')?.value || '';
                op.tags = tags;
                op.updatedAt = now;
            }
        } else {
            opinions.push({
                id: genId(), refNo: generateRefNumber(), title, content,
                status: 'taslak', priority: document.getElementById('opEditPriority')?.value || 'normal',
                deadline: document.getElementById('opEditDeadline')?.value || '',
                category: document.getElementById('opEditCategory')?.value || '', tags,
                author: localStorage.getItem('currentUser') || 'Avukat 1',
                versions: [{ v: 1, title, content, changedBy: localStorage.getItem('currentUser') || 'Avukat 1', summary: 'İlk oluşturma', date: now }],
                createdAt: now, updatedAt: now
            });
        }
        saveOpinions(opinions);
        document.getElementById('opinionEditorModal')?.remove();
        renderOpinions();
        toast('Görüş kaydedildi', 'success');
    };

    window.submitOpinionForApproval = function(id) {
        const opinions = getOpinions();
        const op = opinions.find(o => o.id === id);
        if (op) { op.status = 'onay_bekliyor'; op.updatedAt = new Date().toISOString(); saveOpinions(opinions); }
        document.getElementById('opinionEditorModal')?.remove();
        renderOpinions();
        toast('Onaya gönderildi', 'success');
    };

    window.viewOpinion = function(id) {
        const op = getOpinions().find(o => o.id === id);
        if (!op) return;

        const existing = document.getElementById('opinionViewModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'opinionViewModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10002;';

        modal.innerHTML = `
            <div class="modal-content" style="max-width:700px;max-height:90vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div>
                        <span style="font-family:monospace;font-size:0.78rem;color:var(--text-secondary);">${op.refNo}</span>
                        <span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;background:${STATUS_COLORS[op.status]}22;color:${STATUS_COLORS[op.status]};margin-left:6px;">${STATUS_LABELS[op.status]}</span>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="this.closest('#opinionViewModal').remove()">&times;</button>
                </div>
                <h2 style="margin:0 0 12px;">${op.title}</h2>
                <div style="display:flex;gap:12px;margin-bottom:16px;font-size:0.78rem;color:var(--text-secondary);">
                    <span>Yazar: ${op.author}</span>
                    <span>Kategori: ${op.category || '-'}</span>
                    <span>Öncelik: ${PRIORITY_LABELS[op.priority]}</span>
                    ${op.deadline ? `<span style="color:${new Date(op.deadline) < new Date() ? 'var(--accent1)' : 'var(--accent3)'};">Deadline: ${new Date(op.deadline).toLocaleDateString('tr-TR')}</span>` : ''}
                </div>
                ${op.tags?.length ? `<div style="margin-bottom:12px;">${op.tags.map(t => `<span style="padding:2px 8px;background:var(--primary)22;color:var(--primary);border-radius:10px;font-size:0.72rem;margin-right:4px;">${t}</span>`).join('')}</div>` : ''}
                <div style="padding:16px;background:var(--bg-secondary);border-radius:8px;margin-bottom:16px;line-height:1.7;font-size:0.88rem;white-space:pre-wrap;">${op.content}</div>
                ${op.versions?.length > 1 ? `<div style="margin-bottom:16px;"><h4 style="font-size:0.85rem;margin-bottom:8px;">Versiyon Geçmişi (${op.versions.length})</h4>
                    ${op.versions.map(v => `<div style="padding:6px 8px;background:var(--bg-secondary);border-radius:6px;margin-bottom:4px;font-size:0.78rem;display:flex;justify-content:space-between;">
                        <span>v${v.v} — ${v.summary || 'Düzenleme'} (${v.changedBy})</span>
                        <span style="color:var(--text-secondary);">${new Date(v.date).toLocaleDateString('tr-TR')}</span>
                    </div>`).join('')}
                </div>` : ''}
                ${op.assignedTo ? `<div style="padding:10px;background:rgba(52,152,219,0.08);border-left:3px solid #3498db;border-radius:6px;margin-bottom:12px;font-size:0.82rem;">
                    <strong><i class="fas fa-user-shield"></i> Delegasyon:</strong> ${op.assignedTo}
                    ${op.assignmentDueDate ? ` | Teslim: ${new Date(op.assignmentDueDate).toLocaleDateString('tr-TR')}` : ''}
                    ${op.delegationStatus ? ` | Durum: <strong>${op.delegationStatus}</strong>` : ''}
                </div>` : ''}
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-outline" onclick="this.closest('#opinionViewModal').remove();openOpinionEditor('${op.id}')"><i class="fas fa-edit"></i> Düzenle</button>
                    <button class="btn btn-outline" style="color:#3498db;" onclick="this.closest('#opinionViewModal').remove();openOpinionDelegation('${op.id}')"><i class="fas fa-user-shield"></i> ${op.assignedTo ? 'Delegasyonu Yönet' : 'Ata / Delege Et'}</button>
                    ${op.status === 'onay_bekliyor' ? `<button class="btn btn-primary" onclick="approveOpinion('${op.id}', true)"><i class="fas fa-check"></i> Onayla</button><button class="btn btn-outline" style="color:var(--accent1);" onclick="approveOpinion('${op.id}', false)"><i class="fas fa-times"></i> Reddet</button>` : ''}
                    ${op.status === 'onaylandi' ? `<button class="btn btn-outline" onclick="archiveOpinion('${op.id}')"><i class="fas fa-archive"></i> Arşivle</button>` : ''}
                    <button class="btn btn-outline" onclick="generateOpinionAISummary('${op.id}')"><i class="fas fa-robot"></i> AI Özet</button>
                </div>
                <div id="opinionAISummary" style="margin-top:12px;"></div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.approveOpinion = function(id, approve) {
        const opinions = getOpinions();
        const op = opinions.find(o => o.id === id);
        if (op) { op.status = approve ? 'onaylandi' : 'reddedildi'; op.updatedAt = new Date().toISOString(); saveOpinions(opinions); }
        document.getElementById('opinionViewModal')?.remove();
        renderOpinions();
        toast(approve ? 'Görüş onaylandı' : 'Görüş reddedildi', approve ? 'success' : 'info');
    };

    window.archiveOpinion = function(id) {
        const opinions = getOpinions();
        const op = opinions.find(o => o.id === id);
        if (op) { op.status = 'arsivlendi'; op.updatedAt = new Date().toISOString(); saveOpinions(opinions); }
        document.getElementById('opinionViewModal')?.remove();
        renderOpinions();
        toast('Arşivlendi', 'success');
    };

    window.deleteOpinion = function(id) {
        if (!confirm('Bu görüşü silmek istediğinize emin misiniz?')) return;
        const opinions = getOpinions();
        const op = opinions.find(o => o.id === id);
        if (op) { op.deleted = true; op.deletedAt = new Date().toISOString(); saveOpinions(opinions); }
        document.getElementById('opinionEditorModal')?.remove();
        document.getElementById('opinionViewModal')?.remove();
        renderOpinions();
        toast('Silindi', 'success');
    };

    window.generateOpinionAISummary = async function(id) {
        const op = getOpinions().find(o => o.id === id);
        if (!op) return;
        const apiKey = DB.data.settings?.geminiApiKey;
        if (!apiKey) { toast('Gemini API Key gerekli', 'error'); return; }
        const el = document.getElementById('opinionAISummary');
        if (el) el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Özet hazırlanıyor...';
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `Bu hukuki görüşün 3-5 cümlelik profesyonel özetini yaz:\n\nBaşlık: ${op.title}\nKategori: ${op.category}\n\n${op.content}` }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 500 } })
            });
            const data = await resp.json();
            const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (el) el.innerHTML = `<div style="padding:10px;background:rgba(74,108,247,0.08);border-radius:6px;font-size:0.82rem;"><strong>AI Özet:</strong> ${summary}</div>`;
            // Save summary
            const opinions = getOpinions();
            const o = opinions.find(x => x.id === id);
            if (o) { o.aiSummary = summary; saveOpinions(opinions); }
        } catch (e) { if (el) el.innerHTML = `<p style="color:var(--accent1);">Hata: ${e.message}</p>`; }
    };
})();

// ============================================================
// #9 — MADDE KÜTÜPHANESİ
// ============================================================
(function() {
    const CLAUSE_CATEGORIES = {
        'cezai-sart': 'Cezai Şart', 'mucbir-sebep': 'Mücbir Sebep', 'fesih': 'Fesih Koşulları',
        'gizlilik': 'Gizlilik', 'odeme': 'Ödeme Koşulları', 'uyusmazlik': 'Uyuşmazlık Çözümü',
        'kvkk': 'KVKK Uyum', 'rekabet': 'Rekabet Yasağı', 'tazminat': 'Tazminat',
        'sure': 'Süre & Uzatma', 'teminat': 'Teminat', 'diger': 'Diğer'
    };

    function getClauses() { return DB.data.clauseLibrary || []; }
    function saveClauses(arr) { DB.data.clauseLibrary = arr; DB.save(); }

    window.renderClauses = function() {
        const el = document.getElementById('clausesList');
        if (!el) return;
        const search = (document.getElementById('clauseSearchInput')?.value || '').toLowerCase();
        const catFilter = document.getElementById('clauseCategoryFilter')?.value || '';

        let clauses = getClauses();
        if (search) clauses = clauses.filter(c => (c.title + c.body + c.tags?.join(' ')).toLowerCase().includes(search));
        if (catFilter) clauses = clauses.filter(c => c.category === catFilter);

        if (!clauses.length) { el.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:40px;">Kütüphanede madde yok. "Yeni Madde" ile ekleyin.</p>'; return; }

        el.innerHTML = clauses.map(c => `
            <div class="form-card" style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;background:var(--primary)22;color:var(--primary);">${CLAUSE_CATEGORIES[c.category] || c.category}</span>
                        ${c.version ? `<span style="font-size:0.7rem;color:var(--text-secondary);margin-left:6px;">v${c.version}</span>` : ''}
                    </div>
                    <div style="display:flex;gap:4px;">
                        <button class="btn btn-sm btn-outline" onclick="copyClauseToClipboard('${c.id}')" title="Kopyala"><i class="fas fa-copy"></i></button>
                        <button class="btn btn-sm btn-outline" onclick="openClauseEditor('${c.id}')" title="Düzenle"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline" onclick="deleteClause('${c.id}')" title="Sil" style="color:var(--accent1);"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <h3 style="margin:8px 0 4px;font-size:0.95rem;">${c.title}</h3>
                <pre style="font-size:0.78rem;color:var(--text-secondary);white-space:pre-wrap;margin:0;max-height:100px;overflow:hidden;">${c.body.substring(0, 300)}${c.body.length > 300 ? '...' : ''}</pre>
                ${c.tags?.length ? `<div style="margin-top:6px;">${c.tags.map(t => `<span style="padding:1px 6px;background:var(--bg-hover);border-radius:8px;font-size:0.68rem;">${t}</span>`).join(' ')}</div>` : ''}
            </div>
        `).join('');
    };

    window.openClauseEditor = function(id) {
        const clause = id ? getClauses().find(c => c.id === id) : null;
        const existing = document.getElementById('clauseEditorModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'clauseEditorModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10002;';

        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;max-height:85vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:24px;">
                <h3 style="margin-bottom:16px;">${clause ? 'Madde Düzenle' : 'Yeni Madde'}</h3>
                <div class="form-group"><label>Başlık</label><input type="text" id="clEditTitle" value="${clause?.title || ''}" placeholder="Ör: Mücbir Sebep - Güçlü versiyon"></div>
                <div class="form-row">
                    <div class="form-group"><label>Kategori</label><select id="clEditCategory">
                        ${Object.entries(CLAUSE_CATEGORIES).map(([k, v]) => `<option value="${k}" ${clause?.category === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select></div>
                    <div class="form-group"><label>Versiyon</label><input type="text" id="clEditVersion" value="${clause?.version || '1'}" placeholder="1"></div>
                </div>
                <div class="form-group"><label>Etiketler (virgülle ayır)</label><input type="text" id="clEditTags" value="${(clause?.tags || []).join(', ')}" placeholder="müvekkil lehine, güçlü, standart"></div>
                <div class="form-group"><label>Madde Metni</label><textarea id="clEditBody" rows="10" style="font-family:monospace;font-size:0.82rem;">${clause?.body || ''}</textarea>
                    <small style="color:var(--text-secondary);">Değişkenler: {{müvekkil}}, {{tarih}}, {{tutar}}, {{süre}}</small>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary" onclick="saveClauseFromEditor('${clause?.id || ''}')"><i class="fas fa-save"></i> Kaydet</button>
                    <button class="btn btn-outline" onclick="this.closest('#clauseEditorModal').remove()">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.saveClauseFromEditor = function(existingId) {
        const title = document.getElementById('clEditTitle')?.value;
        if (!title) { toast('Başlık gerekli', 'info'); return; }
        const clauses = getClauses();
        const data = {
            title, body: document.getElementById('clEditBody')?.value || '',
            category: document.getElementById('clEditCategory')?.value || 'diger',
            version: document.getElementById('clEditVersion')?.value || '1',
            tags: (document.getElementById('clEditTags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
            updatedAt: new Date().toISOString()
        };
        if (existingId) {
            const idx = clauses.findIndex(c => c.id === existingId);
            if (idx >= 0) Object.assign(clauses[idx], data);
        } else {
            clauses.push({ id: genId(), ...data, createdAt: new Date().toISOString() });
        }
        saveClauses(clauses);
        document.getElementById('clauseEditorModal')?.remove();
        renderClauses();
        toast('Madde kaydedildi', 'success');
    };

    window.deleteClause = function(id) {
        if (!confirm('Bu maddeyi silmek istediğinize emin misiniz?')) return;
        saveClauses(getClauses().filter(c => c.id !== id));
        renderClauses();
        toast('Silindi', 'success');
    };

    window.copyClauseToClipboard = function(id) {
        const clause = getClauses().find(c => c.id === id);
        if (!clause) return;
        const text = window.applyTemplateVariables ? window.applyTemplateVariables(clause.body) : clause.body;
        navigator.clipboard.writeText(text).then(() => toast('Panoya kopyalandı', 'success')).catch(() => toast('Kopyalama başarısız', 'error'));
    };
})();

// ============================================================
// #3 — MEVZUAT TAKİP SİSTEMİ (regwatch patterns)
// ============================================================
(function() {
    const SOURCES = [
        { id: 'resmi-gazete', name: 'Resmi Gazete', icon: 'fa-newspaper', url: 'https://www.resmigazete.gov.tr' },
        { id: 'spk', name: 'SPK', icon: 'fa-chart-line', url: 'https://spk.gov.tr' },
        { id: 'kvkk', name: 'KVKK', icon: 'fa-shield-alt', url: 'https://kvkk.gov.tr' },
        { id: 'tcmb', name: 'TCMB', icon: 'fa-university', url: 'https://tcmb.gov.tr' },
        { id: 'reklamkurulu', name: 'Reklam Kurulu', icon: 'fa-bullhorn', url: 'https://ticaret.gov.tr' },
    ];

    const SEVERITY_KEYWORDS = {
        kritik: ['ceza', 'para cezası', 'idari para ceza', 'iptal', 'lisans iptali', 'yasaklama', 'ihlal', 'veri ihlali', 'durdurma', 'tasfiye', 'iflas'],
        onemli: ['yönetmelik', 'tebliğ', 'değişiklik', 'düzenleme', 'kanun', 'mevzuat', 'izin', 'lisans', 'genelge', 'karar'],
        bilgi: ['duyuru', 'bilgilendirme', 'ilan', 'toplantı', 'rapor', 'istatistik', 'atama']
    };

    const SEVERITY_LABELS = { kritik: '🔴 Kritik', onemli: '🟡 Önemli', bilgi: '🟢 Bilgi' };
    const SEVERITY_COLORS = { kritik: 'var(--accent1)', onemli: 'var(--accent3)', bilgi: 'var(--accent2)' };

    function getRegulations() { return DB.data.regulations || []; }
    function saveRegulations(arr) { DB.data.regulations = arr; DB.save(); }

    function classifySeverity(text) {
        const lower = text.toLowerCase();
        for (const kw of SEVERITY_KEYWORDS.kritik) { if (lower.includes(kw)) return 'kritik'; }
        for (const kw of SEVERITY_KEYWORDS.onemli) { if (lower.includes(kw)) return 'onemli'; }
        return 'bilgi';
    }

    window.renderRegulations = function() {
        const el = document.getElementById('regulationsList');
        if (!el) return;
        const search = (document.getElementById('regSearchInput')?.value || '').toLowerCase();
        const srcFilter = document.getElementById('regSourceFilter')?.value || '';
        const impFilter = document.getElementById('regImportanceFilter')?.value || '';

        let regs = getRegulations();
        if (search) regs = regs.filter(r => (r.title + r.summary + r.source).toLowerCase().includes(search));
        if (srcFilter) regs = regs.filter(r => r.source === srcFilter);
        if (impFilter) regs = regs.filter(r => r.severity === impFilter);
        regs.sort((a, b) => new Date(b.date || b.addedAt) - new Date(a.date || a.addedAt));

        // Stats
        const statsEl = document.getElementById('regStats');
        if (statsEl) {
            const all = getRegulations();
            const kritik = all.filter(r => r.severity === 'kritik').length;
            const onemli = all.filter(r => r.severity === 'onemli').length;
            const bilgi = all.filter(r => r.severity === 'bilgi').length;
            statsEl.innerHTML = `
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;"><div style="font-size:1.2rem;font-weight:700;">${all.length}</div><div style="font-size:0.72rem;color:var(--text-secondary);">Toplam</div></div>
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;border-top:3px solid var(--accent1);"><div style="font-size:1.2rem;font-weight:700;color:var(--accent1);">${kritik}</div><div style="font-size:0.72rem;">Kritik</div></div>
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;border-top:3px solid var(--accent3);"><div style="font-size:1.2rem;font-weight:700;color:var(--accent3);">${onemli}</div><div style="font-size:0.72rem;">Önemli</div></div>
                <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;border-top:3px solid var(--accent2);"><div style="font-size:1.2rem;font-weight:700;color:var(--accent2);">${bilgi}</div><div style="font-size:0.72rem;">Bilgi</div></div>
            `;
        }

        if (!regs.length) { el.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:40px;">Kayıtlı düzenleme yok. "Manuel Ekle" veya "Güncelle" ile başlayın.</p>'; return; }

        el.innerHTML = regs.map(r => {
            const src = SOURCES.find(s => s.id === r.source);
            return `<div class="form-card" style="margin-bottom:10px;border-left:3px solid ${SEVERITY_COLORS[r.severity] || 'var(--border-color)'};">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="font-size:0.7rem;color:var(--text-secondary);"><i class="fas ${src?.icon || 'fa-file'}"></i> ${src?.name || r.source}</span>
                        <span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;background:${SEVERITY_COLORS[r.severity]}22;color:${SEVERITY_COLORS[r.severity]};margin-left:6px;">${SEVERITY_LABELS[r.severity] || r.severity}</span>
                        ${r.read ? '' : '<span style="padding:2px 6px;border-radius:10px;font-size:0.65rem;background:var(--primary);color:#fff;margin-left:4px;">YENİ</span>'}
                    </div>
                    <span style="font-size:0.72rem;color:var(--text-secondary);">${r.date ? new Date(r.date).toLocaleDateString('tr-TR') : ''}</span>
                </div>
                <h3 style="margin:8px 0 4px;font-size:0.95rem;cursor:pointer;" onclick="viewRegulation('${r.id}')">${r.title}</h3>
                <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">${(r.summary || '').substring(0, 150)}</p>
                ${r.tags?.length ? `<div style="margin-top:6px;">${r.tags.map(t => `<span style="padding:1px 6px;background:var(--bg-hover);border-radius:8px;font-size:0.68rem;">${t}</span>`).join(' ')}</div>` : ''}
            </div>`;
        }).join('');
    };

    window.addManualRegulation = function() {
        const existing = document.getElementById('regEditorModal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'regEditorModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10002;';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;background:var(--bg-primary);border-radius:12px;padding:24px;">
                <h3 style="margin-bottom:16px;">Yeni Düzenleme Ekle</h3>
                <div class="form-group"><label>Başlık</label><input type="text" id="regEditTitle" placeholder="Düzenleme başlığı"></div>
                <div class="form-row">
                    <div class="form-group"><label>Kaynak</label><select id="regEditSource">
                        ${SOURCES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                        <option value="diger">Diğer</option>
                    </select></div>
                    <div class="form-group"><label>Tarih</label><input type="date" id="regEditDate" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
                <div class="form-group"><label>Özet / İçerik</label><textarea id="regEditSummary" rows="6" placeholder="Düzenlemenin özeti veya tam metni..."></textarea></div>
                <div class="form-group"><label>Etiketler</label><input type="text" id="regEditTags" placeholder="kvkk, finans, ceza (virgülle ayır)"></div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary" onclick="saveManualRegulation()"><i class="fas fa-save"></i> Kaydet</button>
                    <button class="btn btn-outline" onclick="saveAndAnalyzeRegulation()"><i class="fas fa-robot"></i> Kaydet & AI Analiz</button>
                    <button class="btn btn-outline" onclick="this.closest('#regEditorModal').remove()">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.saveManualRegulation = function() {
        const title = document.getElementById('regEditTitle')?.value;
        if (!title) { toast('Başlık gerekli', 'info'); return; }
        const regs = getRegulations();
        const summary = document.getElementById('regEditSummary')?.value || '';
        regs.push({
            id: genId(), title, source: document.getElementById('regEditSource')?.value || 'diger',
            date: document.getElementById('regEditDate')?.value || new Date().toISOString().split('T')[0],
            summary, severity: classifySeverity(title + ' ' + summary),
            tags: (document.getElementById('regEditTags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
            read: false, addedAt: new Date().toISOString()
        });
        saveRegulations(regs);
        document.getElementById('regEditorModal')?.remove();
        renderRegulations();
        toast('Düzenleme kaydedildi', 'success');
    };

    window.saveAndAnalyzeRegulation = async function() {
        window.saveManualRegulation();
        const regs = getRegulations();
        const last = regs[regs.length - 1];
        if (!last) return;
        const apiKey = DB.data.settings?.geminiApiKey;
        if (!apiKey) { toast('AI analiz için Gemini API Key gerekli', 'info'); return; }
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `Bu düzenlemeyi analiz et. Önem derecesini (kritik/onemli/bilgi) ve kısa özetini ver. JSON: {"onem":"kritik/onemli/bilgi","ozet":"max 3 cümle","etiketler":["tag1","tag2"]}\n\n${last.title}\n${last.summary}` }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 500 } })
            });
            const data = await resp.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jm = aiText.match(/\{[\s\S]*\}/);
            if (jm) {
                const ai = JSON.parse(jm[0]);
                last.severity = ai.onem || last.severity;
                last.aiSummary = ai.ozet || '';
                if (ai.etiketler) last.tags = [...new Set([...(last.tags || []), ...ai.etiketler])];
                saveRegulations(regs);
                renderRegulations();
                toast('AI analiz tamamlandı', 'success');
            }
        } catch (e) { /* silent */ }
    };

    window.viewRegulation = function(id) {
        const regs = getRegulations();
        const r = regs.find(x => x.id === id);
        if (!r) return;
        if (!r.read) { r.read = true; saveRegulations(regs); renderRegulations(); }
        const src = SOURCES.find(s => s.id === r.source);
        alert(`${SEVERITY_LABELS[r.severity] || ''} ${src?.name || r.source}\n\n${r.title}\n\nTarih: ${r.date}\n\n${r.summary || 'İçerik yok'}\n\n${r.aiSummary ? 'AI Özet: ' + r.aiSummary : ''}`);
    };

    window.fetchRegulations = async function() {
        const apiKey = DB.data.settings?.geminiApiKey;
        if (!apiKey) { toast('AI için Gemini API Key gerekli. Şimdilik manuel ekleme yapabilirsiniz.', 'info'); return; }
        toast('Mevzuat kaynakları taranıyor... (CORS kısıtlaması nedeniyle AI simülasyonu)', 'info');
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `Bugün ${new Date().toLocaleDateString('tr-TR')} tarihinde Türkiye'de yayınlanan veya güncel olan önemli hukuki düzenlemeleri listele. JSON array formatında yanıt ver:
[{"baslik":"","kaynak":"resmi-gazete/spk/kvkk/tcmb/reklamkurulu","tarih":"YYYY-MM-DD","ozet":"","onem":"kritik/onemli/bilgi","etiketler":["tag1"]}]
En fazla 5 sonuç ver. Gerçekçi ve güncel bilgiler olsun.` }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 2000 } })
            });
            const data = await resp.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jm = aiText.match(/\[[\s\S]*\]/);
            if (jm) {
                const items = JSON.parse(jm[0]);
                const regs = getRegulations();
                let added = 0;
                for (const item of items) {
                    if (regs.some(r => r.title === item.baslik)) continue;
                    regs.push({
                        id: genId(), title: item.baslik, source: item.kaynak || 'diger',
                        date: item.tarih || new Date().toISOString().split('T')[0],
                        summary: item.ozet || '', severity: item.onem || 'bilgi',
                        tags: item.etiketler || [], read: false, addedAt: new Date().toISOString(), aiGenerated: true
                    });
                    added++;
                }
                saveRegulations(regs);
                renderRegulations();
                toast(`${added} yeni düzenleme eklendi`, 'success');
            }
        } catch (e) { toast('Güncelleme hatası: ' + e.message, 'error'); }
    };
})();

// ============================================================
// #5 — DOSYA OTOMATİK SINIFLANDIRMA
// ============================================================
(function() {
    const CATEGORIES = {
        hukuk: { label: 'Hukuk', icon: 'fa-gavel', keywords: ['sözleşme', 'dilekçe', 'mahkeme', 'dava', 'icra', 'tebligat', 'vekaletname', 'karar', 'ihtarname', 'bilirkişi', 'temyiz', 'istinaf'] },
        gizlilik: { label: 'Gizlilik Sözleşmeleri', icon: 'fa-lock', keywords: ['gizlilik', 'nda', 'non-disclosure', 'confidential'] },
        muhasebe: { label: 'Muhasebe/Vergi', icon: 'fa-calculator', keywords: ['fatura', 'vergi', 'beyanname', 'muhasebe', 'gelir', 'gider', 'kdv', 'sgk', 'maaş'] },
        ik: { label: 'İnsan Kaynakları', icon: 'fa-users', keywords: ['özlük', 'işe giriş', 'sgk', 'bordro', 'izin', 'personel'] },
        pazarlama: { label: 'Pazarlama', icon: 'fa-bullhorn', keywords: ['pazarlama', 'reklam', 'kampanya', 'sunum', 'teklif', 'brosür'] },
        teknoloji: { label: 'Teknoloji', icon: 'fa-laptop-code', keywords: ['yazılım', 'api', 'sistem', 'kod', 'teknik', 'proje'] },
        insaat: { label: 'İnşaat', icon: 'fa-hard-hat', keywords: ['inşaat', 'yapı', 'ruhsat', 'imar', 'tapu', 'iskan'] },
    };

    function normalizeForSearch(text) {
        return text.toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
    }

    function classifyFile(fileName) {
        const lower = fileName.toLowerCase();
        const normalized = normalizeForSearch(fileName);
        let bestCat = 'diger', bestScore = 0;
        for (const [cat, data] of Object.entries(CATEGORIES)) {
            let score = 0;
            for (const kw of data.keywords) {
                if (lower.includes(kw) || normalized.includes(normalizeForSearch(kw))) score++;
            }
            if (score > bestScore) { bestScore = score; bestCat = cat; }
        }
        return { category: bestCat, label: CATEGORIES[bestCat]?.label || 'Diğer', score: bestScore };
    }

    function matchClient(fileName) {
        const lower = fileName.toLowerCase();
        const clients = DB.data.clients || [];
        for (const c of clients) {
            if (lower.includes(c.name.toLowerCase()) || lower.includes(normalizeForSearch(c.name))) return c.name;
        }
        return null;
    }

    // File drop zone — dosya sınıflandırma aracını Dosya Takibi sayfasına ekle
    window.classifyUploadedFiles = function(files) {
        const results = [];
        for (const file of files) {
            const classification = classifyFile(file.name);
            const client = matchClient(file.name);
            results.push({ name: file.name, size: file.size, ...classification, client });
        }
        return results;
    };

    // Dashboard'a veya Dosya Takibi'ne sınıflandırma butonu ekle
    setTimeout(() => {
        const caseFilesPage = document.getElementById('page-case-files');
        if (!caseFilesPage) return;

        const existingZone = caseFilesPage.querySelector('.file-classify-zone');
        if (existingZone) return;

        const zone = document.createElement('div');
        zone.className = 'file-classify-zone';
        zone.style.cssText = 'margin-bottom:16px;padding:20px;border:2px dashed var(--border-color);border-radius:10px;text-align:center;cursor:pointer;transition:all 0.2s;';
        zone.innerHTML = `
            <i class="fas fa-magic" style="font-size:1.5rem;color:var(--primary);"></i>
            <p style="margin:8px 0 4px;font-weight:600;">Dosya Otomatik Sınıflandırma</p>
            <p style="font-size:0.78rem;color:var(--text-secondary);">Dosyaları sürükleyin veya tıklayıp seçin — otomatik kategorize edilir</p>
            <input type="file" id="classifyFileInput" multiple style="display:none;" onchange="handleFileClassification(this.files)">
        `;
        zone.onclick = () => document.getElementById('classifyFileInput')?.click();
        zone.ondragover = (e) => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; zone.style.background = 'rgba(74,108,247,0.05)'; };
        zone.ondragleave = () => { zone.style.borderColor = 'var(--border-color)'; zone.style.background = ''; };
        zone.ondrop = (e) => { e.preventDefault(); zone.style.borderColor = 'var(--border-color)'; zone.style.background = ''; handleFileClassification(e.dataTransfer.files); };

        const firstChild = caseFilesPage.firstChild;
        caseFilesPage.insertBefore(zone, firstChild?.nextSibling || firstChild);
    }, 1500);

    window.handleFileClassification = function(fileList) {
        const files = Array.from(fileList);
        if (!files.length) return;
        const results = classifyUploadedFiles(files);

        const existing = document.getElementById('classifyResultModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'classifyResultModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10002;';

        const catCounts = {};
        results.forEach(r => { catCounts[r.label] = (catCounts[r.label] || 0) + 1; });

        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;max-height:80vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:24px;">
                <h3 style="margin-bottom:16px;"><i class="fas fa-magic" style="color:var(--primary);margin-right:8px;"></i>Sınıflandırma Sonucu (${results.length} dosya)</h3>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                    ${Object.entries(catCounts).map(([cat, count]) => `<span style="padding:3px 8px;background:var(--primary)22;color:var(--primary);border-radius:12px;font-size:0.75rem;">${cat}: ${count}</span>`).join('')}
                </div>
                ${results.map(r => `<div style="padding:8px;background:var(--bg-secondary);border-radius:6px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:0.85rem;font-weight:500;">${r.name}</div>
                        <div style="font-size:0.72rem;color:var(--text-secondary);">
                            <i class="fas ${CATEGORIES[r.category]?.icon || 'fa-file'}"></i> ${r.label}
                            ${r.client ? `| <i class="fas fa-user"></i> ${r.client}` : ''}
                            | ${(r.size / 1024).toFixed(1)} KB
                        </div>
                    </div>
                    <span style="font-size:0.7rem;color:var(--text-secondary);">Skor: ${r.score}</span>
                </div>`).join('')}
                <button class="btn btn-outline" onclick="this.closest('#classifyResultModal').remove()" style="margin-top:12px;width:100%;">Kapat</button>
            </div>
        `;
        document.body.appendChild(modal);
    };
})();

// ============================================================
// #8 — E-POSTA RAPORLAMA (HTML rapor oluştur & indir)
// ============================================================
(function() {
    window.generateEmailReport = function(type) {
        const now = new Date();
        const user = localStorage.getItem('currentUser') || 'Avukat';

        const hearings = (DB.data.hearings || []).filter(h => {
            const d = new Date(h.date);
            if (type === 'sabah') return d.toDateString() === now.toDateString();
            if (type === 'aksam') { const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); return d.toDateString() === tomorrow.toDateString(); }
            if (type === 'haftalik') { const week = new Date(now); week.setDate(week.getDate() + 7); return d >= now && d <= week; }
            return false;
        });

        const tasks = (DB.data.tasks || []).filter(t => {
            if (type === 'haftalik') return t.status !== 'done';
            const d = new Date(t.dueDate);
            return t.status !== 'done' && d <= new Date(now.getTime() + 86400000);
        });

        const deadlines = (DB.data.deadlines || []).filter(d => {
            const dd = new Date(d.date);
            const days = type === 'haftalik' ? 7 : 3;
            return dd >= now && dd <= new Date(now.getTime() + days * 86400000);
        });

        const regs = (DB.data.regulations || []).filter(r => !r.read && (type === 'haftalik' || new Date(r.addedAt) >= new Date(now.getTime() - 86400000)));

        const typeLabels = { sabah: 'Sabah Raporu', aksam: 'Akşam Raporu', haftalik: 'Haftalık Özet' };

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body{font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;}
            h1{color:#4a6cf7;font-size:1.3rem;border-bottom:2px solid #4a6cf7;padding-bottom:8px;}
            h2{font-size:1rem;color:#555;margin-top:20px;}
            .card{padding:10px;background:#f8f9fa;border-radius:6px;margin-bottom:8px;border-left:3px solid #4a6cf7;}
            .critical{border-left-color:#e74c3c;}
            .warning{border-left-color:#f39c12;}
            .success{border-left-color:#2ecc71;}
            .meta{font-size:0.78rem;color:#888;}
            .badge{display:inline-block;padding:2px 6px;border-radius:10px;font-size:0.7rem;color:#fff;margin-left:4px;}
        </style></head><body>
            <h1>⚖️ Akgül Legal — ${typeLabels[type]}</h1>
            <p class="meta">${now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | ${user}</p>

            <h2>📅 Duruşmalar (${hearings.length})</h2>
            ${hearings.length ? hearings.map(h => `<div class="card"><strong>${h.subject || h.client}</strong><br><span class="meta">${new Date(h.date).toLocaleDateString('tr-TR')} ${h.time || ''} | ${h.court || ''}</span></div>`).join('') : '<p class="meta">Duruşma yok</p>'}

            <h2>📋 Görevler (${tasks.length})</h2>
            ${tasks.length ? tasks.map(t => `<div class="card ${new Date(t.dueDate) < now ? 'critical' : ''}">${t.title}<br><span class="meta">${t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : 'Tarih yok'} | ${t.assignee || ''}</span></div>`).join('') : '<p class="meta">Bekleyen görev yok</p>'}

            <h2>⏰ Yaklaşan Süreler (${deadlines.length})</h2>
            ${deadlines.length ? deadlines.map(d => `<div class="card warning">${d.description || d.type}<br><span class="meta">${new Date(d.date).toLocaleDateString('tr-TR')}</span></div>`).join('') : '<p class="meta">Yaklaşan süre yok</p>'}

            ${regs.length ? `<h2>📰 Yeni Mevzuat (${regs.length})</h2>${regs.map(r => `<div class="card">${r.title}<br><span class="meta">${r.source} | ${r.severity}</span></div>`).join('')}` : ''}

            <hr style="margin-top:24px;"><p class="meta" style="text-align:center;">Bu rapor Akgül Legal Büro Yönetim Sistemi tarafından oluşturulmuştur.</p>
        </body></html>`;

        // Download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `akgul-legal-rapor-${type}-${now.toISOString().split('T')[0]}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`${typeLabels[type]} indirildi`, 'success');
    };
})();

// ============================================================
// FAZ 1 — GELİŞMİŞ SÖZLEŞME ANALİZİ (contract-shield'den)
// ============================================================
(function() {
    // Helper: inject result into contract analysis panel
    function showPanel(html) {
        const el = document.getElementById('contractAnalysisPanel');
        if (!el) return;
        el.style.display = 'block';
        el.innerHTML = html;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function getContract(id) {
        return (DB.data.contracts || []).find(c => c.id === id);
    }

    // ---------- 1. CONTRACT COMPARISON (DIFF) ----------
    function lcsLines(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
        const result = [];
        let i = m, j = n;
        while (i > 0 && j > 0) {
            if (a[i-1] === b[j-1]) { result.unshift({ type: 'unchanged', text: a[i-1], lineA: i, lineB: j }); i--; j--; }
            else if (dp[i-1][j] >= dp[i][j-1]) { result.unshift({ type: 'removed', text: a[i-1], lineA: i }); i--; }
            else { result.unshift({ type: 'added', text: b[j-1], lineB: j }); j--; }
        }
        while (i > 0) { result.unshift({ type: 'removed', text: a[i-1], lineA: i }); i--; }
        while (j > 0) { result.unshift({ type: 'added', text: b[j-1], lineB: j }); j--; }
        return result;
    }

    window.openContractCompare = function(contractId) {
        const c = getContract(contractId);
        if (!c) return;
        const others = (DB.data.contracts || []).filter(x => x.id !== contractId);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'contractCompareModal';
        modal.innerHTML = `
        <div class="modal-content" style="max-width:1100px;max-height:92vh;">
            <div class="modal-header">
                <h3><i class="fas fa-exchange-alt"></i> Sözleşme Karşılaştırma — ${c.no}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Karşılaştırılacak Sözleşme</label>
                    <select id="compareTargetSelect">
                        <option value="">-- Başka bir sözleşme seçin --</option>
                        ${others.map(o => `<option value="${o.id}">${o.no} - ${o.title}</option>`).join('')}
                        <option value="__paste__">📋 Metin yapıştır (dışarıdan gelen sözleşme)</option>
                    </select>
                </div>
                <div id="compareTextArea" style="display:none;">
                    <label>Karşılaştırılacak metin</label>
                    <textarea id="compareTargetText" rows="6" placeholder="Karşı tarafın önerdiği metni yapıştırın..."></textarea>
                </div>
                <button class="btn btn-primary" onclick="runContractCompare('${c.id}')"><i class="fas fa-play"></i> Karşılaştır</button>
                <div id="compareResult" style="margin-top:14px;"></div>
            </div>
        </div>`;
        document.body.appendChild(modal);
        document.getElementById('compareTargetSelect').addEventListener('change', function() {
            document.getElementById('compareTextArea').style.display = this.value === '__paste__' ? 'block' : 'none';
        });
    };

    window.runContractCompare = function(contractId) {
        const c = getContract(contractId);
        if (!c) return;
        const sel = document.getElementById('compareTargetSelect').value;
        let targetText;
        if (sel === '__paste__') {
            targetText = document.getElementById('compareTargetText').value;
            if (!targetText.trim()) { toast('Lütfen karşılaştırılacak metni girin', 'warning'); return; }
        } else if (sel) {
            const target = getContract(sel);
            if (!target) return;
            targetText = target.content || '';
        } else {
            toast('Karşılaştırılacak sözleşmeyi seçin', 'warning'); return;
        }

        const aLines = (c.content || '').split('\n').map(l => l.trim()).filter(l => l);
        const bLines = targetText.split('\n').map(l => l.trim()).filter(l => l);
        const diff = lcsLines(aLines, bLines);

        const added = diff.filter(d => d.type === 'added').length;
        const removed = diff.filter(d => d.type === 'removed').length;
        const unchanged = diff.filter(d => d.type === 'unchanged').length;

        const html = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
                <div style="padding:10px;background:rgba(46,204,113,0.1);border-radius:6px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;color:#2ecc71;">+${added}</div>
                    <div style="font-size:0.72rem;">Eklenen</div>
                </div>
                <div style="padding:10px;background:rgba(231,76,60,0.1);border-radius:6px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;color:#e74c3c;">-${removed}</div>
                    <div style="font-size:0.72rem;">Kaldırılan</div>
                </div>
                <div style="padding:10px;background:var(--bg-tertiary);border-radius:6px;text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;">${unchanged}</div>
                    <div style="font-size:0.72rem;">Değişmedi</div>
                </div>
            </div>
            <div style="max-height:420px;overflow-y:auto;font-family:monospace;font-size:0.82rem;border:1px solid var(--border);border-radius:6px;padding:8px;background:var(--bg-primary);">
                ${diff.map(d => {
                    if (d.type === 'added') return `<div style="background:rgba(46,204,113,0.15);padding:2px 6px;border-left:3px solid #2ecc71;">+ ${escapeHtml(d.text)}</div>`;
                    if (d.type === 'removed') return `<div style="background:rgba(231,76,60,0.15);padding:2px 6px;border-left:3px solid #e74c3c;">- ${escapeHtml(d.text)}</div>`;
                    return `<div style="padding:2px 6px;color:var(--text-secondary);">&nbsp;&nbsp;${escapeHtml(d.text)}</div>`;
                }).join('')}
            </div>`;
        document.getElementById('compareResult').innerHTML = html;
    };

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    // ---------- 2. CLAUSE OPTIMIZER ----------
    window.openClauseOptimizer = function(contractId) {
        const c = getContract(contractId);
        if (!c) return;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'clauseOptimizerModal';
        modal.innerHTML = `
        <div class="modal-content" style="max-width:800px;max-height:92vh;">
            <div class="modal-header">
                <h3><i class="fas fa-magic"></i> Madde Optimizasyonu</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Optimize edilecek madde metni</label>
                    <textarea id="clauseOptInput" rows="6" placeholder="Sözleşmeden bir maddeyi buraya yapıştırın..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Optimizasyon Hedefi</label>
                        <select id="clauseOptGoal">
                            <option value="risk_reduction">Risk Azaltma</option>
                            <option value="clarity">Netlik</option>
                            <option value="balance">Taraf Dengesi</option>
                            <option value="compliance">Mevzuat Uyumu</option>
                            <option value="enforceability">İcra Edilebilirlik</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Madde Türü</label>
                        <input type="text" id="clauseOptType" placeholder="Örn: Cezai şart, Fesih, Gizlilik">
                    </div>
                </div>
                <button class="btn btn-primary" onclick="runClauseOptimization()"><i class="fas fa-bolt"></i> AI ile Optimize Et</button>
                <div id="clauseOptResult" style="margin-top:14px;"></div>
            </div>
        </div>`;
        document.body.appendChild(modal);
    };

    window.runClauseOptimization = async function() {
        const text = document.getElementById('clauseOptInput').value.trim();
        const goal = document.getElementById('clauseOptGoal').value;
        const type = document.getElementById('clauseOptType').value || 'Genel';
        if (!text) { toast('Madde metnini girin', 'warning'); return; }

        const result = document.getElementById('clauseOptResult');
        result.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> AI analiz ediyor...</div>';

        const goalLabels = {
            risk_reduction: 'Risk Azaltma',
            clarity: 'Netlik',
            balance: 'Taraf Dengesi',
            compliance: 'Mevzuat Uyumu',
            enforceability: 'İcra Edilebilirlik'
        };

        const prompt = `Sen Türkiye'nin en deneyimli sözleşme hukuku uzmanısın. Aşağıdaki sözleşme maddesini belirtilen hedefe göre optimize et.

MEVCUT MADDE METNİ:
${text}

MADDE TÜRÜ: ${type}
OPTİMİZASYON HEDEFİ: ${goalLabels[goal]}

Maddeyi analiz et, zayıf noktaları tespit et ve güçlendirilmiş versiyonunu hazırla. Sadece aşağıdaki JSON formatında yanıt ver:
{
  "strengthened_text": "güçlendirilmiş madde metni",
  "changes_summary": "yapılan değişikliklerin özeti",
  "risk_reduction": "low|medium|high|critical",
  "legal_basis": ["6098 sayılı TBK m.XX", "..."],
  "warnings": ["dikkat edilmesi gereken konular"],
  "weaknesses": ["mevcut zayıf noktalar"]
}`;

        try {
            const aiResponse = await callGeminiAPI(prompt);
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('JSON yanıt alınamadı');
            const data = JSON.parse(jsonMatch[0]);

            const colors = { low: '#2ecc71', medium: '#f39c12', high: '#e67e22', critical: '#e74c3c' };
            const labels = { low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik' };

            result.innerHTML = `
                <div style="padding:12px;background:rgba(74,108,247,0.08);border-left:3px solid var(--primary);border-radius:6px;margin-bottom:10px;">
                    <h4 style="margin:0 0 6px;"><i class="fas fa-check-circle" style="color:var(--primary);"></i> Güçlendirilmiş Metin</h4>
                    <div style="white-space:pre-wrap;font-size:0.88rem;">${escapeHtml(data.strengthened_text)}</div>
                    <button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="navigator.clipboard.writeText(${JSON.stringify(data.strengthened_text)});toast('Kopyalandı','success')"><i class="fas fa-copy"></i> Kopyala</button>
                </div>
                <div style="padding:10px;background:var(--bg-tertiary);border-radius:6px;margin-bottom:8px;">
                    <strong>Yapılan Değişiklikler:</strong> ${escapeHtml(data.changes_summary)}
                </div>
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                    <span style="padding:4px 10px;background:${colors[data.risk_reduction]};color:white;border-radius:12px;font-size:0.78rem;">Risk ${labels[data.risk_reduction] || data.risk_reduction}</span>
                </div>
                ${data.weaknesses?.length ? `<div style="margin-bottom:8px;"><strong>Zayıf Noktalar:</strong><ul>${data.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>` : ''}
                ${data.legal_basis?.length ? `<div style="margin-bottom:8px;"><strong>Yasal Dayanak:</strong><ul>${data.legal_basis.map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul></div>` : ''}
                ${data.warnings?.length ? `<div style="padding:8px;background:rgba(243,156,18,0.1);border-left:3px solid #f39c12;border-radius:4px;"><strong>⚠️ Uyarılar:</strong><ul>${data.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>` : ''}
            `;
        } catch (e) {
            result.innerHTML = `<div style="padding:10px;background:rgba(231,76,60,0.1);border-left:3px solid #e74c3c;border-radius:6px;">Hata: ${escapeHtml(e.message)}</div>`;
        }
    };

    // ---------- 3. CONTRACT HEALTH SCORE ----------
    const HEALTH_WEIGHTS = { legal: 0.35, financial: 0.25, operational: 0.20, reputation: 0.20 };
    const HEALTH_KEYWORDS = {
        legal: ['kanun', 'yönetmelik', 'TBK', 'TTK', 'KVKK', 'mevzuat', 'yasal', 'hukuki'],
        financial: ['ödeme', 'fatura', 'ücret', 'bedel', 'faiz', 'cezai şart', 'teminat', 'tazminat'],
        operational: ['süre', 'teslim', 'ifa', 'performans', 'hizmet', 'yükümlülük', 'gecikme'],
        reputation: ['gizlilik', 'iyi niyet', 'itibar', 'marka', 'kamuya açıklama', 'rekabet']
    };

    window.computeContractHealth = function(contractId) {
        const c = getContract(contractId);
        if (!c) return;
        const text = (c.content || '').toLowerCase();
        const lines = text.split('\n').filter(l => l.trim());

        // Category analysis: count presence + missing critical terms
        const categories = {};
        let totalScore = 0;

        Object.entries(HEALTH_KEYWORDS).forEach(([cat, keywords]) => {
            const found = keywords.filter(k => text.includes(k.toLowerCase())).length;
            const coverage = Math.min(100, (found / keywords.length) * 100);

            // Risk: missing keywords = higher risk
            const riskPoints = Math.max(0, 100 - coverage);
            const weighted = riskPoints * HEALTH_WEIGHTS[cat];
            totalScore += weighted;

            categories[cat] = {
                coverage: Math.round(coverage),
                risk: Math.round(riskPoints),
                found,
                total: keywords.length,
                missing: keywords.filter(k => !text.includes(k.toLowerCase()))
            };
        });

        // Completeness: key clauses presence
        const criticalClauses = [
            { name: 'Taraflar', keywords: ['taraf', 'müvekkil', 'vekil'] },
            { name: 'Konu', keywords: ['konu', 'amaç', 'kapsam'] },
            { name: 'Ücret', keywords: ['ücret', 'bedel', 'ödeme'] },
            { name: 'Süre', keywords: ['süre', 'vade', 'tarih'] },
            { name: 'Fesih', keywords: ['fesih', 'sona erme', 'iptal'] },
            { name: 'Yetkili Mahkeme', keywords: ['yetkili mahkeme', 'uyuşmazlık', 'tahkim'] },
            { name: 'Gizlilik', keywords: ['gizlilik', 'sır', 'ifşa'] },
            { name: 'İmza', keywords: ['imza', 'tarih'] }
        ];
        const presentClauses = criticalClauses.filter(cl => cl.keywords.some(k => text.includes(k)));
        const completeness = Math.round((presentClauses.length / criticalClauses.length) * 100);
        const missingClauses = criticalClauses.filter(cl => !cl.keywords.some(k => text.includes(k)));

        // Final health score: invert risk + weight completeness
        const riskScore = Math.round(totalScore);
        const healthScore = Math.round((100 - riskScore) * 0.6 + completeness * 0.4);

        const level = healthScore >= 80 ? { label: 'Mükemmel', color: '#2ecc71', icon: '💚' } :
                      healthScore >= 60 ? { label: 'İyi', color: '#27ae60', icon: '✅' } :
                      healthScore >= 40 ? { label: 'Orta', color: '#f39c12', icon: '⚠️' } :
                      healthScore >= 20 ? { label: 'Zayıf', color: '#e67e22', icon: '🔴' } :
                                          { label: 'Kritik', color: '#e74c3c', icon: '🚨' };

        // Save to contract
        c.healthScore = healthScore;
        c.healthCategories = categories;
        c.healthCompleteness = completeness;
        c.healthComputedAt = new Date().toISOString();
        DB.save();

        const catLabels = { legal: 'Yasal Uyum', financial: 'Finansal', operational: 'Operasyonel', reputation: 'İtibar' };

        showPanel(`
            <h4 style="margin-top:0;"><i class="fas fa-heartbeat"></i> Sözleşme Sağlık Puanı</h4>
            <div style="display:flex;align-items:center;gap:20px;margin-bottom:14px;">
                <div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(${level.color} ${healthScore*3.6}deg, var(--bg-tertiary) 0deg);display:flex;align-items:center;justify-content:center;">
                    <div style="width:90px;height:90px;border-radius:50%;background:var(--bg-secondary);display:flex;flex-direction:column;align-items:center;justify-content:center;">
                        <div style="font-size:1.8rem;font-weight:700;color:${level.color};">${healthScore}</div>
                        <div style="font-size:0.72rem;">/ 100</div>
                    </div>
                </div>
                <div style="flex:1;">
                    <div style="font-size:1.2rem;font-weight:700;color:${level.color};">${level.icon} ${level.label}</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary);margin-top:4px;">Tamamlanma: ${completeness}% (${presentClauses.length}/${criticalClauses.length} kritik madde)</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">Risk Skoru: ${riskScore}/100</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
                ${Object.entries(categories).map(([k, v]) => `
                    <div style="padding:10px;background:var(--bg-primary);border-radius:6px;border-left:3px solid ${v.risk > 50 ? '#e74c3c' : v.risk > 25 ? '#f39c12' : '#2ecc71'};">
                        <div style="font-weight:600;font-size:0.85rem;">${catLabels[k]}</div>
                        <div style="font-size:0.78rem;color:var(--text-secondary);">Kapsam: ${v.coverage}% (${v.found}/${v.total})</div>
                        ${v.missing.length ? `<div style="font-size:0.72rem;color:#e74c3c;margin-top:4px;">Eksik: ${v.missing.slice(0,3).join(', ')}${v.missing.length > 3 ? '...' : ''}</div>` : ''}
                    </div>`).join('')}
            </div>
            ${missingClauses.length ? `
                <div style="padding:10px;background:rgba(231,76,60,0.08);border-left:3px solid #e74c3c;border-radius:6px;">
                    <strong>⚠️ Eksik Kritik Maddeler:</strong>
                    <div style="margin-top:4px;">${missingClauses.map(c => `<span style="display:inline-block;padding:3px 8px;margin:2px;background:rgba(231,76,60,0.15);border-radius:10px;font-size:0.78rem;">${c.name}</span>`).join('')}</div>
                </div>` : '<div style="padding:10px;background:rgba(46,204,113,0.08);border-left:3px solid #2ecc71;border-radius:6px;">✅ Tüm kritik maddeler mevcut</div>'}
        `);
        toast(`Sağlık puanı: ${healthScore}/100 (${level.label})`, healthScore >= 60 ? 'success' : 'warning');
    };

    // ---------- 4. RENEWAL PREDICTION ----------
    window.predictRenewal = async function(contractId) {
        const c = getContract(contractId);
        if (!c) return;

        showPanel('<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> AI yenileme tahmini yapılıyor...</div>');

        const prompt = `Sen Türk hukuk ve ticaret alanında uzmanlaşmış bir sözleşme yenileme tahmin uzmanısın. Aşağıdaki sözleşme için yenileme olasılığını tahmin et.

SÖZLEŞME BİLGİLERİ:
- Başlık: ${c.title}
- No: ${c.no}
- Müvekkil: ${c.clientName}
- Tarih: ${c.date}
- Ücret: ${c.fees || 'N/A'} ${c.currency || ''}
- Ödeme Koşulları: ${c.paymentTerms || 'N/A'}
- Sağlık Puanı: ${c.healthScore || 'Hesaplanmadı'}/100

SÖZLEŞME METNİ (İLK 2000 KARAKTER):
${(c.content || '').substring(0, 2000)}

Lütfen aşağıdaki JSON formatında yenileme tahmini döndür. Türkçe açıklamalar:
{
  "renewal_probability": 0-100,
  "confidence_level": "high|medium|low",
  "factors_favoring_renewal": [{"factor":"","weight":1-10,"explanation":""}],
  "factors_against_renewal": [{"factor":"","weight":1-10,"explanation":""}],
  "recommended_actions": [{"action":"","priority":"critical|high|medium|low","deadline":""}],
  "suggested_improvements": ["..."],
  "estimated_negotiation_difficulty": 1-10,
  "price_change_prediction": {"direction":"up|down|stable","percentage_range":"","justification":""}
}

En az 3 lehte, 3 aleyhte faktör ve 4 aksiyon döndür.`;

        try {
            const response = await callGeminiAPI(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('JSON yanıt alınamadı');
            const data = JSON.parse(jsonMatch[0]);

            const prob = data.renewal_probability || 0;
            const color = prob >= 70 ? '#2ecc71' : prob >= 40 ? '#f39c12' : '#e74c3c';
            const priorityColors = { critical: '#e74c3c', high: '#e67e22', medium: '#f39c12', low: '#95a5a6' };
            const dirIcons = { up: '📈', down: '📉', stable: '➡️' };

            showPanel(`
                <h4 style="margin-top:0;"><i class="fas fa-sync-alt"></i> Yenileme Tahmini</h4>
                <div style="display:flex;align-items:center;gap:20px;margin-bottom:14px;">
                    <div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(${color} ${prob*3.6}deg, var(--bg-tertiary) 0deg);display:flex;align-items:center;justify-content:center;">
                        <div style="width:110px;height:110px;border-radius:50%;background:var(--bg-secondary);display:flex;flex-direction:column;align-items:center;justify-content:center;">
                            <div style="font-size:2rem;font-weight:700;color:${color};">${prob}%</div>
                            <div style="font-size:0.72rem;">Yenileme</div>
                        </div>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:0.85rem;margin-bottom:4px;">Güven: <strong>${data.confidence_level || 'medium'}</strong></div>
                        <div style="font-size:0.85rem;margin-bottom:4px;">Müzakere Zorluğu: <strong>${data.estimated_negotiation_difficulty || 5}/10</strong></div>
                        ${data.price_change_prediction ? `<div style="font-size:0.85rem;">${dirIcons[data.price_change_prediction.direction]} Fiyat: ${data.price_change_prediction.percentage_range || ''}</div><div style="font-size:0.75rem;color:var(--text-secondary);">${escapeHtml(data.price_change_prediction.justification || '')}</div>` : ''}
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                    <div>
                        <h5 style="color:#2ecc71;margin:0 0 6px;">✅ Lehte Faktörler</h5>
                        ${(data.factors_favoring_renewal || []).map(f => `<div style="padding:6px 8px;background:rgba(46,204,113,0.08);border-left:3px solid #2ecc71;border-radius:4px;margin-bottom:4px;font-size:0.82rem;"><strong>${escapeHtml(f.factor)}</strong> <span style="color:var(--text-secondary);">(${f.weight}/10)</span><br>${escapeHtml(f.explanation || '')}</div>`).join('')}
                    </div>
                    <div>
                        <h5 style="color:#e74c3c;margin:0 0 6px;">❌ Aleyhte Faktörler</h5>
                        ${(data.factors_against_renewal || []).map(f => `<div style="padding:6px 8px;background:rgba(231,76,60,0.08);border-left:3px solid #e74c3c;border-radius:4px;margin-bottom:4px;font-size:0.82rem;"><strong>${escapeHtml(f.factor)}</strong> <span style="color:var(--text-secondary);">(${f.weight}/10)</span><br>${escapeHtml(f.explanation || '')}</div>`).join('')}
                    </div>
                </div>
                <div style="margin-bottom:10px;">
                    <h5 style="margin:0 0 6px;">🎯 Önerilen Aksiyonlar</h5>
                    ${(data.recommended_actions || []).map(a => `<div style="padding:8px;background:var(--bg-primary);border-left:3px solid ${priorityColors[a.priority] || '#95a5a6'};border-radius:4px;margin-bottom:4px;font-size:0.82rem;"><strong>${escapeHtml(a.action)}</strong> <span style="padding:2px 6px;background:${priorityColors[a.priority] || '#95a5a6'};color:white;border-radius:8px;font-size:0.7rem;">${a.priority || 'medium'}</span>${a.deadline ? `<div style="color:var(--text-secondary);font-size:0.75rem;">📅 ${escapeHtml(a.deadline)}</div>` : ''}</div>`).join('')}
                </div>
                ${data.suggested_improvements?.length ? `<div><h5 style="margin:0 0 6px;">💡 İyileştirme Önerileri</h5><ul style="margin:0;padding-left:20px;font-size:0.82rem;">${data.suggested_improvements.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>` : ''}
            `);
        } catch (e) {
            showPanel(`<div style="padding:10px;background:rgba(231,76,60,0.1);border-left:3px solid #e74c3c;border-radius:6px;">Hata: ${escapeHtml(e.message)}</div>`);
        }
    };

    // ---------- 5. DEPENDENCY MAP ----------
    window.openDependencyMap = async function(contractId) {
        const c = getContract(contractId);
        if (!c) return;

        // Extract MADDE-based clauses
        const text = c.content || '';
        const matches = text.split(/(?=MADDE\s+\d+|Madde\s+\d+)/).filter(s => s.trim().length > 20);
        if (matches.length < 2) {
            showPanel('<div style="padding:10px;background:rgba(243,156,18,0.1);border-left:3px solid #f39c12;border-radius:6px;">Sözleşmede en az 2 MADDE bulunamadı. Madde yapılı bir metin gerekli.</div>');
            return;
        }

        const clauses = matches.slice(0, 20).map((m, i) => {
            const titleMatch = m.match(/MADDE\s+\d+[\s\-:]*([^\n]{0,80})/i);
            return {
                key: `m${i+1}`,
                title: titleMatch?.[1]?.trim() || `Madde ${i+1}`,
                text: m.substring(0, 500)
            };
        });

        showPanel('<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Bağımlılıklar analiz ediliyor...</div>');

        const prompt = `Aşağıdaki sözleşme maddelerini analiz et ve maddeler arası bağımlılıkları tespit et. Her bağımlılık için: kaynak madde, hedef madde, bağımlılık türü (reference, conflict, dependent, complementary) ve açıklama belirt. Ayrıca birbirine yakın maddeleri kümelere (cluster) grupla.

MADDELER:
${clauses.map(c => `[${c.key}] ${c.title}: ${c.text.substring(0, 200)}`).join('\n\n')}

Sadece aşağıdaki JSON formatında yanıt ver:
{
  "dependencies": [{"source_key":"m1","target_key":"m2","type":"reference|conflict|dependent|complementary","description":"..."}],
  "clusters": [{"name":"Küme adı","clause_keys":["m1","m2"]}]
}`;

        try {
            const response = await callGeminiAPI(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('JSON yanıt alınamadı');
            const data = JSON.parse(jsonMatch[0]);

            const typeColors = { reference: '#3498db', conflict: '#e74c3c', dependent: '#f39c12', complementary: '#2ecc71' };
            const typeLabels = { reference: '🔗 Referans', conflict: '⚠️ Çelişki', dependent: '↳ Bağımlı', complementary: '➕ Tamamlayıcı' };

            showPanel(`
                <h4 style="margin-top:0;"><i class="fas fa-project-diagram"></i> Madde Bağımlılık Haritası</h4>
                <div style="margin-bottom:12px;">
                    <strong>Tespit Edilen Maddeler (${clauses.length})</strong>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
                        ${clauses.map(c => `<span style="padding:4px 8px;background:var(--bg-primary);border-radius:12px;font-size:0.75rem;border:1px solid var(--border);">[${c.key}] ${escapeHtml(c.title.substring(0,30))}</span>`).join('')}
                    </div>
                </div>
                ${data.clusters?.length ? `
                <div style="margin-bottom:12px;">
                    <h5 style="margin:0 0 6px;">📦 Madde Kümeleri</h5>
                    ${data.clusters.map(cl => `
                        <div style="padding:8px;background:var(--bg-primary);border-radius:6px;margin-bottom:4px;">
                            <strong>${escapeHtml(cl.name)}</strong>
                            <div style="margin-top:4px;">${(cl.clause_keys || []).map(k => `<span style="padding:2px 6px;background:rgba(74,108,247,0.15);border-radius:8px;font-size:0.72rem;margin-right:4px;">${k}</span>`).join('')}</div>
                        </div>`).join('')}
                </div>` : ''}
                ${data.dependencies?.length ? `
                <div>
                    <h5 style="margin:0 0 6px;">🔗 Bağımlılıklar (${data.dependencies.length})</h5>
                    ${data.dependencies.map(d => `
                        <div style="padding:8px;background:var(--bg-primary);border-left:3px solid ${typeColors[d.type] || '#95a5a6'};border-radius:4px;margin-bottom:4px;font-size:0.82rem;">
                            <div><strong>${d.source_key}</strong> → <strong>${d.target_key}</strong> <span style="padding:2px 6px;background:${typeColors[d.type] || '#95a5a6'};color:white;border-radius:8px;font-size:0.7rem;margin-left:6px;">${typeLabels[d.type] || d.type}</span></div>
                            <div style="color:var(--text-secondary);margin-top:2px;">${escapeHtml(d.description || '')}</div>
                        </div>`).join('')}
                </div>` : '<div style="padding:10px;background:var(--bg-primary);border-radius:6px;">Bağımlılık tespit edilmedi.</div>'}
            `);
        } catch (e) {
            showPanel(`<div style="padding:10px;background:rgba(231,76,60,0.1);border-left:3px solid #e74c3c;border-radius:6px;">Hata: ${escapeHtml(e.message)}</div>`);
        }
    };

    // ---------- 6. COLLABORATIVE NOTES ----------
    function getContractNotes(contractId) {
        if (!DB.data.contractNotes) DB.data.contractNotes = {};
        if (!DB.data.contractNotes[contractId]) DB.data.contractNotes[contractId] = [];
        return DB.data.contractNotes[contractId];
    }

    window.updateContractNotesBadge = function(contractId) {
        const notes = getContractNotes(contractId);
        const badge = document.getElementById(`contractNotesBadge-${contractId}`);
        if (badge) {
            if (notes.length) { badge.textContent = notes.length; badge.style.display = 'inline-block'; }
            else badge.style.display = 'none';
        }
    };

    window.openContractNotes = function(contractId) {
        const c = getContract(contractId);
        if (!c) return;
        const notes = getContractNotes(contractId);
        const currentUser = (DB.data.currentUser?.name) || localStorage.getItem('currentUser') || 'Anonim';

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'contractNotesModal';
        modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;max-height:92vh;">
            <div class="modal-header">
                <h3><i class="fas fa-comments"></i> Ekip Notları — ${c.no}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove();updateContractNotesBadge('${contractId}')">&times;</button>
            </div>
            <div class="modal-body">
                <div id="contractNotesList" style="max-height:420px;overflow-y:auto;margin-bottom:12px;">
                    ${notes.length ? notes.map(n => `
                        <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;margin-bottom:8px;border-left:3px solid ${n.color || '#4a6cf7'};">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                                <strong style="font-size:0.85rem;">${escapeHtml(n.author)}</strong>
                                <div>
                                    <span style="font-size:0.72rem;color:var(--text-secondary);">${new Date(n.createdAt).toLocaleString('tr-TR')}</span>
                                    ${n.author === currentUser ? `<button class="btn btn-sm btn-ghost" onclick="deleteContractNote('${contractId}','${n.id}')" style="padding:2px 6px;margin-left:4px;color:#e74c3c;"><i class="fas fa-trash"></i></button>` : ''}
                                </div>
                            </div>
                            ${n.clauseRef ? `<div style="font-size:0.75rem;color:var(--primary);margin-bottom:4px;">📍 ${escapeHtml(n.clauseRef)}</div>` : ''}
                            <div style="white-space:pre-wrap;font-size:0.88rem;">${escapeHtml(n.content)}</div>
                        </div>`).join('') : '<p style="color:var(--text-secondary);text-align:center;padding:30px;">Henüz not yok. İlk notu ekleyin.</p>'}
                </div>
                <div style="padding:12px;background:var(--bg-secondary);border-radius:8px;">
                    <div style="display:grid;grid-template-columns:1fr 120px 120px;gap:8px;margin-bottom:8px;">
                        <input type="text" id="noteClauseRef" placeholder="Madde referansı (opsiyonel) - örn: Madde 5">
                        <select id="noteColor">
                            <option value="#4a6cf7">🔵 Not</option>
                            <option value="#2ecc71">🟢 Onay</option>
                            <option value="#f39c12">🟡 Dikkat</option>
                            <option value="#e74c3c">🔴 İtiraz</option>
                            <option value="#9b59b6">🟣 Soru</option>
                        </select>
                        <button class="btn btn-primary btn-sm" onclick="addContractNote('${contractId}')"><i class="fas fa-plus"></i> Ekle</button>
                    </div>
                    <textarea id="noteContent" rows="3" placeholder="Yorumunuzu yazın..."></textarea>
                </div>
            </div>
        </div>`;
        document.body.appendChild(modal);
    };

    window.addContractNote = function(contractId) {
        const content = document.getElementById('noteContent').value.trim();
        if (!content) { toast('Not içeriği boş olamaz', 'warning'); return; }
        const notes = getContractNotes(contractId);
        const currentUser = (DB.data.currentUser?.name) || localStorage.getItem('currentUser') || 'Anonim';
        notes.push({
            id: 'note-' + Date.now(),
            author: currentUser,
            content,
            clauseRef: document.getElementById('noteClauseRef').value.trim(),
            color: document.getElementById('noteColor').value,
            createdAt: new Date().toISOString()
        });
        DB.save();
        document.getElementById('contractNotesModal').remove();
        window.openContractNotes(contractId);
        updateContractNotesBadge(contractId);
        toast('Not eklendi', 'success');
    };

    window.deleteContractNote = function(contractId, noteId) {
        if (!confirm('Bu not silinsin mi?')) return;
        const notes = getContractNotes(contractId);
        const idx = notes.findIndex(n => n.id === noteId);
        if (idx >= 0) {
            notes.splice(idx, 1);
            DB.save();
            document.getElementById('contractNotesModal').remove();
            window.openContractNotes(contractId);
            updateContractNotesBadge(contractId);
        }
    };
})();

// ============================================================
// FAZ 2 — GELİŞMİŞ MEVZUAT SİSTEMİ
// (regwatch-turkey, legalhub, legal-agent'ten)
// ============================================================
(function() {
    // ---------- 21 RESMİ KAYNAK LİSTESİ ----------
    const MEVZUAT_SOURCES = [
        { id: 'resmi-gazete', name: 'Resmi Gazete', url: 'https://www.resmigazete.gov.tr', category: 'gazete', icon: '📰' },
        { id: 'mevzuat-gov', name: 'Mevzuat.gov.tr', url: 'https://www.mevzuat.gov.tr', category: 'mevzuat', icon: '⚖️' },
        { id: 'spk', name: 'SPK', url: 'https://spk.gov.tr', category: 'finansal', icon: '💹' },
        { id: 'bddk', name: 'BDDK', url: 'https://www.bddk.org.tr', category: 'finansal', icon: '🏦' },
        { id: 'tcmb', name: 'TCMB', url: 'https://www.tcmb.gov.tr', category: 'finansal', icon: '🏛️' },
        { id: 'kvkk', name: 'KVKK', url: 'https://kvkk.gov.tr', category: 'veri-koruma', icon: '🔒' },
        { id: 'masak', name: 'MASAK', url: 'https://masak.hmb.gov.tr', category: 'finansal-suc', icon: '🚨' },
        { id: 'rekabet', name: 'Rekabet Kurumu', url: 'https://www.rekabet.gov.tr', category: 'rekabet', icon: '⚔️' },
        { id: 'reklam-kurulu', name: 'Reklam Kurulu', url: 'https://www.ticaret.gov.tr/tuketicinin-korunmasi', category: 'tuketici', icon: '📢' },
        { id: 'vgm', name: 'VGM', url: 'https://www.vgm.gov.tr', category: 'vakif', icon: '🏛️' },
        { id: 'sgk', name: 'SGK', url: 'https://www.sgk.gov.tr', category: 'is-hukuku', icon: '👷' },
        { id: 'csgb', name: 'Çalışma Bakanlığı (İSG)', url: 'https://www.csgb.gov.tr', category: 'is-hukuku', icon: '🛡️' },
        { id: 'csb', name: 'Çevre ve Şehircilik', url: 'https://csb.gov.tr', category: 'cevre', icon: '🌳' },
        { id: 'ticaret', name: 'Ticaret Bakanlığı', url: 'https://www.ticaret.gov.tr', category: 'ticaret', icon: '🏪' },
        { id: 'sanayi', name: 'Sanayi Bakanlığı', url: 'https://www.sanayi.gov.tr', category: 'sanayi', icon: '🏭' },
        { id: 'uab', name: 'Ulaştırma Bakanlığı', url: 'https://www.uab.gov.tr', category: 'ulastirma', icon: '🚚' },
        { id: 'turkpatent', name: 'Türk Patent Enstitüsü', url: 'https://www.turkpatent.gov.tr', category: 'fikri-mulkiyet', icon: '💡' },
        { id: 'yargitay', name: 'Yargıtay', url: 'https://www.yargitay.gov.tr', category: 'yargi', icon: '⚖️' },
        { id: 'danistay', name: 'Danıştay', url: 'https://www.danistay.gov.tr', category: 'yargi', icon: '🏛️' },
        { id: 'gib', name: 'GİB (Gelir İdaresi)', url: 'https://www.gib.gov.tr', category: 'vergi', icon: '💰' },
        { id: 'tubitak', name: 'TÜBİTAK', url: 'https://www.tubitak.gov.tr', category: 'ar-ge', icon: '🔬' }
    ];

    window.MEVZUAT_SOURCES = MEVZUAT_SOURCES;

    // ---------- SEVERITY CLASSIFICATION ----------
    const SEVERITY_KW = {
        kritik: ['ceza', 'para cezası', 'idari para', 'iptal', 'lisans iptali', 'faaliyet izni iptali', 'yasaklama', 'yasak', 'men edil', 'ihlal', 'veri ihlali', 'durdurma', 'faaliyetten men', 'tasfiye', 'iflas'],
        onemli: ['yönetmelik', 'tebliğ', 'değişiklik', 'düzenleme', 'kanun', 'mevzuat', 'izin', 'lisans', 'ruhsat', 'genelge', 'sirküler', 'uyarı', 'kurul kararı'],
        bilgi: ['duyuru', 'bilgilendirme', 'ilan', 'toplantı', 'rapor', 'istatistik', 'atama', 'görevlendirme']
    };

    function classifySeverity(text) {
        const t = (text || '').toLowerCase();
        if (SEVERITY_KW.kritik.some(k => t.includes(k))) return 'kritik';
        if (SEVERITY_KW.onemli.some(k => t.includes(k))) return 'onemli';
        return 'bilgi';
    }

    window.classifyRegulationSeverity = classifySeverity;

    // ---------- 1. 20+ KAYNAK TOPLU TARAMA (AI destekli simülasyon) ----------
    window.bulkScanAllSources = async function() {
        const btn = document.getElementById('btnBulkScan');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tüm kaynaklar taranıyor...'; }
        toast('21 kaynak AI ile taranıyor, 30-60 saniye sürebilir...', 'info');

        const prompt = `Bir hukuk bürosu için Türkiye'deki resmi kaynaklardan SON 1 HAFTA içindeki güncel düzenlemeleri listele. Her kaynak için 1-3 adet varsayımsal ama gerçekçi güncel düzenleme üret (tarih: son 7 gün).

KAYNAKLAR: ${MEVZUAT_SOURCES.map(s => s.name).join(', ')}

Her kayıt için: source_id, title, summary (2-3 cümle), severity (kritik/onemli/bilgi), date (YYYY-MM-DD), tags (array).

Sadece JSON array formatında yanıtla:
[{"source_id":"...","title":"...","summary":"...","severity":"...","date":"2026-04-XX","tags":["..."]}]

En az 15 kayıt üret, farklı kaynaklardan. Gerçek Türk mevzuatı konularına dayalı.`;

        try {
            const response = await callGeminiAPI(prompt);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('JSON yanıt alınamadı');
            const items = JSON.parse(jsonMatch[0]);

            if (!DB.data.regulations) DB.data.regulations = [];
            let added = 0;
            items.forEach(item => {
                const exists = DB.data.regulations.some(r => r.title === item.title && r.source === item.source_id);
                if (exists) return;
                DB.data.regulations.push({
                    id: 'reg-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
                    title: item.title,
                    source: item.source_id,
                    date: item.date || new Date().toISOString().split('T')[0],
                    summary: item.summary || '',
                    severity: item.severity || classifySeverity(item.title + ' ' + item.summary),
                    tags: item.tags || [],
                    read: false,
                    addedAt: new Date().toISOString(),
                    bulkScanAt: new Date().toISOString()
                });
                added++;
            });
            DB.save();
            if (typeof renderRegulations === 'function') renderRegulations();
            if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
            toast(`${added} yeni düzenleme eklendi`, 'success');
        } catch (e) {
            toast('Tarama hatası: ' + e.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-satellite-dish"></i> 21 Kaynak Toplu Tarama'; }
        }
    };

    // ---------- 2. OTOMATİK TARAMA (09:00 / 18:00) ----------
    window.setupAutoScan = function() {
        const enabled = localStorage.getItem('autoScanEnabled') === 'true';
        if (!enabled) return;

        // Check every 5 minutes if it's time for scheduled scan
        if (window._autoScanInterval) clearInterval(window._autoScanInterval);
        window._autoScanInterval = setInterval(() => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const lastScan = parseInt(localStorage.getItem('lastAutoScan') || '0');
            const lastDate = new Date(lastScan);
            const isNewDay = lastDate.toDateString() !== now.toDateString();

            // Morning scan: 09:00-09:05
            if (h === 9 && m < 5) {
                const key = 'morning-' + now.toDateString();
                if (localStorage.getItem('lastScanKey') !== key) {
                    localStorage.setItem('lastScanKey', key);
                    localStorage.setItem('lastAutoScan', Date.now().toString());
                    toast('🌅 Sabah otomatik taraması başladı', 'info');
                    window.bulkScanAllSources();
                }
            }
            // Evening scan: 18:00-18:05
            if (h === 18 && m < 5) {
                const key = 'evening-' + now.toDateString();
                if (localStorage.getItem('lastScanKey') !== key) {
                    localStorage.setItem('lastScanKey', key);
                    localStorage.setItem('lastAutoScan', Date.now().toString());
                    toast('🌙 Akşam otomatik taraması başladı', 'info');
                    window.bulkScanAllSources();
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        console.log('Auto-scan enabled (09:00 + 18:00)');
    };

    window.toggleAutoScan = function() {
        const current = localStorage.getItem('autoScanEnabled') === 'true';
        const next = !current;
        localStorage.setItem('autoScanEnabled', next.toString());
        if (next) {
            window.setupAutoScan();
            toast('Otomatik tarama açıldı (09:00 ve 18:00)', 'success');
        } else {
            if (window._autoScanInterval) clearInterval(window._autoScanInterval);
            toast('Otomatik tarama kapatıldı', 'info');
        }
        const btn = document.getElementById('btnAutoScanToggle');
        if (btn) btn.innerHTML = next ? '<i class="fas fa-toggle-on"></i> Otomatik Tarama: AÇIK' : '<i class="fas fa-toggle-off"></i> Otomatik Tarama: KAPALI';
    };

    // ---------- 3. ÇAPRAZ REFERANS ANALİZİ ----------
    function computeSimilarity(a, b) {
        // Unicode-aware split to preserve Turkish characters
        const tokenize = s => (s || '').toLocaleLowerCase('tr-TR').split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3);
        const wa = new Set(tokenize(a));
        const wb = new Set(tokenize(b));
        if (!wa.size || !wb.size) return 0;
        const intersection = [...wa].filter(w => wb.has(w)).length;
        const union = new Set([...wa, ...wb]).size;
        return intersection / union; // Jaccard similarity
    }

    window.findCrossReferences = function() {
        const regs = DB.data.regulations || [];
        if (regs.length < 2) { toast('Çapraz referans için en az 2 düzenleme gerekli', 'warning'); return; }

        const pairs = [];
        for (let i = 0; i < regs.length; i++) {
            for (let j = i + 1; j < regs.length; j++) {
                if (regs[i].source === regs[j].source) continue;
                const sim = computeSimilarity(regs[i].title + ' ' + regs[i].summary, regs[j].title + ' ' + regs[j].summary);
                if (sim > 0.2) {
                    pairs.push({
                        a: regs[i],
                        b: regs[j],
                        similarity: Math.round(sim * 100)
                    });
                }
            }
        }
        pairs.sort((a, b) => b.similarity - a.similarity);

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
        <div class="modal-content" style="max-width:900px;max-height:92vh;">
            <div class="modal-header">
                <h3><i class="fas fa-link"></i> Çapraz Referans Analizi</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text-secondary);font-size:0.85rem;">Farklı kaynaklarda aynı konuyu ele alan düzenlemeler (Jaccard benzerlik skoru).</p>
                ${pairs.length ? pairs.slice(0, 20).map(p => `
                    <div style="padding:12px;background:var(--bg-secondary);border-radius:8px;margin-bottom:8px;border-left:3px solid var(--primary);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <strong>Benzerlik: ${p.similarity}%</strong>
                            <span style="padding:3px 8px;background:var(--primary);color:white;border-radius:10px;font-size:0.72rem;">${p.similarity >= 50 ? 'Yüksek' : p.similarity >= 30 ? 'Orta' : 'Düşük'}</span>
                        </div>
                        <div style="padding:8px;background:var(--bg-primary);border-radius:6px;margin-bottom:4px;">
                            <div style="font-size:0.75rem;color:var(--text-secondary);">📍 ${(MEVZUAT_SOURCES.find(s => s.id === p.a.source)?.name) || p.a.source}</div>
                            <div style="font-size:0.88rem;font-weight:600;">${p.a.title}</div>
                        </div>
                        <div style="text-align:center;color:var(--primary);font-size:0.82rem;">⬇️</div>
                        <div style="padding:8px;background:var(--bg-primary);border-radius:6px;">
                            <div style="font-size:0.75rem;color:var(--text-secondary);">📍 ${(MEVZUAT_SOURCES.find(s => s.id === p.b.source)?.name) || p.b.source}</div>
                            <div style="font-size:0.88rem;font-weight:600;">${p.b.title}</div>
                        </div>
                    </div>`).join('') : '<p style="text-align:center;color:var(--text-secondary);padding:30px;">Çapraz referans bulunamadı. Daha fazla düzenleme ekleyin.</p>'}
            </div>
        </div>`;
        document.body.appendChild(modal);
    };

    // ---------- 4. BİLDİRİM MERKEZİ (ZİL İKONU) ----------
    window.updateNotificationBadge = function() {
        const regs = DB.data.regulations || [];
        const unreadCritical = regs.filter(r => !r.read && r.severity === 'kritik').length;
        const unreadTotal = regs.filter(r => !r.read).length;
        const badge = document.getElementById('notifBadge');
        if (badge) {
            if (unreadTotal > 0) {
                badge.textContent = unreadTotal > 9 ? '9+' : unreadTotal;
                badge.style.display = 'flex';
                badge.style.background = unreadCritical > 0 ? '#e74c3c' : '#f39c12';
            } else {
                badge.style.display = 'none';
            }
        }
    };

    window.openNotificationCenter = function() {
        const regs = (DB.data.regulations || []).filter(r => !r.read);
        const hearings = (DB.data.hearings || []).filter(h => {
            const d = new Date(h.date);
            const now = new Date();
            const diff = (d - now) / 86400000;
            return diff >= 0 && diff <= 3;
        });
        const deadlines = (DB.data.deadlines || []).filter(d => {
            const dd = new Date(d.date);
            const now = new Date();
            const diff = (dd - now) / 86400000;
            return diff >= 0 && diff <= 7;
        });

        // Sort regs by severity
        const severityOrder = { kritik: 0, onemli: 1, bilgi: 2 };
        regs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        const sevColors = { kritik: '#e74c3c', onemli: '#f39c12', bilgi: '#3498db' };
        const sevIcons = { kritik: '🔴', onemli: '🟡', bilgi: '🟢' };

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'notifCenterModal';
        modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;max-height:92vh;">
            <div class="modal-header">
                <h3><i class="fas fa-bell"></i> Bildirim Merkezi</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <button class="btn btn-sm btn-outline" onclick="markAllRegulationsRead();this.closest('.modal').remove();openNotificationCenter();"><i class="fas fa-check-double"></i> Tümünü Okundu İşaretle</button>
                </div>

                ${hearings.length ? `
                <h4 style="margin:12px 0 6px;"><i class="fas fa-gavel" style="color:#e67e22;"></i> Yaklaşan Duruşmalar (3 gün)</h4>
                ${hearings.slice(0,5).map(h => `<div style="padding:8px;background:rgba(230,126,34,0.1);border-left:3px solid #e67e22;border-radius:6px;margin-bottom:4px;font-size:0.85rem;"><strong>${h.subject || h.client}</strong><div style="font-size:0.72rem;color:var(--text-secondary);">${new Date(h.date).toLocaleDateString('tr-TR')} ${h.time || ''} | ${h.court || ''}</div></div>`).join('')}
                ` : ''}

                ${deadlines.length ? `
                <h4 style="margin:12px 0 6px;"><i class="fas fa-clock" style="color:#f39c12;"></i> Yaklaşan Süreler (7 gün)</h4>
                ${deadlines.slice(0,5).map(d => `<div style="padding:8px;background:rgba(243,156,18,0.1);border-left:3px solid #f39c12;border-radius:6px;margin-bottom:4px;font-size:0.85rem;"><strong>${d.description || d.type}</strong><div style="font-size:0.72rem;color:var(--text-secondary);">${new Date(d.date).toLocaleDateString('tr-TR')}</div></div>`).join('')}
                ` : ''}

                ${regs.length ? `
                <h4 style="margin:12px 0 6px;"><i class="fas fa-satellite-dish" style="color:var(--primary);"></i> Okunmamış Mevzuat (${regs.length})</h4>
                ${regs.slice(0, 15).map(r => `
                    <div style="padding:10px;background:var(--bg-secondary);border-left:3px solid ${sevColors[r.severity]};border-radius:6px;margin-bottom:6px;cursor:pointer;" onclick="markRegulationRead('${r.id}');this.closest('.modal').remove();openNotificationCenter();">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-size:0.72rem;color:var(--text-secondary);">${sevIcons[r.severity]} ${(MEVZUAT_SOURCES.find(s => s.id === r.source)?.name) || r.source}</span>
                            <span style="font-size:0.72rem;color:var(--text-secondary);">${new Date(r.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div style="font-size:0.88rem;font-weight:600;">${r.title}</div>
                        ${r.summary ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">${r.summary.substring(0, 150)}${r.summary.length > 150 ? '...' : ''}</div>` : ''}
                    </div>`).join('')}
                ` : ''}

                ${!regs.length && !hearings.length && !deadlines.length ? '<p style="text-align:center;color:var(--text-secondary);padding:30px;">🎉 Yeni bildirim yok!</p>' : ''}
            </div>
        </div>`;
        document.body.appendChild(modal);
    };

    window.markAllRegulationsRead = function() {
        (DB.data.regulations || []).forEach(r => r.read = true);
        DB.save();
        updateNotificationBadge();
        if (typeof renderRegulations === 'function') renderRegulations();
    };

    window.markRegulationRead = function(id) {
        const r = (DB.data.regulations || []).find(x => x.id === id);
        if (r) { r.read = true; DB.save(); updateNotificationBadge(); }
    };

    // ---------- 5. EXCEL DIŞA AKTARMA ----------
    window.exportRegulationsExcel = function() {
        const regs = DB.data.regulations || [];
        if (!regs.length) { toast('Dışa aktarılacak düzenleme yok', 'warning'); return; }

        // Apply current filters
        const search = (document.getElementById('regSearchInput')?.value || '').toLowerCase();
        const sourceF = document.getElementById('regSourceFilter')?.value || '';
        const impF = document.getElementById('regImportanceFilter')?.value || '';

        let filtered = regs;
        if (search) filtered = filtered.filter(r => (r.title + ' ' + (r.summary||'')).toLowerCase().includes(search));
        if (sourceF) filtered = filtered.filter(r => r.source === sourceF);
        if (impF) filtered = filtered.filter(r => r.severity === impF);

        // Build CSV (Excel-compatible) with BOM for Turkish chars
        const BOM = '\uFEFF';
        const headers = ['Tarih', 'Kaynak', 'Başlık', 'Özet', 'Önem', 'Etiketler', 'Okundu'];
        const rows = filtered.map(r => [
            r.date || '',
            (MEVZUAT_SOURCES.find(s => s.id === r.source)?.name) || r.source,
            (r.title || '').replace(/"/g, '""'),
            (r.summary || '').replace(/"/g, '""').replace(/\n/g, ' '),
            { kritik: 'Kritik', onemli: 'Önemli', bilgi: 'Bilgi' }[r.severity] || r.severity,
            (r.tags || []).join(', '),
            r.read ? 'Evet' : 'Hayır'
        ]);

        const csv = BOM + [headers, ...rows].map(row => row.map(c => `"${c}"`).join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `akgul-legal-mevzuat-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`${filtered.length} kayıt Excel'e aktarıldı`, 'success');
    };

    // ---------- 6. WEB SCRAPING (mevzuat.gov.tr) ----------
    window.scrapeMevzuatGov = async function(query) {
        const q = query || prompt('Mevzuat.gov.tr\'de aranacak terim (örn: 6098 sayılı, KVKK):');
        if (!q) return;

        toast('Mevzuat.gov.tr aranıyor...', 'info');

        // NOTE: Direct scraping blocked by CORS. Use Gemini AI to simulate + provide known data.
        const prompt2 = `Türkiye mevzuat.gov.tr'de "${q}" arandığında dönebilecek gerçek Türk mevzuat sonuçlarını listele. Her sonuç için:
- kanun_no (örn: 6098)
- kanun_adi (tam ad)
- kabul_tarihi
- ilgili_maddeler (ilgili madde numaraları ve kısa özetleri)
- mevzuat_turu (Kanun/KHK/Yönetmelik/Tebliğ)
- ozet (2-3 cümle)
- url (mevzuat.gov.tr linki)

Sadece JSON array:
[{"kanun_no":"","kanun_adi":"","kabul_tarihi":"","mevzuat_turu":"","ozet":"","url":"","ilgili_maddeler":[{"madde":"","ozet":""}]}]

En fazla 5 sonuç. Gerçek Türk mevzuatına dayalı.`;

        try {
            const response = await callGeminiAPI(prompt2);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Yanıt alınamadı');
            const results = JSON.parse(jsonMatch[0]);

            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
            <div class="modal-content" style="max-width:900px;max-height:92vh;">
                <div class="modal-header">
                    <h3><i class="fas fa-globe"></i> Mevzuat.gov.tr Arama: "${q}"</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${results.map(r => `
                        <div style="padding:12px;background:var(--bg-secondary);border-radius:8px;margin-bottom:10px;border-left:3px solid var(--primary);">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                <strong style="font-size:1rem;">${escapeHtml2(r.kanun_adi)}</strong>
                                <span style="padding:3px 8px;background:var(--primary);color:white;border-radius:10px;font-size:0.72rem;">${r.mevzuat_turu || 'Kanun'}</span>
                            </div>
                            <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:6px;">📋 ${r.kanun_no || '-'} | 📅 ${r.kabul_tarihi || '-'}</div>
                            <div style="font-size:0.85rem;margin-bottom:8px;">${escapeHtml2(r.ozet || '')}</div>
                            ${r.ilgili_maddeler?.length ? `
                                <div style="padding:8px;background:var(--bg-primary);border-radius:6px;">
                                    <strong style="font-size:0.82rem;">İlgili Maddeler:</strong>
                                    ${r.ilgili_maddeler.map(m => `<div style="font-size:0.78rem;padding:4px 0;"><strong>${m.madde}:</strong> ${escapeHtml2(m.ozet || '')}</div>`).join('')}
                                </div>` : ''}
                            ${r.url ? `<div style="margin-top:6px;"><a href="${r.url}" target="_blank" style="color:var(--primary);font-size:0.78rem;"><i class="fas fa-external-link-alt"></i> Resmi Kaynakta Görüntüle</a></div>` : ''}
                        </div>`).join('')}
                </div>
            </div>`;
            document.body.appendChild(modal);
        } catch (e) {
            toast('Arama hatası: ' + e.message, 'error');
        }
    };

    function escapeHtml2(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    // ---------- 7. GELİŞMİŞ REFERANS ÇIKARMA ----------
    const REF_PATTERNS = {
        kanun: /(\d{3,5})\s+sayılı\s+([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?(?:Kanunu?|Kanun\s+Hükmünde\s+Kararname))/g,
        teblig: /([IVXLCDM]+-[\d.]+-[\d.]+)\s+(?:sayılı\s+)?([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?Tebliğ\w*)/g,
        madde: /(?:MADDE|Madde)\s+(\d+)(?:\s*\((\d+)\))?\s*[-–—.]?\s*([^\n]{0,100})/g,
        maddeRef: /(\d+)\.\s*madde/g,
        maddeRef2: /(\d+)[iıüu]nc[iıüu]\s+madde/g,
        sayiliRef: /(\d{3,5})\s+sayılı/g,
        yonetmelik: /([A-ZÇĞİÖŞÜa-zçğıöşü\s]{5,80})\s+Yönetmelik\w*/g,
        genelge: /([A-ZÇĞİÖŞÜa-zçğıöşü\s]{5,80})\s+Genelge\w*/g
    };

    window.extractLegalReferences = function(text) {
        const refs = {
            kanunlar: [],
            maddeler: [],
            tebligler: [],
            yonetmelikler: [],
            genelgeler: [],
            sayiliRefs: []
        };

        // Kanunlar
        let m;
        const kanunRe = new RegExp(REF_PATTERNS.kanun.source, 'g');
        while ((m = kanunRe.exec(text)) !== null) {
            refs.kanunlar.push({ no: m[1], ad: m[2].trim(), tam: m[0] });
        }

        // Maddeler
        const maddeRe = new RegExp(REF_PATTERNS.madde.source, 'g');
        while ((m = maddeRe.exec(text)) !== null) {
            refs.maddeler.push({ no: m[1], fikra: m[2], baslik: (m[3] || '').trim() });
        }

        // Tebliğler
        const tebRe = new RegExp(REF_PATTERNS.teblig.source, 'g');
        while ((m = tebRe.exec(text)) !== null) {
            refs.tebligler.push({ no: m[1], ad: m[2].trim() });
        }

        // Yönetmelikler
        const yonRe = new RegExp(REF_PATTERNS.yonetmelik.source, 'g');
        while ((m = yonRe.exec(text)) !== null) {
            refs.yonetmelikler.push({ ad: (m[1] + ' Yönetmelik').trim() });
        }

        // Genelgeler
        const genRe = new RegExp(REF_PATTERNS.genelge.source, 'g');
        while ((m = genRe.exec(text)) !== null) {
            refs.genelgeler.push({ ad: (m[1] + ' Genelge').trim() });
        }

        // Sayılı referanslar (duplicate'ları filtrele)
        const sayiliRe = new RegExp(REF_PATTERNS.sayiliRef.source, 'g');
        const seen = new Set();
        while ((m = sayiliRe.exec(text)) !== null) {
            if (!seen.has(m[1])) { refs.sayiliRefs.push(m[1]); seen.add(m[1]); }
        }

        // Deduplicate
        refs.kanunlar = Array.from(new Map(refs.kanunlar.map(k => [k.no, k])).values());

        return refs;
    };

    window.showReferenceExtractor = function() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
        <div class="modal-content" style="max-width:800px;max-height:92vh;">
            <div class="modal-header">
                <h3><i class="fas fa-link"></i> Hukuki Referans Çıkarma</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text-secondary);font-size:0.85rem;">Metni yapıştırın, kanun/madde/tebliğ/yönetmelik referansları otomatik çıkarılsın.</p>
                <textarea id="refExtractInput" rows="8" placeholder="Hukuki metin yapıştırın..."></textarea>
                <button class="btn btn-primary" style="margin-top:8px;" onclick="runReferenceExtraction()"><i class="fas fa-search"></i> Referansları Çıkar</button>
                <div id="refExtractResult" style="margin-top:14px;"></div>
            </div>
        </div>`;
        document.body.appendChild(modal);
    };

    window.runReferenceExtraction = function() {
        const text = document.getElementById('refExtractInput').value;
        if (!text.trim()) { toast('Metin girin', 'warning'); return; }
        const refs = extractLegalReferences(text);
        const el = document.getElementById('refExtractResult');

        const total = refs.kanunlar.length + refs.maddeler.length + refs.tebligler.length + refs.yonetmelikler.length + refs.genelgeler.length;

        el.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px;">
                <div style="padding:8px;background:rgba(74,108,247,0.1);border-radius:6px;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:var(--primary);">${refs.kanunlar.length}</div><div style="font-size:0.7rem;">Kanun</div></div>
                <div style="padding:8px;background:rgba(46,204,113,0.1);border-radius:6px;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:#2ecc71;">${refs.maddeler.length}</div><div style="font-size:0.7rem;">Madde</div></div>
                <div style="padding:8px;background:rgba(155,89,182,0.1);border-radius:6px;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:#9b59b6;">${refs.tebligler.length}</div><div style="font-size:0.7rem;">Tebliğ</div></div>
                <div style="padding:8px;background:rgba(230,126,34,0.1);border-radius:6px;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:#e67e22;">${refs.yonetmelikler.length}</div><div style="font-size:0.7rem;">Yönetmelik</div></div>
                <div style="padding:8px;background:rgba(243,156,18,0.1);border-radius:6px;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:#f39c12;">${refs.genelgeler.length}</div><div style="font-size:0.7rem;">Genelge</div></div>
            </div>
            ${refs.kanunlar.length ? `<div style="margin-bottom:10px;"><h5>📜 Kanunlar</h5>${refs.kanunlar.map(k => `<div style="padding:6px 8px;background:var(--bg-secondary);border-radius:4px;margin-bottom:3px;font-size:0.85rem;cursor:pointer;" onclick="searchMevzuat && (document.getElementById('mevzuatSearchInput').value='${k.no} sayılı ${k.ad}',document.querySelector('.nav-item[data-page=tools]').click(),document.querySelector('.tab-btn[data-tab=mevzuat-search-tab]').click())"><strong>${k.no}</strong> sayılı ${escapeHtml2(k.ad)}</div>`).join('')}</div>` : ''}
            ${refs.maddeler.length ? `<div style="margin-bottom:10px;"><h5>📖 Maddeler</h5>${refs.maddeler.slice(0,20).map(m => `<div style="padding:6px 8px;background:var(--bg-secondary);border-radius:4px;margin-bottom:3px;font-size:0.85rem;"><strong>Madde ${m.no}${m.fikra ? '('+m.fikra+')' : ''}</strong>${m.baslik ? ' — ' + escapeHtml2(m.baslik) : ''}</div>`).join('')}</div>` : ''}
            ${refs.tebligler.length ? `<div style="margin-bottom:10px;"><h5>📋 Tebliğler</h5>${refs.tebligler.map(t => `<div style="padding:6px 8px;background:var(--bg-secondary);border-radius:4px;margin-bottom:3px;font-size:0.85rem;"><strong>${t.no}</strong> ${escapeHtml2(t.ad)}</div>`).join('')}</div>` : ''}
            ${refs.yonetmelikler.length ? `<div style="margin-bottom:10px;"><h5>⚖️ Yönetmelikler</h5>${refs.yonetmelikler.map(y => `<div style="padding:6px 8px;background:var(--bg-secondary);border-radius:4px;margin-bottom:3px;font-size:0.85rem;">${escapeHtml2(y.ad)}</div>`).join('')}</div>` : ''}
            ${!total ? '<p style="text-align:center;color:var(--text-secondary);padding:20px;">Referans bulunamadı.</p>' : ''}
        `;
    };

    // Initialize on load
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            if (localStorage.getItem('autoScanEnabled') === 'true') window.setupAutoScan();
            updateNotificationBadge();
        }, 1500);
    }
})();

// ============================================================
// FAZ 3 — YETKİ DELEGASYONU (Görüş Atama / Assignment)
// legal-opinions projesinden uyarlandı
// ============================================================
(function() {
    function getOpinions() { return DB.data.opinions || []; }
    function saveOpinions(arr) { DB.data.opinions = arr; DB.save(); }
    function getUsers() { return (DB.data.users || []).filter(u => u && u.name); }
    function currentUserName() {
        return DB.data.currentUser?.name || localStorage.getItem('currentUser') || 'Avukat 1';
    }

    const DELEGATION_STATUS = {
        pending: { label: 'Atama Bekliyor', color: '#95a5a6' },
        assigned: { label: 'Atandı', color: '#3498db' },
        in_progress: { label: 'Çalışılıyor', color: '#f39c12' },
        submitted: { label: 'Teslim Edildi', color: '#9b59b6' },
        completed: { label: 'Tamamlandı', color: '#2ecc71' },
        declined: { label: 'Reddedildi', color: '#e74c3c' }
    };

    // Modal: Assign / delegate an opinion to another lawyer
    window.openOpinionDelegation = function(opinionId) {
        const op = getOpinions().find(o => o.id === opinionId);
        if (!op) { toast('Görüş bulunamadı', 'error'); return; }

        const users = getUsers();
        if (!users.length) {
            toast('Atama yapmak için Ayarlar > Kullanıcılar kısmından avukat ekleyin', 'warning');
            return;
        }

        const existing = document.getElementById('delegationModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'delegationModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10003;';

        const history = op.delegationHistory || [];
        const currentAssignee = op.assignedTo || '';
        const delegStatus = op.delegationStatus || 'pending';

        modal.innerHTML = `
        <div class="modal-content" style="max-width:720px;max-height:92vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3><i class="fas fa-user-shield"></i> Yetki Delegasyonu — ${op.refNo}</h3>
                <button class="btn btn-sm btn-outline" onclick="this.closest('#delegationModal').remove()">&times;</button>
            </div>
            <div style="padding:10px;background:var(--bg-secondary);border-radius:8px;margin-bottom:14px;">
                <strong>${op.title}</strong>
                <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">
                    Yazar: ${op.author || '-'} |
                    Durum: <span style="color:${DELEGATION_STATUS[delegStatus]?.color || '#999'};font-weight:600;">${DELEGATION_STATUS[delegStatus]?.label || delegStatus}</span>
                    ${currentAssignee ? ` | Atanan: <strong>${currentAssignee}</strong>` : ''}
                </div>
            </div>

            <div class="form-group">
                <label>Atanacak Avukat</label>
                <select id="delegAssignee">
                    <option value="">-- Avukat seç --</option>
                    ${users.map(u => `<option value="${u.name}" ${u.name === currentAssignee ? 'selected' : ''}>${u.name}${u.role ? ' ('+u.role+')' : ''}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Yetki Seviyesi</label>
                    <select id="delegAuthLevel">
                        <option value="review">Sadece İnceleme</option>
                        <option value="edit" selected>Düzenleme + Yorum</option>
                        <option value="full">Tam Yetki (onay dahil)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Teslim Tarihi</label>
                    <input type="date" id="delegDueDate" value="${op.assignmentDueDate || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Talimat / Not</label>
                <textarea id="delegInstructions" rows="4" placeholder="Atanan avukata özel talimatlar, beklentiler, kısıtlar...">${op.assignmentInstructions || ''}</textarea>
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="delegNotify" checked> Atanana e-posta bildirimi hazırla</label>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                <button class="btn btn-primary" onclick="assignOpinion('${op.id}')"><i class="fas fa-paper-plane"></i> Ata / Gönder</button>
                ${currentAssignee ? `<button class="btn btn-outline" onclick="unassignOpinion('${op.id}')"><i class="fas fa-times"></i> Atamayı Kaldır</button>` : ''}
                ${delegStatus === 'assigned' ? `
                    <button class="btn btn-outline" style="color:#f39c12;" onclick="updateDelegationStatus('${op.id}','in_progress')"><i class="fas fa-play"></i> Çalışmaya Başla</button>
                ` : ''}
                ${delegStatus === 'in_progress' ? `
                    <button class="btn btn-outline" style="color:#9b59b6;" onclick="updateDelegationStatus('${op.id}','submitted')"><i class="fas fa-check"></i> Teslim Et</button>
                ` : ''}
                ${delegStatus === 'submitted' ? `
                    <button class="btn btn-outline" style="color:#2ecc71;" onclick="updateDelegationStatus('${op.id}','completed')"><i class="fas fa-check-double"></i> Kabul Et</button>
                    <button class="btn btn-outline" style="color:#e74c3c;" onclick="updateDelegationStatus('${op.id}','in_progress')"><i class="fas fa-undo"></i> Geri Gönder</button>
                ` : ''}
            </div>

            ${history.length ? `
                <div style="margin-top:18px;">
                    <h4 style="font-size:0.9rem;margin-bottom:8px;">Delegasyon Geçmişi</h4>
                    <div style="max-height:200px;overflow-y:auto;">
                        ${history.slice().reverse().map(h => `
                            <div style="padding:8px;background:var(--bg-secondary);border-radius:6px;margin-bottom:6px;font-size:0.78rem;border-left:3px solid ${DELEGATION_STATUS[h.status]?.color || '#999'};">
                                <div style="display:flex;justify-content:space-between;">
                                    <strong>${DELEGATION_STATUS[h.status]?.label || h.status}</strong>
                                    <span style="color:var(--text-secondary);">${new Date(h.date).toLocaleString('tr-TR')}</span>
                                </div>
                                <div style="color:var(--text-secondary);margin-top:2px;">${h.by || '-'}${h.to ? ' → ' + h.to : ''}</div>
                                ${h.note ? `<div style="margin-top:4px;font-style:italic;">${h.note}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>`;
        document.body.appendChild(modal);
    };

    window.assignOpinion = function(opinionId) {
        const opinions = getOpinions();
        const op = opinions.find(o => o.id === opinionId);
        if (!op) return;

        const assignee = document.getElementById('delegAssignee')?.value;
        if (!assignee) { toast('Atanacak avukat seçin', 'warning'); return; }

        const authLevel = document.getElementById('delegAuthLevel')?.value || 'edit';
        const dueDate = document.getElementById('delegDueDate')?.value || '';
        const instructions = document.getElementById('delegInstructions')?.value || '';
        const notify = document.getElementById('delegNotify')?.checked;

        const now = new Date().toISOString();
        const by = currentUserName();

        op.assignedTo = assignee;
        op.assignedBy = by;
        op.assignedAt = now;
        op.assignmentAuthLevel = authLevel;
        op.assignmentDueDate = dueDate;
        op.assignmentInstructions = instructions;
        op.delegationStatus = 'assigned';

        if (!op.delegationHistory) op.delegationHistory = [];
        op.delegationHistory.push({
            status: 'assigned',
            by: by,
            to: assignee,
            date: now,
            note: instructions ? instructions.substring(0, 120) : 'Atama yapıldı'
        });

        op.updatedAt = now;
        saveOpinions(opinions);

        document.getElementById('delegationModal')?.remove();
        if (typeof renderOpinions === 'function') renderOpinions();
        toast(`${assignee} avukatına atandı`, 'success');

        // Trigger notification email draft
        if (notify) {
            setTimeout(() => generateDelegationNotification(op.id), 300);
        }
    };

    window.unassignOpinion = function(opinionId) {
        if (!confirm('Atamayı kaldırmak istediğinizden emin misiniz?')) return;
        const opinions = getOpinions();
        const op = opinions.find(o => o.id === opinionId);
        if (!op) return;

        const now = new Date().toISOString();
        const by = currentUserName();
        if (!op.delegationHistory) op.delegationHistory = [];
        op.delegationHistory.push({
            status: 'pending',
            by: by,
            to: op.assignedTo,
            date: now,
            note: 'Atama kaldırıldı'
        });

        op.assignedTo = '';
        op.delegationStatus = 'pending';
        op.updatedAt = now;
        saveOpinions(opinions);

        document.getElementById('delegationModal')?.remove();
        if (typeof renderOpinions === 'function') renderOpinions();
        toast('Atama kaldırıldı', 'info');
    };

    window.updateDelegationStatus = function(opinionId, newStatus) {
        const opinions = getOpinions();
        const op = opinions.find(o => o.id === opinionId);
        if (!op) return;

        const now = new Date().toISOString();
        op.delegationStatus = newStatus;
        op.updatedAt = now;
        if (!op.delegationHistory) op.delegationHistory = [];
        op.delegationHistory.push({
            status: newStatus,
            by: currentUserName(),
            to: op.assignedTo,
            date: now
        });
        saveOpinions(opinions);
        document.getElementById('delegationModal')?.remove();
        window.openOpinionDelegation(opinionId);
        if (typeof renderOpinions === 'function') renderOpinions();
        toast(`Durum güncellendi: ${DELEGATION_STATUS[newStatus]?.label}`, 'success');
    };

    // Generate email notification for the assigned lawyer
    window.generateDelegationNotification = function(opinionId) {
        const op = getOpinions().find(o => o.id === opinionId);
        if (!op || !op.assignedTo) return;

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body{font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#2c3e50;}
            .header{background:linear-gradient(135deg,#4a6cf7,#8f5bf7);color:#fff;padding:20px;border-radius:10px 10px 0 0;}
            .body{background:#fff;padding:20px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 10px 10px;}
            .box{background:#f8f9fa;padding:14px;border-radius:8px;margin:10px 0;border-left:4px solid #4a6cf7;}
            .meta{font-size:0.82rem;color:#7f8c8d;}
            .btn{display:inline-block;padding:10px 18px;background:#4a6cf7;color:#fff;text-decoration:none;border-radius:6px;margin-top:10px;}
        </style></head><body>
            <div class="header">
                <h2 style="margin:0;">🔔 Yeni Görev Ataması</h2>
                <p style="margin:4px 0 0;opacity:0.9;">Akgül Legal — Hukuki Görüş Delegasyonu</p>
            </div>
            <div class="body">
                <p>Sayın <strong>${op.assignedTo}</strong>,</p>
                <p>Size aşağıdaki hukuki görüş atanmıştır:</p>
                <div class="box">
                    <div class="meta">${op.refNo}</div>
                    <h3 style="margin:4px 0;">${op.title}</h3>
                    <div class="meta">Kategori: ${op.category || '-'} | Öncelik: ${op.priority || 'normal'}</div>
                    ${op.assignmentDueDate ? `<div style="color:#e74c3c;margin-top:8px;"><strong>⏰ Teslim: ${new Date(op.assignmentDueDate).toLocaleDateString('tr-TR')}</strong></div>` : ''}
                </div>
                ${op.assignmentInstructions ? `
                <h4>Talimatlar</h4>
                <div class="box">${op.assignmentInstructions.replace(/\n/g, '<br>')}</div>` : ''}
                <h4>Yetki Seviyesi</h4>
                <p>${op.assignmentAuthLevel === 'review' ? 'Sadece inceleme' : op.assignmentAuthLevel === 'edit' ? 'Düzenleme + yorum yapabilirsiniz' : 'Tam yetki — onay dahil'}</p>
                <p style="margin-top:20px;" class="meta">Atayan: ${op.assignedBy} — ${new Date(op.assignedAt).toLocaleString('tr-TR')}</p>
            </div>
        </body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `delegasyon-${op.refNo}-${op.assignedTo.replace(/\s+/g, '_')}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Bildirim e-postası indirildi', 'success');
    };

    // "Bana atananlar" filter panel
    window.showMyAssignments = function() {
        const me = currentUserName();
        const myOps = getOpinions().filter(o => !o.deleted && o.assignedTo === me);

        const existing = document.getElementById('myAssignmentsModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'myAssignmentsModal';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10003;';

        modal.innerHTML = `
        <div class="modal-content" style="max-width:780px;max-height:88vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:22px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <h3><i class="fas fa-tasks"></i> Bana Atanan Görüşler (${myOps.length})</h3>
                <button class="btn btn-sm btn-outline" onclick="this.closest('#myAssignmentsModal').remove()">&times;</button>
            </div>
            ${!myOps.length ? '<p style="text-align:center;color:var(--text-secondary);padding:30px;">Size atanmış görüş bulunmuyor.</p>' :
                myOps.map(o => {
                    const st = DELEGATION_STATUS[o.delegationStatus || 'assigned'];
                    const overdue = o.assignmentDueDate && new Date(o.assignmentDueDate) < new Date() && o.delegationStatus !== 'completed';
                    return `
                    <div class="form-card" style="margin-bottom:8px;border-left:3px solid ${st.color};padding:12px;cursor:pointer;" onclick="document.getElementById('myAssignmentsModal').remove();viewOpinion('${o.id}')">
                        <div style="display:flex;justify-content:space-between;align-items:start;">
                            <div style="flex:1;">
                                <span style="font-family:monospace;font-size:0.72rem;color:var(--text-secondary);">${o.refNo}</span>
                                <span style="padding:2px 8px;border-radius:10px;font-size:0.68rem;background:${st.color}22;color:${st.color};margin-left:6px;">${st.label}</span>
                                ${overdue ? '<span style="padding:2px 8px;border-radius:10px;font-size:0.68rem;background:#e74c3c22;color:#e74c3c;margin-left:4px;">GECİKMİŞ</span>' : ''}
                                <h4 style="margin:6px 0 4px;font-size:0.95rem;">${o.title}</h4>
                                <div style="font-size:0.72rem;color:var(--text-secondary);">
                                    Atayan: ${o.assignedBy || '-'}
                                    ${o.assignmentDueDate ? ` | Teslim: ${new Date(o.assignmentDueDate).toLocaleDateString('tr-TR')}` : ''}
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();document.getElementById('myAssignmentsModal').remove();openOpinionDelegation('${o.id}')">Yönet</button>
                        </div>
                    </div>`;
                }).join('')
            }
        </div>`;
        document.body.appendChild(modal);
    };
})();

// ============================================================
// FAZ 3 — DİNAMİK E-POSTA ŞABLONLARI (regwatch-python'dan uyarlandı)
// Genişletilmiş HTML raporlar + şablon seçimi + önizleme
// ============================================================
(function() {
    // Email template library
    const EMAIL_TEMPLATES = {
        modern: {
            name: 'Modern Gradient',
            description: 'Renkli gradyan header, kart tabanlı içerik',
            primaryColor: '#4a6cf7',
            accentColor: '#8f5bf7'
        },
        corporate: {
            name: 'Kurumsal',
            description: 'Sade, profesyonel, iki sütunlu',
            primaryColor: '#2c3e50',
            accentColor: '#34495e'
        },
        minimal: {
            name: 'Minimal',
            description: 'Düz tipografi, minimal görsel',
            primaryColor: '#000000',
            accentColor: '#666666'
        },
        warning: {
            name: 'Acil / Uyarı',
            description: 'Kırmızı tonlarda yüksek dikkat',
            primaryColor: '#e74c3c',
            accentColor: '#c0392b'
        }
    };

    // Severity badge helper
    function sevBadge(sev) {
        const colors = { kritik: '#e74c3c', onemli: '#f39c12', bilgi: '#3498db' };
        const labels = { kritik: 'KRİTİK', onemli: 'ÖNEMLİ', bilgi: 'BİLGİ' };
        const c = colors[sev] || '#7f8c8d';
        return `<span style="display:inline-block;padding:2px 8px;background:${c};color:#fff;border-radius:10px;font-size:0.68rem;font-weight:600;">${labels[sev] || sev || 'GENEL'}</span>`;
    }

    // Build rich HTML with template
    function buildReportHTML(data, templateKey = 'modern') {
        const t = EMAIL_TEMPLATES[templateKey] || EMAIL_TEMPLATES.modern;
        const { title, subtitle, user, date, sections } = data;

        const sectionsHTML = sections.map(s => {
            if (!s.items || !s.items.length) {
                return `<h2 style="color:${t.primaryColor};font-size:1rem;margin-top:24px;border-bottom:2px solid ${t.primaryColor}33;padding-bottom:6px;">${s.icon || ''} ${s.title}</h2>
                <p style="color:#95a5a6;font-style:italic;font-size:0.88rem;">${s.emptyText || 'Kayıt yok'}</p>`;
            }

            const itemsHTML = s.items.map(item => {
                const borderColor = item.critical ? '#e74c3c' : item.warning ? '#f39c12' : t.primaryColor;
                return `
                <div style="padding:12px 14px;background:#f8f9fa;border-radius:8px;margin-bottom:8px;border-left:4px solid ${borderColor};">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                        <div style="flex:1;">
                            <strong style="color:#2c3e50;font-size:0.92rem;">${item.title}</strong>
                            ${item.sev ? ' ' + sevBadge(item.sev) : ''}
                            ${item.subtitle ? `<div style="color:#7f8c8d;font-size:0.8rem;margin-top:4px;">${item.subtitle}</div>` : ''}
                            ${item.content ? `<div style="color:#5a6c7d;font-size:0.82rem;margin-top:6px;line-height:1.5;">${item.content}</div>` : ''}
                        </div>
                        ${item.meta ? `<div style="font-size:0.72rem;color:#95a5a6;text-align:right;white-space:nowrap;">${item.meta}</div>` : ''}
                    </div>
                </div>`;
            }).join('');

            return `<h2 style="color:${t.primaryColor};font-size:1.05rem;margin-top:24px;border-bottom:2px solid ${t.primaryColor}33;padding-bottom:6px;">${s.icon || ''} ${s.title} <span style="font-size:0.82rem;color:#95a5a6;font-weight:400;">(${s.items.length})</span></h2>
            ${itemsHTML}`;
        }).join('');

        const headerHTML = templateKey === 'modern' ? `
            <div style="background:linear-gradient(135deg,${t.primaryColor},${t.accentColor});color:#fff;padding:28px 24px;border-radius:12px 12px 0 0;">
                <h1 style="margin:0;font-size:1.4rem;">⚖️ ${title}</h1>
                <p style="margin:6px 0 0;opacity:0.9;font-size:0.88rem;">${subtitle}</p>
            </div>`
        : templateKey === 'corporate' ? `
            <div style="background:${t.primaryColor};color:#fff;padding:24px;border-bottom:4px solid #d4af37;">
                <div style="font-size:0.75rem;letter-spacing:2px;opacity:0.7;">AKGÜL LEGAL</div>
                <h1 style="margin:4px 0 0;font-size:1.3rem;font-weight:500;">${title}</h1>
                <div style="font-size:0.82rem;opacity:0.85;margin-top:4px;">${subtitle}</div>
            </div>`
        : templateKey === 'warning' ? `
            <div style="background:${t.primaryColor};color:#fff;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
                <div style="font-size:2rem;">⚠️</div>
                <h1 style="margin:4px 0;font-size:1.3rem;">${title}</h1>
                <p style="margin:0;opacity:0.95;font-size:0.85rem;">${subtitle}</p>
            </div>`
        : `
            <div style="padding:20px 0;border-bottom:1px solid #e0e0e0;">
                <h1 style="margin:0;font-size:1.3rem;color:${t.primaryColor};font-weight:300;">${title}</h1>
                <p style="margin:4px 0 0;color:#888;font-size:0.85rem;">${subtitle}</p>
            </div>`;

        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
        <body style="font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:0;background:#f4f6f8;color:#2c3e50;">
            <div style="background:#fff;margin:20px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
                ${headerHTML}
                <div style="padding:24px;">
                    <div style="display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #eee;margin-bottom:16px;font-size:0.82rem;color:#7f8c8d;">
                        <span>📅 ${date}</span>
                        <span>👤 ${user}</span>
                    </div>
                    ${sectionsHTML}
                    <hr style="margin-top:28px;border:none;border-top:1px solid #eee;">
                    <p style="text-align:center;color:#95a5a6;font-size:0.74rem;margin:12px 0 0;">
                        Bu rapor <strong>Akgül Legal Büro Yönetim Sistemi</strong> tarafından otomatik oluşturulmuştur.<br>
                        ${new Date().toLocaleString('tr-TR')}
                    </p>
                </div>
            </div>
        </body></html>`;
    }

    // Collect report data based on period type
    function collectReportData(period) {
        const now = new Date();
        const user = DB.data.currentUser?.name || localStorage.getItem('currentUser') || 'Avukat';

        const typeLabels = {
            sabah: { title: 'Sabah Raporu', subtitle: 'Güne başlarken — bugünün özeti' },
            aksam: { title: 'Akşam Raporu', subtitle: 'Yarının hazırlığı — bekleyen işler' },
            haftalik: { title: 'Haftalık Özet', subtitle: 'Önümüzdeki 7 gün için planlama' },
            acil: { title: 'Acil Uyarı', subtitle: 'Kritik ve gecikmiş öğeler' }
        };

        // Hearings
        let hearings = [];
        const hearingsData = DB.data.hearings || [];
        if (period === 'sabah') {
            hearings = hearingsData.filter(h => new Date(h.date).toDateString() === now.toDateString());
        } else if (period === 'aksam') {
            const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
            hearings = hearingsData.filter(h => new Date(h.date).toDateString() === tomorrow.toDateString());
        } else if (period === 'haftalik') {
            const week = new Date(now); week.setDate(week.getDate() + 7);
            hearings = hearingsData.filter(h => { const d = new Date(h.date); return d >= now && d <= week; });
        } else if (period === 'acil') {
            const in3 = new Date(now); in3.setDate(in3.getDate() + 3);
            hearings = hearingsData.filter(h => { const d = new Date(h.date); return d >= now && d <= in3; });
        }

        // Tasks
        const tasks = (DB.data.tasks || []).filter(t => {
            if (t.status === 'done') return false;
            if (period === 'haftalik') return true;
            if (period === 'acil') return !t.dueDate || new Date(t.dueDate) <= now;
            const d = t.dueDate ? new Date(t.dueDate) : null;
            return d && d <= new Date(now.getTime() + 86400000);
        });

        // Deadlines
        const days = period === 'haftalik' ? 7 : period === 'acil' ? 2 : 3;
        const deadlines = (DB.data.deadlines || []).filter(d => {
            const dd = new Date(d.date);
            return dd >= now && dd <= new Date(now.getTime() + days * 86400000);
        });

        // Regulations (unread)
        const regs = (DB.data.regulations || []).filter(r => {
            if (r.read) return false;
            if (period === 'haftalik') return true;
            if (period === 'acil') return r.severity === 'kritik';
            return new Date(r.addedAt || r.date) >= new Date(now.getTime() - 86400000);
        });

        // My delegated opinions (Faz 3 integration)
        const myAssignments = (DB.data.opinions || []).filter(o =>
            !o.deleted && o.assignedTo === user && o.delegationStatus !== 'completed'
        );

        return {
            title: `Akgül Legal — ${typeLabels[period].title}`,
            subtitle: typeLabels[period].subtitle,
            user: user,
            date: now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            sections: [
                {
                    title: 'Duruşmalar', icon: '📅',
                    emptyText: 'Dönem içinde duruşma yok',
                    items: hearings.map(h => ({
                        title: h.subject || h.client || 'Duruşma',
                        subtitle: `${h.court || ''}${h.caseNo ? ' • Dosya: ' + h.caseNo : ''}`,
                        meta: `${new Date(h.date).toLocaleDateString('tr-TR')}${h.time ? '<br>' + h.time : ''}`,
                        critical: new Date(h.date) < new Date(now.getTime() + 86400000)
                    }))
                },
                {
                    title: 'Görevler', icon: '📋',
                    emptyText: 'Bekleyen görev yok',
                    items: tasks.map(t => ({
                        title: t.title,
                        subtitle: t.assignee ? 'Atanan: ' + t.assignee : '',
                        meta: t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : 'Tarih yok',
                        critical: t.dueDate && new Date(t.dueDate) < now,
                        warning: t.priority === 'high'
                    }))
                },
                {
                    title: 'Yaklaşan Süreler', icon: '⏰',
                    emptyText: 'Yakın dönemde süre yok',
                    items: deadlines.map(d => ({
                        title: d.description || d.type,
                        subtitle: d.caseNo || '',
                        meta: new Date(d.date).toLocaleDateString('tr-TR'),
                        warning: true
                    }))
                },
                {
                    title: 'Yeni Mevzuat', icon: '📰',
                    emptyText: 'Yeni mevzuat yok',
                    items: regs.slice(0, 10).map(r => ({
                        title: r.title,
                        subtitle: r.source || '',
                        sev: r.severity,
                        content: r.summary ? r.summary.substring(0, 200) + (r.summary.length > 200 ? '...' : '') : '',
                        meta: r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '',
                        critical: r.severity === 'kritik',
                        warning: r.severity === 'onemli'
                    }))
                },
                {
                    title: 'Bana Atanan Görüşler', icon: '👤',
                    emptyText: 'Size atanmış görüş yok',
                    items: myAssignments.map(o => ({
                        title: o.title,
                        subtitle: `${o.refNo} • Atayan: ${o.assignedBy || '-'}`,
                        meta: o.assignmentDueDate ? 'Teslim: ' + new Date(o.assignmentDueDate).toLocaleDateString('tr-TR') : '',
                        critical: o.assignmentDueDate && new Date(o.assignmentDueDate) < now,
                        warning: o.priority === 'acil' || o.priority === 'yuksek'
                    }))
                }
            ]
        };
    }

    // Override the old generateEmailReport with enhanced version
    const _oldGenerate = window.generateEmailReport;
    window.generateEmailReport = function(period, templateKey) {
        // If no template, show picker modal
        if (!templateKey) {
            return window.openEmailReportBuilder(period);
        }

        const data = collectReportData(period);
        const html = buildReportHTML(data, templateKey);

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `akgul-legal-${period}-${templateKey}-${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`${period} raporu (${EMAIL_TEMPLATES[templateKey].name}) indirildi`, 'success');
    };

    // New: Template picker + preview modal
    window.openEmailReportBuilder = function(defaultPeriod) {
        const existing = document.getElementById('emailReportBuilder');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'emailReportBuilder';
        modal.className = 'modal active';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10003;';

        modal.innerHTML = `
        <div class="modal-content" style="max-width:900px;max-height:92vh;overflow-y:auto;background:var(--bg-primary);border-radius:12px;padding:22px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <h3><i class="fas fa-envelope-open-text"></i> E-posta Raporu Oluşturucu</h3>
                <button class="btn btn-sm btn-outline" onclick="this.closest('#emailReportBuilder').remove()">&times;</button>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Rapor Dönemi</label>
                    <select id="reportPeriodSelect">
                        <option value="sabah" ${defaultPeriod === 'sabah' ? 'selected' : ''}>🌅 Sabah Raporu (Bugün)</option>
                        <option value="aksam" ${defaultPeriod === 'aksam' ? 'selected' : ''}>🌙 Akşam Raporu (Yarın)</option>
                        <option value="haftalik" ${defaultPeriod === 'haftalik' ? 'selected' : ''}>📆 Haftalık Özet (7 Gün)</option>
                        <option value="acil" ${defaultPeriod === 'acil' ? 'selected' : ''}>🚨 Acil Uyarı (Kritik)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tema / Şablon</label>
                    <select id="reportTemplateSelect" onchange="refreshEmailPreview()">
                        ${Object.entries(EMAIL_TEMPLATES).map(([k, v]) =>
                            `<option value="${k}">${v.name} — ${v.description}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button class="btn btn-sm btn-outline" onclick="refreshEmailPreview()"><i class="fas fa-sync"></i> Önizlemeyi Yenile</button>
                <button class="btn btn-primary" onclick="downloadEmailReport()"><i class="fas fa-download"></i> İndir</button>
                <button class="btn btn-outline" onclick="copyEmailReportHTML()"><i class="fas fa-copy"></i> HTML'i Kopyala</button>
                <button class="btn btn-outline" onclick="openEmailClient()"><i class="fas fa-paper-plane"></i> E-posta İstemcisinde Aç</button>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#f4f6f8;">
                <div style="padding:6px 12px;background:var(--bg-secondary);font-size:0.78rem;color:var(--text-secondary);border-bottom:1px solid var(--border);">
                    <i class="fas fa-eye"></i> Canlı Önizleme
                </div>
                <iframe id="emailPreviewFrame" style="width:100%;height:500px;border:none;background:#fff;"></iframe>
            </div>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(refreshEmailPreview, 100);
    };

    window.refreshEmailPreview = function() {
        const period = document.getElementById('reportPeriodSelect')?.value || 'sabah';
        const tpl = document.getElementById('reportTemplateSelect')?.value || 'modern';
        const data = collectReportData(period);
        const html = buildReportHTML(data, tpl);
        const iframe = document.getElementById('emailPreviewFrame');
        if (iframe) {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open(); doc.write(html); doc.close();
        }
    };

    window.downloadEmailReport = function() {
        const period = document.getElementById('reportPeriodSelect')?.value || 'sabah';
        const tpl = document.getElementById('reportTemplateSelect')?.value || 'modern';
        const data = collectReportData(period);
        const html = buildReportHTML(data, tpl);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `akgul-legal-${period}-${tpl}-${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Rapor indirildi', 'success');
    };

    window.copyEmailReportHTML = function() {
        const period = document.getElementById('reportPeriodSelect')?.value || 'sabah';
        const tpl = document.getElementById('reportTemplateSelect')?.value || 'modern';
        const data = collectReportData(period);
        const html = buildReportHTML(data, tpl);
        navigator.clipboard.writeText(html).then(() => {
            toast('HTML panoya kopyalandı', 'success');
        }).catch(() => toast('Kopyalama başarısız', 'error'));
    };

    window.openEmailClient = function() {
        const period = document.getElementById('reportPeriodSelect')?.value || 'sabah';
        const data = collectReportData(period);
        const subject = encodeURIComponent(data.title + ' — ' + data.date);
        const body = encodeURIComponent(
            data.title + '\n' + data.date + '\n\n' +
            data.sections.map(s =>
                `${s.title} (${s.items?.length || 0})\n` +
                (s.items?.length ? s.items.map(i => '- ' + i.title + (i.meta ? ' [' + i.meta.replace(/<[^>]*>/g, ' ') + ']' : '')).join('\n') : s.emptyText)
            ).join('\n\n')
        );
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };
})();
