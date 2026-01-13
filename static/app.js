// Use relative URL so it works on any domain/IP
const API_URL = '/api';

// State
let users = [];
let jobs = [];
let matches = [];

// DOM Elements
const usersList = document.getElementById('usersList');
const jobsList = document.getElementById('jobsList');
const usersCount = document.getElementById('usersCount');
const jobsCount = document.getElementById('jobsCount');
const loadingOverlay = document.getElementById('loadingOverlay');

const userModal = document.getElementById('userModal');
const jobModal = document.getElementById('jobModal');
const userForm = document.getElementById('userForm');
const jobForm = document.getElementById('jobForm');

const addUserBtn = document.getElementById('addUserBtn');
const addJobBtn = document.getElementById('addJobBtn');
const matchBtn = document.getElementById('matchBtn');

const closeUserModal = document.getElementById('closeUserModal');
const closeJobModal = document.getElementById('closeJobModal');
const cancelUserBtn = document.getElementById('cancelUserBtn');
const cancelJobBtn = document.getElementById('cancelJobBtn');

// Initialize
async function init() {
  await Promise.all([fetchUsers(), fetchJobs(), fetchMatches()]);
  renderAll();
  setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
  addUserBtn.addEventListener('click', () => openModal(userModal));
  addJobBtn.addEventListener('click', () => openModal(jobModal));
  matchBtn.addEventListener('click', runMatching);

  closeUserModal.addEventListener('click', () => closeModal(userModal));
  closeJobModal.addEventListener('click', () => closeModal(jobModal));
  cancelUserBtn.addEventListener('click', () => closeModal(userModal));
  cancelJobBtn.addEventListener('click', () => closeModal(jobModal));

  userForm.addEventListener('submit', handleUserSubmit);
  jobForm.addEventListener('submit', handleJobSubmit);

  // Close modal on outside click
  userModal.addEventListener('click', (e) => {
    if (e.target === userModal) closeModal(userModal);
  });
  jobModal.addEventListener('click', (e) => {
    if (e.target === jobModal) closeModal(jobModal);
  });
}

// Modal Functions
function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = '';
  if (modal === userModal) userForm.reset();
  if (modal === jobModal) jobForm.reset();
}

function showLoading() {
  loadingOverlay.classList.add('active');
}

function hideLoading() {
  loadingOverlay.classList.remove('active');
}

// API Functions
async function fetchUsers() {
  try {
    const response = await fetch(`${API_URL}/users`);
    users = await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

async function fetchJobs() {
  try {
    const response = await fetch(`${API_URL}/jobs`);
    jobs = await response.json();
  } catch (error) {
    console.error('Error fetching jobs:', error);
  }
}

async function fetchMatches() {
  try {
    const response = await fetch(`${API_URL}/matches`);
    matches = await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
  }
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    showLoading();

    // Create user
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      skills: formData.get('skills') || null,
      cvText: formData.get('cvText') || null,
    };

    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const newUser = await response.json();

    // Upload CV if provided
    const cvFile = formData.get('cvFile');
    if (cvFile && cvFile.size > 0) {
      const cvFormData = new FormData();
      cvFormData.append('cv', cvFile);

      await fetch(`${API_URL}/users/${newUser.id}/upload-cv`, {
        method: 'POST',
        body: cvFormData,
      });
    }

    await fetchUsers();
    renderAll();
    closeModal(userModal);
  } catch (error) {
    console.error('Error adding user:', error);
    alert('Failed to add user: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function handleJobSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    showLoading();

    const jobData = {
      title: formData.get('title'),
      description: formData.get('description'),
      requirements: formData.get('requirements'),
      location: formData.get('location') || null,
      salary: formData.get('salary') || null,
    };

    await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    });

    await fetchJobs();
    renderAll();
    closeModal(jobModal);
  } catch (error) {
    console.error('Error adding job:', error);
    alert('Failed to add job: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this candidate?')) return;

  try {
    showLoading();
    await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
    await Promise.all([fetchUsers(), fetchMatches()]);
    renderAll();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user');
  } finally {
    hideLoading();
  }
}

async function deleteJob(jobId) {
  if (!confirm('Are you sure you want to delete this position?')) return;

  try {
    showLoading();
    await fetch(`${API_URL}/jobs/${jobId}`, { method: 'DELETE' });
    await Promise.all([fetchJobs(), fetchMatches()]);
    renderAll();
  } catch (error) {
    console.error('Error deleting job:', error);
    alert('Failed to delete job');
  } finally {
    hideLoading();
  }
}

async function runMatching() {
  if (users.length === 0 || jobs.length === 0) {
    alert('Please add at least one candidate and one job before matching.');
    return;
  }

  const hasCV = users.some(u => u.cvText || u.skills);
  if (!hasCV) {
    alert('Please add CV text or skills to at least one candidate before matching.');
    return;
  }

  try {
    showLoading();

    const response = await fetch(`${API_URL}/match`, {
      method: 'POST',
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    await fetchMatches();
    renderAll();

    alert(`✅ Matching complete! Found ${result.matchCount} compatible job-candidate pairs.`);
  } catch (error) {
    console.error('Error running match:', error);
    alert('Failed to run matching: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Render Functions
function renderAll() {
  renderUsers();
  renderJobs();
}

function renderUsers() {
  usersCount.textContent = users.length;

  if (users.length === 0) {
    usersList.innerHTML = '<div class="empty-state">No candidates yet. Add your first candidate!</div>';
    return;
  }

  usersList.innerHTML = users
    .map((user, index) => {
      const userMatches = matches.filter(m => m.userId === user.id);
      const hasCV = user.cvText || user.cvPdfPath;

      return `
        <div class="card" style="animation-delay: ${index * 50}ms">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(user.name)}</h3>
            <button class="card-delete" onclick="deleteUser(${user.id})" title="Delete">×</button>
          </div>
          <div class="card-meta">
            <div class="card-meta-item">
              <span class="card-meta-label">Email:</span>
              ${escapeHtml(user.email)}
            </div>
            ${user.skills ? `
              <div class="card-meta-item">
                <span class="card-meta-label">Skills:</span>
                ${escapeHtml(user.skills)}
              </div>
            ` : ''}
          </div>
          ${hasCV ? '<div class="card-cv-indicator">CV Uploaded</div>' : ''}
          ${userMatches.length > 0 ? `
            <div class="card-tags">
              ${userMatches
                .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
                .slice(0, 5)
                .map(match => `
                  <div class="tag tag-match" title="${escapeHtml(match.reasoning || '')}">
                    ${escapeHtml(match.jobTitle)}
                    <span class="tag-score">${Math.round(match.compatibilityScore)}%</span>
                  </div>
                `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('');
}

function renderJobs() {
  jobsCount.textContent = jobs.length;

  if (jobs.length === 0) {
    jobsList.innerHTML = '<div class="empty-state">No positions yet. Add your first job listing!</div>';
    return;
  }

  jobsList.innerHTML = jobs
    .map((job, index) => {
      const jobMatches = matches.filter(m => m.jobId === job.id);

      return `
        <div class="card" style="animation-delay: ${index * 50}ms">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(job.title)}</h3>
            <button class="card-delete" onclick="deleteJob(${job.id})" title="Delete">×</button>
          </div>
          <div class="card-meta">
            ${job.location ? `
              <div class="card-meta-item">
                <span class="card-meta-label">Location:</span>
                ${escapeHtml(job.location)}
              </div>
            ` : ''}
            ${job.salary ? `
              <div class="card-meta-item">
                <span class="card-meta-label">Salary:</span>
                ${escapeHtml(job.salary)}
              </div>
            ` : ''}
          </div>
          <p class="card-description">${escapeHtml(job.description)}</p>
          ${jobMatches.length > 0 ? `
            <div class="card-tags">
              ${jobMatches
                .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
                .slice(0, 5)
                .map(match => `
                  <div class="tag tag-match" title="${escapeHtml(match.reasoning || '')}">
                    ${escapeHtml(match.userName)}
                    <span class="tag-score">${Math.round(match.compatibilityScore)}%</span>
                  </div>
                `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('');
}

// Utility
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
