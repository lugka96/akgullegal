// ============================================================
// HUKUK TEKLİF ASİSTANI - Ana Uygulama
// ============================================================

// ---- DATA STORE ----
const DB = {
    _data: null,
    _key: 'hukukTeklifApp',

    defaults() {
        return {
            users: [
                { id: 1, name: 'Avukat 1', pin: '1234' },
                { id: 2, name: 'Avukat 2', pin: '5678' }
            ],
            currentUser: null,
            settings: {
                firmName: '',
                barAssociation: '',
                firmAddress: '',
                firmPhone: '',
                firmEmail: '',
                firmWebsite: '',
                firmLogo: ''
            },
            proposals: [],
            credentials: [],
            templates: [],
            contracts: [],
            powerOfAttorneys: [],
            hearings: [],
            deadlines: [],
            customDeadlineTypes: [],
            lawyers: [
                { id: 'lawyer-1', name: '', title: '', barNo: '', education: '', expertise: '', experience: '', bio: '' },
                { id: 'lawyer-2', name: '', title: '', barNo: '', education: '', expertise: '', experience: '', bio: '' }
            ],
            caseFiles: [],
            petitions: [],
            lawyerProfiles: [],
            proposalCounter: 0,
            contractCounter: 0,
            poaCounter: 0
        };
    },

    load() {
        try {
            const raw = localStorage.getItem(this._key);
            this._data = raw ? { ...this.defaults(), ...JSON.parse(raw) } : this.defaults();
        } catch {
            this._data = this.defaults();
        }
        return this._data;
    },

    save() {
        localStorage.setItem(this._key, JSON.stringify(this._data));
    },

    get data() {
        if (!this._data) this.load();
        return this._data;
    }
};

// ---- UTILITY FUNCTIONS ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const genId = () => 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

function toast(msg, type = 'info') {
    const container = $('#toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${msg}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function formatCurrency(amount, currency = 'TRY') {
    const symbols = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
    const num = parseFloat(String(amount).replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(num)) return amount;
    return symbols[currency] + num.toLocaleString('tr-TR', { minimumFractionDigits: 0 });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function generateProposalNo() {
    DB.data.proposalCounter++;
    DB.save();
    return `TKL-${new Date().getFullYear()}-${String(DB.data.proposalCounter).padStart(3, '0')}`;
}

function generateContractNo() {
    DB.data.contractCounter++;
    DB.save();
    return `SZL-${new Date().getFullYear()}-${String(DB.data.contractCounter).padStart(3, '0')}`;
}

function generatePoaNo() {
    DB.data.poaCounter++;
    DB.save();
    return `VKL-${new Date().getFullYear()}-${String(DB.data.poaCounter).padStart(3, '0')}`;
}

// ---- LOGO FETCHER (Karma: auto + manual) ----
function fetchCompanyLogo(companyName) {
    // Try Clearbit first, then Google favicon
    const domain = companyName.toLowerCase()
        .replace(/\s*(a\.ş\.|ltd\.|şti\.|holding|inc\.|corp\.|gmbh|llc)\s*/gi, '')
        .trim().replace(/\s+/g, '') + '.com';

    return `https://logo.clearbit.com/${domain}`;
}

function getLogoFallback(companyName) {
    // Google favicon as fallback
    const domain = companyName.toLowerCase()
        .replace(/\s*(a\.ş\.|ltd\.|şti\.|holding|inc\.|corp\.|gmbh|llc)\s*/gi, '')
        .trim().replace(/\s+/g, '') + '.com';
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// ---- PIN LOGIN ----
function showLogin() {
    const currentTheme = localStorage.getItem('hukukTheme') || 'dark';
    const themeIcon = currentTheme === 'dark' ? 'sun' : 'moon';
    document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg);font-family:var(--font);position:relative;">
        <!-- Tema Toggle -->
        <button onclick="(function(){ const c = document.documentElement.getAttribute('data-theme'); const n = c==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme',n); localStorage.setItem('hukukTheme',n); document.getElementById('loginThemeIcon').className='fas fa-'+(n==='dark'?'sun':'moon'); })()" style="position:absolute;top:20px;right:20px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;width:44px;height:44px;cursor:pointer;color:var(--text);font-size:1.2rem;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow);" title="Tema Değiştir">
            <i id="loginThemeIcon" class="fas fa-${themeIcon}"></i>
        </button>
        <div style="background:var(--bg-card);padding:48px;border-radius:16px;box-shadow:var(--shadow-lg);text-align:center;max-width:420px;width:90%;">
            <i class="fas fa-balance-scale" style="font-size:3rem;color:var(--primary);margin-bottom:16px;display:block;"></i>
            <h1 style="font-family:var(--font-display);margin-bottom:4px;color:var(--text);">Hukuk Teklif Asistanı</h1>
            <p style="color:var(--text-secondary);margin-bottom:24px;font-size:0.85rem;">Büro Yönetim Sistemi</p>

            <!-- Avukat Seçim -->
            <div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px;">
                <button onclick="selectLoginUser(0)" id="loginUser0" style="flex:1;padding:14px 10px;border:2px solid var(--border);border-radius:12px;background:var(--bg);cursor:pointer;transition:all 0.2s;text-align:center;">
                    <i class="fas fa-user-tie" style="font-size:1.6rem;color:var(--primary);display:block;margin-bottom:6px;"></i>
                    <div style="font-weight:600;color:var(--text);font-size:0.9rem;">${DB.data.users[0]?.name || 'Avukat 1'}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;">PIN ile giriş</div>
                </button>
                <button onclick="selectLoginUser(1)" id="loginUser1" style="flex:1;padding:14px 10px;border:2px solid var(--border);border-radius:12px;background:var(--bg);cursor:pointer;transition:all 0.2s;text-align:center;">
                    <i class="fas fa-user-tie" style="font-size:1.6rem;color:var(--accent2);display:block;margin-bottom:6px;"></i>
                    <div style="font-weight:600;color:var(--text);font-size:0.9rem;">${DB.data.users[1]?.name || 'Avukat 2'}</div>
                    <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;">PIN ile giriş</div>
                </button>
            </div>

            <p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.82rem;">PIN kodunuzu girin</p>
            <div id="pinDots" style="display:flex;gap:12px;justify-content:center;margin-bottom:24px;">
                <div class="pin-dot" style="width:16px;height:16px;border-radius:50%;border:2px solid var(--border);transition:all 0.2s;"></div>
                <div class="pin-dot" style="width:16px;height:16px;border-radius:50%;border:2px solid var(--border);transition:all 0.2s;"></div>
                <div class="pin-dot" style="width:16px;height:16px;border-radius:50%;border:2px solid var(--border);transition:all 0.2s;"></div>
                <div class="pin-dot" style="width:16px;height:16px;border-radius:50%;border:2px solid var(--border);transition:all 0.2s;"></div>
            </div>
            <div id="pinPad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:240px;margin:0 auto;">
                ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(n =>
                    n === '' ? '<div></div>' :
                    `<button onclick="pinInput('${n}')" style="padding:16px;border:1px solid var(--border);border-radius:10px;font-size:1.3rem;font-weight:600;background:var(--bg);color:var(--text);cursor:pointer;font-family:var(--font);transition:all 0.15s;"
                    onmouseover="this.style.background='var(--primary)';this.style.color='#fff'"
                    onmouseout="this.style.background='var(--bg)';this.style.color='var(--text)'">${n}</button>`
                ).join('')}
            </div>
            <p id="pinError" style="color:var(--accent);margin-top:16px;font-size:0.85rem;display:none;">Yanlış PIN kodu</p>
            <div style="margin-top:20px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
                <p style="color:var(--text-secondary);font-size:0.75rem;margin:0;"><i class="fas fa-info-circle" style="margin-right:4px;"></i> Varsayılan PIN: <strong>Avukat 1 → 1234</strong> | <strong>Avukat 2 → 5678</strong></p>
                <p style="color:var(--text-secondary);font-size:0.72rem;margin:4px 0 0 0;">PIN'inizi Ayarlar → Veri Yönetimi'nden değiştirebilirsiniz.</p>
            </div>
        </div>
    </div>`;
}

window.selectLoginUser = function(index) {
    document.querySelectorAll('#loginUser0, #loginUser1').forEach((btn, i) => {
        if (i === index) {
            btn.style.borderColor = 'var(--primary)';
            btn.style.background = 'var(--bg-hover)';
            btn.style.boxShadow = '0 0 0 3px rgba(74,108,247,0.15)';
        } else {
            btn.style.borderColor = 'var(--border)';
            btn.style.background = 'var(--bg)';
            btn.style.boxShadow = 'none';
        }
    });
};

let currentPin = '';
window.pinInput = function(val) {
    if (val === '⌫') {
        currentPin = currentPin.slice(0, -1);
    } else if (currentPin.length < 4) {
        currentPin += val;
    }

    // Update dots
    document.querySelectorAll('.pin-dot').forEach((dot, i) => {
        dot.style.background = i < currentPin.length ? 'var(--primary)' : 'transparent';
        dot.style.borderColor = i < currentPin.length ? 'var(--primary)' : 'var(--border)';
    });

    if (currentPin.length === 4) {
        const user = DB.data.users.find(u => u.pin === currentPin);
        if (user) {
            // Highlight the matched user card
            const userIdx = DB.data.users.indexOf(user);
            selectLoginUser(userIdx);
            DB.data.currentUser = user;
            DB.save();
            currentPin = '';
            // Brief delay to show which user logged in
            setTimeout(() => location.reload(), 400);
        } else {
            const err = document.getElementById('pinError');
            if (err) err.style.display = 'block';
            currentPin = '';
            setTimeout(() => {
                document.querySelectorAll('.pin-dot').forEach(dot => {
                    dot.style.background = 'transparent';
                    dot.style.borderColor = 'var(--border)';
                });
            }, 300);
        }
    }
};

// ---- THEME ----
function initTheme() {
    const saved = localStorage.getItem('hukukTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hukukTheme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = $('#themeToggle');
    if (btn) btn.innerHTML = `<i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
}

// ---- NAVIGATION ----
function navigateTo(pageId) {
    $$('.page').forEach(p => p.classList.remove('active'));
    $$('.nav-item').forEach(n => n.classList.remove('active'));

    const page = $(`#page-${pageId}`);
    const nav = $(`.nav-item[data-page="${pageId}"]`);
    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');

    const titles = {
        'dashboard': 'Ana Sayfa',
        'new-proposal': 'Yeni Teklif Oluştur',
        'proposals': 'Tekliflerim',
        'templates': 'Şablonlar',
        'credentials': 'Credential Kütüphanesi',
        'contracts': 'Sözleşme & Vekaletname',
        'settings': 'Ayarlar',
        'hearings': 'Duruşma & Süre Takibi',
        'clients': 'Müvekkiller (CRM)',
        'case-files': 'Dosya Takibi',
        'expenses': 'Masraf Takibi',
        'tasks': 'Görevler',
        'timesheet': 'Zaman Takibi',
        'contacts': 'Karşı Taraf & Kişiler',
        'petitions': 'Dilekçe Şablonları',
        'tools': 'Hesaplama Araçları'
    };
    $('#pageTitle').textContent = titles[pageId] || pageId;

    // Close sidebar on mobile
    $('#sidebar').classList.remove('open');

    // Refresh page content
    if (pageId === 'dashboard') refreshDashboard();
    if (pageId === 'proposals') refreshProposalsList();
    if (pageId === 'credentials') refreshCredentialsLibrary();
    if (pageId === 'contracts') refreshContracts();
    if (pageId === 'hearings') refreshHearings();
    if (pageId === 'case-files') refreshCaseFiles();
    if (pageId === 'templates') refreshCustomTemplates();
}

// ---- WIZARD STATE ----
let wizardStep = 1;
const TOTAL_STEPS = 7;
let currentProposal = null;
let editingProposalId = null;

function initWizard() {
    wizardStep = 1;
    currentProposal = {
        id: genId(),
        no: generateProposalNo(),
        title: '',
        clientName: '',
        contactPerson: '',
        date: new Date().toISOString().split('T')[0],
        validityDays: 30,
        type: 'specific',
        topics: [],
        legalArea: '',
        summary: '',
        understanding: '',
        workSteps: [],
        feeModel: 'fixed',
        fees: {},
        paymentTerms: '',
        expenseNote: '',
        lawyers: [],
        credentials: [],
        language: 'tr',
        currency: 'TRY',
        status: 'draft',
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || 'Unknown'
    };
    editingProposalId = null;

    // Set default date
    const dateInput = $('#proposalDate');
    if (dateInput) dateInput.value = currentProposal.date;

    // Reset all wizard forms
    resetWizardForms();
    updateWizardUI();
    addDefaultWorkSteps();
    addDefaultLawyers();
}

function resetWizardForms() {
    ['proposalTitle', 'clientName', 'contactPerson', 'proposalSummary',
     'understandingText', 'fixedFeeAmount', 'hourlyRate', 'estimatedHours',
     'successRate', 'successCriteria', 'mixedFixed', 'mixedHourly',
     'monthlyFee', 'contractDuration', 'monthlyScope', 'paymentTerms', 'expenseNote'
    ].forEach(id => {
        const el = $(`#${id}`);
        if (el) el.value = '';
    });

    const validityEl = $('#validityDays');
    if (validityEl) validityEl.value = '30';

    const feeModel = $('#feeModel');
    if (feeModel) feeModel.value = 'fixed';

    const typeRadio = $('input[name="proposalType"][value="specific"]');
    if (typeRadio) typeRadio.checked = true;

    updateFeeModelUI();
    updateProposalTypeUI();
}

function updateWizardUI() {
    $$('.wizard-step').forEach(s => {
        const step = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (step === wizardStep) s.classList.add('active');
        else if (step < wizardStep) s.classList.add('completed');
    });

    $$('.wizard-content').forEach(c => {
        c.classList.toggle('active', parseInt(c.dataset.step) === wizardStep);
    });

    const prevBtn = $('#prevStepBtn');
    const nextBtn = $('#nextStepBtn');
    if (prevBtn) prevBtn.disabled = wizardStep === 1;
    if (nextBtn) {
        if (wizardStep === TOTAL_STEPS) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = '';
            nextBtn.innerHTML = 'İleri <i class="fas fa-arrow-right"></i>';
        }
    }

    if (wizardStep === TOTAL_STEPS) {
        renderPreview();
    }
}

function nextStep() {
    collectCurrentStepData();
    if (wizardStep < TOTAL_STEPS) {
        wizardStep++;
        updateWizardUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevStep() {
    collectCurrentStepData();
    if (wizardStep > 1) {
        wizardStep--;
        updateWizardUI();
    }
}

function collectCurrentStepData() {
    if (!currentProposal) return;

    switch (wizardStep) {
        case 1:
            currentProposal.title = $('#proposalTitle')?.value || '';
            currentProposal.clientName = $('#clientName')?.value || '';
            currentProposal.contactPerson = $('#contactPerson')?.value || '';
            currentProposal.date = $('#proposalDate')?.value || '';
            currentProposal.validityDays = parseInt($('#validityDays')?.value) || 30;
            currentProposal.type = document.querySelector('input[name="proposalType"]:checked')?.value || 'specific';
            currentProposal.legalArea = $('#legalArea')?.value || '';
            currentProposal.summary = $('#proposalSummary')?.value || '';
            currentProposal.language = $('#proposalLang')?.value || 'tr';
            currentProposal.currency = $('#proposalCurrency')?.value || 'TRY';
            currentProposal.letterhead = document.querySelector('input[name="letterhead"]:checked')?.value || 'full';

            // Collect multi topics
            if (currentProposal.type === 'multi') {
                currentProposal.topics = [];
                $$('.topic-item').forEach(item => {
                    currentProposal.topics.push({
                        name: item.querySelector('.topic-name')?.value || '',
                        area: item.querySelector('.topic-area')?.value || ''
                    });
                });
            }
            break;

        case 2:
            currentProposal.understanding = $('#understandingText')?.value || '';
            break;

        case 3:
            currentProposal.workSteps = [];
            $$('.work-step-item').forEach(item => {
                currentProposal.workSteps.push({
                    title: item.querySelector('.step-title')?.value || '',
                    description: item.querySelector('.step-desc')?.value || ''
                });
            });
            break;

        case 4:
            currentProposal.feeModel = $('#feeModel')?.value || 'fixed';
            currentProposal.fees = collectFeeData();
            currentProposal.paymentTerms = $('#paymentTerms')?.value || '';
            currentProposal.expenseNote = $('#expenseNote')?.value || '';
            break;

        case 5:
            currentProposal.lawyers = [];
            $$('.lawyer-card').forEach(card => {
                currentProposal.lawyers.push({
                    name: card.querySelector('.lawyer-name')?.value || '',
                    title: card.querySelector('.lawyer-title')?.value || '',
                    barNo: card.querySelector('.lawyer-barno')?.value || '',
                    education: card.querySelector('.lawyer-education')?.value || '',
                    expertise: card.querySelector('.lawyer-expertise')?.value || '',
                    experience: card.querySelector('.lawyer-experience')?.value || '',
                    bio: card.querySelector('.lawyer-bio')?.value || ''
                });
            });
            break;

        case 6:
            currentProposal.credentials = [];
            $$('#credentialsList .credential-item').forEach(item => {
                currentProposal.credentials.push({
                    id: item.dataset.credId,
                    title: item.querySelector('.cred-title')?.textContent || '',
                    client: item.dataset.client || '',
                    clientType: item.dataset.clientType || 'company',
                    logo: item.dataset.logo || '',
                    description: item.querySelector('.cred-desc')?.textContent || '',
                    year: item.dataset.year || '',
                    area: item.dataset.area || '',
                    confidential: item.dataset.confidential === 'true'
                });
            });
            break;
    }
}

function collectFeeData() {
    const model = $('#feeModel')?.value;
    const fees = { model };

    switch (model) {
        case 'fixed':
            fees.amount = $('#fixedFeeAmount')?.value || '';
            fees.vat = $('#fixedFeeVat')?.value || '20';
            break;
        case 'hourly':
            fees.rate = $('#hourlyRate')?.value || '';
            fees.hours = $('#estimatedHours')?.value || '';
            break;
        case 'success':
            fees.rate = $('#successRate')?.value || '';
            fees.criteria = $('#successCriteria')?.value || '';
            break;
        case 'mixed':
            fees.fixed = $('#mixedFixed')?.value || '';
            fees.hourly = $('#mixedHourly')?.value || '';
            break;
        case 'monthly':
            fees.monthly = $('#monthlyFee')?.value || '';
            fees.duration = $('#contractDuration')?.value || '12';
            fees.scope = $('#monthlyScope')?.value || '';
            break;
    }

    // Multi topic fees
    if (currentProposal?.type === 'multi') {
        fees.topicFees = [];
        $$('.multi-fee-item').forEach(item => {
            fees.topicFees.push({
                topicName: item.querySelector('.mf-topic-name')?.textContent || '',
                model: item.querySelector('.mf-model')?.value || 'fixed',
                amount: item.querySelector('.mf-amount')?.value || ''
            });
        });
    }

    return fees;
}

// ---- DYNAMIC FORM ELEMENTS ----

function addDefaultWorkSteps() {
    const container = $('#workStepsList');
    if (!container) return;
    container.innerHTML = '';
    addWorkStep('', '');
}

function addWorkStep(title = '', desc = '') {
    const container = $('#workStepsList');
    if (!container) return;
    const num = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'work-step-item';
    div.innerHTML = `
        <div class="step-header">
            <div class="step-num">${num}</div>
            <input type="text" class="step-title" placeholder="İş adımı başlığı" value="${title}">
        </div>
        <textarea class="step-desc" rows="2" placeholder="Bu adımın açıklaması...">${desc}</textarea>
        <button class="remove-step" onclick="this.closest('.work-step-item').remove();renumberSteps();" title="Sil">
            <i class="fas fa-times"></i>
        </button>`;
    container.appendChild(div);
}

window.renumberSteps = function() {
    $$('.work-step-item .step-num').forEach((el, i) => el.textContent = i + 1);
};

function addDefaultLawyers() {
    const container = $('#lawyersList');
    if (!container) return;
    container.innerHTML = '';

    DB.data.lawyers.forEach(lawyer => {
        addLawyerCard(lawyer);
    });
}

function addLawyerCard(data = {}) {
    const container = $('#lawyersList');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'lawyer-card';
    div.innerHTML = `
        <button class="remove-lawyer" onclick="this.closest('.lawyer-card').remove();" title="Sil">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-row">
            <div class="form-group">
                <label>Ad Soyad</label>
                <input type="text" class="lawyer-name" value="${data.name || ''}" placeholder="Av. Ad Soyad">
            </div>
            <div class="form-group">
                <label>Unvan</label>
                <input type="text" class="lawyer-title" value="${data.title || ''}" placeholder="Kurucu Ortak / Kıdemli Avukat">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Baro Sicil No</label>
                <input type="text" class="lawyer-barno" value="${data.barNo || ''}" placeholder="12345">
            </div>
            <div class="form-group">
                <label>Eğitim</label>
                <input type="text" class="lawyer-education" value="${data.education || ''}" placeholder="İstanbul Üniversitesi Hukuk Fakültesi">
            </div>
        </div>
        <div class="form-group">
            <label>Uzmanlık Alanları</label>
            <input type="text" class="lawyer-expertise" value="${data.expertise || ''}" placeholder="Şirketler Hukuku, M&A, Uyum">
        </div>
        <div class="form-group">
            <label>Deneyim (Yıl)</label>
            <input type="text" class="lawyer-experience" value="${data.experience || ''}" placeholder="15+">
        </div>
        <div class="form-group">
            <label>Kısa Biyografi (İşe özel düzenleyebilirsiniz)</label>
            <textarea class="lawyer-bio" rows="3" placeholder="Avukatın kısa biyografisi...">${data.bio || ''}</textarea>
        </div>`;
    container.appendChild(div);
}

// ---- MULTI-TOPIC ----
function addTopic() {
    const container = $('#topicsList');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'topic-item';
    div.style.cssText = 'display:flex;gap:10px;align-items:center;margin-bottom:8px;';
    div.innerHTML = `
        <input type="text" class="topic-name" placeholder="Konu adı" style="flex:1;">
        <select class="topic-area" style="width:200px;">
            <option value="sirketler">Şirketler Hukuku</option>
            <option value="birlesme">M&A</option>
            <option value="is">İş Hukuku</option>
            <option value="sozlesme">Sözleşmeler</option>
            <option value="dava">Dava</option>
            <option value="uyum">Uyum</option>
            <option value="kvkk">KVKK</option>
            <option value="gayrimenkul">Gayrimenkul</option>
            <option value="fikri">Fikri Mülkiyet</option>
            <option value="rekabet">Rekabet</option>
            <option value="vergi">Vergi</option>
            <option value="diger">Diğer</option>
        </select>
        <button class="btn btn-sm btn-ghost" onclick="this.closest('.topic-item').remove()" style="color:var(--accent);">
            <i class="fas fa-times"></i>
        </button>`;
    container.appendChild(div);
}

// ---- FEE MODEL UI ----
function updateFeeModelUI() {
    const model = $('#feeModel')?.value;
    ['Fixed', 'Hourly', 'Success', 'Mixed', 'Monthly'].forEach(m => {
        const el = $(`#feeDetails${m}`);
        if (el) el.classList.toggle('hidden', model !== m.toLowerCase());
    });
}

function updateProposalTypeUI() {
    const type = document.querySelector('input[name="proposalType"]:checked')?.value;
    const multi = $('#multiTopicArea');
    const single = $('#singleTopicArea');
    if (multi) multi.classList.toggle('hidden', type !== 'multi');
    if (single) single.classList.toggle('hidden', type === 'multi');

    // Fee section
    const specificFee = $('#specificFeeArea');
    const multiFee = $('#multiFeeArea');
    if (specificFee) specificFee.classList.toggle('hidden', type === 'multi');
    if (multiFee) multiFee.classList.toggle('hidden', type !== 'multi');

    if (type === 'general') {
        const feeModel = $('#feeModel');
        if (feeModel) {
            feeModel.value = 'monthly';
            updateFeeModelUI();
        }
    }
}

// ---- CREDENTIAL IN PROPOSAL ----
function addCredentialToProposal(credData = null) {
    const container = $('#credentialsList');
    if (!container) return;

    const data = credData || { id: genId(), title: '', client: '', clientType: 'company', logo: '', description: '', year: new Date().getFullYear(), area: '', confidential: false };

    const logoSrc = data.logo || (data.clientType === 'company' && data.client ? fetchCompanyLogo(data.client) : '');

    const div = document.createElement('div');
    div.className = 'credential-item';
    div.dataset.credId = data.id;
    div.dataset.client = data.client;
    div.dataset.clientType = data.clientType;
    div.dataset.logo = logoSrc;
    div.dataset.year = data.year;
    div.dataset.area = data.area;
    div.dataset.confidential = data.confidential;

    div.innerHTML = `
        <div class="cred-logo">
            ${logoSrc ? `<img src="${logoSrc}" alt="" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-building\\'></i>'">` : '<i class="fas fa-building"></i>'}
        </div>
        <div class="cred-info">
            <div class="cred-title">${data.title}</div>
            <div class="cred-meta">${data.confidential ? 'Gizli Müvekkil' : data.client} | ${data.year} | ${data.area}</div>
            <div class="cred-desc">${data.description}</div>
        </div>
        <button class="remove-cred" onclick="this.closest('.credential-item').remove();" title="Kaldır">
            <i class="fas fa-times"></i>
        </button>`;
    container.appendChild(div);
}

// ---- CREDENTIAL LIBRARY ----
function refreshCredentialsLibrary() {
    const container = $('#credentialsLibraryList');
    if (!container) return;

    if (DB.data.credentials.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz credential eklenmedi.</p>';
        return;
    }

    container.innerHTML = DB.data.credentials.map(c => {
        const logoSrc = c.logo || (c.clientType === 'company' ? fetchCompanyLogo(c.client) : '');
        return `
        <div class="credential-lib-item">
            <div class="cred-logo">
                ${logoSrc ? `<img src="${logoSrc}" alt="" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-building\\'></i>'">` : '<i class="fas fa-building"></i>'}
            </div>
            <div class="cred-info">
                <div class="cred-title" style="font-weight:600;">${c.title}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary);">${c.confidential ? 'Gizli Müvekkil' : c.client} | ${c.year} | ${c.area}</div>
                <div style="font-size:0.85rem;margin-top:4px;">${c.description}</div>
            </div>
            <div class="cred-actions">
                <button class="btn btn-sm btn-outline" onclick="editCredential('${c.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="deleteCredential('${c.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');

    // Update library select in proposal wizard
    updateCredentialSelect();
}

function updateCredentialSelect() {
    const sel = $('#credentialLibrarySelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">Kütüphaneden seçin...</option>' +
        DB.data.credentials.map(c => `<option value="${c.id}">${c.title} (${c.client})</option>`).join('');
}

let editingCredId = null;

function openCredentialModal(id = null) {
    editingCredId = id;
    const modal = $('#credentialModal');
    if (!modal) return;

    if (id) {
        const c = DB.data.credentials.find(x => x.id === id);
        if (c) {
            $('#credTitle').value = c.title;
            $('#credArea').value = c.area;
            $('#credClient').value = c.client;
            document.querySelector(`input[name="credClientType"][value="${c.clientType}"]`).checked = true;
            $('#credLogoUrl').value = c.logo || '';
            $('#credDescription').value = c.description;
            $('#credYear').value = c.year;
            $('#credConfidential').checked = c.confidential;
        }
    } else {
        $('#credTitle').value = '';
        $('#credClient').value = '';
        $('#credDescription').value = '';
        $('#credLogoUrl').value = '';
        $('#credYear').value = new Date().getFullYear();
        $('#credConfidential').checked = false;
    }

    modal.classList.add('active');
}

function saveCredential() {
    const cred = {
        id: editingCredId || genId(),
        title: $('#credTitle').value,
        area: $('#credArea').value,
        client: $('#credClient').value,
        clientType: document.querySelector('input[name="credClientType"]:checked')?.value || 'company',
        logo: $('#credLogoUrl').value,
        description: $('#credDescription').value,
        year: parseInt($('#credYear').value),
        confidential: $('#credConfidential').checked
    };

    if (editingCredId) {
        const idx = DB.data.credentials.findIndex(c => c.id === editingCredId);
        if (idx >= 0) DB.data.credentials[idx] = cred;
    } else {
        DB.data.credentials.push(cred);
    }

    DB.save();
    closeCredentialModal();
    refreshCredentialsLibrary();
    toast('Credential kaydedildi', 'success');
}

function closeCredentialModal() {
    $('#credentialModal')?.classList.remove('active');
    editingCredId = null;
}

window.editCredential = function(id) { openCredentialModal(id); };
window.deleteCredential = function(id) {
    if (confirm('Bu credential silinsin mi?')) {
        DB.data.credentials = DB.data.credentials.filter(c => c.id !== id);
        DB.save();
        refreshCredentialsLibrary();
        toast('Credential silindi', 'success');
    }
};

// ---- PREVIEW RENDERER ----
function renderPreview() {
    collectCurrentStepData();
    const p = currentProposal;
    const container = $('#previewContainer');
    if (!container || !p) return;

    const s = DB.data.settings;
    const lang = p.language || 'tr';
    const curr = p.currency || 'TRY';

    const labels = getLabels(lang);

    let html = '';
    const letterhead = p.letterhead || 'full';

    // Header - Antetli Kağıt
    if (letterhead === 'full') {
        html += `<div class="preview-header-info" style="border-bottom:3px solid #4a6cf7;padding-bottom:18px;margin-bottom:24px;">
            <div style="display:flex;align-items:center;gap:20px;">
                ${s.firmLogo ? `<img src="${s.firmLogo}" class="preview-firm-logo" alt="Logo" style="width:80px;height:auto;">` : ''}
                <div>
                    <h1 style="margin:0;border:none;padding:0;font-size:1.6rem;">${s.firmName || 'Hukuk Bürosu'}</h1>
                    <div class="preview-subtitle" style="margin:4px 0 0 0;">
                        ${s.barAssociation ? s.barAssociation + '<br>' : ''}
                        ${s.firmAddress ? s.firmAddress + '<br>' : ''}
                        ${[s.firmPhone ? 'Tel: ' + s.firmPhone : '', s.firmEmail, s.firmWebsite].filter(Boolean).join(' | ')}
                    </div>
                </div>
            </div>
        </div>`;
    } else if (letterhead === 'minimal') {
        html += `<div style="text-align:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #4a6cf7;">
            <h1 style="margin:0;border:none;padding:0;font-size:1.4rem;">${s.firmName || 'Hukuk Bürosu'}</h1>
        </div>`;
    }
    // letterhead === 'none' → no header

    // Teklif Bilgileri
    html += `<div style="display:flex;justify-content:space-between;padding:14px 0;border-top:1px solid #e1e5ee;border-bottom:1px solid #e1e5ee;margin-bottom:24px;">
        <div>
            <strong>${labels.proposalNo}:</strong> ${p.no}<br>
            <strong>${labels.date}:</strong> ${formatDate(p.date)}<br>
            <strong>${labels.validity}:</strong> ${p.validityDays} ${labels.days}
        </div>
        <div style="text-align:right;">
            <strong>${labels.client}:</strong> ${p.clientName}<br>
            <strong>${labels.contact}:</strong> ${p.contactPerson}
        </div>
    </div>`;

    // Title
    html += `<h1 style="font-size:1.5rem;text-align:center;margin-bottom:24px;border:none;padding:0;">${p.title}</h1>`;

    // 1. Anlayışımız
    if (p.understanding) {
        html += `<h2>${labels.understanding}</h2>`;
        html += `<p>${p.understanding.replace(/\n/g, '<br>')}</p>`;
    }

    // 2. İş Adımları
    if (p.workSteps?.length > 0) {
        html += `<h2>${labels.workSteps}</h2>`;
        p.workSteps.forEach((step, i) => {
            if (step.title || step.description) {
                html += `<div class="preview-step">
                    <div class="preview-step-num">${i + 1}</div>
                    <div>
                        <strong>${step.title}</strong>
                        ${step.description ? `<p style="margin-top:4px;">${step.description}</p>` : ''}
                    </div>
                </div>`;
            }
        });
    }

    // 3. Ücretlendirme
    html += `<h2>${labels.fees}</h2>`;
    html += renderFeePreview(p, labels, curr);

    if (p.paymentTerms) {
        html += `<p><strong>${labels.paymentTerms}:</strong> ${p.paymentTerms}</p>`;
    }
    if (p.expenseNote) {
        html += `<p><strong>${labels.expenses}:</strong> ${p.expenseNote}</p>`;
    }

    // 4. Özgeçmiş
    if (p.lawyers?.length > 0) {
        html += `<h2>${labels.team}</h2>`;
        p.lawyers.forEach(l => {
            if (l.name) {
                html += `<div class="preview-lawyer">
                    <h4>${l.name}</h4>
                    ${l.title ? `<p><strong>${labels.lawyerTitle}:</strong> ${l.title}</p>` : ''}
                    ${l.barNo ? `<p><strong>${labels.barNo}:</strong> ${l.barNo}</p>` : ''}
                    ${l.education ? `<p><strong>${labels.education}:</strong> ${l.education}</p>` : ''}
                    ${l.expertise ? `<p><strong>${labels.expertise}:</strong> ${l.expertise}</p>` : ''}
                    ${l.experience ? `<p><strong>${labels.experienceYears}:</strong> ${l.experience} ${labels.years}</p>` : ''}
                    ${l.bio ? `<p>${l.bio}</p>` : ''}
                </div>`;
            }
        });
    }

    // 5. Credentials
    if (p.credentials?.length > 0) {
        html += `<h2>${labels.credentials}</h2>`;
        p.credentials.forEach(c => {
            const displayClient = c.confidential ? labels.confidentialClient : c.client;
            html += `<div class="preview-credential">
                <div class="preview-cred-logo">
                    ${c.logo && !c.confidential ? `<img src="${c.logo}" alt="" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-building\\'></i>'">` : '<i class="fas fa-building" style="color:#ccc;"></i>'}
                </div>
                <div>
                    <strong>${c.title}</strong>
                    <div style="font-size:0.85rem;color:#636e72;">${displayClient} | ${c.year}</div>
                    <div style="font-size:0.88rem;margin-top:4px;">${c.description}</div>
                </div>
            </div>`;
        });
    }

    // İmza Alanı
    html += `<div style="margin-top:48px;padding-top:24px;border-top:1px solid #e1e5ee;">
        <p>${labels.regards},</p>
        <div style="margin-top:36px;">
            ${p.lawyers?.filter(l => l.name).map(l => `
                <div style="margin-bottom:20px;">
                    <strong>${l.name}</strong><br>
                    <span style="font-size:0.85rem;color:#636e72;">${l.title || ''}</span>
                </div>
            `).join('') || ''}
        </div>
    </div>`;

    container.innerHTML = html;
}

function renderFeePreview(p, labels, curr) {
    const fees = p.fees || {};
    let html = '';

    if (p.type === 'multi' && fees.topicFees?.length > 0) {
        html += `<table class="preview-fee-table">
            <thead><tr><th>${labels.topic}</th><th>${labels.feeModel}</th><th>${labels.amount}</th></tr></thead>
            <tbody>`;
        fees.topicFees.forEach(tf => {
            html += `<tr><td>${tf.topicName}</td><td>${getFeeModelLabel(tf.model, labels)}</td><td>${formatCurrency(tf.amount, curr)}</td></tr>`;
        });
        html += `</tbody></table>`;
    } else {
        switch (fees.model) {
            case 'fixed':
                html += `<table class="preview-fee-table">
                    <tr><td><strong>${labels.fixedFee}</strong></td><td>${formatCurrency(fees.amount, curr)}</td></tr>
                    <tr><td><strong>KDV</strong></td><td>${fees.vat === '0' ? labels.excludingVat : labels.includingVat}</td></tr>
                </table>`;
                break;
            case 'hourly':
                html += `<table class="preview-fee-table">
                    <tr><td><strong>${labels.hourlyRate}</strong></td><td>${formatCurrency(fees.rate, curr)}/${labels.hour}</td></tr>
                    <tr><td><strong>${labels.estimatedHours}</strong></td><td>${fees.hours} ${labels.hours}</td></tr>
                    <tr><td><strong>${labels.estimatedTotal}</strong></td><td>${formatCurrency(parseFloat(String(fees.rate).replace(/[^\d]/g,'')) * parseFloat(fees.hours || 0), curr)}</td></tr>
                </table>`;
                break;
            case 'success':
                html += `<table class="preview-fee-table">
                    <tr><td><strong>${labels.successRate}</strong></td><td>%${fees.rate}</td></tr>
                    <tr><td><strong>${labels.successCriteria}</strong></td><td>${fees.criteria}</td></tr>
                </table>`;
                break;
            case 'mixed':
                html += `<table class="preview-fee-table">
                    <tr><td><strong>${labels.fixedPart}</strong></td><td>${formatCurrency(fees.fixed, curr)}</td></tr>
                    <tr><td><strong>${labels.hourlyPart}</strong></td><td>${formatCurrency(fees.hourly, curr)}/${labels.hour}</td></tr>
                </table>`;
                break;
            case 'monthly':
                html += `<table class="preview-fee-table">
                    <tr><td><strong>${labels.monthlyFee}</strong></td><td>${formatCurrency(fees.monthly, curr)}</td></tr>
                    <tr><td><strong>${labels.contractDuration}</strong></td><td>${fees.duration} ${labels.months}</td></tr>
                    ${fees.scope ? `<tr><td><strong>${labels.scope}</strong></td><td>${fees.scope}</td></tr>` : ''}
                </table>`;
                break;
        }
    }

    return html;
}

function getFeeModelLabel(model, labels) {
    const map = { fixed: labels.fixedFee, hourly: labels.hourlyRate, success: labels.successRate, mixed: labels.mixed, monthly: labels.monthlyFee };
    return map[model] || model;
}

// ---- LANGUAGE LABELS ----
function getLabels(lang) {
    const labels = {
        tr: {
            proposalNo: 'Teklif No', date: 'Tarih', validity: 'Geçerlilik', days: 'gün',
            client: 'Müvekkil', contact: 'İletişim', understanding: '1. Anlayışımız',
            workSteps: '2. Yapılacak İş Adımları', fees: '3. Avukatlık Hizmet Bedeli',
            team: '4. Ekibimiz', credentials: '5. Referans İşlerimiz',
            paymentTerms: 'Ödeme Koşulları', expenses: 'Masraflar',
            fixedFee: 'Maktu Ücret', hourlyRate: 'Saatlik Ücret', hour: 'saat', hours: 'saat',
            estimatedHours: 'Tahmini Süre', estimatedTotal: 'Tahmini Toplam',
            successRate: 'Başarı Primi Oranı', successCriteria: 'Başarı Kriteri',
            fixedPart: 'Sabit Kısım', hourlyPart: 'Saatlik Kısım', mixed: 'Karma',
            monthlyFee: 'Aylık Sabit Ücret', contractDuration: 'Sözleşme Süresi', months: 'ay',
            scope: 'Kapsam', topic: 'Konu', feeModel: 'Ücret Modeli', amount: 'Tutar',
            includingVat: '%20 KDV dahil', excludingVat: 'KDV hariç',
            lawyerTitle: 'Unvan', barNo: 'Baro Sicil No', education: 'Eğitim',
            expertise: 'Uzmanlık', experienceYears: 'Deneyim', years: 'yıl',
            confidentialClient: 'Gizli Müvekkil', regards: 'Saygılarımızla'
        },
        en: {
            proposalNo: 'Proposal No', date: 'Date', validity: 'Validity', days: 'days',
            client: 'Client', contact: 'Contact', understanding: '1. Our Understanding',
            workSteps: '2. Scope of Work', fees: '3. Legal Fees',
            team: '4. Our Team', credentials: '5. Relevant Experience',
            paymentTerms: 'Payment Terms', expenses: 'Expenses',
            fixedFee: 'Fixed Fee', hourlyRate: 'Hourly Rate', hour: 'hour', hours: 'hours',
            estimatedHours: 'Estimated Hours', estimatedTotal: 'Estimated Total',
            successRate: 'Success Fee Rate', successCriteria: 'Success Criteria',
            fixedPart: 'Fixed Part', hourlyPart: 'Hourly Part', mixed: 'Mixed',
            monthlyFee: 'Monthly Retainer', contractDuration: 'Contract Duration', months: 'months',
            scope: 'Scope', topic: 'Topic', feeModel: 'Fee Model', amount: 'Amount',
            includingVat: '20% VAT included', excludingVat: 'VAT excluded',
            lawyerTitle: 'Title', barNo: 'Bar Registration No', education: 'Education',
            expertise: 'Expertise', experienceYears: 'Experience', years: 'years',
            confidentialClient: 'Confidential Client', regards: 'Kind regards'
        }
    };

    if (lang === 'dual') {
        // Dual mode: TR + EN
        const dual = {};
        for (const key of Object.keys(labels.tr)) {
            dual[key] = labels.tr[key] + ' / ' + labels.en[key];
        }
        return dual;
    }

    return labels[lang] || labels.tr;
}

// ---- SAVE & LOAD PROPOSALS ----
function saveProposal() {
    collectCurrentStepData();
    if (!currentProposal) return;

    const idx = DB.data.proposals.findIndex(p => p.id === currentProposal.id);
    if (idx >= 0) {
        DB.data.proposals[idx] = { ...currentProposal };
    } else {
        DB.data.proposals.push({ ...currentProposal });
    }

    // Save lawyer data to global settings
    if (currentProposal.lawyers?.length > 0) {
        DB.data.lawyers = currentProposal.lawyers.map((l, i) => ({ ...l, id: `lawyer-${i + 1}` }));
    }

    DB.save();
    toast('Teklif kaydedildi', 'success');
    refreshDashboard();
}

function loadProposalForEdit(id) {
    const p = DB.data.proposals.find(x => x.id === id);
    if (!p) return;

    currentProposal = { ...p };
    editingProposalId = id;
    wizardStep = 1;

    // Fill forms
    navigateTo('new-proposal');

    setTimeout(() => {
        $('#proposalTitle').value = p.title || '';
        $('#clientName').value = p.clientName || '';
        $('#contactPerson').value = p.contactPerson || '';
        $('#proposalDate').value = p.date || '';
        $('#validityDays').value = p.validityDays || 30;
        $('#proposalSummary').value = p.summary || '';

        const typeRadio = $(`input[name="proposalType"][value="${p.type}"]`);
        if (typeRadio) typeRadio.checked = true;
        updateProposalTypeUI();

        if (p.legalArea) $('#legalArea').value = p.legalArea;

        const langSel = $('#proposalLang');
        if (langSel) langSel.value = p.language || 'tr';
        const currSel = $('#proposalCurrency');
        if (currSel) currSel.value = p.currency || 'TRY';

        updateWizardUI();
    }, 100);
}

function refreshProposalsList() {
    const container = $('#proposalsList');
    if (!container) return;

    if (DB.data.proposals.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz teklif yok.</p>';
        return;
    }

    container.innerHTML = DB.data.proposals.map(p => {
        const statusLabels = { draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul Edildi', rejected: 'Reddedildi' };
        return `
        <div class="proposal-card" onclick="loadProposalForEdit('${p.id}')">
            <div class="pc-info">
                <div class="pc-title">${p.title || 'İsimsiz Teklif'}</div>
                <div class="pc-meta">${p.no} | ${p.clientName} | ${formatDate(p.date)} | ${p.createdBy || ''}</div>
            </div>
            <div class="pc-actions">
                <select class="status-select" onclick="event.stopPropagation()" onchange="updateProposalStatus('${p.id}', this.value)">
                    ${Object.entries(statusLabels).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();duplicateProposal('${p.id}')" title="Kopyala"><i class="fas fa-copy"></i></button>
                <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();deleteProposal('${p.id}')" title="Sil" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

window.loadProposalForEdit = loadProposalForEdit;

window.updateProposalStatus = function(id, status) {
    const p = DB.data.proposals.find(x => x.id === id);
    if (p) {
        p.status = status;
        DB.save();
        refreshDashboard();
        refreshContracts();
        toast(`Durum güncellendi: ${status === 'accepted' ? 'Kabul Edildi' : status === 'sent' ? 'Gönderildi' : status === 'rejected' ? 'Reddedildi' : 'Taslak'}`, 'success');
    }
};

window.duplicateProposal = function(id) {
    const orig = DB.data.proposals.find(x => x.id === id);
    if (!orig) return;
    const dup = { ...JSON.parse(JSON.stringify(orig)), id: genId(), no: generateProposalNo(), status: 'draft', createdAt: new Date().toISOString() };
    dup.title = orig.title + ' (Kopya)';
    DB.data.proposals.push(dup);
    DB.save();
    refreshProposalsList();
    toast('Teklif kopyalandı', 'success');
};

window.deleteProposal = function(id) {
    if (confirm('Bu teklif silinsin mi?')) {
        DB.data.proposals = DB.data.proposals.filter(p => p.id !== id);
        DB.save();
        refreshProposalsList();
        refreshDashboard();
        toast('Teklif silindi', 'success');
    }
};

// ---- DASHBOARD ----
function refreshDashboard() {
    const d = DB.data;
    $('#statProposals').textContent = d.proposals.length;
    $('#statAccepted').textContent = d.proposals.filter(p => p.status === 'accepted').length;
    $('#statCredentials').textContent = d.credentials.length;
    $('#statContracts').textContent = d.contracts.length + d.powerOfAttorneys.length;

    const recent = $('#recentProposals');
    if (recent) {
        if (d.proposals.length === 0) {
            recent.innerHTML = '<p class="empty-state">Henüz teklif oluşturulmadı. <a href="#" data-page="new-proposal" class="link">İlk teklifinizi oluşturun →</a></p>';
        } else {
            recent.innerHTML = d.proposals.slice(-5).reverse().map(p => {
                const statusClass = { draft: 'status-draft', sent: 'status-sent', accepted: 'status-accepted', rejected: 'status-rejected' }[p.status] || 'status-draft';
                const statusLabel = { draft: 'Taslak', sent: 'Gönderildi', accepted: 'Kabul Edildi', rejected: 'Reddedildi' }[p.status] || 'Taslak';
                return `
                <div class="recent-item" onclick="loadProposalForEdit('${p.id}')">
                    <div class="ri-info">
                        <div class="ri-title">${p.title || 'İsimsiz'}</div>
                        <div class="ri-meta">${p.no} | ${p.clientName} | ${formatDate(p.date)}</div>
                    </div>
                    <span class="ri-status ${statusClass}">${statusLabel}</span>
                </div>`;
            }).join('');
        }
    }

    // Check upcoming hearings for notification banner
    checkUpcomingHearings();
}

// ---- CONTRACTS & POWER OF ATTORNEY ----
function refreshContracts() {
    // Accepted proposals tab
    const acceptedList = $('#acceptedProposalsList');
    if (acceptedList) {
        const accepted = DB.data.proposals.filter(p => p.status === 'accepted');
        if (accepted.length === 0) {
            acceptedList.innerHTML = '<p class="empty-state">Henüz kabul edilen teklif yok.</p>';
        } else {
            acceptedList.innerHTML = accepted.map(p => `
            <div class="contract-item">
                <div>
                    <strong>${p.title}</strong>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">${p.no} | ${p.clientName}</div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-primary" onclick="generateContract('${p.id}')">
                        <i class="fas fa-file-signature"></i> Sözleşme Oluştur
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="generatePOA('${p.id}')">
                        <i class="fas fa-stamp"></i> Vekaletname Oluştur
                    </button>
                </div>
            </div>`).join('');
        }
    }

    // Contracts list
    const contractsList = $('#contractsList');
    if (contractsList) {
        if (DB.data.contracts.length === 0) {
            contractsList.innerHTML = '<p class="empty-state">Henüz sözleşme oluşturulmadı.</p>';
        } else {
            contractsList.innerHTML = DB.data.contracts.map(c => `
            <div class="contract-item">
                <div>
                    <strong>${c.no} - ${c.title}</strong>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">${c.clientName} | ${formatDate(c.date)}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    ${c.signedFile ? '<span style="color:var(--accent2);font-size:0.82rem;"><i class="fas fa-check-circle"></i> İmzalı</span>' : ''}
                    <button class="btn btn-sm btn-outline" onclick="viewContract('${c.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline" onclick="exportContractWord('${c.id}')"><i class="fas fa-file-word"></i></button>
                    <label class="btn btn-sm btn-ghost" title="İmzalı sözleşme yükle">
                        <i class="fas fa-upload"></i>
                        <input type="file" accept=".pdf,.jpg,.png" style="display:none;" onchange="uploadSignedContract('${c.id}', this)">
                    </label>
                    <button class="btn btn-sm btn-ghost" onclick="deleteContract('${c.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');
        }
    }

    // POA list
    const poaList = $('#poaList');
    if (poaList) {
        if (DB.data.powerOfAttorneys.length === 0) {
            poaList.innerHTML = '<p class="empty-state">Henüz vekaletname oluşturulmadı.</p>';
        } else {
            poaList.innerHTML = DB.data.powerOfAttorneys.map(v => `
            <div class="poa-item">
                <div>
                    <strong>${v.no} - ${v.title}</strong>
                    <div style="font-size:0.82rem;color:var(--text-secondary);">${v.clientName} | ${v.type} | ${formatDate(v.date)}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    ${v.notarizedFile ? '<span style="color:var(--accent2);font-size:0.82rem;"><i class="fas fa-check-circle"></i> Noter Tasdikli</span>' : ''}
                    <button class="btn btn-sm btn-outline" onclick="viewPOA('${v.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline" onclick="exportPOAWord('${v.id}')"><i class="fas fa-file-word"></i></button>
                    <label class="btn btn-sm btn-ghost" title="Noter tasdikli vekaletname yükle">
                        <i class="fas fa-upload"></i>
                        <input type="file" accept=".pdf,.jpg,.png" style="display:none;" onchange="uploadNotarizedPOA('${v.id}', this)">
                    </label>
                    <button class="btn btn-sm btn-ghost" onclick="deletePOA('${v.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join('');
        }
    }
}

window.generateContract = function(proposalId) {
    const p = DB.data.proposals.find(x => x.id === proposalId);
    if (!p) return;

    const contract = {
        id: genId(),
        no: generateContractNo(),
        proposalId: proposalId,
        title: `Avukatlık Sözleşmesi - ${p.clientName}`,
        clientName: p.clientName,
        contactPerson: p.contactPerson,
        date: new Date().toISOString().split('T')[0],
        fees: p.fees,
        feeModel: p.feeModel,
        currency: p.currency,
        paymentTerms: p.paymentTerms,
        content: generateContractContent(p),
        customNotes: '',
        signedFile: null,
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    DB.data.contracts.push(contract);
    DB.save();
    refreshContracts();
    toast('Avukatlık sözleşmesi oluşturuldu', 'success');

    // Show contract in modal for editing
    showContractEditor(contract.id);
};

function generateContractContent(proposal) {
    const s = DB.data.settings;
    const lawyerNames = proposal.lawyers?.filter(l => l.name).map(l => l.name).join(', ') || '';

    return `AVUKATLIK HİZMET SÖZLEŞMESİ

MADDE 1 - TARAFLAR

İş Sahibi (Müvekkil):
${proposal.clientName}
İletişim: ${proposal.contactPerson}

Avukat:
${s.firmName || '[Büro Adı]'}
${s.firmAddress || '[Adres]'}
${lawyerNames}

MADDE 2 - SÖZLEŞMENİN KONUSU

İşbu sözleşme, Müvekkilin aşağıda belirtilen hukuki konularda Avukattan hukuki danışmanlık ve/veya avukatlık hizmeti almasına ilişkin şartları düzenlemektedir.

Konu: ${proposal.title}

MADDE 3 - AVUKATIN YÜKÜMLÜLÜKLERİ

Avukat, işbu sözleşme kapsamında;
${proposal.workSteps?.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n') || '- Belirtilen hukuki hizmetleri sunacaktır.'}

MADDE 4 - AVUKATLIK ÜCRETİ

${renderContractFeeText(proposal)}

MADDE 5 - ÖDEME KOŞULLARI

${proposal.paymentTerms || 'Ödeme koşulları taraflarca ayrıca belirlenecektir.'}

${proposal.expenseNote ? `MADDE 6 - MASRAFLAR\n\n${proposal.expenseNote}` : ''}

MADDE 7 - SÖZLEŞMENİN SÜRESİ

İşbu sözleşme imza tarihinde yürürlüğe girer ve sözleşme konusu hizmetin tamamlanmasına kadar geçerliliğini korur.

MADDE 8 - FESİH

Taraflardan her biri, yazılı bildirimde bulunmak suretiyle işbu sözleşmeyi feshedebilir. Fesih halinde, fesih tarihine kadar sunulan hizmetlere ilişkin ücret ve masraflar Müvekkil tarafından ödenecektir.

MADDE 9 - GİZLİLİK

Taraflar, işbu sözleşme kapsamında edindikleri tüm bilgi ve belgeleri gizli tutmayı taahhüt ederler.

MADDE 10 - UYUŞMAZLIK

İşbu sözleşmeden doğan uyuşmazlıkların çözümünde ${s.barAssociation || 'İstanbul'} Mahkemeleri ve İcra Daireleri yetkilidir.

İşbu sözleşme iki nüsha olarak düzenlenmiş ve taraflarca imza altına alınmıştır.

Tarih: ${formatDate(new Date().toISOString().split('T')[0])}

MÜVEKKİL                                    AVUKAT
${proposal.clientName}                       ${s.firmName || ''}

İmza: _________________                     İmza: _________________`;
}

function renderContractFeeText(p) {
    const fees = p.fees || {};
    const curr = p.currency || 'TRY';

    switch (fees.model) {
        case 'fixed':
            return `Avukatlık ücreti maktu ${formatCurrency(fees.amount, curr)} (${fees.vat === '20' ? 'KDV dahil' : 'KDV hariç'}) olarak belirlenmiştir.`;
        case 'hourly':
            return `Avukatlık ücreti saatlik ${formatCurrency(fees.rate, curr)} olarak belirlenmiştir. Tahmini çalışma süresi ${fees.hours} saattir.`;
        case 'success':
            return `Başarı primi oranı %${fees.rate} olarak belirlenmiştir. Başarı kriteri: ${fees.criteria}`;
        case 'mixed':
            return `Sabit ücret ${formatCurrency(fees.fixed, curr)}, ek olarak saatlik ${formatCurrency(fees.hourly, curr)} ücret uygulanacaktır.`;
        case 'monthly':
            return `Aylık sabit danışmanlık ücreti ${formatCurrency(fees.monthly, curr)} olarak belirlenmiş olup sözleşme süresi ${fees.duration} aydır.`;
        default:
            return 'Ücret taraflarca ayrıca belirlenecektir.';
    }
}

function showContractEditor(contractId) {
    const c = DB.data.contracts.find(x => x.id === contractId);
    if (!c) return;

    // Create editor modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'contractEditorModal';
    modal.innerHTML = `
    <div class="modal-content" style="max-width:800px;max-height:90vh;">
        <div class="modal-header">
            <h3>Sözleşme Düzenle - ${c.no}</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Özel Notlar / Ek Maddeler</label>
                <textarea id="contractCustomNotes" rows="4" placeholder="Sözleşmeye eklemek istediğiniz özel maddeler...">${c.customNotes || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Sözleşme Metni</label>
                <textarea id="contractContent" rows="25" style="font-family:monospace;font-size:0.85rem;">${c.content}</textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">İptal</button>
            <button class="btn btn-primary" onclick="saveContractEdit('${c.id}')">
                <i class="fas fa-save"></i> Kaydet
            </button>
        </div>
    </div>`;
    document.body.appendChild(modal);
}

window.saveContractEdit = function(id) {
    const c = DB.data.contracts.find(x => x.id === id);
    if (c) {
        c.content = $('#contractContent')?.value || c.content;
        c.customNotes = $('#contractCustomNotes')?.value || '';
        DB.save();
        toast('Sözleşme güncellendi', 'success');
    }
    $('#contractEditorModal')?.remove();
};

window.viewContract = function(id) { showContractEditor(id); };
window.deleteContract = function(id) {
    if (confirm('Bu sözleşme silinsin mi?')) {
        DB.data.contracts = DB.data.contracts.filter(c => c.id !== id);
        DB.save();
        refreshContracts();
        toast('Sözleşme silindi', 'success');
    }
};

// ---- POWER OF ATTORNEY ----
const POA_TEMPLATES = {
    genel: { name: 'Genel Vekaletname', content: generateGeneralPOA },
    dava: { name: 'Dava Vekaletnamesi', content: generateLitigationPOA },
    icra: { name: 'İcra Vekaletnamesi', content: generateEnforcementPOA },
    arabuluculuk: { name: 'Arabuluculuk Vekaletnamesi', content: generateMediationPOA },
    noter: { name: 'Noter İşlemleri Vekaletnamesi', content: generateNotaryPOA },
    sirket: { name: 'Şirket İşleri Vekaletnamesi', content: generateCompanyPOA }
};

window.generatePOA = function(proposalId) {
    const p = DB.data.proposals.find(x => x.id === proposalId);
    if (!p) return;

    // Show POA type selection
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'poaTypeModal';
    modal.innerHTML = `
    <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
            <h3>Vekaletname Türü Seçin</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            ${Object.entries(POA_TEMPLATES).map(([key, val]) => `
                <div style="padding:10px;margin-bottom:8px;border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.2s;"
                     onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'"
                     onclick="createPOA('${proposalId}','${key}')">
                    <strong>${val.name}</strong>
                </div>`).join('')}
            <div style="padding:10px;margin-bottom:8px;border:1px solid var(--border);border-radius:8px;cursor:pointer;"
                 onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'"
                 onclick="createPOA('${proposalId}','custom')">
                <strong>Özel Vekaletname</strong>
                <div style="font-size:0.82rem;color:var(--text-secondary);">Boş şablondan başlayın</div>
            </div>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

window.createPOA = function(proposalId, type) {
    const p = DB.data.proposals.find(x => x.id === proposalId);
    if (!p) return;

    $('#poaTypeModal')?.remove();

    const template = POA_TEMPLATES[type];
    const content = template ? template.content(p) : `VEKALETNAME\n\n[İçeriği düzenleyin]`;

    const poa = {
        id: genId(),
        no: generatePoaNo(),
        proposalId: proposalId,
        title: `${template ? template.name : 'Özel Vekaletname'} - ${p.clientName}`,
        clientName: p.clientName,
        type: template ? template.name : 'Özel',
        date: new Date().toISOString().split('T')[0],
        content: content,
        customNotes: '',
        notarizedFile: null,
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    DB.data.powerOfAttorneys.push(poa);
    DB.save();
    refreshContracts();
    toast('Vekaletname taslağı oluşturuldu', 'success');
    showPOAEditor(poa.id);
};

function generateGeneralPOA(p) {
    const s = DB.data.settings;
    const lawyers = p.lawyers?.filter(l => l.name) || [];
    return `GENEL VEKALETNAME

Vekalet Veren (Müvekkil):
${p.clientName}

Vekil Edilen Avukat(lar):
${lawyers.map(l => `${l.name} - ${s.barAssociation || ''} Barosu, Sicil No: ${l.barNo || '[Sicil No]'}`).join('\n')}

Leh ve aleyhimde açılmış ve açılacak her türlü dava ve takiplerden dolayı T.C. yargı organlarının, meclislerinin, daire ve kurumlarının her kısım ve derecesinde her sıfat, tarik ve surette beni temsile, hak ve menfaatlerimi korumaya, icra takibinde bulunmaya, davalar açmaya, açılan davaları kabul veya redde, her nevi dilekçe ve layihaları kendi imzası ile ilgili kurumlara vermeye, tebliğ ve tebellüğe, tanık göstermeye, karşı taraftan gösterilen tanıklara itiraz etmeye, yemin teklif, kabul ve reddetmeye, bilirkişi, hakem tayin ve azline, her türlü şerh ve ipotek tesisine, fekkine, muvafakat vermeye, mal beyanında bulunmaya, keşif yaptırmaya, keşiflerde hazır bulunmaya, keşiflere itiraz etmeye, yargılamanın yenilenmesi talebinde bulunmaya, hakimleri reddetmeye, başkalarını tevkil, teşrik ve azle, birlikte veya ayrı ayrı ifayı vekalete ve bu vekaletnameden doğan tüm hakları kullanmaya mezun ve yetkili olmak üzere vekaletname tanzim edilmiştir.

Tarih: ${formatDate(new Date().toISOString().split('T')[0])}

Vekalet Veren
${p.clientName}

İmza: _________________
T.C. Kimlik No: _________________`;
}

function generateLitigationPOA(p) {
    const s = DB.data.settings;
    const lawyers = p.lawyers?.filter(l => l.name) || [];
    return `DAVA VEKALETNAMESİ

Vekalet Veren (Müvekkil):
${p.clientName}

Vekil Edilen Avukat(lar):
${lawyers.map(l => `${l.name} - ${s.barAssociation || ''} Barosu, Sicil No: ${l.barNo || '[Sicil No]'}`).join('\n')}

Aşağıda belirtilen konularda, leh ve aleyhimde açılmış ve açılacak dava ve takiplerden dolayı T.C. yargı organlarının her kısım ve derecesinde, beni temsile, dava açmaya, icra takibinde bulunmaya, davayı kabule, davadan vazgeçmeye, her türlü kanun yollarına başvurmaya (istinaf, temyiz, karar düzeltme), ihtiyati tedbir ve ihtiyati haciz kararları almaya, tehiri icra talebinde bulunmaya, tebliğ ve tebellüğe, tanık göstermeye, bilirkişi tayin ve reddine, yemin teklif, kabul ve reddine, sulh ve ibraya, tahkim ve hakem sözleşmesi yapmaya, davayı tamamen veya kısmen ıslah etmeye, müdahale talebinde bulunmaya, başkalarını tevkil, teşrik ve azle yetkili olmak üzere vekaletname düzenlenmiştir.

Konu: ${p.title}

Tarih: ${formatDate(new Date().toISOString().split('T')[0])}

Vekalet Veren
${p.clientName}

İmza: _________________
T.C. Kimlik No: _________________`;
}

function generateEnforcementPOA(p) {
    const s = DB.data.settings;
    const lawyers = p.lawyers?.filter(l => l.name) || [];
    return `İCRA VEKALETNAMESİ

Vekalet Veren: ${p.clientName}
Vekil: ${lawyers.map(l => l.name).join(', ')}

Alacaklarımın tahsili amacıyla her türlü icra takibi başlatmaya, icra dairelerinde beni temsile, haciz, muhafaza, satış ve ihale işlemlerini yürütmeye, sıra cetveline itiraz etmeye, istihkak davası açmaya, ihalenin feshi davası açmaya, mal beyanında bulunmaya, borç ödemeden aciz vesikası almaya, konkordato talebinde bulunmaya ve bu vekaletnameden doğan tüm hakları kullanmaya yetkili olmak üzere vekaletname düzenlenmiştir.

Tarih: ${formatDate(new Date().toISOString().split('T')[0])}

Vekalet Veren: ${p.clientName}
İmza: _________________`;
}

function generateMediationPOA(p) {
    const lawyers = p.lawyers?.filter(l => l.name) || [];
    return `ARABULUCULUK VEKALETNAMESİ

Vekalet Veren: ${p.clientName}
Vekil: ${lawyers.map(l => l.name).join(', ')}

6325 sayılı Hukuk Uyuşmazlıklarında Arabuluculuk Kanunu kapsamında, arabuluculuk görüşmelerine katılmaya, arabuluculuk sürecinde beni temsile, arabuluculuk anlaşma belgesini imzalamaya, dava şartı arabuluculuk başvurusu yapmaya ve süreçle ilgili tüm işlemleri yürütmeye yetkili olmak üzere vekaletname düzenlenmiştir.

Konu: ${p.title}

Tarih: ${formatDate(new Date().toISOString().split('T')[0])}

Vekalet Veren: ${p.clientName}
İmza: _________________`;
}

function generateNotaryPOA(p) {
    const lawyers = p.lawyers?.filter(l => l.name) || [];
    return `NOTER İŞLEMLERİ VEKALETNAMESİ

Vekalet Veren: ${p.clientName}
Vekil: ${lawyers.map(l => l.name).join(', ')}

Noterlik işlemlerinde beni temsile, ihtarname, ihbarname, protesto çekmeye ve cevap vermeye, noter kanalıyla tebligat göndermeye ve almaya, tasdik işlemleri yaptırmaya yetkili olmak üzere vekaletname düzenlenmiştir.

Tarih: ${formatDate(new Date().toISOString().split('T')[0])}

Vekalet Veren: ${p.clientName}
İmza: _________________`;
}

function generateCompanyPOA(p) {
    const lawyers = p.lawyers?.filter(l => l.name) || [];
    return `ŞİRKET İŞLERİ VEKALETNAMESİ

Vekalet Veren: ${p.clientName}
Vekil: ${lawyers.map(l => l.name).join(', ')}

Şirket kuruluş, birleşme, bölünme, tür değiştirme, tasfiye işlemlerinde, Ticaret Sicili Müdürlüğü, Vergi Dairesi, Sosyal Güvenlik Kurumu ve diğer resmi kurum ve kuruluşlar nezdinde beni temsile, genel kurul ve yönetim kurulu toplantılarına katılmaya, şirket ana sözleşmesi değişikliklerini yapmaya, pay devir işlemlerini yürütmeye yetkili olmak üzere vekaletname düzenlenmiştir.

Tarih: ${formatDate(new Date().toISOString().split('T')[0])}

Vekalet Veren: ${p.clientName}
İmza: _________________`;
}

function showPOAEditor(poaId) {
    const v = DB.data.powerOfAttorneys.find(x => x.id === poaId);
    if (!v) return;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'poaEditorModal';
    modal.innerHTML = `
    <div class="modal-content" style="max-width:800px;max-height:90vh;">
        <div class="modal-header">
            <h3>Vekaletname Düzenle - ${v.no}</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Özel Notlar</label>
                <textarea id="poaCustomNotes" rows="3" placeholder="Vekaletname hakkında notlarınız...">${v.customNotes || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Vekaletname Metni</label>
                <textarea id="poaContent" rows="20" style="font-family:monospace;font-size:0.85rem;">${v.content}</textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">İptal</button>
            <button class="btn btn-primary" onclick="savePOAEdit('${v.id}')">
                <i class="fas fa-save"></i> Kaydet
            </button>
        </div>
    </div>`;
    document.body.appendChild(modal);
}

window.savePOAEdit = function(id) {
    const v = DB.data.powerOfAttorneys.find(x => x.id === id);
    if (v) {
        v.content = $('#poaContent')?.value || v.content;
        v.customNotes = $('#poaCustomNotes')?.value || '';
        DB.save();
        toast('Vekaletname güncellendi', 'success');
    }
    $('#poaEditorModal')?.remove();
};

window.viewPOA = function(id) { showPOAEditor(id); };
window.deletePOA = function(id) {
    if (confirm('Bu vekaletname silinsin mi?')) {
        DB.data.powerOfAttorneys = DB.data.powerOfAttorneys.filter(v => v.id !== id);
        DB.save();
        refreshContracts();
        toast('Vekaletname silindi', 'success');
    }
};

// ---- FILE UPLOAD (Signed contracts / Notarized POAs) ----
window.uploadSignedContract = function(id, input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const c = DB.data.contracts.find(x => x.id === id);
        if (c) {
            c.signedFile = { name: file.name, data: e.target.result, uploadedAt: new Date().toISOString() };
            DB.save();
            refreshContracts();
            toast('İmzalı sözleşme yüklendi', 'success');
        }
    };
    reader.readAsDataURL(file);
};

window.uploadNotarizedPOA = function(id, input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const v = DB.data.powerOfAttorneys.find(x => x.id === id);
        if (v) {
            v.notarizedFile = { name: file.name, data: e.target.result, uploadedAt: new Date().toISOString() };
            DB.save();
            refreshContracts();
            toast('Noter tasdikli vekaletname yüklendi', 'success');
        }
    };
    reader.readAsDataURL(file);
};

// ---- HEARINGS & DEADLINE TRACKING ----
const DEFAULT_DEADLINE_TYPES = [
    { id: 'istinaf', name: 'İstinaf Başvurusu', days: 14, description: 'Tebliğ tarihinden itibaren 2 hafta' },
    { id: 'temyiz', name: 'Temyiz Başvurusu', days: 30, description: 'Tebliğ tarihinden itibaren 1 ay' },
    { id: 'itiraz', name: 'İcra İtirazı', days: 7, description: 'Tebliğ tarihinden itibaren 7 gün' },
    { id: 'cevap', name: 'Cevap Dilekçesi', days: 14, description: 'Tebliğ tarihinden itibaren 2 hafta' },
    { id: 'cevap-cevap', name: 'Cevaba Cevap Dilekçesi', days: 14, description: 'Tebliğ tarihinden itibaren 2 hafta' },
    { id: 'islah', name: 'Islah', days: 0, description: 'Tahkikat sona erinceye kadar' },
    { id: 'arabuluculuk', name: 'Dava Şartı Arabuluculuk', days: 21, description: 'Başvurudan itibaren 3 hafta (uzatılabilir)' },
    { id: 'bilirkisi-itiraz', name: 'Bilirkişi Raporuna İtiraz', days: 14, description: 'Tebliğ tarihinden itibaren 2 hafta' },
    { id: 'karar-duzeltme', name: 'Karar Düzeltme', days: 15, description: 'Tebliğ tarihinden itibaren 15 gün' }
];

function refreshHearings() {
    const hearingsList = $('#hearingsList');
    const deadlinesList = $('#deadlinesList');

    if (hearingsList) {
        if (DB.data.hearings.length === 0) {
            hearingsList.innerHTML = '<p class="empty-state">Henüz duruşma kaydı yok.</p>';
        } else {
            hearingsList.innerHTML = DB.data.hearings
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(h => {
                    const isPast = new Date(h.date) < new Date();
                    const isToday = new Date(h.date).toDateString() === new Date().toDateString();
                    const daysUntil = Math.ceil((new Date(h.date) - new Date()) / (1000 * 60 * 60 * 24));

                    return `
                    <div class="contract-item" style="border-left:4px solid ${isToday ? 'var(--accent)' : isPast ? 'var(--text-secondary)' : daysUntil <= 7 ? 'var(--accent3)' : 'var(--accent2)'};">
                        <div>
                            <strong>${h.caseTitle}</strong>
                            <div style="font-size:0.82rem;color:var(--text-secondary);">
                                ${h.court} | Dosya No: ${h.caseNo} | ${formatDate(h.date)} ${h.time || ''}
                            </div>
                            ${h.judge ? `<div style="font-size:0.82rem;">Hakim: ${h.judge}</div>` : ''}
                            ${h.opponent ? `<div style="font-size:0.82rem;">Karşı Taraf: ${h.opponent}</div>` : ''}
                            ${h.notes ? `<div style="font-size:0.82rem;margin-top:4px;">${h.notes}</div>` : ''}
                            ${h.result ? `<div style="font-size:0.82rem;color:var(--primary);margin-top:4px;">Sonuç: ${h.result}</div>` : ''}
                            <div style="font-size:0.78rem;margin-top:4px;color:${isToday ? 'var(--accent)' : daysUntil <= 7 && !isPast ? 'var(--accent3)' : 'var(--text-secondary)'};">
                                ${isToday ? 'BUGÜN!' : isPast ? 'Geçmiş' : `${daysUntil} gün kaldı`}
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;">
                            ${!h.result ? `<button class="btn btn-sm btn-outline" onclick="recordCaseResult('${h.id}')" title="Sonuç Kaydet"><i class="fas fa-flag-checkered"></i></button>` : ''}
                            <button class="btn btn-sm btn-outline" onclick="editHearing('${h.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-ghost" onclick="deleteHearing('${h.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
                }).join('');
        }
    }

    if (deadlinesList) {
        if (DB.data.deadlines.length === 0) {
            deadlinesList.innerHTML = '<p class="empty-state">Henüz süre kaydı yok.</p>';
        } else {
            deadlinesList.innerHTML = DB.data.deadlines
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map(d => {
                    const isPast = new Date(d.dueDate) < new Date();
                    const daysUntil = Math.ceil((new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysUntil <= 3 && !isPast;

                    return `
                    <div class="contract-item" style="border-left:4px solid ${isPast ? (d.completed ? 'var(--accent2)' : 'var(--accent)') : isUrgent ? 'var(--accent)' : 'var(--accent3)'};">
                        <div>
                            <strong>${d.completed ? '<s>' : ''}${d.title}${d.completed ? '</s>' : ''}</strong>
                            <div style="font-size:0.82rem;color:var(--text-secondary);">
                                ${d.caseTitle || ''} | Son Gün: ${formatDate(d.dueDate)}
                            </div>
                            ${d.notificationDate ? `<div style="font-size:0.78rem;">Tebliğ: ${formatDate(d.notificationDate)}</div>` : ''}
                            <div style="font-size:0.78rem;color:${isPast && !d.completed ? 'var(--accent)' : isUrgent ? 'var(--accent)' : 'var(--text-secondary)'};">
                                ${d.completed ? 'Tamamlandı' : isPast ? 'SÜRESİ GEÇTİ!' : `${daysUntil} gün kaldı`}
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;align-items:center;">
                            ${!d.completed ? `<button class="btn btn-sm btn-success" onclick="completeDeadline('${d.id}')"><i class="fas fa-check"></i></button>` : ''}
                            <button class="btn btn-sm btn-ghost" onclick="deleteDeadline('${d.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
                }).join('');
        }
    }
}

function checkUpcomingHearings() {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const upcoming = DB.data.hearings.filter(h => {
        const d = new Date(h.date);
        return d >= now && d <= threeDays;
    });

    const urgentDeadlines = DB.data.deadlines.filter(d => {
        const due = new Date(d.dueDate);
        return !d.completed && due >= now && due <= threeDays;
    });

    // Show notification banner on dashboard
    const banner = document.getElementById('notificationBanner');
    if (banner) {
        if (upcoming.length > 0 || urgentDeadlines.length > 0) {
            let msgs = [];
            if (upcoming.length > 0) msgs.push(`${upcoming.length} duruşma yaklaşıyor!`);
            if (urgentDeadlines.length > 0) msgs.push(`${urgentDeadlines.length} süre dolmak üzere!`);
            banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${msgs.join(' | ')}`;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    }

    // Browser push notification
    if ((upcoming.length > 0 || urgentDeadlines.length > 0) && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            upcoming.forEach(h => {
                new Notification('Duruşma Hatırlatması', {
                    body: `${h.caseTitle} - ${h.court} - ${formatDate(h.date)} ${h.time || ''}`,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚖️</text></svg>'
                });
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
}

window.addHearing = function() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'hearingModal';
    modal.innerHTML = `
    <div class="modal-content" style="max-width:600px;">
        <div class="modal-header">
            <h3>Yeni Duruşma</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Dava Başlığı</label>
                <input type="text" id="hearingCaseTitle" placeholder="Örn: ABC A.Ş. vs XYZ Ltd.">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Mahkeme</label>
                    <input type="text" id="hearingCourt" placeholder="Örn: İstanbul 3. Asliye Ticaret Mahkemesi">
                </div>
                <div class="form-group">
                    <label>Dosya/Esas No</label>
                    <input type="text" id="hearingCaseNo" placeholder="Örn: 2024/1234 E.">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Duruşma Tarihi</label>
                    <input type="date" id="hearingDate">
                </div>
                <div class="form-group">
                    <label>Saat</label>
                    <input type="time" id="hearingTime">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Hakim</label>
                    <input type="text" id="hearingJudge" placeholder="Hakim adı">
                </div>
                <div class="form-group">
                    <label>Karşı Taraf</label>
                    <input type="text" id="hearingOpponent" placeholder="Karşı taraf">
                </div>
            </div>
            <div class="form-group">
                <label>İlişkili Teklif/Sözleşme</label>
                <select id="hearingRelated">
                    <option value="">Seçiniz...</option>
                    ${DB.data.proposals.map(p => `<option value="${p.id}">${p.no} - ${p.title}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Notlar</label>
                <textarea id="hearingNotes" rows="3" placeholder="Duruşma notları..."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">İptal</button>
            <button class="btn btn-primary" onclick="saveHearing()">
                <i class="fas fa-save"></i> Kaydet
            </button>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

window.saveHearing = function(editId) {
    const hearing = {
        id: editId || genId(),
        caseTitle: $('#hearingCaseTitle')?.value || '',
        court: $('#hearingCourt')?.value || '',
        caseNo: $('#hearingCaseNo')?.value || '',
        date: $('#hearingDate')?.value || '',
        time: $('#hearingTime')?.value || '',
        judge: $('#hearingJudge')?.value || '',
        opponent: $('#hearingOpponent')?.value || '',
        relatedProposalId: $('#hearingRelated')?.value || '',
        notes: $('#hearingNotes')?.value || '',
        result: '',
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    if (editId) {
        const idx = DB.data.hearings.findIndex(h => h.id === editId);
        if (idx >= 0) DB.data.hearings[idx] = { ...DB.data.hearings[idx], ...hearing };
    } else {
        DB.data.hearings.push(hearing);
    }

    DB.save();
    $('#hearingModal')?.remove();
    refreshHearings();
    toast('Duruşma kaydedildi', 'success');
};

window.editHearing = function(id) {
    const h = DB.data.hearings.find(x => x.id === id);
    if (!h) return;
    window.addHearing();
    setTimeout(() => {
        $('#hearingCaseTitle').value = h.caseTitle || '';
        $('#hearingCourt').value = h.court || '';
        $('#hearingCaseNo').value = h.caseNo || '';
        $('#hearingDate').value = h.date || '';
        $('#hearingTime').value = h.time || '';
        $('#hearingJudge').value = h.judge || '';
        $('#hearingOpponent').value = h.opponent || '';
        $('#hearingRelated').value = h.relatedProposalId || '';
        $('#hearingNotes').value = h.notes || '';

        const saveBtn = modal.querySelector('.btn-primary');
        if (saveBtn) saveBtn.setAttribute('onclick', `saveHearing('${id}')`);
    }, 100);
};

window.deleteHearing = function(id) {
    if (confirm('Bu duruşma silinsin mi?')) {
        DB.data.hearings = DB.data.hearings.filter(h => h.id !== id);
        DB.save();
        refreshHearings();
        toast('Duruşma silindi', 'success');
    }
};

// ---- DEADLINE MANAGEMENT ----
window.addDeadline = function() {
    const allTypes = [...DEFAULT_DEADLINE_TYPES, ...(DB.data.customDeadlineTypes || [])];

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'deadlineModal';
    modal.innerHTML = `
    <div class="modal-content" style="max-width:560px;">
        <div class="modal-header">
            <h3>Yeni Yasal Süre</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Süre Türü</label>
                <select id="deadlineType" onchange="onDeadlineTypeChange()">
                    <option value="">Özel süre girin...</option>
                    ${allTypes.map(t => `<option value="${t.id}" data-days="${t.days}">${t.name} (${t.days} gün)</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Başlık</label>
                <input type="text" id="deadlineTitle" placeholder="Süre açıklaması">
            </div>
            <div class="form-group">
                <label>İlişkili Dava</label>
                <input type="text" id="deadlineCaseTitle" placeholder="Dava başlığı">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tebliğ Tarihi</label>
                    <input type="date" id="deadlineNotifDate" onchange="calculateDueDate()">
                </div>
                <div class="form-group">
                    <label>Son Gün</label>
                    <input type="date" id="deadlineDueDate">
                </div>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="deadlineExcludeWeekends" onchange="calculateDueDate()">
                    <span class="checkbox-custom"></span>
                    Hafta sonları ve resmi tatilleri hariç tut
                </label>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">İptal</button>
            <button class="btn btn-primary" onclick="saveDeadline()">
                <i class="fas fa-save"></i> Kaydet
            </button>
        </div>
    </div>`;
    document.body.appendChild(modal);
};

window.onDeadlineTypeChange = function() {
    const sel = $('#deadlineType');
    const opt = sel.options[sel.selectedIndex];
    const days = parseInt(opt?.dataset?.days);

    if (opt.value && days > 0) {
        $('#deadlineTitle').value = opt.textContent.split('(')[0].trim();
        calculateDueDate();
    }
};

// Türkiye Resmi Tatil Günleri
function isOfficialHoliday(date) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    const year = date.getFullYear();

    // Sabit tatiller
    const fixedHolidays = [
        [1, 1],   // Yılbaşı
        [4, 23],  // Ulusal Egemenlik ve Çocuk Bayramı
        [5, 1],   // Emek ve Dayanışma Günü
        [5, 19],  // Atatürk'ü Anma, Gençlik ve Spor Bayramı
        [7, 15],  // Demokrasi ve Milli Birlik Günü
        [8, 30],  // Zafer Bayramı
        [10, 29], // Cumhuriyet Bayramı
    ];

    for (const [m, d] of fixedHolidays) {
        if (month === m && day === d) return true;
    }

    // Dini bayramlar (yaklaşık tarihler - her yıl ~11 gün geri kayar)
    // 2025-2027 arası Ramazan ve Kurban Bayramı tarihleri
    const religiousHolidays = {
        2025: [[3,30],[3,31],[4,1], [6,6],[6,7],[6,8],[6,9]],
        2026: [[3,20],[3,21],[3,22], [5,27],[5,28],[5,29],[5,30]],
        2027: [[3,9],[3,10],[3,11], [5,16],[5,17],[5,18],[5,19]]
    };

    const yearHolidays = religiousHolidays[year];
    if (yearHolidays) {
        for (const [m, d] of yearHolidays) {
            if (month === m && day === d) return true;
        }
    }

    return false;
}

window.calculateDueDate = function() {
    const notifDate = $('#deadlineNotifDate')?.value;
    const sel = $('#deadlineType');
    const opt = sel?.options[sel.selectedIndex];
    const days = parseInt(opt?.dataset?.days);
    const excludeWeekends = $('#deadlineExcludeWeekends')?.checked;

    if (notifDate && days > 0) {
        let date = new Date(notifDate);
        let addedDays = 0;

        while (addedDays < days) {
            date.setDate(date.getDate() + 1);
            if (excludeWeekends) {
                const dow = date.getDay();
                if (dow === 0 || dow === 6) continue;
                // Resmi tatilleri atla
                if (isOfficialHoliday(date)) continue;
            }
            addedDays++;
        }

        $('#deadlineDueDate').value = date.toISOString().split('T')[0];
    }
};

window.saveDeadline = function() {
    const deadline = {
        id: genId(),
        type: $('#deadlineType')?.value || 'custom',
        title: $('#deadlineTitle')?.value || '',
        caseTitle: $('#deadlineCaseTitle')?.value || '',
        notificationDate: $('#deadlineNotifDate')?.value || '',
        dueDate: $('#deadlineDueDate')?.value || '',
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: DB.data.currentUser?.name || ''
    };

    DB.data.deadlines.push(deadline);
    DB.save();
    $('#deadlineModal')?.remove();
    refreshHearings();
    toast('Yasal süre kaydedildi', 'success');
};

window.completeDeadline = function(id) {
    const d = DB.data.deadlines.find(x => x.id === id);
    if (d) {
        d.completed = true;
        DB.save();
        refreshHearings();
        toast('Süre tamamlandı olarak işaretlendi', 'success');
    }
};

window.deleteDeadline = function(id) {
    if (confirm('Bu süre kaydı silinsin mi?')) {
        DB.data.deadlines = DB.data.deadlines.filter(d => d.id !== id);
        DB.save();
        refreshHearings();
    }
};

// ---- EXPORT: PDF ----
function exportPDF() {
    collectCurrentStepData();
    renderPreview();

    const element = $('#previewContainer');
    if (!element) return;

    const opt = {
        margin: [15, 15, 15, 15],
        filename: `${currentProposal?.no || 'teklif'}_${currentProposal?.clientName || ''}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    toast('PDF oluşturuluyor...', 'info');
    html2pdf().set(opt).from(element).save().then(() => {
        toast('PDF indirildi', 'success');
    });
}

// ---- EXPORT: WORD ----
function exportWord() {
    collectCurrentStepData();
    const p = currentProposal;
    if (!p) return;

    toast('Word belgesi oluşturuluyor...', 'info');

    const s = DB.data.settings;
    const labels = getLabels(p.language || 'tr');

    try {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = docx;

        const children = [];

        // Header
        children.push(new Paragraph({
            children: [new TextRun({ text: s.firmName || 'Hukuk Bürosu', bold: true, size: 32, color: '4a6cf7' })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 }
        }));

        if (s.firmAddress || s.firmPhone || s.firmEmail) {
            children.push(new Paragraph({
                children: [new TextRun({ text: [s.firmAddress, s.firmPhone, s.firmEmail, s.firmWebsite].filter(Boolean).join(' | '), size: 18, color: '636e72' })],
                spacing: { after: 200 }
            }));
        }

        // Teklif bilgileri
        children.push(new Paragraph({
            children: [new TextRun({ text: `${labels.proposalNo}: ${p.no} | ${labels.date}: ${formatDate(p.date)} | ${labels.validity}: ${p.validityDays} ${labels.days}`, size: 20 })],
            spacing: { after: 100 }
        }));

        children.push(new Paragraph({
            children: [new TextRun({ text: `${labels.client}: ${p.clientName} | ${labels.contact}: ${p.contactPerson}`, size: 20 })],
            spacing: { after: 200 }
        }));

        // Title
        children.push(new Paragraph({
            children: [new TextRun({ text: p.title, bold: true, size: 30 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        }));

        // Anlayışımız
        if (p.understanding) {
            children.push(new Paragraph({ text: labels.understanding, heading: HeadingLevel.HEADING_1, spacing: { after: 100 } }));
            p.understanding.split('\n').forEach(line => {
                children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })], spacing: { after: 80 } }));
            });
        }

        // İş Adımları
        if (p.workSteps?.length > 0) {
            children.push(new Paragraph({ text: labels.workSteps, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
            p.workSteps.forEach((step, i) => {
                if (step.title) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `${i + 1}. ${step.title}`, bold: true, size: 22 })],
                        spacing: { after: 40 }
                    }));
                    if (step.description) {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: step.description, size: 21 })],
                            spacing: { after: 100 }
                        }));
                    }
                }
            });
        }

        // Ücretlendirme
        children.push(new Paragraph({ text: labels.fees, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
        const feeText = renderContractFeeText(p);
        children.push(new Paragraph({ children: [new TextRun({ text: feeText, size: 22 })], spacing: { after: 100 } }));

        if (p.paymentTerms) {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${labels.paymentTerms}: `, bold: true, size: 22 }), new TextRun({ text: p.paymentTerms, size: 22 })],
                spacing: { after: 80 }
            }));
        }

        // Ekip
        if (p.lawyers?.length > 0) {
            children.push(new Paragraph({ text: labels.team, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
            p.lawyers.forEach(l => {
                if (l.name) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: l.name, bold: true, size: 24 })],
                        spacing: { after: 40 }
                    }));
                    if (l.title) children.push(new Paragraph({ children: [new TextRun({ text: `${labels.lawyerTitle}: ${l.title}`, size: 21 })], spacing: { after: 20 } }));
                    if (l.expertise) children.push(new Paragraph({ children: [new TextRun({ text: `${labels.expertise}: ${l.expertise}`, size: 21 })], spacing: { after: 20 } }));
                    if (l.bio) children.push(new Paragraph({ children: [new TextRun({ text: l.bio, size: 21 })], spacing: { after: 100 } }));
                }
            });
        }

        // Credentials
        if (p.credentials?.length > 0) {
            children.push(new Paragraph({ text: labels.credentials, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
            p.credentials.forEach(c => {
                const displayClient = c.confidential ? labels.confidentialClient : c.client;
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: c.title, bold: true, size: 22 }),
                        new TextRun({ text: ` | ${displayClient} | ${c.year}`, size: 20, color: '636e72' })
                    ],
                    spacing: { after: 40 }
                }));
                children.push(new Paragraph({ children: [new TextRun({ text: c.description, size: 21 })], spacing: { after: 100 } }));
            });
        }

        // İmza
        children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 400 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: labels.regards + ',', size: 22 })], spacing: { after: 200 } }));
        p.lawyers?.filter(l => l.name).forEach(l => {
            children.push(new Paragraph({
                children: [new TextRun({ text: l.name, bold: true, size: 22 })],
                spacing: { after: 20 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: l.title || '', size: 20, color: '636e72' })],
                spacing: { after: 100 }
            }));
        });

        const doc = new Document({
            sections: [{ children }]
        });

        Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${p.no}_${p.clientName || 'teklif'}.docx`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Word belgesi indirildi', 'success');
        });
    } catch (err) {
        console.error('Word export error:', err);
        toast('Word oluşturulurken hata: ' + err.message, 'error');
    }
}

// ---- WORD EXPORT FOR CONTRACTS ----
window.exportContractWord = function(id) {
    const c = DB.data.contracts.find(x => x.id === id);
    if (!c) return;

    try {
        const { Document, Packer, Paragraph, TextRun } = docx;
        const children = c.content.split('\n').map(line =>
            new Paragraph({
                children: [new TextRun({
                    text: line,
                    bold: line === line.toUpperCase() && line.length > 5,
                    size: line.startsWith('MADDE') || line === line.toUpperCase() ? 24 : 22
                })],
                spacing: { after: line === '' ? 100 : 40 }
            })
        );

        const doc = new Document({ sections: [{ children }] });
        Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${c.no}_sozlesme.docx`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Sözleşme Word belgesi indirildi', 'success');
        });
    } catch (err) {
        toast('Hata: ' + err.message, 'error');
    }
};

window.exportPOAWord = function(id) {
    const v = DB.data.powerOfAttorneys.find(x => x.id === id);
    if (!v) return;

    try {
        const { Document, Packer, Paragraph, TextRun } = docx;
        const children = v.content.split('\n').map(line =>
            new Paragraph({
                children: [new TextRun({
                    text: line,
                    bold: line === line.toUpperCase() && line.length > 5,
                    size: 22
                })],
                spacing: { after: line === '' ? 100 : 40 }
            })
        );

        const doc = new Document({ sections: [{ children }] });
        Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${v.no}_vekaletname.docx`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Vekaletname Word belgesi indirildi', 'success');
        });
    } catch (err) {
        toast('Hata: ' + err.message, 'error');
    }
};

// ---- TEMPLATES ----
const BUILT_IN_TEMPLATES = {
    ma: {
        type: 'specific', legalArea: 'birlesme',
        understanding: 'Müvekkilimiz, hedef şirketin devralınması/birleşme işlemi kapsamında hukuki danışmanlık ve due diligence hizmeti talep etmektedir.\n\nBu kapsamda, hedef şirketin hukuki durumunun kapsamlı bir şekilde incelenmesi, işlem yapısının belirlenmesi, ilgili sözleşmelerin hazırlanması ve gerekli resmi başvuruların yapılması planlanmaktadır.',
        workSteps: [
            { title: 'Ön İnceleme ve İşlem Yapısı', description: 'İşlemin genel yapısının belirlenmesi, tarafların ihtiyaçlarının analizi' },
            { title: 'Hukuki Due Diligence', description: 'Hedef şirketin şirketler hukuku, iş hukuku, sözleşmeler, fikri mülkiyet, dava ve uyuşmazlık, gayrimenkul ve regülasyon açısından kapsamlı incelenmesi' },
            { title: 'Due Diligence Raporu', description: 'Tespit edilen risklerin ve önerilerin detaylı raporlanması' },
            { title: 'İşlem Sözleşmeleri', description: 'Hisse devir sözleşmesi, ortaklık sözleşmesi, rekabet yasağı ve diğer yan sözleşmelerin hazırlanması' },
            { title: 'Rekabet Kurulu Başvurusu', description: 'Gerekli hallerde Rekabet Kurulu\'na bildirim/izin başvurusu' },
            { title: 'Kapanış İşlemleri', description: 'Kapanış belgelerinin hazırlanması, ticaret sicili tescil işlemleri' }
        ],
        feeModel: 'mixed'
    },
    litigation: {
        type: 'specific', legalArea: 'dava',
        understanding: 'Müvekkilimiz, aşağıda detayları belirtilen uyuşmazlık kapsamında hukuki temsil ve dava takibi hizmeti talep etmektedir.\n\nDavayı kazanma olasılığını artırmak amacıyla kapsamlı bir hukuki strateji geliştireceğiz.',
        workSteps: [
            { title: 'Dosya İnceleme ve Strateji', description: 'Mevcut belgelerin ve delillerin incelenmesi, hukuki stratejinin belirlenmesi' },
            { title: 'Dava Dilekçesi Hazırlama', description: 'Dava/cevap dilekçesinin hazırlanması ve mahkemeye sunulması' },
            { title: 'Delil Toplama', description: 'Tanık ifadeleri, bilirkişi raporları ve diğer delillerin toplanması' },
            { title: 'Duruşma Takibi', description: 'Tüm duruşmalara katılım ve müvekkil temsili' },
            { title: 'Kanun Yolları', description: 'Gerekli hallerde istinaf/temyiz başvurularının yapılması' }
        ],
        feeModel: 'fixed'
    },
    compliance: {
        type: 'specific', legalArea: 'uyum',
        understanding: 'Müvekkilimiz, mevzuat uyum süreçlerinin oluşturulması/güncellenmesi konusunda hukuki danışmanlık talep etmektedir.\n\nBu kapsamda mevcut durumun analizi, risk değerlendirmesi ve uyum programının tasarlanması planlanmaktadır.',
        workSteps: [
            { title: 'Mevcut Durum Analizi', description: 'Şirketin mevcut uyum yapısının ve süreçlerinin incelenmesi' },
            { title: 'Boşluk Analizi (Gap Analysis)', description: 'Mevzuat gereklilikleri ile mevcut durum arasındaki farkların tespiti' },
            { title: 'Uyum Programı Tasarımı', description: 'Politika ve prosedürlerin hazırlanması' },
            { title: 'Eğitim', description: 'Çalışanlara yönelik uyum eğitimlerinin verilmesi' },
            { title: 'İzleme ve Raporlama', description: 'Periyodik uyum izleme ve raporlama mekanizmasının kurulması' }
        ],
        feeModel: 'fixed'
    },
    general: {
        type: 'general', legalArea: 'genel',
        understanding: 'Müvekkilimiz, günlük ticari faaliyetlerinde karşılaşılan hukuki konularda sürekli danışmanlık hizmeti talep etmektedir.\n\nAylık sabit ücret karşılığında geniş kapsamlı bir hukuki destek sunulacaktır.',
        workSteps: [
            { title: 'Sözleşme İnceleme', description: 'Ticari sözleşmelerin incelenmesi, düzenlenmesi ve müzakere desteği' },
            { title: 'Hukuki Görüş', description: 'Günlük operasyonlarda karşılaşılan hukuki sorulara yazılı/sözlü görüş verilmesi' },
            { title: 'Mevzuat Takibi', description: 'İlgili mevzuat değişikliklerinin takibi ve bilgilendirme' },
            { title: 'Toplantı Katılımı', description: 'Aylık düzenli toplantılar ve gerektiğinde acil danışmanlık' }
        ],
        feeModel: 'monthly'
    },
    labor: {
        type: 'specific', legalArea: 'is',
        understanding: 'Müvekkilimiz, iş hukuku kapsamında hukuki danışmanlık/temsil hizmeti talep etmektedir.',
        workSteps: [
            { title: 'İş Sözleşmesi İnceleme', description: 'Mevcut iş sözleşmelerinin incelenmesi ve güncellenmesi' },
            { title: 'İşe İade / Tazminat Değerlendirmesi', description: 'Hukuki risklerin ve olası sonuçların analizi' },
            { title: 'Arabuluculuk Süreci', description: 'Zorunlu arabuluculuk görüşmelerine katılım' },
            { title: 'Dava Takibi', description: 'Gerekli hallerde iş mahkemesinde dava takibi' }
        ],
        feeModel: 'fixed'
    },
    contract: {
        type: 'specific', legalArea: 'sozlesme',
        understanding: 'Müvekkilimiz, belirtilen sözleşmelerin hazırlanması/incelenmesi konusunda hukuki danışmanlık talep etmektedir.',
        workSteps: [
            { title: 'İhtiyaç Analizi', description: 'Tarafların ihtiyaç ve beklentilerinin belirlenmesi' },
            { title: 'Sözleşme Taslağı', description: 'Sözleşme taslağının hazırlanması' },
            { title: 'Müzakere Desteği', description: 'Karşı tarafla müzakere sürecinde danışmanlık' },
            { title: 'Nihai Sözleşme', description: 'Nihai sözleşmenin tamamlanması ve imza sürecinin koordinasyonu' }
        ],
        feeModel: 'fixed'
    }
};

function applyTemplate(templateKey) {
    const t = BUILT_IN_TEMPLATES[templateKey];
    if (!t) return;

    // Navigate to new proposal and apply
    navigateTo('new-proposal');
    initWizard();

    setTimeout(() => {
        // Set type
        const typeRadio = $(`input[name="proposalType"][value="${t.type}"]`);
        if (typeRadio) { typeRadio.checked = true; updateProposalTypeUI(); }

        if (t.legalArea) $('#legalArea').value = t.legalArea;

        // Understanding
        if (t.understanding) $('#understandingText').value = t.understanding;

        // Work steps
        if (t.workSteps) {
            const container = $('#workStepsList');
            container.innerHTML = '';
            t.workSteps.forEach(s => addWorkStep(s.title, s.description));
        }

        // Fee model
        if (t.feeModel) {
            $('#feeModel').value = t.feeModel;
            updateFeeModelUI();
        }

        currentProposal.type = t.type;
        currentProposal.legalArea = t.legalArea;
        currentProposal.understanding = t.understanding;
        currentProposal.workSteps = t.workSteps;
        currentProposal.feeModel = t.feeModel;

        toast('Şablon uygulandı. Bilgileri düzenleyebilirsiniz.', 'success');
    }, 200);
}

function saveAsTemplate() {
    collectCurrentStepData();
    const name = prompt('Şablon adı:');
    if (!name) return;

    const template = {
        id: genId(),
        name: name,
        data: JSON.parse(JSON.stringify(currentProposal)),
        createdAt: new Date().toISOString()
    };

    DB.data.templates.push(template);
    DB.save();
    toast('Şablon kaydedildi', 'success');
}

function refreshCustomTemplates() {
    const container = $('#customTemplatesList');
    if (!container) return;

    if (DB.data.templates.length === 0) {
        container.innerHTML = '<p class="empty-state">Henüz özel şablon yok.</p>';
        return;
    }

    container.innerHTML = DB.data.templates.map(t => `
    <div class="template-card">
        <div class="template-icon"><i class="fas fa-file-alt"></i></div>
        <h4>${t.name}</h4>
        <p>${formatDate(t.createdAt)}</p>
        <div style="display:flex;gap:8px;justify-content:center;">
            <button class="btn btn-sm btn-outline" onclick="applyCustomTemplate('${t.id}')">Kullan</button>
            <button class="btn btn-sm btn-ghost" onclick="deleteTemplate('${t.id}')" style="color:var(--accent);"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

window.applyCustomTemplate = function(id) {
    const t = DB.data.templates.find(x => x.id === id);
    if (!t) return;

    navigateTo('new-proposal');
    initWizard();
    currentProposal = { ...t.data, id: genId(), no: generateProposalNo(), status: 'draft', createdAt: new Date().toISOString() };

    // Fill forms
    setTimeout(() => {
        $('#proposalTitle').value = currentProposal.title || '';
        $('#clientName').value = '';
        $('#contactPerson').value = '';
        $('#understandingText').value = currentProposal.understanding || '';

        const typeRadio = $(`input[name="proposalType"][value="${currentProposal.type}"]`);
        if (typeRadio) { typeRadio.checked = true; updateProposalTypeUI(); }

        if (currentProposal.legalArea) $('#legalArea').value = currentProposal.legalArea;

        // Work steps
        const container = $('#workStepsList');
        if (container && currentProposal.workSteps) {
            container.innerHTML = '';
            currentProposal.workSteps.forEach(s => addWorkStep(s.title, s.description));
        }

        toast('Şablon uygulandı', 'success');
    }, 200);
};

window.deleteTemplate = function(id) {
    if (confirm('Bu şablon silinsin mi?')) {
        DB.data.templates = DB.data.templates.filter(t => t.id !== id);
        DB.save();
        refreshCustomTemplates();
        toast('Şablon silindi', 'success');
    }
};

// ---- AI SUGGESTION (Placeholder) ----
function generateSampleUnderstanding() {
    const area = $('#legalArea')?.value || '';
    const client = $('#clientName')?.value || '[Müvekkil]';

    const samples = {
        sirketler: `${client}, şirket yapılanması ve kurumsal yönetim konularında hukuki danışmanlık hizmeti talep etmektedir.\n\nAnlayışımıza göre, müvekkilimiz mevcut şirket yapısının gözden geçirilmesi ve gerekli düzenlemelerin yapılmasını istemektedir.`,
        birlesme: `${client}, planlanan birleşme/devralma işlemi kapsamında kapsamlı hukuki danışmanlık hizmeti talep etmektedir.\n\nBu süreçte hedef şirketin hukuki due diligence incelemesi, işlem sözleşmelerinin hazırlanması ve resmi başvuruların yönetilmesi gerekmektedir.`,
        dava: `${client}, mevcut uyuşmazlık kapsamında hukuki temsil ve dava takibi hizmeti talep etmektedir.\n\nMüvekkilimizin haklarını en etkin şekilde korumak amacıyla kapsamlı bir dava stratejisi geliştirmeyi hedefliyoruz.`,
        kvkk: `${client}, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında uyum süreçlerinin oluşturulması/güncellenmesi konusunda danışmanlık talep etmektedir.\n\nMevcut veri işleme süreçlerinin analizi, VERBİS kaydı ve gerekli politikaların hazırlanması planlanmaktadır.`
    };

    const text = samples[area] || `${client}, belirtilen konuda hukuki danışmanlık hizmeti talep etmektedir.\n\nMüvekkilimizin ihtiyaçları doğrultusunda kapsamlı ve etkin bir hukuki hizmet sunmayı hedefliyoruz.`;

    $('#understandingText').value = text;
    toast('Örnek metin oluşturuldu', 'success');
}

// ---- SETTINGS ----
function loadSettings() {
    const s = DB.data.settings;
    $('#firmName').value = s.firmName || '';
    $('#barAssociation').value = s.barAssociation || '';
    $('#firmAddress').value = s.firmAddress || '';
    $('#firmPhone').value = s.firmPhone || '';
    $('#firmEmail').value = s.firmEmail || '';
    $('#firmWebsite').value = s.firmWebsite || '';
    $('#firmLogo').value = s.firmLogo || '';
}

function saveSettings() {
    DB.data.settings = {
        firmName: $('#firmName')?.value || '',
        barAssociation: $('#barAssociation')?.value || '',
        firmAddress: $('#firmAddress')?.value || '',
        firmPhone: $('#firmPhone')?.value || '',
        firmEmail: $('#firmEmail')?.value || '',
        firmWebsite: $('#firmWebsite')?.value || '',
        firmLogo: $('#firmLogo')?.value || ''
    };
    DB.save();
    toast('Ayarlar kaydedildi', 'success');
}

// ---- INITIALIZATION ----
document.addEventListener('DOMContentLoaded', () => {
    DB.load();

    // Check if logged in
    if (!DB.data.currentUser) {
        showLogin();
        return;
    }

    initTheme();

    // Navigation
    document.addEventListener('click', (e) => {
        const navTarget = e.target.closest('[data-page]');
        if (navTarget) {
            e.preventDefault();
            const page = navTarget.dataset.page;
            navigateTo(page);
            if (page === 'new-proposal' && !editingProposalId) {
                initWizard();
            }
        }

        const templateBtn = e.target.closest('.use-template-btn');
        if (templateBtn) {
            applyTemplate(templateBtn.dataset.template);
        }
    });

    // Sidebar toggle
    $('#sidebarToggle')?.addEventListener('click', () => {
        $('#sidebar').classList.toggle('open');
    });

    // Theme toggle
    $('#themeToggle')?.addEventListener('click', toggleTheme);

    // Wizard nav
    $('#nextStepBtn')?.addEventListener('click', nextStep);
    $('#prevStepBtn')?.addEventListener('click', prevStep);

    // Wizard step click
    $$('.wizard-step').forEach(s => {
        s.addEventListener('click', () => {
            collectCurrentStepData();
            wizardStep = parseInt(s.dataset.step);
            updateWizardUI();
        });
    });

    // Proposal type radio
    $$('input[name="proposalType"]').forEach(r => {
        r.addEventListener('change', updateProposalTypeUI);
    });

    // Fee model change
    $('#feeModel')?.addEventListener('change', updateFeeModelUI);

    // Add topic
    $('#addTopicBtn')?.addEventListener('click', addTopic);

    // Add work step
    $('#addWorkStepBtn')?.addEventListener('click', () => addWorkStep());

    // Add lawyer
    $('#addLawyerBtn')?.addEventListener('click', () => addLawyerCard());

    // Add credential to proposal
    $('#addCredentialBtn')?.addEventListener('click', () => {
        addCredentialToProposal();
    });

    // Add from library
    $('#addFromLibraryBtn')?.addEventListener('click', () => {
        const selVal = $('#credentialLibrarySelect')?.value;
        if (!selVal) return;
        const cred = DB.data.credentials.find(c => c.id === selVal);
        if (cred) addCredentialToProposal(cred);
    });

    // Credential library modal
    $('#addCredLibBtn')?.addEventListener('click', () => openCredentialModal());
    $('#closeCredModal')?.addEventListener('click', closeCredentialModal);
    $('#cancelCredModal')?.addEventListener('click', closeCredentialModal);
    $('#saveCredModal')?.addEventListener('click', saveCredential);

    // Auto-fetch logo on client name change
    $('#credClient')?.addEventListener('blur', function() {
        const clientType = document.querySelector('input[name="credClientType"]:checked')?.value;
        if (clientType === 'company' && this.value && !$('#credLogoUrl').value) {
            $('#credLogoUrl').value = fetchCompanyLogo(this.value);
        }
    });

    // Contracts tabs
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            $$('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            $(`#tab-${btn.dataset.tab}`)?.classList.add('active');
        });
    });

    // Export
    $('#exportPdfBtn')?.addEventListener('click', exportPDF);
    $('#exportWordBtn')?.addEventListener('click', exportWord);
    $('#saveProposalBtn')?.addEventListener('click', saveProposal);
    $('#saveTemplateBtn')?.addEventListener('click', saveAsTemplate);

    // AI suggestion
    $('#aiSuggestUnderstanding')?.addEventListener('click', generateSampleUnderstanding);

    // Settings
    $('#saveSettingsBtn')?.addEventListener('click', saveSettings);

    // Load settings
    loadSettings();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Hearings page tabs
    $$('.contracts-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.closest('.page') || this.closest('.contracts-tabs').parentElement;
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const tabId = `tab-${this.dataset.tab}`;
            const tabContent = document.getElementById(tabId);
            if (tabContent) tabContent.classList.add('active');
            if (this.dataset.tab === 'calendar-tab') renderCalendar();
        });
    });

    // Init dashboard
    refreshDashboard();
    updateCredentialSelect();

    // Logout button (add to topbar)
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-sm btn-ghost';
    logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> ${DB.data.currentUser.name}`;
    logoutBtn.addEventListener('click', () => {
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
            DB.data.currentUser = null;
            DB.save();
            location.reload();
        }
    });
    $('.topbar-actions')?.appendChild(logoutBtn);
});

// ---- CALENDAR VIEW ----
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function renderCalendar() {
    const container = $('#calendarView');
    if (!container) return;

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1; // Monday first

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Gather events for this month
    const events = [];
    DB.data.hearings.forEach(h => {
        const d = new Date(h.date);
        if (d.getMonth() === calendarMonth && d.getFullYear() === calendarYear) {
            events.push({ date: d.getDate(), label: h.caseTitle, type: 'hearing', time: h.time });
        }
    });
    DB.data.deadlines.forEach(dl => {
        const d = new Date(dl.dueDate);
        if (d.getMonth() === calendarMonth && d.getFullYear() === calendarYear) {
            const daysLeft = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
            events.push({ date: d.getDate(), label: dl.title, type: daysLeft <= 3 && !dl.completed ? 'urgent' : 'deadline' });
        }
    });

    let html = `<div class="calendar-nav" style="grid-column:1/-1;">
        <button class="btn btn-sm btn-ghost" onclick="calendarMonth--;if(calendarMonth<0){calendarMonth=11;calendarYear--;}renderCalendar();">
            <i class="fas fa-chevron-left"></i>
        </button>
        <h3>${monthNames[calendarMonth]} ${calendarYear}</h3>
        <button class="btn btn-sm btn-ghost" onclick="calendarMonth++;if(calendarMonth>11){calendarMonth=0;calendarYear++;}renderCalendar();">
            <i class="fas fa-chevron-right"></i>
        </button>
    </div>`;

    // Day headers
    dayNames.forEach(d => {
        html += `<div class="calendar-header">${d}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < startDow; i++) {
        html += `<div class="calendar-day other-month"></div>`;
    }

    // Days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
        const dayEvents = events.filter(e => e.date === day);

        html += `<div class="calendar-day ${isToday ? 'today' : ''}">
            <div class="day-num">${day}</div>
            ${dayEvents.map(e => `<div class="cal-event ${e.type}">${e.time ? e.time + ' ' : ''}${e.label}</div>`).join('')}
        </div>`;
    }

    container.innerHTML = html;
}
