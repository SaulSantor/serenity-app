// Compartir post: copia el enlace al portapapeles
function sharePost(postId) {
    const url = `${window.location.origin}/dashboard.html#post-${postId}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
            .then(() => showNotification('¡Enlace copiado!', 'success'))
            .catch(() => showNotification('No se pudo copiar el enlace', 'error'));
    } else {
        // Fallback para navegadores antiguos
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            showNotification('¡Enlace copiado!', 'success');
        } catch (e) {
            showNotification('No se pudo copiar el enlace', 'error');
        }
        document.body.removeChild(tempInput);
    }
}
// Editar y eliminar posts
async function editPost(postId) {
    const post = communityPosts.find(p => p._id === postId);
    if (!post) return;
    const newContent = prompt('Editar post:', post.content);
    if (!newContent || newContent.trim().length < 2) {
        showNotification('El post debe tener al menos 2 caracteres', 'error');
        return;
    }
    try {
        const res = await window.dashboardAPI.editPost(postId, newContent.trim(), post.image);
        if (res.success) {
            post.content = newContent.trim();
            renderPosts(communityPosts);
            showNotification('Post editado', 'success');
        } else {
            showNotification(res.error || 'No se pudo editar el post', 'error');
        }
    } catch (err) {
        showNotification('Error al editar post', 'error');
    }
}

// Muestra una notificación simple al usuario
function showNotification(message, type = 'info') {
    // Puedes mejorar esto con un toast o mensaje en pantalla
    alert(message);
}

// Muestra un banner amigable cuando la sesión expiró o el usuario debe iniciar sesión
function showSessionBanner(message, showLogin = false) {
    try {
        const comunidad = document.getElementById('comunidad') || document.body;
        let banner = document.getElementById('session-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'session-banner';
            banner.style.position = 'relative';
            banner.style.maxWidth = '900px';
            banner.style.margin = '16px auto';
            banner.style.padding = '14px 18px';
            banner.style.borderRadius = '12px';
            banner.style.display = 'flex';
            banner.style.alignItems = 'center';
            banner.style.justifyContent = 'space-between';
            banner.style.gap = '12px';
            banner.style.background = 'linear-gradient(90deg, rgba(255,235,205,0.95), rgba(255,245,238,0.95))';
            banner.style.border = '1px solid rgba(0,0,0,0.06)';
            const container = document.getElementById('posts-feed') || comunidad;
            container.prepend(banner);
        }
        banner.innerHTML = `
            <div style="color: var(--text-primary); font-weight:600;">${escapeHtml(message)}</div>
            ${showLogin ? `<a href="login.html" class="btn" style="background:var(--accent-color); color:#fff; padding:8px 12px; border-radius:8px; text-decoration:none; font-weight:600;">Iniciar sesión</a>` : ''}
        `;
    } catch (e) {
        console.warn('showSessionBanner error', e);
    }
}

async function deletePost(postId) {
    if (!confirm('¿Eliminar este post?')) return;
    try {
        const res = await window.dashboardAPI.deletePost(postId);
        if (res.success) {
            communityPosts = communityPosts.filter(p => p._id !== postId);
            renderPosts(communityPosts);
            showNotification('Post eliminado', 'success');
        } else {
            showNotification(res.error || 'No se pudo eliminar el post', 'error');
        }
    } catch (err) {
        showNotification('Error al eliminar post', 'error');
    }
}

// Editar y eliminar comentarios
async function editComment(commentId, postId) {
    const post = communityPosts.find(p => p._id === postId);
    if (!post) return;
    const commentsList = document.getElementById(`comments-list-${postId}`);
    const commentDiv = commentsList.querySelector(`[data-comment-id='${commentId}'] .comment-text`);
    if (!commentDiv) return;
    const oldContent = commentDiv.textContent;
    const newContent = prompt('Editar comentario:', oldContent);
    if (!newContent || newContent.trim().length < 2) {
        showNotification('El comentario debe tener al menos 2 caracteres', 'error');
        return;
    }
    try {
        const res = await window.dashboardAPI.editComment(commentId, newContent.trim());
        if (res.success) {
            commentDiv.textContent = newContent.trim();
            showNotification('Comentario editado', 'success');
        } else {
            showNotification(res.error || 'No se pudo editar el comentario', 'error');
        }
    } catch (err) {
        showNotification('Error al editar comentario', 'error');
    }
}

async function deleteComment(commentId, postId) {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
        const res = await window.dashboardAPI.deleteComment(commentId);
        if (res.success) {
            // Recargar comentarios del post
            const newData = await window.dashboardAPI.getPostComments(postId);
            if (newData.success && newData.comments) {
                const commentsList = document.getElementById(`comments-list-${postId}`);
                const comments = newData.comments.map(c => ({ ...c, created_at: c.created_at || new Date().toISOString() }));
                commentsList.innerHTML = comments.map(comment => {
                    const isOwnComment = comment && comment.author && comment.author.id === getCurrentUserId();
                    // Determinar avatar del autor del comentario (coincide con backend)
                    let avatarUrl = (comment.author && (comment.author.photo || (comment.author.profile && comment.author.profile.avatar))) || 'https://i.pravatar.cc/150';
                    if (avatarUrl === 'https://i.pravatar.cc/150') avatarUrl = '/static/img/default-avatar.png';
                    const authorName = (comment.author && comment.author.name) || 'Usuario';
                    return `
                        <div class="comment" data-comment-id="${comment._id}">
                            <div class="comment-avatar">
                                <img src="${avatarUrl}" alt="${authorName}" class="avatar-tiny">
                            </div>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-author">${authorName}</span>
                                    <span class="time-ago comment-time" data-time="${comment.created_at}">${getTimeAgo(comment.created_at)}</span>
                                    ${isOwnComment ? `
                                        <button class="btn-icon" onclick="editComment('${comment._id}', '${postId}')" title="Editar comentario"><i class="ri-edit-line"></i></button>
                                        <button class="btn-icon" onclick="deleteComment('${comment._id}', '${postId}')" title="Eliminar comentario"><i class="ri-delete-bin-line"></i></button>
                                    ` : ''}
                                </div>
                                <p class="comment-text">${escapeHtml(comment.content)}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                // Actualizar contador en la tarjeta y en el array local
                const card = document.querySelector(`[data-post-id="${postId}"]`);
                if (card) {
                    const commentsBtnSpan = card.querySelector('button[data-action="comments"] span');
                    if (commentsBtnSpan) commentsBtnSpan.textContent = comments.length;
                }
                const idx = communityPosts.findIndex(p => String(p._id) === String(postId));
                if (idx !== -1) communityPosts[idx].comments_count = comments.length;
            }
            showNotification('Comentario eliminado', 'success');
        } else {
            showNotification(res.error || 'No se pudo eliminar el comentario', 'error');
        }
    } catch (err) {
        showNotification('Error al eliminar comentario', 'error');
    }
}
// dashboard.js - VERSIÓN COMPLETAMENTE DINÁMICA
// ✅ Todo se carga desde la BD, sin datos estáticos
// ✅ Las constantes están definidas en dashboard-api-utils.js

let currentUser = null;
let userProgress = null;
let allTechniques = [];
let userCourses = [];

// ==========================================
// 1. INICIALIZACIÓN Y AUTENTICACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const userId = sessionStorage.getItem('user_id');
    const token = localStorage.getItem('token');

    if (!userId && !token) {
        if (!(window.location.hash && window.location.hash.startsWith('#post-'))) {
            redirectToLogin();
            return;
        }
    }
    
    // Guardar user_id en sessionStorage si viene del token
    if (token && !userId) {
        try {
        const userId = sessionStorage.getItem('user_id') || null;
            if (payload.user_id) {
                sessionStorage.setItem('user_id', payload.user_id);
            }
        } catch (e) {
            console.warn('No se pudo extraer user_id del token:', e);
        }
    }

    // Sincronizar prácticas guardadas localmente (offline) con el backend
    if (window.dashboardAPI) {
        try {
            await syncLocalPracticeLog();
        } catch (e) {
            console.warn('No se pudo sincronizar prácticas locales:', e);
        }
    }

    try {
        // Cargar todos los datos en paralelo usando la API
        const [userRes, progressRes, techniquesRes, coursesRes] = await Promise.allSettled([
            window.dashboardAPI.getCurrentUser(),
            window.dashboardAPI.getUserProgress(),
            window.dashboardAPI.getAllTechniques(),
            window.dashboardAPI.getUserCourses()
        ]);

        // Procesar resultados
        if (userRes.status === 'fulfilled' && userRes.value.success) {
            currentUser = userRes.value.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        else {
            // Si tenemos token pero la llamada a getCurrentUser falló,
            // es probable que la sesión haya expirado. Mostrar banner amigable,
            // excepto si estamos viendo un enlace directo a un post (view-only)
            if (token && !(window.location.hash && window.location.hash.startsWith('#post-'))) {
                showSessionBanner('Parece que tu sesión expiró. Inicia sesión para dar like, comentar o ver contenido privado.', true);
            }
        }

        if (progressRes.status === 'fulfilled' && progressRes.value.success) {
            userProgress = progressRes.value.progress;
        } else {
            userProgress = {
                practicesThisMonth: 0,
                consistency: 0,
                activeWeeks: 0,
                level: 1,
                xp: 0,
                streak: 0,
                badges: [],
                recentActivities: []
            };
        }

        if (techniquesRes.status === 'fulfilled' && techniquesRes.value.success) {
            allTechniques = techniquesRes.value.techniques || [];
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
            userCourses = coursesRes.value.courses || [];
        }

        // Inicializar UI
        renderDashboard();
        initEventListeners(token);
        handleNavigation();

        // Si la URL tiene hash #post-<id>, mostrar la sección de comunidad y ese post
        if (window.location.hash && window.location.hash.startsWith('#post-')) {
            const postId = window.location.hash.replace('#post-', '');
            // Mostrar solo la sección de comunidad
            showSharedPost(postId);
        }

    } catch (err) {
        console.error('❌ Error de inicialización:', err);
        redirectToLogin();
    }
});

// ==========================================
// 2. RENDERIZAR DASHBOARD COMPLETO
// ==========================================
function renderDashboard() {
    renderInitSection();
    renderMiRutaSection();
    renderMeditacionesSection();
    renderCommunitySection();
    renderAyudaSection();
    renderConfiguracionSection();
}

// SECCIÓN: INICIO
function renderInitSection() {
    const section = document.getElementById('inicio');
    if (!section) return;

    // Actualizar header
    const welcomeMsg = section.querySelector('.welcome-section h2');
    if (welcomeMsg) {
        const firstName = currentUser.firstName || 'Usuario';
        welcomeMsg.textContent = `¡Bienvenido de vuelta, ${firstName}!`;
    }

    // Actualizar stats
    updateStats();

    // Renderizar cards principales
    renderMainCards();

    // Renderizar actividad reciente
    renderRecentActivity();

    // Renderizar técnicas rápidas
    renderQuickLinks();
}

function updateStats() {
    
    updateElement('monthlyPracticeCount', 
        `${userProgress.practicesThisMonth || 0}`);
    updateElement('consistencyRate', 
        `${userProgress.consistency || 0}%`);
    updateElement('activeWeeks', 
        `${userProgress.activeWeeks || 0} consecutivas`);
    
    // Foto de perfil
    const photoUrl = currentUser.photo || 'https://i.pravatar.cc/150';
    document.querySelectorAll('.user-profile img, #profilePhotoPreview').forEach(img => {
        img.src = photoUrl;
    });
}

function renderMainCards() {
    const cardsGrid = document.querySelector('.cards-grid');
    if (!cardsGrid) return;

    // Card 1: Total de prácticas (activas y completadas)
    const courseCountEl = cardsGrid.querySelector('.course-count');
    if (courseCountEl) {
        courseCountEl.textContent = userCourses.length;
    }

    // Card 2: Últimas insignias desbloqueadas
    const lastBadge = userProgress.badges?.[0];
    if (lastBadge) {
        const badgeCard = cardsGrid.querySelector('.card-secondary p');
        if (badgeCard) {
            badgeCard.textContent = lastBadge.description || 'Nuevo hábito consolidado!';
        }
    }

    // Card 3: Técnica del día
    const dailyTechnique = allTechniques[Math.floor(Math.random() * allTechniques.length)];
    if (dailyTechnique) {
        const lightCard = cardsGrid.querySelector('.card-light p');
        if (lightCard) {
            lightCard.textContent = `${dailyTechnique.name}: ${dailyTechnique.description}`;
        }
    }
}

function renderRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    const activities = userProgress.recentActivities || [];
    
    activityList.innerHTML = activities.slice(0, 4).map(activity => `
        <div class="activity-item">
            <i class="${getActivityIcon(activity.type)}"></i>
            <div>
                <strong>${activity.title}</strong>
                <span>${activity.description}</span>
            </div>
        </div>
    `).join('');
}

function renderQuickLinks() {
    const resourcesList = document.querySelector('.resources-list');
    if (!resourcesList) return;

    if (allTechniques.length === 0) {
        resourcesList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">No hay técnicas disponibles</p>';
        return;
    }

    // Agrupar técnicas por categoría
    const byCategory = {};
    allTechniques.forEach(tech => {
        if (!byCategory[tech.category]) {
            byCategory[tech.category] = [];
        }
        byCategory[tech.category].push(tech);
    });

    // Seleccionar 1 técnica de cada categoría (preferir corta y Principiante)
    const selectedTechniques = [];
    Object.entries(byCategory).forEach(([category, techniques]) => {
        // Priorizar: Principiante + corta duración
        const beginner = techniques.filter(t => t.difficulty === 'Principiante' && t.duration <= 10);
        const short = techniques.filter(t => t.duration <= 10);
        
        let selected;
        if (beginner.length > 0) {
            // Elegir la más corta entre principiante
            selected = beginner.reduce((prev, curr) => 
                (curr.duration < prev.duration) ? curr : prev
            );
        } else if (short.length > 0) {
            // Si no hay principiante, elegir la más corta
            selected = short.reduce((prev, curr) => 
                (curr.duration < prev.duration) ? curr : prev
            );
        } else {
            // Si no hay corta
            selected = techniques.reduce((prev, curr) => 
                (curr.duration < prev.duration) ? curr : prev
            );
        }
        selectedTechniques.push(selected);
    });

    // Renderizar lista de accesos rápidos (máximo 4, o todas si hay menos)
    const toDisplay = selectedTechniques.slice(0, 4);
    
    resourcesList.innerHTML = toDisplay.map(tech => `
        <a href="javascript:startTechnique('${tech.id}')" class="resource-link" style="border-left: 4px solid ${tech.color}; cursor: pointer; transition: all 0.3s;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; flex: 1;">
                    <i class="${tech.icon}" style="font-size: 20px; margin-right: 12px; color: ${tech.color};"></i>
                    <div>
                        <span style="font-weight: 500; display: block;">${tech.name}</span>
                        <small style="color: var(--text-secondary); display: block;">
                            <i class="ri-time-line"></i> ${tech.duration} min • ${tech.difficulty}
                        </small>
                    </div>
                </div>
                <i class="ri-arrow-right-line" style="color: var(--text-secondary); margin-left: 8px;"></i>
            </div>
        </a>
    `).join('');
}

// SECCIÓN: MI RUTA
function renderMiRutaSection() {
    const section = document.getElementById('mi-ruta');
    // FAQ interactions are initialized by initFAQInteractions() when Ayuda se renderiza
    const grid = document.querySelector('.framework-grid');
    if (!grid) return;

    // Mapeo de categorías a frameworks (basado en course.category)
    const frameworks = {
        'Regulación somática': {
            name: 'Regulación somática',
            icon: 'ri-heart-pulse-line',
            color: 'linear-gradient(135deg, #A8C0FF 0%, #3F2B96 100%)'
        },
        'Reestructuración cognitiva': {
            name: 'Reestructuración cognitiva',
            icon: 'ri-brain-line',
            color: 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)'
        },
        'Mindfulness y aceptación': {
            name: 'Mindfulness y aceptación',
            icon: 'ri-leaf-line',
            color: 'linear-gradient(135deg, #FFD89B 0%, #19547B 100%)'
        },
        'Autocompasión': {
            name: 'Autocompasión',
            icon: 'ri-hand-heart-line',
            color: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)'
        }
    };

    // Calcular técnicas completadas y total por framework
    const frameworkStats = {};
    
    console.log('🔍 Técnicas disponibles:', allTechniques);
    console.log('🔍 Cursos del usuario:', userCourses);
    
    Object.keys(frameworks).forEach(fw => {
        // Total de técnicas disponibles en la categoría (desde allTechniques)
        const totalTechniques = allTechniques.filter(t => t.category === fw).length;
        
        // Contar técnicas completadas (100%)
        const completedTechniques = userCourses.filter(c => c.category === fw && c.status === 'completed').length;
        
        // Contar técnicas en progreso
        const inProgressCourses = userCourses.filter(c => c.category === fw && c.status === 'in_progress');
        
        // Contar prácticas completadas en las técnicas en progreso
        let currentPractices = 0;
        let totalPracticesNeeded = 0;
        
        inProgressCourses.forEach(course => {
            if (course.currentLesson && course.totalLessons) {
                currentPractices += course.currentLesson;
                totalPracticesNeeded += course.totalLessons;
            }
        });
        
        // Para técnicas completadas, asumimos que completaron todas las prácticas requeridas
        const completedPractices = completedTechniques * 5; // Asumiendo 5 prácticas por técnica
        
        console.log(`📊 ${fw}: ${completedTechniques} técnicas completadas, ${currentPractices} prácticas de ${totalPracticesNeeded} en progreso`);
        
        frameworkStats[fw] = {
            techniques: completedTechniques,
            total: totalTechniques,
            practices: currentPractices,
            practicesNeeded: totalPracticesNeeded,
            hasProgress: inProgressCourses.length > 0
        };
    });

    // Renderizar con datos dinámicos
    grid.innerHTML = Object.keys(frameworks).map(fwKey => {
        const fw = frameworks[fwKey];
        const stats = frameworkStats[fwKey];
        const progress = stats.total > 0 ? Math.round((stats.techniques / stats.total) * 100) : 0;
        
        // Mostrar progreso de prácticas si hay técnicas en progreso
        let statusText;
        if (stats.hasProgress && stats.practices > 0) {
            statusText = `${stats.techniques} de ${stats.total} técnicas<br><small style="opacity: 0.8;">${stats.practices} de ${stats.practicesNeeded} prácticas en progreso</small>`;
        } else {
            statusText = `${stats.techniques} de ${stats.total} técnicas`;
        }
        
        return `
            <div class="framework-card">
                <div class="framework-icon" style="background: ${fw.color};">
                    <i class="${fw.icon}"></i>
                </div>
                <h4>${fw.name}</h4>
                <p>Técnicas basadas en evidencia científica</p>
                <div class="mini-progress">
                    <div class="mini-bar" style="width: ${progress}%;"></div>
                </div>
                <span class="framework-stat">${statusText}</span>
            </div>
        `;
    }).join('');

    // Renderizar las subsecciones de Mi Ruta
    renderActiveCourses();
    renderActivePathSelector();
    renderRecommendedPaths();
    renderCatalog();
}

function renderActiveCourses() {
    const courseList = document.querySelector('.course-list');
    if (!courseList) {
        console.warn('⚠️ El contenedor .course-list no se encontró en el DOM.');
        return;
    }

    console.log('📋 Cursos cargados:', userCourses);

    if (userCourses.length === 0) {
        console.log('ℹ️ No hay cursos disponibles.');
        courseList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Aún no has iniciado ninguna práctica. ¡Explora nuevas técnicas para comenzar!</p>';
        return;
    }

    // Agrupar cursos por categoría (mostrar todos, no solo in_progress)
    const coursesByCategory = {};
    userCourses.forEach(course => {
        const category = course.category || 'Sin categoría';
        if (!coursesByCategory[category]) {
            coursesByCategory[category] = [];
        }
        coursesByCategory[category].push(course);
    });

    // Orden personalizado de categorías
    const categoryOrder = [
        'Regulación somática',
        'Mindfulness y aceptación',
        'Autocompasión',
        'Reestructuración cognitiva'
    ];

    let html = '';
    categoryOrder.forEach(category => {
        if (coursesByCategory[category]) {
            // Encabezado de categoría
            html += `<div style="margin-top: 24px; margin-bottom: 12px;">
                <h3 style="color: var(--text-primary); font-size: 16px; font-weight: 600; margin: 0;">${category}</h3>
            </div>`;

            // Cursos de la categoría
            html += coursesByCategory[category].map(course => `
                <div class="course-item">
                    <div class="course-thumbnail" style="background: ${course.color};">
                        <i class="${course.icon}"></i>
                        <span class="course-badge">${course.category}</span>
                    </div>
                    <div class="course-info">
                        <div class="course-header-row">
                            <h4>${course.name}</h4>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span class="difficulty-badge ${course.difficulty.toLowerCase()}">${course.difficulty}</span>
                                ${course.status === 'completed' ? '<span style="background: #E6FCF5; color: #51CF66; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;"><i class="ri-checkbox-circle-fill"></i> Completado</span>' : ''}
                            </div>
                        </div>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                            <strong>Objetivo:</strong> ${course.objective}
                        </p>
                        <div class="course-meta-row">
                            <span><i class="ri-time-line"></i> ~${course.duration} min</span>
                            <span><i class="ri-medal-line"></i> +${course.xp} XP${course.status === 'completed' ? ' (obtenido)' : ' al completar'}</span>
                        </div>
                        <div class="progress-bar-slim">
                            <div class="progress-fill" style="width: ${course.progress}%; background: ${course.status === 'completed' ? '#51CF66' : '#667EEA'};"></div>
                        </div>
                        <span class="progress-text">Lección ${course.currentLesson} de ${course.totalLessons} · ${course.progress}% completo</span>
                    </div>
                    <button class="btn-primary" onclick="startCourse('${course.id}')" ${course.status === 'completed' ? 'style="background: #51CF66; border-color: #51CF66;"' : ''}>
                        <i class="${course.status === 'completed' ? 'ri-repeat-line' : 'ri-play-circle-line'}"></i> ${course.status === 'completed' ? 'Practicar de nuevo' : 'Continuar'}
                    </button>
                </div>
            `).join('');
        }
    });

    // Mostrar cualquier otra categoría no mapeada
    Object.keys(coursesByCategory).forEach(category => {
        if (!categoryOrder.includes(category)) {
            html += `<div style="margin-top: 24px; margin-bottom: 12px;">
                <h3 style="color: var(--text-primary); font-size: 16px; font-weight: 600; margin: 0;">${category}</h3>
            </div>`;

            html += coursesByCategory[category].map(course => `
                <div class="course-item">
                    <div class="course-thumbnail" style="background: ${course.color};">
                        <i class="${course.icon}"></i>
                        <span class="course-badge">${course.category}</span>
                    </div>
                    <div class="course-info">
                        <div class="course-header-row">
                            <h4>${course.name}</h4>
                            <span class="difficulty-badge ${course.difficulty.toLowerCase()}">${course.difficulty}</span>
                        </div>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">
                            <strong>Objetivo:</strong> ${course.objective}
                        </p>
                        <div class="course-meta-row">
                            <span><i class="ri-time-line"></i> ~${course.duration} min</span>
                            <span><i class="ri-medal-line"></i> +${course.xp} XP al completar</span>
                        </div>
                        <div class="progress-bar-slim">
                            <div class="progress-fill" style="width: ${course.progress}%;"></div>
                        </div>
                        <span class="progress-text">Lección ${course.currentLesson} de ${course.totalLessons} · ${course.progress}% completo</span>
                    </div>
                    <button class="btn-primary" onclick="startCourse('${course.id}')">
                        <i class="ri-play-circle-line"></i> Continuar
                    </button>
                </div>
            `).join('');
        }
    });

    courseList.innerHTML = html;
}

// ==========================================
// NUEVO: SELECTOR DE RUTA ACTIVA
// ==========================================
function renderActivePathSelector() {
    const selectorContainer = document.querySelector('.active-path-selector');
    if (!selectorContainer) {
        // Si el container no existe, crearlo dinámicamente
        const miRutaSection = document.getElementById('mi-ruta');
        if (miRutaSection) {
            const container = document.createElement('div');
            container.className = 'active-path-selector';
            container.style.cssText = `
                background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                color: white;
            `;
            miRutaSection.insertBefore(container, miRutaSection.firstChild);
        }
    }

    const container = document.querySelector('.active-path-selector');
    if (!container) return;

    (async () => {
        try {
            // Obtener ruta activa
            const activeRes = await window.dashboardAPI.getActivePath();
            const activePath = activeRes.activePath;

            // Obtener todas las rutas disponibles
            const pathsRes = await window.dashboardAPI.getRecommendedPaths();
            const allPaths = pathsRes.paths || [];

            // Renderizar información de ruta activa
            if (activePath && allPaths.length > 0) {
                const currentPath = allPaths.find(p => p.name === activePath);
                
                if (currentPath) {
                    container.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 20px;">
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 8px 0; font-size: 20px;">
                                    <i class="ri-route-line" style="margin-right: 8px;"></i>${currentPath.name}
                                </h3>
                                <p style="margin: 0 0 12px 0; opacity: 0.9; font-size: 14px;">${currentPath.description || 'Ruta personalizada'}</p>
                                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                    <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 12px;">
                                        <i class="ri-book-line"></i> ${currentPath.techniques?.length || 0} técnicas
                                    </span>
                                    <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 12px;">
                                        <i class="ri-time-line"></i> ~${currentPath.duration || 'N/A'} min
                                    </span>
                                    <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 12px;">
                                        <i class="ri-target-line"></i> ${currentPath.objectives?.length || 0} objetivos
                                    </span>
                                </div>
                            </div>
                            <div>
                                <button class="btn-primary" onclick="togglePathSelector()" style="white-space: nowrap;">
                                    <i class="ri-exchange-line"></i> Cambiar ruta
                                </button>
                            </div>
                        </div>

                        <div id="path-selector-modal" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2);">
                            <h4 style="margin: 0 0 12px 0;">Selecciona una ruta:</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                                ${allPaths.map(path => `
                                    <button class="path-option-btn" onclick="setActivePath('${path.name}')" style="
                                        padding: 12px;
                                        border: 2px solid rgba(255,255,255,0.3);
                                        background: ${path.name === activePath ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'};
                                        color: white;
                                        border-radius: 8px;
                                        cursor: pointer;
                                        font-weight: ${path.name === activePath ? '600' : '400'};
                                        transition: all 0.3s ease;
                                    " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='${path.name === activePath ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}'">
                                        ${path.name === activePath ? '<i class="ri-check-line"></i> ' : ''}<strong>${path.name}</strong>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <p style="margin: 0; text-align: center;">Ruta no encontrada. Selecciona una para comenzar.</p>
                    `;
                }
            } else {
                container.innerHTML = `
                    <div style="text-align: center;">
                        <h3 style="margin: 0 0 12px 0;">Selecciona tu ruta de aprendizaje</h3>
                        <p style="margin: 0 0 16px 0; opacity: 0.9;">Elige una ruta recomendada para estructurar tu práctica</p>
                        <button class="btn-primary" onclick="togglePathSelector()">
                            <i class="ri-compass-line"></i> Seleccionar ruta
                        </button>
                        <div id="path-selector-modal" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2);">
                            <h4 style="margin: 0 0 12px 0;">Elige una ruta:</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                                ${allPaths.map(path => `
                                    <button class="path-option-btn" onclick="setActivePath('${path.name}')" style="
                                        padding: 12px;
                                        border: 2px solid rgba(255,255,255,0.3);
                                        background: rgba(255,255,255,0.05);
                                        color: white;
                                        border-radius: 8px;
                                        cursor: pointer;
                                        transition: all 0.3s ease;
                                    " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                        <strong>${path.name}</strong>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error('Error cargando selector de ruta:', err);
            container.innerHTML = '<p style="margin: 0; color: #ff6b6b;">Error al cargar rutas</p>';
        }
    })();
}

function togglePathSelector() {
    const modal = document.getElementById('path-selector-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
    }
}

async function setActivePath(pathName) {
    try {
        const res = await window.dashboardAPI.setActivePath(pathName);
        if (res.success) {
            console.log('✓ Ruta activa actualizada:', pathName);
            // Recargar selector
            renderActivePathSelector();
            // Cerrar modal
            const modal = document.getElementById('path-selector-modal');
            if (modal) modal.style.display = 'none';
            // Recargar técnicas de la ruta
            loadPathTechniques(pathName);
        }
    } catch (err) {
        console.error('Error actualizando ruta:', err);
    }
}

function renderRecommendedPaths() {
    if (!pathsGrid) return;

    // Mostrar indicador de carga
    pathsGrid.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando rutas recomendadas...</p>';

    // Cargar dinámicamente desde la BD
    (async () => {
        try {
            const data = await window.dashboardAPI.getRecommendedPaths();
            const activeRes = await window.dashboardAPI.getActivePath();
            const activePath = activeRes.activePath;

            if (!data.success || !data.paths || data.paths.length === 0) {
                pathsGrid.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">No hay rutas disponibles en este momento</p>';
                return;
            }

            const colors = [
                'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
                'linear-gradient(135deg, #30CFD0 0%, #330867 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            ];
            const icons = ['ri-heart-add-line', 'ri-mind-map', 'ri-lotus-line', 'ri-leaf-line', 'ri-brain-line'];

            pathsGrid.innerHTML = data.paths.map((path, idx) => {
                const isActive = path.name === activePath;
                return `
                    <div style="position: relative;">
                        <div class="path-card">
                            <div class="path-header" style="background: ${colors[idx % colors.length]};">
                                <i class="${icons[idx % icons.length]}"></i>
                                <h4>${path.name}</h4>
                                <span class="path-duration">~${path.duration || 'N/A'}</span>
                            </div>
                            <div class="path-body">
                                <p>${path.description || 'Sin descripción'}</p>
                                <ul class="path-techniques">
                                    <li><i class="ri-checkbox-circle-line"></i> Técnica completada</li>
                                    <li><i class="ri-checkbox-blank-circle-line"></i> Próxima técnica</li>
                                    <li><i class="ri-checkbox-blank-circle-line"></i> Más técnicas</li>
                                    <li><i class="ri-checkbox-blank-circle-line"></i> Finalización</li>
                                </ul>
                            </div>
                            <button class="btn-outline" onclick="startPath('${path.name}')" style="${isActive ? 'background: #54ad57ff; color: white; border: 2px solid #5fb262ff;' : ''}">
                                <i class="ri-route-line"></i> ${isActive ? 'Ruta activa' : 'Iniciar ruta'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('Error cargando rutas recomendadas:', err);
            pathsGrid.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Error al cargar rutas</p>';
        }
    })();
}

function renderCatalog() {
    const catalogGrid = document.querySelector('.catalog-grid');
    if (!catalogGrid) return;

    if (allTechniques.length === 0) {
        catalogGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No hay técnicas disponibles</p>';
        return;
    }

    // Mostrar TODAS las técnicas disponibles (sin límite de 6)
    catalogGrid.innerHTML = allTechniques.map(tech => `
        <div class="catalog-item" data-category="${tech.category}">
            <div class="catalog-icon" style="background: ${tech.color};">
                <i class="${tech.icon}"></i>
            </div>
            <div class="catalog-content">
                <h5>${tech.name}</h5>
                <span class="catalog-badge ${tech.category.toLowerCase()}">${tech.category}</span>
                <p>${tech.shortDescription}</p>
                <div class="catalog-meta">
                    <span><i class="ri-time-line"></i> ${tech.duration} min</span>
                    <span class="difficulty-badge ${tech.difficulty.toLowerCase()}">${tech.difficulty}</span>
                </div>
            </div>
            <button class="btn-start-small" onclick="startTechnique('${tech.id}')">Comenzar</button>
        </div>
    `).join('');
}

// SECCIÓN: MEDITACIONES
function renderMeditacionesSection() {
    const section = document.getElementById('meditaciones');
    if (!section) return;

    const header = section.querySelector('header.top-bar');
    const grid = section.querySelector('.simulations-grid');
    if (!grid) return;

    // Verificar si hay una ruta seleccionada
    const selectedPath = sessionStorage.getItem('selectedPath');
    
    if (selectedPath) {
        // Si hay ruta seleccionada, cargar técnicas de esa ruta
        loadPathTechniques(selectedPath, header, grid);
    } else {
        // Si no hay ruta, mostrar todas las técnicas
        if (allTechniques.length === 0) {
            grid.innerHTML = '<p style="text-align: center; padding: 20px;">No hay técnicas disponibles</p>';
            return;
        }

        grid.innerHTML = allTechniques.map(tech => `
            <div class="card card-simulation" data-type="${tech.type}" data-duration="${tech.duration}" data-goal="${tech.goal}">
                <div class="simulation-image">
                    <img src="${tech.image}" alt="${tech.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 16px;">
                    <span class="simulation-tag"><i class="${tech.icon}"></i> ${tech.name}</span>
                    <div class="media-badge ${tech.type}-badge"><i class="${getMediaIcon(tech.type)}"></i> ${capitalizeFirst(tech.type)}</div>
                </div>
                <h3>${tech.name}</h3>
                <p>${tech.description}</p>
                <div class="simulation-meta">
                    <span><i class="ri-time-line"></i> ${tech.duration} mins</span>
                    <span><i class="ri-bar-chart-line"></i> ${tech.effectiveness}% efectivo</span>
                    <span><i class="ri-user-line"></i> ${tech.usersCount}K usuarios</span>
                </div>
                <button class="btn-primary" onclick="startTechnique('${tech.id}')">
                    <i class="ri-play-fill"></i> Comenzar
                </button>
            </div>
        `).join('');
    }
    
    // Agregar event listeners a los botones de filtro
    setupFilterButtons();
}

function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Encontrar el grupo de filtros al que pertenece este botón
            const filterGroup = this.parentElement;
            const isDataDuration = this.hasAttribute('data-duration');
            const isDataGoal = this.hasAttribute('data-goal');
            
            if (isDataDuration) {
                // Remover clase active de otros botones de duración
                filterGroup.querySelectorAll('[data-duration]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            } else if (isDataGoal) {
                // Remover clase active de otros botones de objetivo
                filterGroup.querySelectorAll('[data-goal]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
            
            // Aplicar filtros
            applyFilters();
        });
    });
}

async function loadPathTechniques(pathName, headerElement, gridElement) {
    try {
        // Llamar al endpoint de técnicas de ruta
        const API_BASE = window.dashboardAPI?.API_BASE || 'http://127.0.0.1:5000/api';
        const response = await fetch(`${API_BASE}/content/path_techniques/${encodeURIComponent(pathName)}`);
        const data = await response.json();
        
        if (!data.success || !data.techniques || data.techniques.length === 0) {
            gridElement.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">No hay técnicas en esta ruta</p>';
            return;
        }
        
        // Guardar técnicas de la ruta en variable global para filtrado
        window.currentPathTechniques = data.techniques;
        window.currentPathName = pathName;
        
        // Actualizar el encabezado para mostrar la ruta
        if (headerElement) {
            const exitBtn = document.createElement('button');
            exitBtn.innerHTML = '<i class="ri-arrow-left-line"></i> Mostrar todo el catalogo';
            exitBtn.style.cssText = `
                background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            `;
            exitBtn.onmouseover = (e) => {
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
                e.target.style.transform = 'translateY(-2px)';
            };
            exitBtn.onmouseout = (e) => {
                e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                e.target.style.transform = 'translateY(0)';
            };
            exitBtn.onclick = () => {
                sessionStorage.removeItem('selectedPath');
                window.currentPathTechniques = null;
                window.currentPathName = null;
                window.location.hash = '#meditaciones';
                renderMeditacionesSection();
            };
            
            headerElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 24px;">
                    <div style="flex: 1;">
                        <h1 style="margin: 0; font-size: 28px; color: var(--text-primary);">
                            <i class="ri-compass-3-line" style="color: #667EEA; margin-right: 12px;"></i>${data.path_name}
                        </h1>
                        <p style="color: var(--text-secondary); margin: 8px 0 0 0; font-size: 14px; line-height: 1.5;">${data.path_description}</p>
                        ${data.path_objectives && data.path_objectives.length > 0 ? `
                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                                <p style="font-size: 12px; font-weight: 600; color: #667EEA; margin: 0 0 8px 0;">Objetivos:</p>
                                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: var(--text-secondary);">
                                    ${data.path_objectives.slice(0, 2).map(obj => `<li>${obj}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            headerElement.appendChild(exitBtn);
        }
        
        // Renderizar técnicas de la ruta
        renderPathTechniques(data.techniques, gridElement);
        
        // Activar filtros
        setupPathFilters(gridElement);
        
        console.log(`✅ Técnicas de ruta '${pathName}' cargadas: ${data.techniques.length}`);
    } catch (err) {
        console.error('Error cargando técnicas de ruta:', err);
        gridElement.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Error al cargar técnicas de la ruta</p>';
    }
}

function renderPathTechniques(techniques, gridElement) {
    gridElement.innerHTML = techniques.map(tech => `
        <div class="card card-simulation" data-type="${tech.type || 'meditation'}" data-duration="${tech.duration}" data-goal="${tech.goal || ''}">
            <div class="simulation-image">
                <img src="${tech.image || 'assets/images/default.jpg'}" alt="${tech.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 16px;">
                <span class="simulation-tag"><i class="${tech.icon || 'ri-meditation-line'}"></i> ${tech.name}</span>
                <div class="media-badge meditation-badge"><i class="ri-play-circle-line"></i> Técnica</div>
            </div>
            <h3>${tech.name}</h3>
            <p>${tech.description || 'Sin descripción'}</p>
            <div class="simulation-meta">
                <span><i class="ri-time-line"></i> ${tech.duration} min</span>
                <span><i class="ri-bar-chart-line"></i> ${tech.effectiveness || '85'}% efectivo</span>
            </div>
            <button class="btn-primary" onclick="startTechnique('${tech.id}')">
                <i class="ri-play-fill"></i> Comenzar
            </button>
        </div>
    `).join('');
}

function setupPathFilters(gridElement) {
    // Obtener todos los botones de filtro
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.parentElement.previousElementSibling?.textContent || '';
            
            if (filterType.includes('Duración')) {
                // Filtro de duración
                document.querySelectorAll('.filter-btn[data-duration]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            } else if (filterType.includes('Objetivo') || filterType.includes('Efecto')) {
                // Filtro de objetivo
                document.querySelectorAll('.filter-btn[data-goal]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
            
            // Aplicar filtros
            applyPathFilters();
        });
    });
}

function applyPathFilters() {
    if (!window.currentPathTechniques) return;
    
    const activeDuration = document.querySelector('.filter-btn[data-duration].active')?.dataset.duration || 'all';
    const activeGoal = document.querySelector('.filter-btn[data-goal].active')?.dataset.goal || 'all';
    
    const filteredTechniques = window.currentPathTechniques.filter(tech => {
        let matchDuration = true;
        let matchGoal = true;
        
        // Filtrar por duración
        if (activeDuration !== 'all') {
            const duration = parseInt(tech.duration);
            if (activeDuration === '5') {
                matchDuration = duration <= 5;
            } else if (activeDuration === '10') {
                matchDuration = duration >= 6 && duration <= 12;
            } else if (activeDuration === '15') {
                matchDuration = duration >= 15;
            }
        }
        
        // Filtrar por objetivo/goal
        if (activeGoal !== 'all') {
            matchGoal = tech.goal === activeGoal || (tech.goal && tech.goal.toLowerCase().includes(activeGoal.toLowerCase()));
        }
        
        return matchDuration && matchGoal;
    });
    
    // Renderizar técnicas filtradas
    const gridElement = document.querySelector('.simulations-grid');
    if (filteredTechniques.length === 0) {
        gridElement.innerHTML = '<p style="text-align: center; padding: 40px; grid-column: 1/-1; color: var(--text-secondary);">No hay técnicas que coincidan con los filtros seleccionados</p>';
    } else {
        renderPathTechniques(filteredTechniques, gridElement);
    }
}

// SECCIÓN: COMUNIDAD
let communityPosts = [];
let currentOffset = 0;
const POSTS_PER_PAGE = 10;

// ==========================================
// INICIALIZAR COMUNIDAD
// ==========================================
function initCommunity() {
    console.log('📍 initCommunity() - INICIANDO');
    const communitySection = document.getElementById('comunidad');
    console.log('📍 initCommunity() - Sección encontrada:', !!communitySection);
    if (!communitySection) {
        console.error('❌ initCommunity() - No se encontró sección #comunidad');
        return;
    }

    // Crear estructura de comunidad
    communitySection.innerHTML = `
        <header class="top-bar">
            <div>
                <h1><i class="ri-chat-smile-line" style="margin-right: 12px;"></i>Comunidad Serenity</h1>
                <p style="margin: 8px 0 0 0; color: var(--text-secondary); font-size: 14px;">Comparte tus experiencias, logros y aprendizajes con la comunidad</p>
            </div>
        </header>
        
        <div class="community-container">
            <!-- Panel de crear post (sin opción de adjuntar imagen) -->
            <div class="create-post-panel">
                <div class="create-post-header">
                    <img id="current-user-avatar" src="https://i.pravatar.cc/150" alt="Avatar" class="avatar-small">
                    <textarea 
                        id="post-input" 
                        class="post-textarea" 
                        placeholder="Comparte tu experiencia, logro o pregunta..." 
                        rows="3"
                    ></textarea>
                </div>
                <div class="create-post-footer">
                    <button class="btn-primary" id="submit-post-btn" onclick="submitPost()">
                        <i class="ri-send-plane-line"></i> Publicar
                    </button>
                </div>
            </div>

            <!-- Feed de posts -->
            <div id="posts-feed" class="posts-feed"></div>

            <!-- Botón cargar más -->
            <div style="text-align: center; padding: 20px;">
                <button class="btn-outline" id="load-more-btn" onclick="loadMorePosts()" style="display: none;">
                    Cargar más posts
                </button>
            </div>
        </div>
    `;

    console.log('📍 initCommunity() - HTML insertado, llamando loadCommunityPosts()');
    // Asegurar que el avatar del formulario muestre la foto del usuario si está disponible
    try {
        const avatarEl = document.getElementById('current-user-avatar');
        if (avatarEl && currentUser) {
            avatarEl.src = getUserPhoto(currentUser);
        }
    } catch (e) {
        console.warn('initCommunity() - No se pudo actualizar avatar del usuario:', e);
    }
    
    // Pequeño delay para asegurar que el DOM esté completamente actualizado
    setTimeout(() => {
        console.log('📍 initCommunity() - Ejecutando loadCommunityPosts() después del delay');
        loadCommunityPosts();
    }, 100);
}

// ==========================================
// CARGAR POSTS
// ==========================================
async function loadCommunityPosts() {
    try {
        console.log('📍 loadCommunityPosts() - INICIANDO');
        currentOffset = 0;
        
        // Mostrar mensaje de carga mientras se obtienen los posts
        const feed = document.getElementById('posts-feed');
        if (feed && feed.innerHTML === '') {
            feed.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Cargando posts...</p>';
        }
        
        console.log('📍 loadCommunityPosts() - Llamando API con limit=' + POSTS_PER_PAGE + ', offset=' + currentOffset);
        const data = await window.dashboardAPI.getCommunityPosts(POSTS_PER_PAGE, currentOffset);
        console.log('📍 loadCommunityPosts() - Respuesta API:', data);
        
        if (data.success && data.posts && data.posts.length > 0) {
            console.log('✅ loadCommunityPosts() - Se encontraron ' + data.posts.length + ' posts');
            communityPosts = data.posts;
            renderPosts(communityPosts);
            // Mostrar botón de cargar más si hay más posts
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn && data.total > POSTS_PER_PAGE) {
                loadMoreBtn.style.display = 'block';
            }
        } else if (data.success && (!data.posts || data.posts.length === 0)) {
            console.log('⚠️ loadCommunityPosts() - No hay posts');
            communityPosts = [];
            renderPosts([]);
        } else {
            console.error('❌ loadCommunityPosts() - Error en respuesta:', data);
            if (feed) {
                feed.innerHTML = '<p style="text-align: center; padding: 40px; color: #ff6b6b;">No se pudieron cargar los posts</p>';
            }
        }
    } catch (err) {
        console.error('❌ loadCommunityPosts() - Exception:', err);
        const feed = document.getElementById('posts-feed');
        if (feed) {
            feed.innerHTML = '<p style="text-align: center; padding: 40px; color: #ff6b6b;">Error al cargar posts</p>';
        }
    }
}

async function loadMorePosts() {
    try {
        currentOffset += POSTS_PER_PAGE;
        const data = await window.dashboardAPI.getCommunityPosts(POSTS_PER_PAGE, currentOffset);
        
        if (data.success && data.posts) {
            const feed = document.getElementById('posts-feed');
            const postsHtml = data.posts.map(post => renderPostCard(post)).join('');
            feed.innerHTML += postsHtml;
            
            // Ocultar botón si no hay más posts
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn && (currentOffset + POSTS_PER_PAGE) >= data.total) {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Error cargando más posts:', err);
    }
}

// ==========================================
// RENDERIZAR POSTS
// ==========================================
function renderPosts(posts) {
    const feed = document.getElementById('posts-feed');
    if (!feed) return;

    if (posts.length === 0) {
        feed.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="ri-chat-smile-line" style="font-size: 48px; color: var(--text-secondary); opacity: 0.5;"></i>
                <h3 style="color: var(--text-secondary); margin-top: 16px;">No hay publicaciones en la comunidad</h3>
                <p style="color: var(--text-secondary); margin-top: 8px;">Sé el primero en compartir tu experiencia o pregunta.</p>
            </div>
        `;
        return;
    }

    // Si hay hash #post-<id>, mostrar solo ese post en formato grande
    if (window.location.hash && window.location.hash.startsWith('#post-')) {
        const postId = window.location.hash.replace('#post-', '');
        const post = posts.find(p => String(p._id) === postId);
        if (post) {
            // Si el usuario NO está autenticado, mostrar mensaje claro en vez de "sesión expirada"
            if (!getCurrentUserId()) {
                feed.innerHTML = `
                    <div style="max-width:700px;margin:60px auto;padding:36px;background:var(--card-bg);border-radius:16px;border:1px solid var(--border-color);text-align:center;">
                        <i class="ri-lock-2-line" style="font-size:48px;color:var(--accent-color);opacity:0.9"></i>
                        <h2 style="margin-top:18px;color:var(--text-primary);">Debes iniciar sesión para ver este contenido</h2>
                        <p style="color:var(--text-secondary);margin-top:8px;">Inicia sesión o crea una cuenta en Serenity para acceder a este post.</p>
                        <a href="login.html" class="btn" style="display:inline-block;margin-top:20px;padding:10px 20px;border-radius:10px;background:var(--accent-color);color:#fff;text-decoration:none;font-weight:600;">Iniciar sesión</a>
                    </div>
                `;
                // Asegurarnos de ocultar panel de crear post también
                if (createPanel) createPanel.style.display = 'none';
                return;
            }
            // Render single post in big view and in view-only mode (no edit/delete controls)
            feed.innerHTML = renderPostCard(post, true, true);
            updateUserAvatars();
            // Cargar y mostrar comentarios en modo solo lectura (delay corto para asegurar que el DOM esté listo)
            setTimeout(() => loadCommentsReadOnly(postId), 80);
            return;
        }
    }
    feed.innerHTML = posts.map(post => renderPostCard(post)).join('');
    // After rendering posts, ensure current user avatars in inputs are correct
    updateUserAvatars();
}

// Helper para obtener la foto de un usuario (string) con varios fallbacks
function getUserPhoto(user) {
    if (!user) return 'https://i.pravatar.cc/150';
    // backend User.to_dict() usa 'photo' como clave principal
    if (user.photo) return user.photo;
    // posibles estructuras alternativas
    if (user.profile && user.profile.avatar) return user.profile.avatar;
    if (user.profile && user.profile.photo) return user.profile.photo;
    if (user.photoUrl) return user.photoUrl;
    return 'https://i.pravatar.cc/150';
}

// Actualiza los avatares del formulario de nuevo post y de los inputs de comentario
function updateUserAvatars() {
    try {
        const avatarEl = document.getElementById('current-user-avatar');
        if (avatarEl && currentUser) {
            avatarEl.src = getUserPhoto(currentUser);
        }

        // Actualizar avatares dentro de cada comentario-input-wrapper renderizado
        document.querySelectorAll('.comment-input-wrapper').forEach(wrapper => {
            const img = wrapper.querySelector('img.avatar-tiny');
            if (img && currentUser) {
                img.src = getUserPhoto(currentUser);
            }
        });
    } catch (e) {
        console.warn('updateUserAvatars() - Error:', e);
    }
}

function renderPostCard(post, big = false, viewOnly = false) {
    const timeAgo = getTimeAgo(post.created_at);
    const likeIcon = post.user_liked ? 'ri-heart-fill' : 'ri-heart-line';
    const chatIcon = 'ri-chat-2-line';
    const likeColor = post.user_liked ? 'color: #ff6b6b;' : '';

    const isOwnPost = post && post.author && post.author.id === getCurrentUserId();
    // Fix avatar logic for post panel
    let avatarUrl = post.author.photo || (post.author.profile && post.author.profile.avatar) || 'https://i.pravatar.cc/150';
    const cardClass = big ? 'post-card post-card-big' : 'post-card';

    // Si el usuario no está autenticado, mostrar un pequeño banner invitando a crear cuenta
    const joinBanner = !getCurrentUserId() ? `<div style="margin-bottom:12px;">¿Quieres interactuar con este post? <a href="login.html">Crea tu cuenta</a></div>` : '';

    return `
        <div class="${cardClass}" id="post-${post._id}" data-post-id="${post._id}">
            ${joinBanner}
            <div class="post-header">
                <div class="post-author">
                    <img src="${avatarUrl}" alt="${post.author.name}" class="avatar-small">
                    <div class="post-author-info">
                        <h5>${post.author.name || 'Usuario'}</h5>
                        <small><span class="time-ago" data-time="${post.created_at}">${timeAgo}</span></small>
                    </div>
                </div>
                <div class="post-menu">
                    ${(!viewOnly && isOwnPost) ? `
                        <button class="btn-icon" onclick="editPost('${post._id}')" title="Editar post"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon" onclick="deletePost('${post._id}')" title="Eliminar post"><i class="ri-delete-bin-line"></i></button>
                    ` : ''}
                </div>
            </div>

            <div class="post-content">
                <p>${escapeHtml(post.content)}</p>
                ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
            </div>

            <div class="post-actions">
                ${viewOnly ? `
                    <div class="post-action-static" title="Me gusta"><i class="${likeIcon}"></i> <span>${post.likes_count}</span></div>
                    <div class="post-action-static" title="Comentarios"><i class="${chatIcon}"></i> <span>${post.comments_count}</span></div>
                    <button class="post-action-btn" data-action="share" title="Compartir" onclick="sharePost('${post._id}')">
                        <i class="ri-share-line"></i>
                        <span>Compartir</span>
                    </button>
                ` : `
                    <button class="post-action-btn" data-action="like" onclick="toggleLike('${post._id}', ${post.user_liked})" style="${likeColor}" title="Me gusta">
                        <i class="${likeIcon}"></i>
                        <span>${post.likes_count}</span>
                    </button>
                    <button class="post-action-btn" data-action="comments" onclick="toggleComments('${post._id}')" title="Comentarios">
                        <i class="${chatIcon}"></i>
                        <span>${post.comments_count}</span>
                    </button>
                    <button class="post-action-btn" data-action="share" title="Compartir" onclick="sharePost('${post._id}')">
                        <i class="ri-share-line"></i>
                        <span>Compartir</span>
                    </button>
                `}
            </div>

            <div id="comments-${post._id}" class="post-comments" style="display: ${viewOnly ? 'block' : 'none'};">
                <div id="comments-list-${post._id}" class="comments-list ${viewOnly ? 'read-only' : ''}">
                    ${viewOnly ? `<div style="text-align:center;padding:14px;color:var(--text-secondary);">Cargando comentarios...</div>` : ''}
                </div>
                ${viewOnly ? '' : `
                <div class="comment-input-wrapper">
                    <img src="${getUserPhoto(currentUser)}" alt="${(currentUser && (currentUser.firstName || currentUser.name)) || 'Usuario'}" class="avatar-tiny">
                    <input type="text" class="comment-input" placeholder="Escribe un comentario..." onkeypress="if(event.key==='Enter') submitComment('${post._id}')">
                    <button class="btn-icon" onclick="submitComment('${post._id}')" title="Enviar comentario">
                        <i class="ri-send-plane-line"></i>
                    </button>
                </div>
                `}
            </div>
        </div>
    `;
}

// Cargar comentarios en modo solo lectura y renderizarlos en el contenedor read-only
async function loadCommentsReadOnly(postId) {
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (!listEl) return;
    try {
        listEl.innerHTML = `<div style="text-align:center;padding:14px;color:var(--text-secondary);"><i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Cargando comentarios...</div>`;
        const data = await window.dashboardAPI.getPostComments(postId);
        console.log('📍 loadCommentsReadOnly() - API response for post', postId, data);
        if (data && data.success && Array.isArray(data.comments)) {
            const comments = data.comments.map(c => ({ ...c, created_at: c.created_at || new Date().toISOString() }));
            listEl.innerHTML = comments.map(comment => {
                const avatarUrl = (comment.author && (comment.author.photo || comment.author.profile?.avatar || comment.author.photoUrl)) || 'https://i.pravatar.cc/150';
                const finalAvatar = avatarUrl === 'https://i.pravatar.cc/150' ? '/static/img/default-avatar.png' : avatarUrl;
                const authorName = (comment.author && comment.author.name) || 'Usuario';
                return `
                <div class="comment" data-comment-id="${comment._id}">
                    <div class="comment-avatar">
                        <img src="${finalAvatar}" alt="${authorName}" class="avatar-tiny">
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-author">${authorName}</span>
                            <span class="time-ago comment-time" data-time="${comment.created_at}">${getTimeAgo(comment.created_at)}</span>
                        </div>
                        <p class="comment-text">${escapeHtml(comment.content)}</p>
                    </div>
                </div>
            `;
            }).join('');
        } else {
            console.log('📍 loadCommentsReadOnly() - no comments for post', postId, data);
            listEl.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:12px;">Sin comentarios aún</p>`;
        }
        // Activar actualizador de "hace x" para los timestamps recien renderizados
        try { startTimeAgoUpdater(); } catch(e) {}
    } catch (err) {
        console.error('Error cargando comentarios read-only:', err);
        listEl.innerHTML = `<p style="text-align:center;color:#ff6b6b;padding:12px;">Error al cargar comentarios</p>`;
    }
}

// ==========================================
// CREAR POST
// ==========================================
async function submitPost() {
    const input = document.getElementById('post-input');
    if (!input) return;

    const content = input.value.trim();
    if (!content || content.length < 2 || content.length < 1) {
        alert('El post debe tener al menos 2 caracteres');
        return;
    }

    const submitBtn = document.getElementById('submit-post-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Publicando...';

    try {
        const data = await window.dashboardAPI.createPost(content);
        
        if (data.success) {
            // Agregar nuevo post al inicio
            // Asegurar timestamp si el backend no lo devuelve inmediatamente
            if (data.post && !data.post.created_at) data.post.created_at = new Date().toISOString();
            communityPosts.unshift(data.post);
            renderPosts(communityPosts);
            
            // Limpiar input
            input.value = '';
            
            console.log('✓ Post publicado');
        } else {
            alert('Error: ' + (data.error || 'No se pudo publicar el post'));
        }
    } catch (err) {
        console.error('Error publicando post:', err);
        alert('Error al publicar el post');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-send-plane-line"></i> Publicar';
    }
}

// ==========================================
// LIKES
// ==========================================
async function toggleLike(postId, isLiked) {
    try {
        const action = isLiked ? 'unlikePost' : 'likePost';
        const data = await window.dashboardAPI[action](postId);
        
        if (data.success) {
            // Recargar posts
            loadCommunityPosts();
        }
    } catch (err) {
        console.error('Error toggling like:', err);
    }
}

// ==========================================
// COMENTARIOS
// ==========================================
async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentsList = document.getElementById(`comments-list-${postId}`);

    // Use computed style to check visibility robustly
    const isHidden = window.getComputedStyle(commentsSection).display === 'none';

    if (isHidden) {
        // Open comments section
        commentsSection.style.display = 'block';

        // Always fetch latest comments when opening
        commentsList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="ri-loader-4-line" style="animation: spin 1s linear infinite; font-size: 24px; color: var(--accent-color);"></i><p style="margin-top: 8px; color: var(--text-secondary);">Cargando comentarios...</p></div>';

        try {
            console.log('📍 toggleComments() - Cargando comentarios para post:', postId);
            const data = await window.dashboardAPI.getPostComments(postId);
            console.log('📍 toggleComments() - Respuesta API:', data);

            const card = document.querySelector(`[data-post-id="${postId}"]`);

                if (data.success && data.comments) {
                const comments = data.comments.map(c => ({
                    ...c,
                    created_at: c.created_at || new Date().toISOString()
                }));
                console.log('✅ toggleComments() - Se encontraron ' + comments.length + ' comentarios');
                commentsList.innerHTML = comments.map(comment => {
                    const isOwnComment = comment && comment.author && comment.author.id === getCurrentUserId();
                    let avatarUrl = (comment.author && (comment.author.photo || comment.author.profile?.avatar)) || 'https://i.pravatar.cc/150';
                                    // Si el avatar es el valor por defecto, usar el local '/static/img/default-avatar.png'
                                    if (avatarUrl === 'https://i.pravatar.cc/150') {
                                        avatarUrl = '/static/img/default-avatar.png';
                                    }
                    let authorName = (comment.author && comment.author.name) || 'Usuario';
                    return `
                        <div class="comment" data-comment-id="${comment._id}">
                            <div class="comment-avatar">
                                <img src="${avatarUrl}" alt="${authorName}" class="avatar-tiny">
                            </div>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-author">${authorName}</span>
                                    <span class="time-ago comment-time" data-time="${comment.created_at}">${getTimeAgo(comment.created_at)}</span>
                                    ${isOwnComment ? `
                                        <button class="btn-icon" onclick="editComment('${comment._id}', '${postId}')" title="Editar comentario"><i class="ri-edit-line"></i></button>
                                        <button class="btn-icon" onclick="deleteComment('${comment._id}', '${postId}')" title="Eliminar comentario"><i class="ri-delete-bin-line"></i></button>
                                    ` : ''}
                                </div>
                                <p class="comment-text">${escapeHtml(comment.content)}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                // Update comments count in the post card
                if (card) {
                    const commentsBtnSpan = card.querySelector('button[data-action="comments"] span');
                    if (commentsBtnSpan) commentsBtnSpan.textContent = comments.length;

                    // Update in-memory model if present
                    const idx = communityPosts.findIndex(p => String(p._id) === String(postId));
                    if (idx !== -1) communityPosts[idx].comments_count = comments.length;
                }
            } else {
                console.log('⚠️ toggleComments() - No hay comentarios');
                commentsList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);"><i class="ri-chat-empty-line" style="font-size: 28px; opacity: 0.5; margin-bottom: 8px; display: block;"></i>Sin comentarios aún</p>';

                if (card) {
                    const commentsBtnSpan = card.querySelector('button[data-action="comments"] span');
                    if (commentsBtnSpan) commentsBtnSpan.textContent = '0';
                    const idx = communityPosts.findIndex(p => String(p._id) === String(postId));
                    if (idx !== -1) communityPosts[idx].comments_count = 0;
                }
            }
        } catch (err) {
            console.error('❌ toggleComments() - Error cargando comentarios:', err);
            commentsList.innerHTML = '<p style="text-align: center; padding: 20px; color: #ff6b6b;"><i class="ri-error-warning-line" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>Error al cargar comentarios</p>';
        }
    } else {
        // Hide comments
        commentsSection.style.display = 'none';
    }
}

async function submitComment(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const input = commentsSection.querySelector('.comment-input');
    const content = input.value.trim();
    
    if (!content) {
        showNotification('Escribe algo para comentar', 'info');
        return;
    }

    const submitBtn = commentsSection.querySelector('.btn-icon');
    submitBtn.disabled = true;
    
    try {
        console.log('📍 submitComment() - Enviando comentario para post:', postId);
        const data = await window.dashboardAPI.createComment(postId, content);
        console.log('📍 submitComment() - Respuesta:', data);
        
        if (data.success) {
            console.log('✅ submitComment() - Comentario enviado exitosamente');
            // Limpiar input
            input.value = '';
            
            // Recargar comentarios
            const commentsList = document.getElementById(`comments-list-${postId}`);
            commentsList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="ri-loader-4-line" style="animation: spin 1s linear infinite; font-size: 24px; color: var(--accent-color);"></i></div>';
            
            try {
                const newData = await window.dashboardAPI.getPostComments(postId);
                if (newData.success && newData.comments && newData.comments.length > 0) {
                    const comments = newData.comments.map(c => ({ ...c, created_at: c.created_at || new Date().toISOString() }));
                    commentsList.innerHTML = comments.map(comment => {
                        const isOwnComment = comment && comment.author && comment.author.id === getCurrentUserId();
                        let avatarUrl = (comment.author && (comment.author.photo || comment.author.profile?.avatar)) || 'https://i.pravatar.cc/150';
                        if (avatarUrl === 'https://i.pravatar.cc/150') avatarUrl = '/static/img/default-avatar.png';
                        let authorName = (comment.author && comment.author.name) || 'Usuario';
                        return `
                            <div class="comment" data-comment-id="${comment._id}">
                                <div class="comment-avatar">
                                    <img src="${avatarUrl}" alt="${authorName}" class="avatar-tiny">
                                </div>
                                <div class="comment-content">
                                    <div class="comment-header">
                                        <span class="comment-author">${authorName}</span>
                                        <span class="time-ago comment-time" data-time="${comment.created_at}">${getTimeAgo(comment.created_at)}</span>
                                        ${isOwnComment ? `
                                            <button class="btn-icon" onclick="editComment('${comment._id}', '${postId}')" title="Editar comentario"><i class="ri-edit-line"></i></button>
                                            <button class="btn-icon" onclick="deleteComment('${comment._id}', '${postId}')" title="Eliminar comentario"><i class="ri-delete-bin-line"></i></button>
                                        ` : ''}
                                    </div>
                                    <p class="comment-text">${escapeHtml(comment.content)}</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                    // Update comments count in the post card UI
                    const card = document.querySelector(`[data-post-id="${postId}"]`);
                    if (card) {
                        const commentsBtnSpan = card.querySelector('button[data-action="comments"] span');
                        if (commentsBtnSpan) commentsBtnSpan.textContent = comments.length;
                    }
                    const idx = communityPosts.findIndex(p => String(p._id) === String(postId));
                    if (idx !== -1) communityPosts[idx].comments_count = comments.length;
                } else {
                    commentsList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Sin comentarios aún</p>';
                    const card = document.querySelector(`[data-post-id="${postId}"]`);
                    if (card) {
                        const commentsBtnSpan = card.querySelector('button[data-action="comments"] span');
                        if (commentsBtnSpan) commentsBtnSpan.textContent = '0';
                    }
                    const idx = communityPosts.findIndex(p => String(p._id) === String(postId));
                    if (idx !== -1) communityPosts[idx].comments_count = 0;
                }
            } catch (err) {
                console.error('Error recargando comentarios:', err);
            }
            
            showNotification('¡Comentario publicado!', 'success');
        } else {
            showNotification('Error: ' + (data.error || 'No se pudo publicar el comentario'), 'error');
        }
    } catch (err) {
        console.error('❌ submitComment() - Error:', err);
        showNotification('Error al publicar comentario', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

// ==========================================
// UTILIDADES DE COMUNIDAD
// ==========================================
function getTimeAgo(dateString) {
    // Accept Date object or ISO/string
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    let seconds = Math.floor((now - date) / 1000);
    // Si la fecha es futura, mostrar "Hace un momento"
    if (seconds < 0) seconds = 0;

    if (seconds < 60) return 'Hace un momento';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;

    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
}

// Update all elements with class 'time-ago' using their data-time attribute
function updateTimeAgoElements() {
    const nodes = document.querySelectorAll('.time-ago');
    nodes.forEach(n => {
        const ts = n.dataset.time;
        if (!ts) return;
        const txt = getTimeAgo(ts);
        n.textContent = txt;
        // Mostrar tooltip con hora local y UTC
        try {
            const d = new Date(ts);
            if (!isNaN(d.getTime())) {
                const local = d.toLocaleString();
                const utc = d.toISOString().replace('T', ' ').replace('Z', ' UTC');
                n.title = `Local: ${local}\nUTC: ${utc}`;
            }
        } catch (e) {}
    });
}

let timeAgoIntervalId = null;
function startTimeAgoUpdater() {
    // Update immediately then every 15 seconds (keeps minutes/hours accurate)
    updateTimeAgoElements();
    if (timeAgoIntervalId) clearInterval(timeAgoIntervalId);
    timeAgoIntervalId = setInterval(updateTimeAgoElements, 15000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function showPostMenu(postId) {
    // TODO: Implementar menú de opciones (eliminar, editar, etc.)
    console.log('Menu para post:', postId);
}

function renderCommunitySection() {
    // Inicializar comunidad dinámica
    initCommunity();
}

// SECCIÓN: AYUDA Y CONFIGURACIÓN
function renderAyudaSection() {
    // Esta sección puede quedarse estática o cargar FAQs desde BD
    console.log('✅ Sección Ayuda cargada');
    // Attach handler to the 'Ver FAQ' quick card button to scroll to the FAQ block
    setTimeout(() => {
        const viewFAQBtn = document.getElementById('viewFAQBtn');
        const faqBlock = document.getElementById('FAQ');
        if (viewFAQBtn && faqBlock) {
            viewFAQBtn.addEventListener('click', (e) => {
                e.preventDefault();
                faqBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }, 0);
    // Inicializar interacciones de FAQ (acordeón + filtros)
    try {
        initFAQInteractions();
    } catch (e) {
        console.warn('initFAQInteractions failed', e);
    }
}

// Inicializa el comportamiento del FAQ: acordeón y filtros por categoría
function initFAQInteractions() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems || faqItems.length === 0) return;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!question || !answer) return;
        answer.style.maxHeight = '0px';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.28s ease';

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            if (isOpen) {
                item.classList.remove('open');
                answer.style.maxHeight = '0px';
            } else {
                document.querySelectorAll('.faq-item.open').forEach(openItem => {
                    openItem.classList.remove('open');
                    const openAnswer = openItem.querySelector('.faq-answer');
                    if (openAnswer) openAnswer.style.maxHeight = '0px';
                });
                item.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    const categoryBtns = document.querySelectorAll('.faq-category-btn');
    if (!categoryBtns || categoryBtns.length === 0) return;

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            faqItems.forEach(item => {
                const itemCat = item.getAttribute('data-category') || 'general';
                if (!category || category === 'all' || itemCat === category) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
                if (item.classList.contains('open')) {
                    item.classList.remove('open');
                    const ans = item.querySelector('.faq-answer');
                    if (ans) ans.style.maxHeight = '0px';
                }
            });
        });
    });
}

function renderConfiguracionSection() {
    const section = document.getElementById('configuracion');
    if (!section) return;

    // Cargar datos de configuración
    const firstName = section.querySelector('#firstName');
    const lastName = section.querySelector('#lastName');
    const userEmail = section.querySelector('#userEmail');
    const userBio = section.querySelector('#userBio');

    if (firstName) firstName.value = currentUser.firstName || '';
    if (lastName) lastName.value = currentUser.lastName || '';
    if (userEmail) userEmail.value = currentUser.email || '';
    if (userBio) userBio.value = currentUser.bio || '';
}

// ==========================================
// 3. EVENT LISTENERS
// ==========================================
function initEventListeners(token) {
    // Logout
    document.getElementById('btnLogout')?.addEventListener('click', () => {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.clear();
            showNotification('Sesión cerrada', 'info');
            setTimeout(() => window.location.href = 'login.html', 800);
        }
    });

    // Guardar configuración
    document.getElementById('saveSettings')?.addEventListener('click', async () => {
        await saveUserSettings(token);
    });

    // Subir foto
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            await uploadUserPhoto(e, token);
        });
    }

    // Click + drag & drop para la zona de subida
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        // Click abre el file picker
        uploadArea.addEventListener('click', (ev) => {
            ev.preventDefault();
            if (photoInput) photoInput.click();
        });

        // Visual feedback on drag
        ['dragenter', 'dragover'].forEach(evt => {
            uploadArea.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            uploadArea.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
            });
        });

        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : null;
            if (files && files.length > 0) {
                const file = files[0];
                try {
                    await uploadUserPhotoFile(file, token);
                } catch (err) {
                    showNotification('Error al subir la imagen', 'error');
                    console.error('upload drop error', err);
                }
            }
        });
    }

    // Filtros de meditación
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            applyFilters();
        });
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target') || this.getAttribute('data-settings-tab');
            if (!target) return;

            // Desactivar todos
            this.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Mostrar panel
            if (this.getAttribute('data-target')) {
                document.querySelectorAll('.community-panel').forEach(p => p.style.display = 'none');
                document.querySelector(target).style.display = 'block';
            } else if (this.getAttribute('data-settings-tab')) {
                document.querySelectorAll('.settings-tab-panel').forEach(p => p.style.display = 'none');
                document.getElementById(`tab-${target}`).style.display = 'block';
            }
        });
    });
}

// Guardar configuración del usuario
async function saveUserSettings(token) {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const bio = document.getElementById('userBio').value.trim();

    if (!firstName) {
        showNotification('El nombre es obligatorio', 'error');
        return;
    }

    try {
        const data = await window.dashboardAPI.updateUserProfile({ firstName, lastName, bio });
        if (!data.success) throw new Error(data.error);

        currentUser = { ...currentUser, firstName, lastName, bio };
        localStorage.setItem('user', JSON.stringify(currentUser));
        showNotification('¡Configuración guardada!', 'success');
    } catch (err) {
        showNotification('Error: ' + err.message, 'error');
    }
}

// Subir foto de perfil
async function uploadUserPhoto(e, token) {
    // Soporte para input change events
    const file = (e && e.target && e.target.files && e.target.files[0]) ? e.target.files[0] : null;
    if (!file) {
        showNotification('No se seleccionó ninguna imagen', 'error');
        return;
    }
    await uploadUserPhotoFile(file, token);
}

// Helper que sube un File al backend y actualiza UI
async function uploadUserPhotoFile(file, token) {
    if (!file) {
        showNotification('No hay archivo', 'error');
        return;
    }

    const allowed = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowed.includes(file.type)) {
        // Some browsers may report jpeg as image/pjpeg or similar; also check extension as fallback
        const ext = (file.name || '').split('.').pop().toLowerCase();
        if (!['svg','png','jpg','jpeg','gif'].includes(ext)) {
            showNotification('Formato no válido. Usa SVG, PNG, JPG o GIF.', 'error');
            return;
        }
    }

    try {
        // Optional: show a local preview immediately
        const reader = new FileReader();
        reader.onload = function(ev) {
            const url = ev.target.result;
            document.querySelectorAll('.user-profile img, #profilePhotoPreview').forEach(img => {
                img.src = url;
            });
        };
        reader.readAsDataURL(file);

        // Call backend upload (dashboardAPI should accept a File)
        const data = await window.dashboardAPI.uploadProfilePhoto(file);
        if (!data || !data.success) {
            throw new Error((data && data.error) ? data.error : 'Error en el servidor');
        }

        // Use server URL (if returned) to avoid data URL persistence
        if (data.photoUrl) {
            currentUser.photo = data.photoUrl;
            localStorage.setItem('user', JSON.stringify(currentUser));
            document.querySelectorAll('.user-profile img, #profilePhotoPreview').forEach(img => {
                img.src = data.photoUrl;
            });
        }

        showNotification('¡Foto actualizada!', 'success');
    } catch (err) {
        console.error('uploadUserPhotoFile error', err);
        showNotification('Error subiendo foto: ' + (err.message || ''), 'error');
    }

}

// ==========================================
// 4. NAVEGACIÓN
// ==========================================
function handleNavigation() {
    const hash = window.location.hash.substring(1) || 'inicio';
    const sectionId = hash.split('?')[0]; // Extrae solo la parte antes del ?
    navigateToSection(sectionId);

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1) || 'inicio';
        const sectionId = hash.split('?')[0]; // Extrae solo la parte antes del ?
        // Si la nueva hash apunta a un post compartido, manejarlo explícitamente
        if (window.location.hash && window.location.hash.startsWith('#post-')) {
            const postId = window.location.hash.replace('#post-', '');
            showSharedPost(postId);
            return;
        }
        navigateToSection(sectionId);
    });
}

function navigateToSection(id) {
    document.querySelectorAll('.spa-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`[href="#${id}"]`);
    if (active) active.classList.add('active');

    window.scrollTo(0, 0);
    
    // Si navega a "inicio" o "mi-ruta", recargar progreso desde BD
    if (id === 'inicio' || id === 'mi-ruta') {
        reloadProgressData();
    }
    
    // Si navega a "comunidad", reinicializar la sección de comunidad
    if (id === 'comunidad') {
        console.log('📍 Navegando a comunidad - Reinicializando...');
        renderCommunitySection();
    }
}


// Mostrar un post compartido por id: buscar en feed, si no existe pedirlo al API y renderizarlo
async function showSharedPost(postId) {
    // Ocultar todas las secciones y mostrar comunidad
    document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
    const comunidadSection = document.getElementById('comunidad');
    if (comunidadSection) comunidadSection.style.display = '';

    // Asegurar que la sección de comunidad esté inicializada
    try {
        renderCommunitySection();
    } catch (e) {
        console.warn('showSharedPost() - renderCommunitySection error', e);
    }

    // Esperar un poco a que el DOM de comunidad esté listo
    setTimeout(async () => {
        const feed = document.getElementById('posts-feed');
        const postCard = document.getElementById(`post-${postId}`);
        if (postCard) {
            postCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            try { toggleComments(postId); } catch(e) {}
            return;
        }

        // Solicitar post al API y renderizar en vista grande
        try {
            const res = await window.dashboardAPI.getPostById(postId);
            console.log('showSharedPost() - getPostById response:', res);
            if (res && res.success && res.post) {
                // Si el usuario no está autenticado y la política lo exige, mostrar banner
                if (!getCurrentUserId()) {
                    if (feed) {
                        feed.innerHTML = `
                            <div style="max-width:700px;margin:60px auto;padding:36px;background:var(--card-bg);border-radius:16px;border:1px solid var(--border-color);text-align:center;">
                                <i class="ri-lock-2-line" style="font-size:48px;color:var(--accent-color);opacity:0.9"></i>
                                <h2 style="margin-top:18px;color:var(--text-primary);">Debes iniciar sesión para ver este contenido</h2>
                                <p style="color:var(--text-secondary);margin-top:8px;">Inicia sesión o crea una cuenta en Serenity para acceder a este post.</p>
                                <a href="login.html" class="btn" style="display:inline-block;margin-top:20px;padding:10px 20px;border-radius:10px;background:var(--accent-color);color:#fff;text-decoration:none;font-weight:600;">Iniciar sesión</a>
                            </div>
                        `;
                    }
                    return;
                }

                if (feed) {
                    feed.innerHTML = renderPostCard(res.post, true, true);
                    updateUserAvatars();
                    setTimeout(() => loadCommentsReadOnly(postId), 80);
                }
            } else {
                console.warn('showSharedPost() - Post not found or API error', res);
                if (feed) feed.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">Post no encontrado</p>';
            }
        } catch (err) {
            console.error('showSharedPost() - error fetching post:', err);
            if (feed) feed.innerHTML = '<p style="text-align:center;padding:20px;color:#ff6b6b;">Error al cargar el post</p>';
        }
    }, 200);
}

async function reloadProgressData() {
    try {
        if (window.dashboardAPI) {
            const [progressRes, coursesRes] = await Promise.allSettled([
                window.dashboardAPI.getUserProgress(),
                window.dashboardAPI.getUserCourses()
            ]);
            
            if (progressRes.status === 'fulfilled' && progressRes.value.success) {
                userProgress = progressRes.value.progress;
            }
            
            if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
                userCourses = coursesRes.value.courses || [];
            }
            
            // Re-renderizar secciones
            renderInitSection();
            renderMiRutaSection();
        }
    } catch (error) {
        console.error('Error reloading progress:', error);
    }
}

// ==========================================
// 5. UTILIDADES
// ==========================================
function updateElement(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function getActivityIcon(type) {
    const icons = {
        'completed': 'fas fa-check-circle',
        'badge': 'fas fa-medal',
        'exercise': 'fas fa-brain',
        'level': 'fas fa-star'
    };
    return icons[type] || 'fas fa-circle';
}

function getMediaIcon(type) {
    const icons = {
        'audio': 'ri-headphone-line',
        'video': 'ri-video-line',
        'interactive': 'ri-magic-line'
    };
    return icons[type] || 'ri-play-line';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Duplicate getTimeAgo removed. Use the version at line 1374.
function redirectToLogin() {
    localStorage.clear();
    showNotification('Debes iniciar sesión.', 'error');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

// ==========================================
// 6. FUNCIONES DE NAVEGACIÓN ESPECÍFICAS
// ==========================================
function startCourse(courseId) {
    // Buscar primero en userCourses (cursos en progreso)
    let course = userCourses.find(c => c.id === courseId);
    
    // Si no está en userCourses, buscar en allTechniques
    if (!course) {
        course = allTechniques.find(t => t.id === courseId);
    }
    
    if (course) {
        // Usar la URL definida en el objeto, o construirla basándose en el nombre
        if (course.url) {
            window.location.href = course.url;
        } else if (course.name) {
            // Convertir el nombre a formato de archivo
            const fileName = course.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                .replace(/\s+/g, '-'); // Reemplazar espacios con guiones
            
            // Determinar si es ejercicio o meditación según la categoría o tipo
            const isExercise = course.category === 'Regulación somática' || course.type === 'exercise';
            const folder = isExercise ? 'ejercicios' : 'meditaciones';
            const prefix = isExercise ? 'ejercicio' : 'meditacion';
            
            window.location.href = `/${folder}/${prefix}-${fileName}.html`;
        }
    }
}

function startTechnique(techniqueId) {
    const technique = allTechniques.find(t => t.id === techniqueId);
    if (technique) {
        // Usar la URL definida en el objeto, o construirla basándose en el nombre
        if (technique.url) {
            window.location.href = technique.url;
        } else if (technique.name) {
            // Convertir el nombre a formato de archivo
            const fileName = technique.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                .replace(/\s+/g, '-'); // Reemplazar espacios con guiones
            
            // Determinar si es ejercicio o meditación según la categoría o tipo
            const isExercise = technique.category === 'Regulación somática' || technique.type === 'exercise';
            const folder = isExercise ? 'ejercicios' : 'meditaciones';
            const prefix = isExercise ? 'ejercicio' : 'meditacion';
            
            window.location.href = `/${folder}/${prefix}-${fileName}.html`;
        }
    }
}

function startPath(pathName) {
    // Guardar la ruta seleccionada en sessionStorage
    sessionStorage.setItem('selectedPath', pathName);
    
    // Establecer como ruta activa en la BD
    (async () => {
        try {
            const res = await window.dashboardAPI.setActivePath(pathName);
            if (res.success) {
                console.log('✓ Ruta activa establecida:', pathName);
                // Recargar selector de ruta activa
                renderActivePathSelector();
            }
        } catch (err) {
            console.error('Error estableciendo ruta activa:', err);
        }
    })();
    
    // Cambiar el hash a meditaciones
    window.location.hash = '#meditaciones';
    
    // Recargar la sección de meditaciones para mostrar técnicas de la ruta
    setTimeout(() => {
        renderMeditacionesSection();
    }, 100);
    
    // Mostrar notificación
    console.log('🎯 Ruta iniciada:', pathName);
    showPathNotification(pathName);
}

function showPathNotification(pathName) {
    // Crear toast/notificación visual
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    toast.innerHTML = `<i class="ri-compass-3-line"></i> Ruta iniciada: <strong>${pathName}</strong>`;
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function navigateToExercise(techniqueId) {
    startTechnique(techniqueId);
}

function applyFilters() {
    const activeDuration = document.querySelector('.filter-btn[data-duration].active')?.dataset.duration || 'all';
    const activeGoal = document.querySelector('.filter-btn[data-goal].active')?.dataset.goal || 'all';

    // Si estamos viendo una ruta, usar applyPathFilters en su lugar
    if (window.currentPathTechniques && window.currentPathName) {
        applyPathFilters();
        return;
    }

    // Si no, filtrar el catálogo completo
    document.querySelectorAll('.card-simulation').forEach(card => {
        const duration = parseInt(card.dataset.duration);
        const goal = card.dataset.goal;
        let show = true;

        if (activeDuration !== 'all') {
            const filterDuration = parseInt(activeDuration);
            if (activeDuration === '5' && duration > 5) show = false;
            if (activeDuration === '10' && (duration < 6 || duration > 12)) show = false;
            if (activeDuration === '15' && duration < 15) show = false;
        }

        if (activeGoal !== 'all') {
            // Mejorar búsqueda de goal para ser más flexible
            const normalizedGoal = activeGoal.toLowerCase();
            const cardGoal = goal ? goal.toLowerCase() : '';
            show = show && (cardGoal === normalizedGoal || cardGoal.includes(normalizedGoal) || normalizedGoal.includes(cardGoal));
        }

        card.style.display = show ? 'block' : 'none';
    });
}

// ======= Sincronización de prácticas locales =======
async function syncLocalPracticeLog() {
    const key = 'serenityPracticeLog';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    if (!list || list.length === 0) return;

    // Enviar todas las prácticas al backend
    const promises = list.map(item => {
        const technique = item.technique || item.tech;
        const duration = item.minutes || item.duration || 0;
        const pre = item.pre || 5;
        const post = item.post || 5;
        const techniqueId = window.getTechniqueIdByName ? window.getTechniqueIdByName(technique) : null;
        
        return window.dashboardAPI.logPractice({ 
            technique, 
            techniqueId,
            duration, 
            intensityBefore: pre, 
            intensityAfter: post,
            completed: true
        })
            .then(res => ({ok: true, res}))
            .catch(err => ({ok: false, err}));
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.ok).length;
    if (successCount > 0) {
        console.log(`Sincronizadas ${successCount}/${list.length} prácticas locales con la BD`);
    }

    // Mantener solo las prácticas que fallaron para reintento
    const failed = [];
    for (let i = 0; i < results.length; i++) {
        if (!results[i].ok) failed.push(list[i]);
    }

    if (failed.length === 0) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, JSON.stringify(failed));
        console.warn(`Quedaron ${failed.length} prácticas sin sincronizar, se guardaron localmente para reintento.`);
    }
}

// Obtener ID del usuario actual en formato string (varias estructuras)
function getCurrentUserId() {
    if (!currentUser) return sessionStorage.getItem('user_id') || null;
    // Backend User.to_dict() devuelve 'id'
    if (currentUser.id) return String(currentUser.id);
    if (currentUser._id) return String(currentUser._id);
    // fallback a sessionStorage
    return sessionStorage.getItem('user_id') || null;
}

document.addEventListener('DOMContentLoaded', () => {
    const photoInput = document.getElementById('photoInput');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');

    if (photoInput && profilePhotoPreview) {
        photoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePhotoPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});