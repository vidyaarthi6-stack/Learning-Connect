// ============================================================
// LEARNING CONNECT — script.js
// ============================================================
// ⚠️  PASTE YOUR SUPABASE CREDENTIALS BELOW
// ============================================================

const SUPABASE_URL = 'https://tmrlzozptiwvujrorfyj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_whTc8V8TbVzf8TjpyAaLjg_K9WeN-Tu';
const ADMIN_PASSWORD = 'Learning@Connect#1234';   // Change this!

// ── Init Supabase ──────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Toast Notifications ────────────────────────────────────
function toast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.style.opacity = '0', duration - 400);
  setTimeout(() => el.remove(), duration);
}

// ── Spinner ────────────────────────────────────────────────
const spinner = {
  show() { document.getElementById('spinner')?.classList.remove('hidden'); },
  hide() { document.getElementById('spinner')?.classList.add('hidden'); }
};

// ── Helpers ────────────────────────────────────────────────
function levelBadgeClass(level) {
  return { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' }[level] || '';
}
function levelEmoji(level) {
  return { beginner: '🌱', intermediate: '⚡', advanced: '🔥' }[level] || '';
}
function roleEmoji(role) {
  return role === 'educator' ? '🎓' : '📚';
}
function avatarUrl(url, seed) {
  return url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
function safeLink(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return 'https://' + url;
}

// ============================================================
// MATCHMAKING PAGE  (index.html)
// ============================================================
if (document.getElementById('cards-grid')) {
  let allUsers = [];
  let interestOptions = new Set();
  let currentFilters = { search: '', role: '', level: '', interest: '' };

  async function loadUsers() {
    spinner.show();
    const { data, error } = await sb
      .from('users')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    spinner.hide();
    if (error) { toast('Failed to load profiles', 'error'); return; }
    allUsers = data || [];
    allUsers.forEach(u => { if (u.interest) interestOptions.add(u.interest); });
    populateInterestFilter();
    renderCards(allUsers);
    updateStatsCount();
  }

  function populateInterestFilter() {
    const sel = document.getElementById('filter-interest');
    if (!sel) return;
    [...interestOptions].sort().forEach(interest => {
      const opt = document.createElement('option');
      opt.value = interest; opt.textContent = interest;
      sel.appendChild(opt);
    });
  }

  function applyFilters() {
    const { search, role, level, interest } = currentFilters;
    const filtered = allUsers.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.interest?.toLowerCase().includes(q) || u.bio?.toLowerCase().includes(q);
      const matchRole = !role || u.role === role;
      const matchLevel = !level || u.level === level;
      const matchInterest = !interest || u.interest === interest;
      return matchSearch && matchRole && matchLevel && matchInterest;
    });
    renderCards(filtered);
  }

  function renderCards(users) {
    const grid = document.getElementById('cards-grid');
    const countEl = document.getElementById('filter-count');
    if (countEl) countEl.textContent = `${users.length} profile${users.length !== 1 ? 's' : ''} found`;

    if (!users.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="emoji">🔍</div>
          <h3>No profiles found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>`;
      return;
    }
    grid.innerHTML = users.map((u, i) => cardHTML(u, i)).join('');
  }

  function cardHTML(u, i) {
    const avatar = avatarUrl(u.profile_photo, u.name);
    const igIcon  = u.instagram_link ? `<a href="${safeLink(u.instagram_link)}" target="_blank" class="social-btn ig" title="Instagram">&#x1F4F7;</a>` : '';
    const ytIcon  = u.youtube_link   ? `<a href="${safeLink(u.youtube_link)}"   target="_blank" class="social-btn yt" title="YouTube">&#x25B6;</a>` : '';
    const fbIcon  = u.facebook_link  ? `<a href="${safeLink(u.facebook_link)}"  target="_blank" class="social-btn fb" title="Facebook">&#x1F310;</a>` : '';
    const delay = Math.min(i * 0.04, 0.5);
    return `
    <div class="profile-card" style="animation-delay:${delay}s">
      <div class="card-header">
        <div class="avatar-wrap">
          <img class="avatar" src="${avatar}" alt="${u.name}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}'">
          <div class="role-dot ${u.role}" title="${u.role}">${roleEmoji(u.role)}</div>
        </div>
        <div class="card-meta">
          <div class="card-name">${u.name}</div>
          <div class="card-role-interest"><strong>${u.role === 'educator' ? 'Educator' : 'Student'}</strong> · ${u.interest || 'General'}</div>
          <div class="level-badge ${levelBadgeClass(u.level)}">${levelEmoji(u.level)} ${u.level}</div>
        </div>
      </div>
      <div class="card-body">
        <p class="card-bio">${u.bio || 'No bio provided.'}</p>
      </div>
      <div class="card-footer">
        <div class="social-icons">${igIcon}${ytIcon}${fbIcon}</div>
        ${u.contact_link
          ? `<a href="${safeLink(u.contact_link)}" target="_blank" class="connect-btn">✉ Connect</a>`
          : `<span style="font-size:.8rem;color:var(--muted)">No contact link</span>`}
      </div>
    </div>`;
  }

  function updateStatsCount() {
    const el = document.getElementById('hero-count');
    if (el) el.textContent = allUsers.length;
  }

  // Wire up filters
  document.getElementById('search-input')?.addEventListener('input', e => {
    currentFilters.search = e.target.value; applyFilters();
  });
  document.getElementById('filter-role')?.addEventListener('change', e => {
    currentFilters.role = e.target.value; applyFilters();
  });
  document.getElementById('filter-level')?.addEventListener('change', e => {
    currentFilters.level = e.target.value; applyFilters();
  });
  document.getElementById('filter-interest')?.addEventListener('change', e => {
    currentFilters.interest = e.target.value; applyFilters();
  });

  // Role pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilters.role = pill.dataset.role || '';
      applyFilters();
    });
  });

  loadUsers();
}

// ============================================================
// REGISTRATION PAGE  (register.html)
// ============================================================
if (document.getElementById('reg-form')) {
  const form = document.getElementById('reg-form');
  const updateSection = document.getElementById('update-section');
  const updateIdInput = document.getElementById('update-id');
  let editingId = null;

  // Check for ?edit=uuid in URL
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  if (editId) {
    editingId = editId;
    loadUserForEdit(editId);
  }

  async function loadUserForEdit(id) {
    spinner.show();
    const { data, error } = await sb.from('users').select('*').eq('id', id).single();
    spinner.hide();
    if (error || !data) { toast('Profile not found', 'error'); return; }

    document.getElementById('name').value         = data.name || '';
    document.getElementById('role').value         = data.role || '';
    document.getElementById('interest').value     = data.interest || '';
    document.getElementById('level').value        = data.level || '';
    document.getElementById('bio').value          = data.bio || '';
    document.getElementById('contact_link').value = data.contact_link || '';
    document.getElementById('profile_photo').value= data.profile_photo || '';
    document.getElementById('instagram_link').value= data.instagram_link || '';
    document.getElementById('youtube_link').value = data.youtube_link || '';
    document.getElementById('facebook_link').value= data.facebook_link || '';

    document.getElementById('submit-btn').textContent = '↻ Update Profile';
    if (updateSection) updateSection.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    const payload = {
      name:           form.name.value.trim(),
      role:           form.role.value,
      interest:       form.interest.value.trim(),
      level:          form.level.value,
      bio:            form.bio.value.trim(),
      contact_link:   form.contact_link.value.trim(),
      profile_photo:  form.profile_photo.value.trim() || null,
      instagram_link: form.instagram_link.value.trim() || null,
      youtube_link:   form.youtube_link.value.trim()   || null,
      facebook_link:  form.facebook_link.value.trim()  || null,
      status: 'pending'
    };

    let error;
    if (editingId) {
      ({ error } = await sb.from('users').update(payload).eq('id', editingId));
    } else {
      ({ error } = await sb.from('users').insert([payload]));
    }

    btn.disabled = false;
    btn.textContent = editingId ? '↻ Update Profile' : '🚀 Submit Profile';

    if (error) { toast('Error saving profile: ' + error.message, 'error'); return; }

    form.reset();
    document.getElementById('pending-msg').classList.add('show');
    toast('Profile submitted successfully!', 'success');
    window.scrollTo({ top: document.getElementById('pending-msg').offsetTop - 80, behavior: 'smooth' });
  });
}

// ============================================================
// ADMIN PANEL  (admin.html)
// ============================================================
if (document.getElementById('admin-panel')) {
  let allAdminUsers = [];
  let editingUser = null;

  // ── Login ──
  const loginWrap = document.getElementById('login-wrap');
  const panel     = document.getElementById('admin-panel');

  const savedAuth = sessionStorage.getItem('lc_admin');
  if (savedAuth === 'true') { loginWrap.style.display = 'none'; panel.style.display = 'block'; initAdmin(); }

  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const pw = document.getElementById('admin-pw').value;
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('lc_admin', 'true');
      loginWrap.style.display = 'none';
      panel.style.display = 'block';
      initAdmin();
    } else {
      toast('Incorrect password', 'error');
      document.getElementById('admin-pw').value = '';
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('lc_admin');
    loginWrap.style.display = 'flex';
    panel.style.display = 'none';
  });

  async function initAdmin() {
    await fetchAllUsers();
  }

  async function fetchAllUsers() {
    spinner.show();
    const { data, error } = await sb
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    spinner.hide();
    if (error) { toast('Failed to load users', 'error'); return; }
    allAdminUsers = data || [];
    renderAdminPanel();
  }

  function renderAdminPanel() {
    const pending  = allAdminUsers.filter(u => u.status === 'pending');
    const approved = allAdminUsers.filter(u => u.status === 'approved');
    const rejected = allAdminUsers.filter(u => u.status === 'rejected');

    // Stats chips
    document.getElementById('stat-pending').textContent  = `⏳ Pending ${pending.length}`;
    document.getElementById('stat-approved').textContent = `✓ Approved ${approved.length}`;
    document.getElementById('stat-rejected').textContent = `✕ Rejected ${rejected.length}`;

    // Section counts
    document.getElementById('cnt-pending').textContent  = pending.length;
    document.getElementById('cnt-approved').textContent = approved.length;
    document.getElementById('cnt-rejected').textContent = rejected.length;

    renderSection('list-pending',  pending);
    renderSection('list-approved', approved);
    renderSection('list-rejected', rejected);
  }

  function renderSection(containerId, users) {
    const container = document.getElementById(containerId);
    if (!users.length) {
      container.innerHTML = `<p style="color:var(--muted);font-size:.85rem;padding:.5rem 0">No profiles here.</p>`;
      return;
    }
    container.innerHTML = users.map(adminCardHTML).join('');
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.action, btn.dataset.id));
    });
    container.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
    });
  }

  function adminCardHTML(u) {
    const avatar = avatarUrl(u.profile_photo, u.name);
    const links = [
      u.contact_link    && `<a href="${safeLink(u.contact_link)}"    target="_blank" class="admin-link-badge wa">📱 Contact</a>`,
      u.instagram_link  && `<a href="${safeLink(u.instagram_link)}"  target="_blank" class="admin-link-badge ig">📷 Instagram</a>`,
      u.youtube_link    && `<a href="${safeLink(u.youtube_link)}"    target="_blank" class="admin-link-badge yt">▶ YouTube</a>`,
      u.facebook_link   && `<a href="${safeLink(u.facebook_link)}"   target="_blank" class="admin-link-badge fb">🌐 Facebook</a>`,
    ].filter(Boolean).join('');

    const actionBtns = [];
    if (u.status !== 'approved') actionBtns.push(`<button class="action-btn approve" data-action="approve" data-id="${u.id}">✓ Approve</button>`);
    if (u.status !== 'rejected') actionBtns.push(`<button class="action-btn reject"  data-action="reject"  data-id="${u.id}">⏸ Reject</button>`);
    actionBtns.push(`<button class="action-btn edit"   data-edit="${u.id}">✏ Edit</button>`);
    actionBtns.push(`<button class="action-btn delete" data-action="delete" data-id="${u.id}">🗑 Delete</button>`);

    return `
    <div class="admin-card" id="acard-${u.id}">
      <div class="admin-card-inner">
        <img class="admin-avatar" src="${avatar}" alt="${u.name}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}'">
        <div class="admin-info">
          <div class="admin-name">${u.name}</div>
          <div class="admin-meta">
            <span>${u.role}</span> · <span>${u.interest}</span> · <span>${u.level}</span>
            · <span style="color:var(--muted)">Joined ${new Date(u.created_at).toLocaleDateString()}</span>
          </div>
          <div class="admin-bio">${u.bio || '—'}</div>
          ${links ? `<div class="admin-links">${links}</div>` : ''}
        </div>
      </div>
      <div class="admin-actions">${actionBtns.join('')}</div>
    </div>`;
  }

  async function handleAction(action, id) {
    if (action === 'delete') {
      if (!confirm('Permanently delete this profile? This cannot be undone.')) return;
      spinner.show();
      const { error } = await sb.from('users').delete().eq('id', id);
      spinner.hide();
      if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
      allAdminUsers = allAdminUsers.filter(u => u.id !== id);
      renderAdminPanel();
      toast('Profile deleted', 'success');
      return;
    }

    const statusMap = { approve: 'approved', reject: 'rejected' };
    const newStatus = statusMap[action];
    spinner.show();
    const { error } = await sb.from('users').update({ status: newStatus }).eq('id', id);
    spinner.hide();
    if (error) { toast('Update failed: ' + error.message, 'error'); return; }
    const user = allAdminUsers.find(u => u.id === id);
    if (user) user.status = newStatus;
    renderAdminPanel();
    toast(`Profile ${newStatus}!`, 'success');
  }

  // ── Edit Modal ──
  function openEditModal(id) {
    editingUser = allAdminUsers.find(u => u.id === id);
    if (!editingUser) return;
    const m = document.getElementById('edit-modal');
    document.getElementById('edit-id').value             = editingUser.id;
    document.getElementById('edit-name').value           = editingUser.name || '';
    document.getElementById('edit-role').value           = editingUser.role || '';
    document.getElementById('edit-interest').value       = editingUser.interest || '';
    document.getElementById('edit-level').value          = editingUser.level || '';
    document.getElementById('edit-bio').value            = editingUser.bio || '';
    document.getElementById('edit-contact').value        = editingUser.contact_link || '';
    document.getElementById('edit-photo').value          = editingUser.profile_photo || '';
    document.getElementById('edit-instagram').value      = editingUser.instagram_link || '';
    document.getElementById('edit-youtube').value        = editingUser.youtube_link || '';
    document.getElementById('edit-facebook').value       = editingUser.facebook_link || '';
    m.classList.add('show');
  }

  document.getElementById('close-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-edit')?.addEventListener('click', closeModal);
  document.getElementById('edit-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  function closeModal() { document.getElementById('edit-modal').classList.remove('show'); editingUser = null; }

  document.getElementById('save-edit')?.addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const payload = {
      name:           document.getElementById('edit-name').value.trim(),
      role:           document.getElementById('edit-role').value,
      interest:       document.getElementById('edit-interest').value.trim(),
      level:          document.getElementById('edit-level').value,
      bio:            document.getElementById('edit-bio').value.trim(),
      contact_link:   document.getElementById('edit-contact').value.trim() || null,
      profile_photo:  document.getElementById('edit-photo').value.trim()   || null,
      instagram_link: document.getElementById('edit-instagram').value.trim() || null,
      youtube_link:   document.getElementById('edit-youtube').value.trim()   || null,
      facebook_link:  document.getElementById('edit-facebook').value.trim()  || null,
    };

    spinner.show();
    const { error } = await sb.from('users').update(payload).eq('id', id);
    spinner.hide();
    if (error) { toast('Save failed: ' + error.message, 'error'); return; }

    const idx = allAdminUsers.findIndex(u => u.id === id);
    if (idx !== -1) allAdminUsers[idx] = { ...allAdminUsers[idx], ...payload };
    closeModal();
    renderAdminPanel();
    toast('Profile updated!', 'success');
  });

  // Refresh button
  document.getElementById('refresh-btn')?.addEventListener('click', fetchAllUsers);
}
