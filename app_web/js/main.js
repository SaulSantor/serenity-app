// ===== MAIN.JS - LANDING PAGE =====

// === CONSTANTES API ===
const API_CONTACT = '/api/contact';
const API_STATS = '/api/stats';

// === CARGAR ESTADÍSTICAS EN TIEMPO REAL ===
async function loadRealStats() {
  try {
    console.log('📊 Cargando estadísticas en tiempo real...');
    const res = await fetch(API_STATS);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.success && data.stats) {
      const stats = data.stats;
      
      // Actualizar estadísticas en el DOM
      updateStatCard(0, formatNumber(stats.totalUsers), 'Usuarios activos');
      updateStatCard(1, stats.averageRating + '/5', 'Calificación promedio');
      updateStatCard(2, formatNumber(stats.totalPractices), 'Sesiones completadas');
      updateStatCard(3, stats.stressReductionRate + '%', 'Reducción de estrés');
      
      console.log('✅ Estadísticas cargadas:', stats);
    }
  } catch (err) {
    console.warn('⚠️ Error cargando estadísticas (usando valores por defecto):', err.message);
    // Las estadísticas por defecto del HTML se mantienen
  }
}

function updateStatCard(index, number, label) {
  const statCards = document.querySelectorAll('.stat-card');
  if (statCards[index]) {
    const numberEl = statCards[index].querySelector('.stat-number');
    const labelEl = statCards[index].querySelector('.stat-label');
    if (numberEl) numberEl.textContent = number;
    if (labelEl) labelEl.textContent = label;
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}


document.addEventListener('DOMContentLoaded', function() {
  
  // ===== CARGAR ESTADÍSTICAS AL INICIO =====
  loadRealStats();
  
  // ===== MOBILE MENU =====
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
      menuToggle.classList.toggle('active');
      document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking on nav links
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
  
  // ===== CONTACT FORM CON BACKEND =====
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      
      // Obtener datos del formulario
      const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        message: document.getElementById('message').value.trim()
      };
      
      // Validación básica en frontend
      if (!formData.name || !formData.email || !formData.message) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
      }
      
      if (formData.message.length < 10) {
        showNotification('El mensaje debe tener al menos 10 caracteres', 'error');
        return;
      }
      
      // Deshabilitar botón mientras se envía
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      
      try {
        console.log('📤 Enviando mensaje de contacto...');
        const res = await fetch(API_CONTACT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        
        if (data.success) {
          showNotification(data.message || '¡Gracias por tu mensaje! Te contactaremos pronto.', 'success');
          contactForm.reset();
          console.log('✅ Mensaje enviado exitosamente');
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
        
      } catch (err) {
        console.error('❌ Error enviando mensaje:', err);
        showNotification('Error: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
  
  // ===== BREATHING EXERCISE =====
  const startDemoBtn = document.getElementById('startDemoBtn');
  const breathingOverlay = document.getElementById('breathingOverlay');
  const closeBreathing = document.getElementById('closeBreathing');
  const stopBreathing = document.getElementById('stopBreathing');
  const breathingCircle = document.getElementById('breathingCircle');
  const breathingText = document.getElementById('breathingText');
  
  let breathingTimer = null;
  let breathingPhase = 0;
  
  function startBreathingExercise() {
    if (!breathingOverlay) return;
    
    breathingOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    breathingPhase = 0;
    
    // Start after 2 seconds
    setTimeout(() => {
      runBreathingCycle();
    }, 2000);
  }
  
  function runBreathingCycle() {
    if (!breathingOverlay.classList.contains('active')) return;
    
    switch(breathingPhase) {
      case 0: // Inhale
        breathingText.textContent = 'Inhala profundamente...';
        breathingCircle.classList.remove('shrink');
        breathingCircle.classList.add('expand');
        breathingTimer = setTimeout(() => {
          breathingPhase = 1;
          runBreathingCycle();
        }, 4000);
        break;
        
      case 1: // Hold
        breathingText.textContent = 'Mantén...';
        breathingTimer = setTimeout(() => {
          breathingPhase = 2;
          runBreathingCycle();
        }, 7000);
        break;
        
      case 2: // Exhale
        breathingText.textContent = 'Exhala lentamente...';
        breathingCircle.classList.remove('expand');
        breathingCircle.classList.add('shrink');
        breathingTimer = setTimeout(() => {
          breathingPhase = 3;
          runBreathingCycle();
        }, 8000);
        break;
        
      case 3: // Pause
        breathingText.textContent = 'Descansa...';
        breathingTimer = setTimeout(() => {
          breathingPhase = 0;
          runBreathingCycle();
        }, 2000);
        break;
    }
  }
  
  function stopBreathingExercise() {
    if (!breathingOverlay) return;
    
    breathingOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    if (breathingTimer) {
      clearTimeout(breathingTimer);
      breathingTimer = null;
    }
    
    breathingCircle.classList.remove('expand', 'shrink');
    breathingText.textContent = 'Prepárate...';
    breathingPhase = 0;
  }
  
  if (startDemoBtn) {
    startDemoBtn.addEventListener('click', startBreathingExercise);
  }
  
  if (closeBreathing) {
    closeBreathing.addEventListener('click', stopBreathingExercise);
  }
  
  if (stopBreathing) {
    stopBreathing.addEventListener('click', stopBreathingExercise);
  }
  
  // Close breathing overlay when clicking outside
  if (breathingOverlay) {
    breathingOverlay.addEventListener('click', function(e) {
      if (e.target === breathingOverlay) {
        stopBreathingExercise();
      }
    });
  }
  
  // Close breathing overlay with ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && breathingOverlay && breathingOverlay.classList.contains('active')) {
      stopBreathingExercise();
    }
  });
  
  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // ===== SCROLL ANIMATIONS =====
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Add fade-in animation to cards
  const animatedElements = document.querySelectorAll('.feature-card, .stat-card, .step-card, .testimonial-card');
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
  
  console.log('✨ Serenity Landing Page loaded successfully!');
});

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `<span>${message}</span>`;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '8px',
    backgroundColor: type === 'success' ? '#51cf66' : type === 'error' ? '#ff6b6b' : '#4c6ef5',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '10000',
    fontWeight: '500',
    fontSize: '14px',
    maxWidth: '400px',
    animation: 'slideIn 0.3s ease-out'
  });
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// CSS para animaciones de notificación
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);