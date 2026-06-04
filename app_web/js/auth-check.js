/**
 * auth-check.js
 * Verifica si el usuario está autenticado (tiene sesión)
 * Si no está autenticado, redirige a la página de login
 * Debe cargarse al inicio de dashboard.html y otras páginas protegidas
 */

(function() {
    'use strict';

    /**
     * Verifica si el usuario tiene sesión activa
     * @returns {Promise<boolean>} - true si está autenticado, false si no
     */
    async function checkAuthentication() {
        try {
            // Verificar si hay user_id en sessionStorage (guardado al login)
            const userId = sessionStorage.getItem('user_id');
            const userEmail = sessionStorage.getItem('user_email');
            
            if (userId && userEmail) {
                console.log('[AUTH-CHECK] Usuario autenticado:', userEmail);
                return true;
            }
            
            // Si no hay en sessionStorage, verificar con el backend
            // (en caso de que la sesión haya expirado pero el servidor aún la tenga)
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                credentials: 'include'  // Incluir cookies de sesión
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user_id) {
                    // Guardar en sessionStorage para próximas comprobaciones
                    sessionStorage.setItem('user_id', data.user_id);
                    sessionStorage.setItem('user_email', data.email || 'Usuario');
                    console.log('[AUTH-CHECK] Sesión verificada con backend');
                    return true;
                }
            }
            
            // Si la URL apunta a un post compartido (#post-...), permitir ver el recurso público
            // Esto habilita que enlaces compartidos se muestren sin forzar login.
            try {
                const hash = window.location.hash || '';
                if (hash.startsWith('#post-')) {
                    console.log('[AUTH-CHECK] Usuario no autenticado pero URL pública (#post-) - permitiendo acceso de solo lectura');
                    return true;
                }
            } catch (e) {
                // ignore
            }

            console.log('[AUTH-CHECK] Usuario no autenticado - redirigiendo a login');
            return false;
            
        } catch (error) {
            console.error('[AUTH-CHECK] Error al verificar autenticación:', error);
            return false;
        }
    }

    /**
     * Redirige al usuario a la página de login
     */
    function redirectToLogin() {
        console.log('[AUTH-CHECK] Redirigiendo a login.html...');
        // Guardar URL actual para regresar después del login (opcional)
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = '/login.html';
    }

    /**
     * Inicializa la verificación de autenticación
     */
    async function init() {
        // Mostrar un loader mientras verificamos
        document.body.style.opacity = '0.5';
        document.body.style.pointerEvents = 'none';
        
        const isAuthenticated = await checkAuthentication();
        
        if (!isAuthenticated) {
            redirectToLogin();
        } else {
            // Usuario autenticado - permitir acceso
            document.body.style.opacity = '1';
            document.body.style.pointerEvents = 'auto';
            
            // Disparar evento para que otros scripts sepan que el usuario está autenticado
            window.dispatchEvent(new Event('userAuthenticated'));
        }
    }

    // Ejecutar verificación cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exportar funciones globalmente si es necesario
    window.AuthCheck = {
        checkAuthentication,
        redirectToLogin
    };
})();
