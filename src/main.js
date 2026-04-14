import './style.css';
import { DuckyParser } from './parser.js';
import html2pdf from 'html2pdf.js';

// DOM Elements
const inputArea = document.querySelector('#script-input');
const reportPreview = document.querySelector('#report-preview');
const exportBtn = document.querySelector('#export-btn');
const sidebar = document.querySelector('.sidebar');
const views = document.querySelectorAll('.view');

// State Manager
const state = {
    currentView: 'dashboard',
    reports: JSON.parse(localStorage.getItem('ducky_reports') || '[]'),
    settings: JSON.parse(localStorage.getItem('ducky_settings') || JSON.stringify({
        delay: 500,
        title: 'Keystroke Payload Documentation'
    }))
};

// --- View Switcher Logic ---
function switchView(viewName) {
    const mapping = {
        'dashboard': 'view-dashboard',
        'my reports': 'view-reports',
        'templates': 'view-templates',
        'settings': 'view-settings'
    };
    
    const targetId = mapping[viewName.toLowerCase()];
    const targetView = document.getElementById(targetId);
    
    if (targetView) {
        views.forEach(v => v.classList.remove('active'));
        targetView.classList.add('active');
        state.currentView = viewName.toLowerCase();
        
        if (viewName.toLowerCase() === 'my reports') renderReports();
        if (viewName.toLowerCase() === 'templates') renderTemplates();
        if (viewName.toLowerCase() === 'settings') loadSettingsToForm();
        if (viewName.toLowerCase() === 'dashboard') {
            const steps = DuckyParser.parse(inputArea.value);
            renderDocumentation(steps);
        }

        // Clear search when switching tabs
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.value = '';
        }
    }
}

sidebar.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;

    const navName = item.querySelector('span').innerText.toLowerCase();
    
    // Toggle active state in sidebar
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    switchView(navName);

    // Premium "Pop" Animation
    item.animate([
        { transform: 'scale(0.95)', background: 'rgba(255,255,255,0.1)' },
        { transform: 'scale(1.05)', background: 'rgba(255,255,255,0.05)' },
        { transform: 'scale(1)' }
    ], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
});

// --- Settings Logic ---
function loadSettingsToForm() {
    document.getElementById('setting-delay').value = state.settings.delay;
    document.getElementById('setting-title').value = state.settings.title;
}

document.getElementById('save-settings').addEventListener('click', () => {
    state.settings.delay = parseInt(document.getElementById('setting-delay').value) || 500;
    state.settings.title = document.getElementById('setting-title').value.trim() || 'Keystroke Payload Documentation';
    
    localStorage.setItem('ducky_settings', JSON.stringify(state.settings));
    
    // Update active UI (Watermark remains fixed)
    document.querySelector('.watermark').innerText = 'Developed by Sunil';
    
    // Force a re-render of the documentation title if active
    const titleEl = document.getElementById('preview-title');
    if (titleEl) titleEl.innerText = state.settings.title;
    
    alert('Settings saved successfully!');
});

// --- Reports Logic ---
function renderReports(filter = '') {
    const list = document.getElementById('reports-list');
    const count = document.getElementById('report-count');
    
    // Sort reports: Newest first
    const sortedReports = [...state.reports].reverse();
    const filteredReports = sortedReports.filter(r => 
        r.name.toLowerCase().includes(filter.toLowerCase())
    );

    count.innerText = `${filteredReports.length} Reports`;
    
    if (filteredReports.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 4rem; color: var(--slate-400);">
            ${filter ? 'No reports match your search' : 'No exported reports found.'}
        </div>`;
        return;
    }

    list.innerHTML = filteredReports.map((report, idx) => {
        // Find original index for deletion/viewing
        const originalIdx = state.reports.findIndex(r => r === report);
        return `
            <div class="card report-card" style="padding: 1.25rem; min-height: auto;">
                <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
                    <div class="icon-box icon-audit" style="width:40px; height:40px">
                        <i data-lucide="file-check" size="20"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <div class="template-title" style="margin:0; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${report.name}</div>
                        <div style="font-size: 0.7rem; color: var(--slate-400); font-weight: 500; text-transform: uppercase; margin-top: 2px;">DOCUMENTED</div>
                    </div>
                </div>
                
                <div style="padding: 0.75rem; background: var(--slate-50); border-radius: 8px; margin-bottom: 1.25rem;">
                    <div class="template-desc" style="font-size: 0.8rem; margin:0">
                        <strong>${report.steps}</strong> logical steps mapped.
                    </div>
                    <div style="font-size: 0.75rem; color: var(--slate-400); margin-top: 4px;">Created: ${report.date}</div>
                </div>

                <div class="card-actions" style="margin-top: 0">
                    <button class="btn btn-primary" onclick="window.viewReport(${originalIdx})" style="flex: 1; justify-content: center; font-size: 0.8rem">
                        <i data-lucide="eye" size="14"></i> Open in Editor
                    </button>
                    <button class="btn btn-icon" onclick="window.deleteReport(${originalIdx})" style="color: #ef4444; width:36px; height:36px">
                        <i data-lucide="trash-2" size="14"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons({ container: list });
}

// --- Search & Notifications ---
function initSearch() {
    const searchInput = document.getElementById('global-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (state.currentView === 'my reports') renderReports(query);
        if (state.currentView === 'templates') renderTemplates(query);
    });
}

function initNotifications() {
    const bell = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notif-dropdown');
    
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        document.getElementById('notif-badge').style.display = 'none';
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('active');
    });

    dropdown.addEventListener('click', (e) => e.stopPropagation());
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i data-lucide="check-circle" color="#10b981"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons({ container: toast });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function addNotification(msg) {
    const list = document.getElementById('notif-items');
    const badge = document.getElementById('notif-badge');
    
    // Remove empty state
    if (list.querySelector('.notif-empty')) {
        list.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `
        <i data-lucide="info" size="16"></i>
        <div>
            <div style="font-size: 0.85rem; font-weight:500">${msg}</div>
            <div style="font-size: 0.75rem; color: var(--slate-400)">Just now</div>
        </div>
    `;
    
    list.prepend(item);
    lucide.createIcons({ container: item });
    badge.style.display = 'block';
}

// Global Exports
window.viewReport = (idx) => {
    const report = state.reports[idx];
    inputArea.value = report.script;
    switchView('dashboard');
    const steps = DuckyParser.parse(inputArea.value);
    renderDocumentation(steps);
    
    // Highlight sidebar
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
};

window.deleteReport = (idx) => {
    if (confirm('Delete this report?')) {
        state.reports.splice(idx, 1);
        saveState();
        renderReports();
    }
};

function saveState() {
    localStorage.setItem('ducky_reports', JSON.stringify(state.reports));
    updateReportCount();
}

function updateReportCount() {
    const count = document.getElementById('report-count');
    if (count) count.innerText = `${state.reports.length} Reports`;
}

// --- Templates Logic ---
const PAYLOADS = [
    {
        name: "Windows: Admin User",
        os: "Windows",
        desc: "Creates a new local administrator account quietly.",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1V11.7H0V3.449zm0 17.1L9.75 21.9V12.3H0v8.249zM10.5 2V11.7H24V0L10.5 2zm0 19.9L24 24V12.3H10.5v9.6z"/></svg>`,
        color: "icon-windows",
        script: "REM Create Admin User\nGUI r\nDELAY 500\nSTRING cmd\nCTRL SHIFT ENTER\nDELAY 1000\nSTRING net user Sunil-Dev Password123 /add\nENTER\nSTRING net localgroup administrators Sunil-Dev /add\nENTER"
    },
    {
        name: "Linux: Network Scan",
        os: "Linux",
        desc: "Automated local network reconnaissance using Nmap.",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-.934 0-1.802.215-2.58.604-.848.423-1.543 1.05-2.023 1.815-.481.765-.757 1.666-.757 2.653 0 .546.084 1.066.24 1.554-.15.086-.29.186-.418.3-.77.683-1.168 1.616-1.168 2.637 0 1.011.39 1.936 1.14 2.617-.005.048-.008.096-.008.146 0 1.298.673 2.43 1.682 3.082-.016.143-.025.289-.025.437 0 1.956 1.764 3.543 3.923 3.543s3.923-1.587 3.923-3.543c0-.148-.009-.294-.025-.437 1.009-.652 1.682-1.784 1.682-3.082 0-.05-.003-.098-.008-.146.75-.681 1.14-1.606 1.14-2.617 0-1.021-.398-1.954-1.168-2.637-.128-.114-.268-.214-.418-.3.156-.488.24-1.008.24-1.554 0-.987-.276-1.888-.757-2.653-.48-.765-1.175-1.392-2.023-1.815-.778-.389-1.646-.604-2.58-.604z"/></svg>`,
        color: "icon-linux",
        script: "REM Network Recon\nCTRL ALT t\nDELAY 500\nSTRING nmap -sn 192.168.1.0/24\nENTER"
    },
    {
        name: "System Audit (Win)",
        os: "Windows",
        desc: "Extracts full system inventory and saves to desktop.",
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>`,
        color: "icon-audit",
        script: "REM System Audit\nGUI r\nDELAY 200\nSTRING powershell\nENTER\nDELAY 500\nSTRING systeminfo > $home\\Desktop\\Audit.txt\nENTER"
    }
];

function renderTemplates(filter = '') {
    const list = document.getElementById('templates-list');
    if (!list) return;

    const filtered = PAYLOADS.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) || 
        p.desc.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 4rem; color: var(--slate-400);">No templates match your search.</div>';
        return;
    }

    list.innerHTML = filtered.map(t => `
        <div class="card template-card">
            <div class="icon-box ${t.color}">
                ${t.icon.startsWith('<svg') ? t.icon : `<i data-lucide="${t.icon}"></i>`}
            </div>
            <div class="template-title">${t.name}</div>
            <div class="template-desc">${t.desc}</div>
            <div class="card-actions">
                <button class="btn btn-primary" style="flex: 1" onclick="window.useTemplate('${t.name}')">
                    Use Template
                </button>
                <button class="btn btn-icon" onclick="window.simulatePayload('${t.name}')" title="Live Preview">
                    <i data-lucide="play" size="14"></i>
                </button>
            </div>
        </div>
    `).join('');
    lucide.createIcons({ container: list });
}

window.useTemplate = (name) => {
    const p = PAYLOADS.find(x => x.name === name);
    inputArea.value = p.script;
    switchView('dashboard');
    document.querySelector('.nav-item').click(); // Sync sidebar
    inputArea.dispatchEvent(new Event('input')); // Trigger render
};

window.simulatePayload = (name) => {
    const p = PAYLOADS.find(x => x.name === name);
    alert(`[Simulating ${p.os} Payload]\n\nProcessing: ${p.name}\n\nThis would open the terminal and type: \n${p.script.substring(0, 50)}...`);
};

// --- Dashboard Actions ---
document.getElementById('btn-clear').addEventListener('click', () => {
    inputArea.value = '';
    renderDocumentation([]);
});

document.getElementById('btn-copy').addEventListener('click', () => {
    inputArea.select();
    document.execCommand('copy');
    alert('DuckyScript copied to clipboard!');
});

// --- Documentation Logic (Dashboard) ---
function renderDocumentation(steps) {
    if (steps.length === 0) {
        reportPreview.innerHTML = `
            <div style="text-align: center; color: var(--slate-400); margin-top: 4rem;">
                <i data-lucide="file-question" size="48" style="margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Start typing DuckyScript to generate documentation</p>
            </div>
        `;
        lucide.createIcons({ container: reportPreview });
        return;
    }

    // Update Header Metadata
    const titleEl = document.getElementById('preview-title');
    const timeEl = document.getElementById('preview-time');
    const complexEl = document.getElementById('preview-complexity');
    
    if (titleEl) titleEl.innerText = state.settings.title;
    
    const totalMs = steps.reduce((acc, s) => {
        if (s.command === 'DELAY' || s.command === 'DEFAULTDELAY' || s.command === 'DEFAULT_DELAY') {
            return acc + (parseInt(s.raw.split(' ')[1]) || 0);
        }
        return acc + parseInt(state.settings.delay);
    }, 0);
    
    if (timeEl) timeEl.innerText = `Est. Time: ${(totalMs / 1000).toFixed(1)}s`;
    if (complexEl) complexEl.innerText = `${steps.length} Commands`;

    reportPreview.innerHTML = steps.map((step, idx) => `
        <div class="timeline-step" style="animation-delay: ${idx * 0.05}s">
            <div class="step-marker">
                <div class="step-dot"></div>
                ${idx < steps.length - 1 ? '<div class="step-line"></div>' : ''}
            </div>
            <div class="step-content">
                <div class="step-header">
                    <div class="icon-box ${idx % 2 === 0 ? 'icon-blue' : 'icon-purple'}" style="width:20px; height:20px; border-radius:4px">
                        <i data-lucide="${step.icon}" size="10"></i>
                    </div>
                    <span class="step-type">${step.label}</span>
                </div>
                <div class="step-desc">${step.description}</div>
                <div class="step-details">Raw: <code>${step.raw}</code></div>
            </div>
        </div>
    `).join('');
    lucide.createIcons({ container: reportPreview });
}

inputArea.addEventListener('input', (e) => {
    const script = e.target.value;
    const steps = DuckyParser.parse(script);
    renderDocumentation(steps);
});

// --- Export Logic ---
exportBtn.addEventListener('click', () => {
    const element = document.getElementById('report-view');
    const steps = DuckyParser.parse(inputArea.value);
    
    // Sync title one last time for PDF
    const titleEl = document.getElementById('preview-title');
    if (titleEl) titleEl.innerText = state.settings.title;

    if (steps.length === 0) return alert('Nothing to export!');

    const options = {
        margin: [0.5, 0.5],
        filename: `${state.settings.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    exportBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" size="16"></i> Exporting...';
    lucide.createIcons({ container: exportBtn });

    const prjInput = document.getElementById('project-name');
    const prjName = prjInput.value.trim() || `Report_${new Date().toLocaleTimeString()}`;

    // Save to History IMMEDIATELY
    state.reports.unshift({
        id: Date.now(),
        name: prjName,
        steps: steps.length,
        date: new Date().toLocaleDateString(),
        script: inputArea.value
    });
    saveState();
    if (state.currentView === 'my reports') renderReports();
    
    showToast('Report generated successfully!');
    addNotification(`Exported: ${prjName}`);

    // FORCE VISIBILITY FOR PDF CAPTURE (Disable animations/opacity)
    element.classList.add('pdf-export-mode');

    html2pdf().set(options).from(element).save().then(() => {
        element.classList.remove('pdf-export-mode');
        exportBtn.innerHTML = '<i data-lucide="check" size="16"></i> Success';
        lucide.createIcons({ container: exportBtn });
        setTimeout(() => {
            exportBtn.innerHTML = '<i data-lucide="download" size="16"></i> Export Report';
            lucide.createIcons({ container: exportBtn });
        }, 3000);
    }).catch(err => {
        console.error('Export failed:', err);
        exportBtn.innerHTML = '<i data-lucide="alert-circle" size="16"></i> Failed';
        lucide.createIcons({ container: exportBtn });
    });
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    document.querySelector('.watermark').innerText = 'Developed by Sunil';
    updateReportCount(); // Sync badge on load
});
