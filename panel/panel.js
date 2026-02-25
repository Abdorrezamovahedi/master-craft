(function () {
  const DEFAULT_AVATAR = '../yadack/head.png';
  const keys = {
    name: 'profile_name',
    phone: 'profile_phone',
    email: 'profile_email',
    avatar: 'profile_avatar'
  };

  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const form = document.getElementById('profileForm');
  const logoutBtn = document.getElementById('logoutBtn');

  if (localStorage.getItem('isLoggedIn') !== 'true') {
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.replace('../master-craft-mbile/login-mobile/login-mobile.html');
    } else {
      window.location.replace('../login/login-master.html');
    }
    return;
  }

  function loadProfile() {
    document.getElementById('name').value = localStorage.getItem(keys.name) || '';
    document.getElementById('phone').value = localStorage.getItem(keys.phone) || '';
    document.getElementById('email').value = localStorage.getItem(keys.email) || '';

    const avatar = localStorage.getItem(keys.avatar);
    avatarPreview.src = avatar || DEFAULT_AVATAR;
  }

  avatarInput.addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      const dataUrl = reader.result;
      avatarPreview.src = dataUrl;
      localStorage.setItem(keys.avatar, dataUrl);
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    localStorage.setItem(keys.name, document.getElementById('name').value.trim());
    localStorage.setItem(keys.phone, document.getElementById('phone').value.trim());
    localStorage.setItem(keys.email, document.getElementById('email').value.trim());
    alert('پروفایل ذخیره شد');
  });

  logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('isLoggedIn');

    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.replace('../master-craft-mbile/login-mobile/login-mobile.html');
    } else {
      window.location.replace('../login/login-master.html');
    }
  });

  loadProfile();
})();
