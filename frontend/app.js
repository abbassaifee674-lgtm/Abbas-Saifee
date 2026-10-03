// Abbas Saifee Job Hunter & Outreach Agent - Frontend Controller

let allJobs = [];
let targetCountries = [];
let activeCountryFilter = "All";
let activeJobForModal = null;
let scanPollInterval = null;

// DOM Elements
const jobsContainer = document.getElementById("jobsContainer");
const countryPillsContainer = document.getElementById("countryPillsContainer");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const scanStatusBar = document.getElementById("scanStatusBar");

// Stats Elements
const statTotalJobs = document.getElementById("statTotalJobs");
const statCountries = document.getElementById("statCountries");
const statEmails = document.getElementById("statEmails");
const statSent = document.getElementById("statSent");
const badgeAll = document.getElementById("badgeAll");

// Modals
const emailModal = document.getElementById("emailModal");
const manualJobModal = document.getElementById("manualJobModal");
const settingsModal = document.getElementById("settingsModal");
const toast = document.getElementById("toast");

// Initialize on Load
document.addEventListener("DOMContentLoaded", async () => {
    setupEventListeners();
    await loadCountries();
    await refreshData();
});

function setupEventListeners() {
    document.getElementById("btnScan").addEventListener("click", triggerScan);
    const btnDaily50 = document.getElementById("btnDaily50");
    if (btnDaily50) btnDaily50.addEventListener("click", triggerScan);
    document.getElementById("btnOpenManual").addEventListener("click", () => toggleModal(manualJobModal, true));
    document.getElementById("btnOpenSettings").addEventListener("click", openSettingsModal);
    document.getElementById("btnBatchSend").addEventListener("click", batchSendDrafts);

    // Modal Close buttons
    document.getElementById("btnCloseEmailModal").addEventListener("click", () => toggleModal(emailModal, false));
    document.getElementById("btnCloseManualModal").addEventListener("click", () => toggleModal(manualJobModal, false));
    document.getElementById("btnCancelManual").addEventListener("click", () => toggleModal(manualJobModal, false));
    document.getElementById("btnCloseSettingsModal").addEventListener("click", () => toggleModal(settingsModal, false));
    document.getElementById("btnCancelSettings").addEventListener("click", () => toggleModal(settingsModal, false));

    // Modal Action buttons
    document.getElementById("btnSaveDraft").addEventListener("click", saveModalDraft);
    document.getElementById("btnSendLive").addEventListener("click", () => sendModalEmail(false));
    document.getElementById("btnSendTest").addEventListener("click", () => sendModalEmail(true));
    document.getElementById("btnSaveManual").addEventListener("click", submitManualJob);
    document.getElementById("btnSaveSettings").addEventListener("click", saveSettings);

    // Filter and search
    searchInput.addEventListener("input", filterAndRenderJobs);
    statusFilter.addEventListener("change", filterAndRenderJobs);
}

function showToast(message, duration = 3500) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => {
        toast.classList.add("hidden");
    }, duration);
}

function toggleModal(modal, show) {
    if (show) {
        modal.classList.remove("hidden");
    } else {
        modal.classList.add("hidden");
    }
}

// Load 12 Target Countries
async function loadCountries() {
    try {
        const res = await fetch("/api/countries");
        targetCountries = await res.json();
        renderCountryPills();
    } catch (e) {
        console.error("Error loading countries:", e);
    }
}

function renderCountryPills(counts = {}) {
    countryPillsContainer.innerHTML = `
        <button class="country-pill ${activeCountryFilter === 'All' ? 'active' : ''}" data-country="All">
            <span class="flag">🌐</span> All Countries <span class="count-badge" id="badgeAll">${allJobs.length}</span>
        </button>
    `;

    targetCountries.forEach(c => {
        const count = counts[c.name] || 0;
        const btn = document.createElement("button");
        btn.className = `country-pill ${activeCountryFilter === c.name ? 'active' : ''}`;
        btn.dataset.country = c.name;
        btn.innerHTML = `<span class="flag">${c.flag}</span> ${c.name} <span class="count-badge">${count}</span>`;
        btn.addEventListener("click", () => {
            document.querySelectorAll(".country-pill").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            activeCountryFilter = c.name;
            filterAndRenderJobs();
        });
        countryPillsContainer.appendChild(btn);
    });

    const allBtn = countryPillsContainer.querySelector('[data-country="All"]');
    allBtn.addEventListener("click", () => {
        document.querySelectorAll(".country-pill").forEach(p => p.classList.remove("active"));
        allBtn.classList.add("active");
        activeCountryFilter = "All";
        filterAndRenderJobs();
    });
}

// Refresh all stats and jobs
async function refreshData() {
    try {
        const [statsRes, jobsRes] = await Promise.all([
            fetch("/api/stats"),
            fetch("/api/jobs")
        ]);

        const stats = await statsRes.json();
        allJobs = await jobsRes.json();

        // Update stats widgets
        statTotalJobs.textContent = stats.total_jobs;
        statEmails.textContent = stats.emails_found;
        statSent.textContent = stats.emails_sent;
        badgeAll.textContent = stats.total_jobs;

        // Daily 50 Companies Progress
        const daily = stats.daily_quota || { found_today: stats.total_jobs, daily_target: 50, percentage: 100 };
        const progressCountElem = document.getElementById("dailyProgressCount");
        const progressBarElem = document.getElementById("dailyProgressBar");
        const goalStatusElem = document.getElementById("dailyGoalStatus");

        if (progressCountElem) progressCountElem.textContent = daily.found_today;
        if (progressBarElem) progressBarElem.style.width = `${Math.min(daily.percentage, 100)}%`;
        if (goalStatusElem) {
            if (daily.found_today >= 50) {
                goalStatusElem.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #34d399;"></i> <b>Daily 50 Goal Met! (${daily.found_today}/50)</b>`;
            } else {
                goalStatusElem.innerHTML = `<i class="fa-solid fa-hourglass-half" style="color: #fbbf24;"></i> ${50 - daily.found_today} more needed for today's 50 target`;
            }
        }

        renderCountryPills(stats.country_counts || {});

        // Handle scanning status indicator
        if (stats.is_scanning) {
            scanStatusBar.classList.remove("hidden");
            if (!scanPollInterval) {
                scanPollInterval = setInterval(refreshData, 3000);
            }
        } else {
            scanStatusBar.classList.add("hidden");
            if (scanPollInterval) {
                clearInterval(scanPollInterval);
                scanPollInterval = null;
            }
        }

        filterAndRenderJobs();
    } catch (e) {
        console.error("Error refreshing data:", e);
    }
}

// Trigger AI Job Hunter Scan
async function triggerScan() {
    try {
        scanStatusBar.classList.remove("hidden");
        showToast("🚀 Initiating AI Job Hunter across all 12 countries for today's 50 target...");
        const res = await fetch("/api/scan", { method: "POST" });
        const data = await res.json();
        
        if (!scanPollInterval) {
            scanPollInterval = setInterval(refreshData, 3000);
        }
        await refreshData();
    } catch (e) {
        showToast("Error triggering scan: " + e.message);
    }
}

// Filter and render jobs list
function filterAndRenderJobs() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    const filtered = allJobs.filter(j => {
        const matchesCountry = (activeCountryFilter === "All") || (j.country === activeCountryFilter);
        const matchesStatus = (selectedStatus === "All") || (j.status === selectedStatus);
        const matchesSearch = !searchTerm || 
            j.title.toLowerCase().includes(searchTerm) ||
            j.company.toLowerCase().includes(searchTerm) ||
            (j.location && j.location.toLowerCase().includes(searchTerm)) ||
            (j.source_name && j.source_name.toLowerCase().includes(searchTerm)) ||
            (j.description && j.description.toLowerCase().includes(searchTerm));

        return matchesCountry && matchesStatus && matchesSearch;
    });

    renderJobsGrid(filtered);
}

function getCountryFlag(countryName) {
    const c = targetCountries.find(x => x.name.toLowerCase() === countryName.toLowerCase());
    return c ? c.flag : "📍";
}

function renderJobsGrid(jobs) {
    if (jobs.length === 0) {
        jobsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                <i class="fa-solid fa-compass" style="font-size: 2.5rem; color: #3b82f6; margin-bottom: 1rem;"></i>
                <h3>No opportunities found for this filter</h3>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">Click <b>Hunt Today's 50 Companies</b> to fetch fresh procurement jobs across 12 countries.</p>
            </div>
        `;
        return;
    }

    jobsContainer.innerHTML = "";

    jobs.forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card";

        const flag = getCountryFlag(job.country);
        const emailDisplay = job.contact_email ? 
            `<div class="email-tag"><i class="fa-solid fa-at"></i> ${job.contact_email}</div>` : 
            `<div class="email-tag email-tag-empty"><i class="fa-solid fa-circle-question"></i> Email not yet detected</div>`;

        let statusClass = `status-${job.status}`;
        let statusLabel = job.status.replace("_", " ");

        // CV Match Badge
        const matchScore = job.cv_match_score || 88;
        const matchClass = matchScore >= 90 ? 'match-high' : 'match-good';

        // Source badge & Direct link
        const sourceName = job.source_name || job.source_portal || 'Corporate Careers';
        const sourceLink = job.source_url ? 
            `<a href="${job.source_url}" target="_blank" class="source-link-btn" title="Open Original Posting / Portal">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> View Source
             </a>` : '';

        // CV Match Highlights
        const cvSnippet = job.cv_match_reasons ? 
            `<div class="cv-reasons-snippet"><i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <b>CV Match:</b> ${job.cv_match_reasons}</div>` : '';

        card.innerHTML = `
            <div>
                <div class="job-header">
                    <div>
                        <div class="job-company-badge">
                            <i class="fa-solid fa-building"></i> ${job.company}
                        </div>
                        <div class="job-title">${job.title}</div>
                        <div class="job-location">
                            <span>${flag}</span> ${job.location || job.country}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;">
                        <span class="status-pill ${statusClass}">${statusLabel}</span>
                        <span class="cv-match-badge ${matchClass}"><i class="fa-solid fa-star"></i> ${matchScore}% CV Match</span>
                    </div>
                </div>

                <div class="job-body" style="margin-top: 0.85rem;">
                    <div class="source-tag">
                        <i class="fa-solid fa-link"></i> Source: <b>${sourceName}</b> ${sourceLink}
                    </div>

                    ${cvSnippet}

                    ${emailDisplay}
                    <div class="job-desc-snippet">${job.description || 'Procurement, strategic vendor negotiations, and CAPEX/OPEX purchasing role.'}</div>
                </div>
            </div>

            <div class="job-footer">
                <button class="btn btn-secondary btn-view-pitch" data-id="${job.id}">
                    <i class="fa-solid fa-envelope-open-text"></i> Review Pitch & CV
                </button>
                <button class="btn btn-primary btn-quick-send" data-id="${job.id}">
                    <i class="fa-solid fa-paper-plane"></i> Send Now
                </button>
            </div>
        `;

        card.querySelector(".btn-view-pitch").addEventListener("click", () => openEmailModal(job));
        card.querySelector(".btn-quick-send").addEventListener("click", () => quickSendJob(job.id));

        jobsContainer.appendChild(card);
    });
}

// Open Email Pitch & Attachment Modal
function openEmailModal(job) {
    activeJobForModal = job;
    document.getElementById("modalJobCompany").textContent = `${job.title} at ${job.company}`;
    document.getElementById("modalRecipient").value = job.contact_email || "";
    document.getElementById("modalCountry").value = `${getCountryFlag(job.country)} ${job.country}`;
    document.getElementById("modalSubject").value = job.email_subject || `Application: ${job.title} – Abbas Saifee`;
    document.getElementById("modalBody").value = job.email_body || "";

    toggleModal(emailModal, true);
}

// Save edits made to draft in modal
async function saveModalDraft() {
    if (!activeJobForModal) return;
    const recipient = document.getElementById("modalRecipient").value.trim();
    const subject = document.getElementById("modalSubject").value.trim();
    const body = document.getElementById("modalBody").value.trim();

    try {
        const res = await fetch(`/api/jobs/${activeJobForModal.id}/draft`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject, body, contact_email: recipient })
        });
        const data = await res.json();
        showToast("Draft updated successfully!");
        toggleModal(emailModal, false);
        await refreshData();
    } catch (e) {
        showToast("Error updating draft: " + e.message);
    }
}

// Send Email from Modal (Simulated or Live)
async function sendModalEmail(isTestOverride = false) {
    if (!activeJobForModal) return;
    
    // Save current content first
    await saveModalDraft();

    showToast(isTestOverride ? "Sending test simulation..." : "Dispatching email with Abbas's CV attached...");
    try {
        const url = `/api/jobs/${activeJobForModal.id}/send`;
        const res = await fetch(url, { method: "POST" });
        const result = await res.json();

        if (result.success) {
            showToast(result.message);
            toggleModal(emailModal, false);
            await refreshData();
        } else {
            showToast("Failed to send: " + (result.error || "Unknown error"));
        }
    } catch (e) {
        showToast("Send error: " + e.message);
    }
}

// Quick Send from Job Card
async function quickSendJob(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    if (!job.contact_email) {
        openEmailModal(job);
        showToast("Please verify or specify a contact email for this company first.");
        return;
    }

    showToast(`Sending application to ${job.company} (${job.contact_email})...`);
    try {
        const res = await fetch(`/api/jobs/${jobId}/send`, { method: "POST" });
        const result = await res.json();
        if (result.success) {
            showToast(result.message);
            await refreshData();
        } else {
            showToast("Failed: " + result.error);
        }
    } catch (e) {
        showToast("Error sending: " + e.message);
    }
}

// Batch Send All Drafted
async function batchSendDrafts() {
    const draftedJobs = allJobs.filter(j => j.status === 'DRAFTED' && j.contact_email);
    if (draftedJobs.length === 0) {
        showToast("No approved drafts with detected emails ready to send.");
        return;
    }

    if (!confirm(`Are you sure you want to send applications to ${draftedJobs.length} companies with Abbas's CV attached?`)) {
        return;
    }

    showToast(`Batch dispatching ${draftedJobs.length} applications...`);
    const jobIds = draftedJobs.map(j => j.id);

    try {
        const res = await fetch("/api/jobs/batch-send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jobIds)
        });
        const result = await res.json();
        showToast(`Dispatched ${result.total} applications successfully!`);
        await refreshData();
    } catch (e) {
        showToast("Batch send error: " + e.message);
    }
}

// Submit Manual Job Addition
async function submitManualJob() {
    const company = document.getElementById("manCompany").value.trim();
    const title = document.getElementById("manTitle").value.trim();
    const country = document.getElementById("manCountry").value;
    const location = document.getElementById("manLocation").value.trim();
    const contact_email = document.getElementById("manEmail").value.trim();
    const company_domain = document.getElementById("manDomain").value.trim();
    const job_url = document.getElementById("manUrl").value.trim();

    if (!company || !title) {
        showToast("Company name and job title are required.");
        return;
    }

    try {
        const res = await fetch("/api/jobs/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                company, title, country, location, 
                contact_email, company_domain, job_url
            })
        });
        const result = await res.json();
        showToast("Opportunity added & tailored cold email generated!");
        toggleModal(manualJobModal, false);
        await refreshData();
    } catch (e) {
        showToast("Error adding job: " + e.message);
    }
}

// Settings Modal handler
async function openSettingsModal() {
    try {
        const res = await fetch("/api/settings");
        const settings = await res.json();

        document.getElementById("setSenderName").value = settings.sender_name || "Abbas Saifee";
        document.getElementById("setSenderEmail").value = settings.sender_email || "abbasshabbir5153@gmail.com";
        document.getElementById("setSmtpServer").value = settings.smtp_server || "smtp.gmail.com";
        document.getElementById("setSmtpPort").value = settings.smtp_port || "587";
        document.getElementById("setSmtpUser").value = settings.smtp_user || "abbasshabbir5153@gmail.com";
        document.getElementById("setSmtpPassword").value = settings.smtp_password || "";
        document.getElementById("setTestMode").value = settings.test_mode || "true";
        document.getElementById("setTestRecipient").value = settings.test_recipient_email || "";

        toggleModal(settingsModal, true);
    } catch (e) {
        showToast("Error loading settings: " + e.message);
    }
}

async function saveSettings() {
    const payload = {
        sender_name: document.getElementById("setSenderName").value.trim(),
        sender_email: document.getElementById("setSenderEmail").value.trim(),
        smtp_server: document.getElementById("setSmtpServer").value.trim(),
        smtp_port: document.getElementById("setSmtpPort").value.trim(),
        smtp_user: document.getElementById("setSmtpUser").value.trim(),
        smtp_password: document.getElementById("setSmtpPassword").value.trim(),
        test_mode: document.getElementById("setTestMode").value,
        test_recipient_email: document.getElementById("setTestRecipient").value.trim(),
    };

    try {
        const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        showToast("Settings saved successfully!");
        toggleModal(settingsModal, false);
    } catch (e) {
        showToast("Error saving settings: " + e.message);
    }
}
