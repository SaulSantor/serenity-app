// js/login.js - VERSIÓN FINAL: 100% BACKEND + REDIRECCIÓN
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = '/api/auth';
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // === LOGIN ===
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        if (!email && !password) {
            showMessage('Por favor ingresa tu email y contraseña', 'error');
            return;
        }
        if (!email) {
            showMessage('Por favor ingresa tu email', 'error');
            return;
        }
        if (!password) {
            showMessage('Por favor ingresa tu contraseña', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('user_id', data.user._id || data.user.id);
                sessionStorage.setItem('user_email', data.user.email);
                window.location.href = 'dashboard.html';
            } else {
                showMessage(data.error || data.details || 'Credenciales inválidas', 'error');
            }
        } catch (err) {
            showMessage('Error de conexión. Verifica que el backend esté activo.', 'error');
        }
    });

    // === REGISTRO ===
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('registerFirstName').value.trim();
        const lastName = document.getElementById('registerLastName').value.trim();
        const email = document.getElementById('registerEmail').value.trim().toLowerCase();
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerPasswordConfirm').value;

        if (!firstName) {
            showMessage('Por favor ingresa tu nombre', 'error');
            return;
        }
        if (!lastName) {
            showMessage('Por favor ingresa tu apellido', 'error');
            return;
        }
        if (!email) {
            showMessage('Por favor ingresa tu email', 'error');
            return;
        }
        if (!password) {
            showMessage('Por favor ingresa una contraseña', 'error');
            return;
        }
        if (!confirm) {
            showMessage('Por favor confirma tu contraseña', 'error');
            return;
        }

        if (password !== confirm) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        if (password.length < 8) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    firstName,
                    lastName
                }),
                credentials: 'include'
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('user_id', data.user._id || data.user.id);
                sessionStorage.setItem('user_email', data.user.email);
                window.location.href = 'dashboard.html';
            } else {
                showMessage(data.error || 'Error al registrarse', 'error');
            }
        } catch (err) {
            showMessage('Error de conexión. Verifica que el backend esté activo.', 'error');
        }
    });
});

// TOGGLE FORMS
function toggleForms() {
    document.getElementById('loginContainer').classList.toggle('active');
    document.getElementById('registerContainer').classList.toggle('active');
}

// SOCIAL LOGIN
function loginSocial(provider) {
    showMessage(`Login con ${provider} no implementado`, 'info');
}

// FUNCIÓN PARA MOSTRAR MENSAJES PROFESIONALES
function showMessage(message, type = 'info') {
    // Remover mensaje anterior si existe
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) existingMsg.remove();

    // Crear nuevo mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.textContent = message;
    
    // Insertar al inicio del body
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}
