(function () {
  const SUPABASE_URL = 'https://pvudxnmwgdkfccdzaabm.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_H7920EdFQ6SAz5rou2x3ng__C9uAwRF';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const KEYS = {
    adminSession: 'admin_session',
    adminPass: 'admin_pass',
    settings: 'site_settings'
  };
  const DEFAULT_ADMIN_PASS = '@zxcvbnm@';
  const DEFAULT_SUPPORT = 'https://rubika.ir/joing/JGBJBEHB0WQYOGFAXLBALAVGJEDOYVLA';

  const adminPanel = document.getElementById('adminPanel');
  const loginOverlay = document.getElementById('loginOverlay');
  const adminPassInput = document.getElementById('adminPass');
  const adminLoginBtn = document.getElementById('adminLogin');
  const adminLogoutBtn = document.getElementById('adminLogout');

  const announcement = document.getElementById('announcement');
  const supportLink = document.getElementById('supportLink');
  const maintenanceMode = document.getElementById('maintenanceMode');
  const saveSettings = document.getElementById('saveSettings');

  const previewAnnouncement = document.getElementById('previewAnnouncement');
  const previewSupportLink = document.getElementById('previewSupportLink');
  const maintenanceBadge = document.getElementById('maintenanceBadge');

  const usersList = document.getElementById('usersList');
  const userSearch = document.getElementById('userSearch');
  const deleteAllUsers = document.getElementById('deleteAllUsers');
  const clearProfilesOnly = document.getElementById('clearProfilesOnly');

  const exportData = document.getElementById('exportData');
  const importFile = document.getElementById('importFile');
  const resetAllData = document.getElementById('resetAllData');

  const newAdminPass = document.getElementById('newAdminPass');
  const changeAdminPass = document.getElementById('changeAdminPass');

  const totalUsers = document.getElementById('totalUsers');
  const todayUsers = document.getElementById('todayUsers');
  const lastLogin = document.getElementById('lastLogin');

  let usersCache = [];

  function getSettings() {
    const fallback = { announcement: '', supportLink: DEFAULT_SUPPORT, maintenanceMode: false };
    try {
      const data = JSON.parse(localStorage.getItem(KEYS.settings) || '{}');
      return {
        announcement: typeof data.announcement === 'string' ? data.announcement : fallback.announcement,
        supportLink: typeof data.supportLink === 'string' && data.supportLink.trim() ? data.supportLink : fallback.supportLink,
        maintenanceMode: Boolean(data.maintenanceMode)
      };
    } catch (_e) {
      return fallback;
    }
  }

  function setSettings(data) {
    localStorage.setItem(KEYS.settings, JSON.stringify(data));
  }

  function ensureAdminPass() {
    const current = localStorage.getItem(KEYS.adminPass);
    if (!current || current === 'master1234') {
      localStorage.setItem(KEYS.adminPass, DEFAULT_ADMIN_PASS);
    }
  }

  function renderStats() {
    totalUsers.textContent = String(usersCache.length);
    const today = new Date().toISOString().slice(0, 10);
    todayUsers.textContent = String(usersCache.filter(function (u) {
      return String(u.lastLogin || '').startsWith(today);
    }).length);

    const sorted = usersCache.map(function (u) { return u.lastLogin; }).filter(Boolean).sort();
    lastLogin.textContent = sorted.length ? sorted[sorted.length - 1].replace('T', ' ').slice(0, 16) : '-';
  }

  function renderPreview() {
    const s = getSettings();
    previewAnnouncement.textContent = s.announcement || 'اعلان ثبت نشده است.';
    previewSupportLink.href = s.supportLink || DEFAULT_SUPPORT;
    maintenanceBadge.textContent = s.maintenanceMode ? 'وضعیت: تعمیرات' : 'وضعیت: فعال';
    maintenanceBadge.className = s.maintenanceMode ? 'badge on' : 'badge off';
  }

  function renderUsers() {
    const term = userSearch.value.trim().toLowerCase();
    const filtered = usersCache.filter(function (u) {
      return [u.username, u.phone, u.email].join(' ').toLowerCase().includes(term);
    });

    if (!filtered.length) {
      usersList.innerHTML = '<p class="muted">کاربری یافت نشد.</p>';
      renderStats();
      return;
    }

    usersList.innerHTML = filtered.map(function (u) {
      return [
        '<div class="user-item" data-id="' + u.id + '">',
        '<div>',
        '<p><strong>نام:</strong> ' + (u.username || '-') + '</p>',
        '<p><strong>شماره:</strong> ' + (u.phone || '-') + '</p>',
        '<p><strong>ایمیل:</strong> ' + (u.email || '-') + '</p>',
        '<p><strong>آخرین ورود:</strong> ' + (u.lastLogin ? String(u.lastLogin).replace('T', ' ').slice(0, 16) : '-') + '</p>',
        '</div>',
        '<button class="btn danger delete-user" data-id="' + u.id + '">حذف</button>',
        '</div>'
      ].join('');
    }).join('');

    renderStats();
  }

  async function loadUsers() {
    const { data, error } = await sb.from('users').select('id, username, phone, email, last_login').order('last_login', { ascending: false });
    if (error) {
      usersList.innerHTML = '<p class="muted">خطا در خواندن کاربران از دیتابیس.</p>';
      return;
    }

    usersCache = (data || []).map(function (u) {
      return {
        id: u.id,
        username: u.username,
        phone: u.phone,
        email: u.email,
        lastLogin: u.last_login
      };
    });
    renderUsers();
  }

  async function openPanel() {
    loginOverlay.classList.add('hidden');
    adminPanel.classList.remove('hidden');

    const s = getSettings();
    announcement.value = s.announcement;
    supportLink.value = s.supportLink;
    maintenanceMode.checked = s.maintenanceMode;

    renderPreview();
    await loadUsers();
  }

  function loginAdmin() {
    const pass = localStorage.getItem(KEYS.adminPass) || DEFAULT_ADMIN_PASS;
    if (adminPassInput.value !== pass) {
      alert('رمز مدیریت اشتباه است');
      return;
    }
    localStorage.setItem(KEYS.adminSession, 'true');
    openPanel();
  }

  saveSettings.addEventListener('click', function () {
    setSettings({
      announcement: announcement.value.trim(),
      supportLink: supportLink.value.trim() || DEFAULT_SUPPORT,
      maintenanceMode: maintenanceMode.checked
    });
    renderPreview();
    alert('تنظیمات ذخیره شد');
  });

  usersList.addEventListener('click', async function (e) {
    const btn = e.target.closest('.delete-user');
    if (!btn) return;
    if (!confirm('این کاربر حذف شود؟')) return;

    const id = btn.getAttribute('data-id');
    const { error } = await sb.from('users').delete().eq('id', id);
    if (error) {
      alert('حذف کاربر انجام نشد');
      return;
    }

    usersCache = usersCache.filter(function (u) { return String(u.id) !== String(id); });
    renderUsers();
  });

  deleteAllUsers.addEventListener('click', async function () {
    if (!confirm('همه کاربران حذف شوند؟')) return;
    const { error } = await sb.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      alert('حذف همه کاربران انجام نشد');
      return;
    }
    usersCache = [];
    renderUsers();
  });

  clearProfilesOnly.addEventListener('click', function () {
    ['profile_name', 'profile_phone', 'profile_email', 'profile_avatar'].forEach(function (k) {
      localStorage.removeItem(k);
    });
    alert('پروفایل جاری پاک شد');
  });

  exportData.addEventListener('click', function () {
    const data = { users: usersCache, settings: getSettings(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mastercraft-admin-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  importFile.addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        if (Array.isArray(data.users)) {
          for (const u of data.users) {
            await sb.from('users').upsert({
              id: u.id,
              username: u.username || null,
              phone: u.phone || null,
              email: u.email || null,
              last_login: u.lastLogin || new Date().toISOString()
            });
          }
        }
        if (data.settings && typeof data.settings === 'object') setSettings(data.settings);

        const s = getSettings();
        announcement.value = s.announcement;
        supportLink.value = s.supportLink;
        maintenanceMode.checked = s.maintenanceMode;
        renderPreview();
        await loadUsers();
        alert('بازیابی انجام شد');
      } catch (_e) {
        alert('فایل JSON معتبر نیست');
      }
    };
    reader.readAsText(file, 'utf-8');
  });

  resetAllData.addEventListener('click', async function () {
    if (!confirm('همه اطلاعات پنل مدیریت حذف شود؟')) return;
    await sb.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    localStorage.removeItem(KEYS.settings);
    ['profile_name', 'profile_phone', 'profile_email', 'profile_avatar'].forEach(function (k) {
      localStorage.removeItem(k);
    });
    usersCache = [];
    renderUsers();
    renderPreview();
    alert('اطلاعات مدیریت ریست شد');
  });

  changeAdminPass.addEventListener('click', function () {
    const next = newAdminPass.value.trim();
    if (next.length < 6) {
      alert('رمز جدید باید حداقل 6 کاراکتر باشد');
      return;
    }
    localStorage.setItem(KEYS.adminPass, next);
    newAdminPass.value = '';
    alert('رمز مدیریت تغییر کرد');
  });

  adminLogoutBtn.addEventListener('click', function () {
    localStorage.removeItem(KEYS.adminSession);
    adminPanel.classList.add('hidden');
    loginOverlay.classList.remove('hidden');
    adminPassInput.value = '';
  });

  userSearch.addEventListener('input', renderUsers);
  adminLoginBtn.addEventListener('click', loginAdmin);
  adminPassInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') loginAdmin(); });

  ensureAdminPass();
  if (localStorage.getItem(KEYS.adminSession) === 'true') {
    openPanel();
  }
})();
