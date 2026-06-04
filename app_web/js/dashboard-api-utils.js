// dashboard-api-utils.js
// Utilidades para llamadas API centralizadas

const API_BASE = '/api';

// Técnicas cargadas desde el servidor (se actualiza al llamar loadTechniquesMap)
let techniquesMap = {};

// Función para cargar técnicas desde el servidor y crear el mapa
async function loadTechniquesMap() {
    try {
        const response = await fetch(`${API_BASE}/content/techniques`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.success && data.techniques) {
            techniquesMap = {};
            data.techniques.forEach(tech => {
                techniquesMap[tech.name] = tech.id;
            });
            console.log('✅ Técnicas cargadas:', Object.keys(techniquesMap).length);
        }
    } catch (err) {
        console.warn('⚠️ No se pudo cargar técnicas:', err);
    }
}

// Helper para obtener techniqueId por nombre
function getTechniqueIdByName(techniqueName) {
    return techniquesMap[techniqueName] || null;
}

class DashboardAPI {
        // Editar post
        async editPost(postId, content, image = null) {
            return this.fetch(`/api/community/posts/${postId}`, {
                method: 'PUT',
                body: JSON.stringify({ content, image })
            });
        }

        // Editar comentario
        async editComment(commentId, content) {
            return this.fetch(`/api/community/comments/${commentId}`, {
                method: 'PUT',
                body: JSON.stringify({ content })
            });
        }

        // Eliminar comentario
        async deleteComment(commentId) {
            return this.fetch(`/api/community/comments/${commentId}`, {
                method: 'DELETE'
            });
        }
    constructor() {
        this.token = localStorage.getItem('token');
    }

    // ==========================================
    // USUARIOS
    // ==========================================
    async getCurrentUser() {
        return this.fetch(`${API_BASE}/users/me`);
    }

    async updateUserProfile(data) {
        return this.fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async uploadProfilePhoto(file) {
        const form = new FormData();
        form.append('photo', file);
        return this.fetch(`${API_BASE}/users/photo`, {
            method: 'POST',
            body: form,
            skipContentType: true
        });
    }

    // ==========================================
    // PROGRESO
    // ==========================================
    async getUserProgress() {
        return this.fetch(`${API_BASE}/progress/me`);
    }

    async getUserCourses() {
        return this.fetch(`${API_BASE}/progress/courses`);
    }

    async getCourseById(courseId) {
        return this.fetch(`${API_BASE}/progress/courses/${courseId}`);
    }

    async updateCourseProgress(courseId, data) {
        return this.fetch(`${API_BASE}/progress/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async completeCourse(courseId) {
        return this.fetch(`${API_BASE}/progress/courses/${courseId}/complete`, {
            method: 'POST'
        });
    }

    async getFrameworkStats() {
        return this.fetch(`${API_BASE}/progress/framework-stats`);
    }

    async logPractice(data) {
        // Aceptar objeto con: technique, duration, intensityBefore, intensityAfter, type, techniqueId
        const payload = {
            technique: data.technique || 'Unknown',
            duration: data.duration || 0,
            intensityBefore: data.intensityBefore || 5,
            intensityAfter: data.intensityAfter || 5,
            type: data.type || 'meditation',
            techniqueId: data.techniqueId || null,
            completed: data.completed !== undefined ? data.completed : true
        };
        return this.fetch(`${API_BASE}/progress/log-practice`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    // ==========================================
    // CONTENIDO (TÉCNICAS)
    // ==========================================
    async getAllTechniques(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.fetch(`${API_BASE}/content/techniques?${params}`);
    }

    async getTechniqueById(techniqueId) {
        return this.fetch(`${API_BASE}/content/techniques/${techniqueId}`);
    }

    async getTechniquesByCategory(category) {
        return this.fetch(`${API_BASE}/content/techniques?category=${category}`);
    }

    async searchTechniques(query) {
        return this.fetch(`${API_BASE}/content/techniques/search?q=${encodeURIComponent(query)}`);
    }

    // ==========================================
    // COMUNIDAD
    // ==========================================
    async getCommunityPosts(limit = 10, offset = 0) {
        return this.fetch(`${API_BASE}/community/posts?limit=${limit}&offset=${offset}`);
    }

    async getPostById(postId) {
        return this.fetch(`${API_BASE}/community/posts/${postId}`);
    }

    async createPost(content, image = null) {
        return this.fetch(`${API_BASE}/community/posts`, {
            method: 'POST',
            body: JSON.stringify({ content, image })
        });
    }

    async deletePost(postId) {
        return this.fetch(`${API_BASE}/community/posts/${postId}`, {
            method: 'DELETE'
        });
    }

    async likePost(postId) {
        return this.fetch(`${API_BASE}/community/posts/${postId}/like`, {
            method: 'POST'
        });
    }

    async unlikePost(postId) {
        return this.fetch(`${API_BASE}/community/posts/${postId}/unlike`, {
            method: 'POST'
        });
    }

    async getPostComments(postId) {
        return this.fetch(`${API_BASE}/community/posts/${postId}/comments`);
    }

    async createComment(postId, content) {
        return this.fetch(`${API_BASE}/community/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    async getCommunityEvents(limit = 10) {
        return this.fetch(`${API_BASE}/community/events?limit=${limit}`);
    }

    // ==========================================
    // CONTENIDO ADICIONAL (quotes, prompts, recommended paths)
    // ==========================================
    async getQuotes() {
        return this.fetch(`${API_BASE}/content/quotes`);
    }

    async getPrompts() {
        return this.fetch(`${API_BASE}/content/prompts`);
    }

    async getRecommendedPaths() {
        return this.fetch(`${API_BASE}/content/recommended_paths`);
    }

    async getActivePath() {
        return this.fetch(`${API_BASE}/users/active-path`);
    }

    async setActivePath(pathName) {
        return this.fetch(`${API_BASE}/users/active-path`, {
            method: 'POST',
            body: JSON.stringify({ pathName })
        });
    }

    async getLeaderboard(period = 'week') {
        return this.fetch(`${API_BASE}/community/leaderboard?period=${period}`);
    }

    async joinEvent(eventId) {
        return this.fetch(`${API_BASE}/community/events/${eventId}/join`, {
            method: 'POST'
        });
    }

    // ==========================================
    // RETOS/METAS
    // ==========================================
    async getActiveChallenges() {
        return this.fetch(`${API_BASE}/challenges/active`);
    }

    async joinChallenge(challengeId) {
        return this.fetch(`${API_BASE}/challenges/${challengeId}/join`, {
            method: 'POST'
        });
    }

    async getUserChallenges() {
        return this.fetch(`${API_BASE}/challenges/user`);
    }

    // ==========================================
    // NOTIFICACIONES
    // ==========================================
    async getNotifications(limit = 20) {
        return this.fetch(`${API_BASE}/notifications?limit=${limit}`);
    }

    async markNotificationAsRead(notificationId) {
        return this.fetch(`${API_BASE}/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    async updateNotificationSettings(settings) {
        return this.fetch(`${API_BASE}/users/notification-settings`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // ==========================================
    // FAVORITOS
    // ==========================================
    async saveFavoriteTechnique(techniqueId) {
        return this.fetch(`${API_BASE}/users/favorites`, {
            method: 'POST',
            body: JSON.stringify({ techniqueId })
        });
    }

    async removeFavoriteTechnique(techniqueId) {
        return this.fetch(`${API_BASE}/users/favorites/${techniqueId}`, {
            method: 'DELETE'
        });
    }

    async getUserFavorites() {
        return this.fetch(`${API_BASE}/users/favorites`);
    }

    // ==========================================
    // HELPER INTERNO
    // ==========================================
    async fetch(url, options = {}) {
        const headers = {
            ...(options.skipContentType ? {} : { 'Content-Type': 'application/json' })
        };

        // Leer token fresco desde localStorage en cada petición (maneja login después de cargar la página)
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                // Incluir cookies por si la sesión está en cookie (web flow)
                credentials: 'include',
                ...options,
                headers
            });

            // Si es 404 o 501, retornar error amigable
            if (response.status === 404 || response.status === 501) {
                console.warn(`⚠️ Endpoint no implementado: ${url}`);
                throw new Error(`Endpoint no disponible: ${response.status}`);
            }

            if (response.status === 401) {
                // Token expirado o sesión inválida
                console.warn('API returned 401 for', url);
                this.handleUnauthorized();
                throw new Error('No autorizado');
            }

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error(`❌ Respuesta no es JSON en: ${url}`, contentType);
                throw new Error('La respuesta del servidor no es JSON válida. Verifica que el endpoint exista.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (err) {
            console.error('❌ Error en API:', url, err && err.message ? err.message : err);
            // Mostrar alerta mínima al usuario en caso de fallo al guardar práctica
            if (url.endsWith('/practices')) {
                try { alert('No se pudo guardar la práctica en el servidor. Se guardó localmente.'); } catch(e) {}
            }
            throw err;
        }
    }

    handleUnauthorized() {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Crear instancia global
window.dashboardAPI = new DashboardAPI();

// Exponer helpers globales
window.getTechniqueIdByName = getTechniqueIdByName;
window.loadTechniquesMap = loadTechniquesMap;

// Cargar técnicas automáticamente cuando hay token
if (localStorage.getItem('token')) {
    loadTechniquesMap().catch(err => console.warn('Error cargando técnicas:', err));
}