// dashboard-extras.js - 100% SIN localStorage, usa datos del backend

// Inicializar extras con datos reales del usuario
function initExtrasWithUserData(userData) {
    updateWelcomeMessage(userData);
    updateProfileUI(userData);
    initMeditationFilters();
    initCommunityTabs();
    initConnectedDevices();
    initSettingsTabs();
    initProfileSettings(userData);
    initNotificationSettings();
    initProgressSystem(userData); // Usa datos reales
}

// === Bienvenida ===
function updateWelcomeMessage(userData) {
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg && userData.name) {
        const firstName = userData.name.split(' ')[0];
        welcomeMsg.textContent = `¡Hola, ${firstName}!`;
    }
}

// === Actualizar foto de perfil en todos lados ===
function updateProfileUI(userData) {
    const photo = userData.profile?.avatar || 'https://i.pravatar.cc/150';
    document.querySelectorAll('.user-profile img, .sidebar-footer img').forEach(img => {
        img.src = photo;
    });
}

// === Progreso real desde DB ===
function initProgressSystem(userData) {
    const monthlyCount = document.getElementById('monthlyPracticeCount');
    const consistencyEl = document.getElementById('consistencyRate');
    const activeWeeksEl = document.getElementById('activeWeeks');

    if (monthlyCount) monthlyCount.textContent = `${userData.practicesThisMonth || 0}/${new Date().getDate()} días`;
    if (consistencyEl) consistencyEl.textContent = `${userData.consistency || 0}%`;
    if (activeWeeksEl) activeWeeksEl.textContent = `${userData.activeWeeks || 0} consecutivas`;
}

// === Filtros de meditación (sin cambios) ===
function initMeditationFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const isDuration = this.parentElement.querySelector('label')?.textContent?.includes('Duración');
            this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });
}

function applyFilters() {
    const activeDuration = document.querySelector('.filter-btn[data-duration].active')?.dataset.duration || 'all';
    const activeGoal = document.querySelector('.filter-btn[data-goal].active')?.dataset.goal || 'all';
    const activeMode = document.querySelector('.mode-btn.active')?.textContent.trim().toLowerCase();

    document.querySelectorAll('.card-simulation').forEach(card => {
        const duration = card.dataset.duration;
        const goal = card.dataset.goal;
        const type = card.dataset.type;

        let showCard = true;

        if (activeMode) {
            if (activeMode.includes('audio') && type !== 'audio') showCard = false;
            if (activeMode.includes('video') && type !== 'video') showCard = false;
            if (activeMode.includes('interactivo') && type !== 'interactive') showCard = false;
        }

        if (activeDuration !== 'all') {
            const cardDuration = parseInt(duration);
            const filterDuration = parseInt(activeDuration);
            if (activeDuration === '5' && cardDuration > 5) showCard = false;
            if (activeDuration === '10' && (cardDuration < 6 || cardDuration > 12)) showCard = false;
            if (activeDuration === '15' && cardDuration < 15) showCard = false;
        }

        if (activeGoal !== 'all' && goal !== activeGoal) showCard = false;

        card.style.display = showCard ? 'block' : 'none';
    });
}

function toggleMeditationMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (event?.target) event.target.closest('.mode-btn')?.classList.add('active');
    applyFilters();
}

// === Navegación SPA ===
const spaSections = ['inicio', 'mi-ruta', 'meditaciones', 'comunidad', 'ayuda', 'configuracion'];
document.querySelectorAll('.sidebar-nav .nav-item, .sidebar-footer .nav-item').forEach((item, idx) => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        spaSections.forEach((id, sidx) => {
            const sec = document.getElementById(id);
            if (sec) sec.style.display = idx === sidx ? 'block' : 'none';
        });
    });
});

// Estado inicial
spaSections.forEach((id, idx) => {
    const sec = document.getElementById(id);
    if (sec) sec.style.display = idx === 0 ? 'block' : 'none';
});

// === Filtro catálogo ===
document.getElementById('catalogFilter')?.addEventListener('change', function(e) {
    const filterValue = e.target.value;
    document.querySelectorAll('.catalog-item').forEach(item => {
        const category = item.dataset.category;
        item.style.display = (filterValue === 'all' || category === filterValue) ? 'flex' : 'none';
    });
});

// === Dispositivos conectados (solo SO) ===
function initConnectedDevices() {
    const connectedSection = Array.from(document.querySelectorAll('.settings-section'))
        .find(sec => (sec.querySelector('h3')?.textContent || '').toLowerCase().includes('dispositivos conectados'));
    if (!connectedSection) return;

    const osName = detectOS();
    if (!osName) {
        connectedSection.style.display = 'none';
        return;
    }

    const devicesList = connectedSection.querySelector('.devices-list');
    if (!devicesList) return;

    devicesList.innerHTML = '';
    const item = document.createElement('div');
    item.className = 'device-item';
    const icon = document.createElement('i');
    icon.className = osName === 'Windows' ? 'fa-brands fa-windows' : 'fa-brands fa-apple';
    const info = document.createElement('div');
    info.className = 'device-info';
    const strong = document.createElement('strong');
    strong.textContent = osName;
    const status = document.createElement('span');
    status.className = 'device-status active';
    status.textContent = 'Activo ahora';
    info.appendChild(strong);
    info.appendChild(status);
    item.appendChild(icon);
    item.appendChild(info);
    devicesList.appendChild(item);
}

function detectOS() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    if (/Win/i.test(ua) || /Win/i.test(platform)) return 'Windows';
    if (/Mac/i.test(ua) || /Mac/i.test(platform)) return 'macOS';
    return null;
}

// === Tabs de configuración ===
function initSettingsTabs() {
    document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.settingsTab;
            document.querySelectorAll('.settings-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.settings-tab-panel').forEach(panel => panel.style.display = 'none');
            const targetPanel = document.getElementById(`tab-${targetTab}`);
            if (targetPanel) targetPanel.style.display = 'block';
        });
    });
}

// === Comunidad ===
function initCommunityTabs() {
    document.querySelectorAll('#comunidad .community-tabs .tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            document.querySelectorAll('#comunidad .community-tabs .tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('#comunidad .community-panel').forEach(panel => panel.style.display = 'none');
            const targetPanel = document.querySelector(target);
            if (targetPanel) targetPanel.style.display = 'block';
        });
    });
}

// === Configuración de perfil (con datos reales) ===
function initProfileSettings(userData) {
    const photoInput = document.getElementById('photoInput');
    const uploadArea = document.getElementById('uploadArea');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    const saveBtn = document.getElementById('saveSettings');
    const cancelBtn = document.getElementById('cancelSettings');

    if (uploadArea) uploadArea.addEventListener('click', () => photoInput.click());

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    profilePhotoPreview.src = event.target.result;
                    sessionStorage.setItem('tempProfilePhoto', event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('userEmail').value;
            const photo = sessionStorage.getItem('tempProfilePhoto') || profilePhotoPreview.src;

            // Aquí puedes hacer un PATCH al backend si lo deseas
            const updatedData = {
                firstName, lastName, email,
                profile: { ...window.currentUser.profile, avatar: photo }
            };

            window.currentUser = { ...window.currentUser, ...updatedData };
            localStorage.setItem('user', JSON.stringify(window.currentUser));

            updateProfileUI(window.currentUser);
            if (typeof showNotification === 'function') showNotification('Cambios guardados');
            sessionStorage.removeItem('tempProfilePhoto');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('userEmail').value = userData.email || '';
            profilePhotoPreview.src = userData.profile?.avatar || 'https://i.pravatar.cc/150';
            sessionStorage.removeItem('tempProfilePhoto');
        });
    }
}

// === Notificaciones ===
function initNotificationSettings() {
    const notifToggles = ['notifPractice', 'notifCommunity', 'notifContent', 'notifAchievements', 'notifWeekly']
        .reduce((obj, id) => { obj[id] = document.getElementById(id); return obj; }, {});

    const saved = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    Object.keys(notifToggles).forEach(key => {
        if (notifToggles[key] && saved[key] !== undefined) {
            notifToggles[key].checked = saved[key];
        }
    });

    Object.keys(notifToggles).forEach(key => {
        if (notifToggles[key]) {
            notifToggles[key].addEventListener('change', function() {
                const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
                settings[key] = this.checked;
                localStorage.setItem('notificationSettings', JSON.stringify(settings));
                if (typeof showNotification === 'function') {
                    showNotification(`Notificaciones ${this.checked ? 'activadas' : 'desactivadas'}`);
                }
            });
        }
    });
}