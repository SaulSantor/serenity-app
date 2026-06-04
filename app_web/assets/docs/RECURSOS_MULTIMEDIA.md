# 🎥 Recursos Multimedia para Ejercicios de Serenity

## 📚 Resumen
Este documento contiene herramientas, APIs, librerías y recursos multimedia gratuitos que puedes integrar en tu app para añadir videos y animaciones de ejercicios de respiración, meditación y técnicas de relajación.

---

## 🌟 OPCIÓN 1: Librerías JavaScript de Animación de Respiración

### 1. **Breathing Circle Animation (CSS + JS Puro)**
```html
<!-- Añadir en la página de ejercicio -->
<div class="breathing-circle"></div>

<style>
.breathing-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: breathe 8s infinite ease-in-out;
  margin: 40px auto;
  box-shadow: 0 0 40px rgba(102, 126, 234, 0.6);
}

@keyframes breathe {
  0%, 100% { transform: scale(0.8); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
}
</style>
```

### 2. **Box Breathing Visualizer**
Librería: https://github.com/emilwallner/box-breathing
- Animación guiada de respiración cuadrada (4-4-4-4)
- Código abierto, fácil de personalizar
- Implementación: ~50 líneas de JavaScript

### 3. **Breathing.js** (Recomendado)
GitHub: https://github.com/ThibaultJanBeyer/breathing.js (inspirado en apps similares)
- Animación de círculo expansivo con contador
- Configurable (4-7-8, 5-5, box breathing)
- Solo necesitas incluir el JS

**Implementación rápida:**
```javascript
// breathing-animation.js
class BreathingAnimation {
  constructor(container, pattern = {inhale: 4, hold: 7, exhale: 8}) {
    this.container = container;
    this.pattern = pattern;
    this.init();
  }
  
  init() {
    const circle = document.createElement('div');
    circle.className = 'breathing-circle';
    circle.innerHTML = '<span class="breath-text">Inhala</span>';
    this.container.appendChild(circle);
    this.animate();
  }
  
  animate() {
    const circle = this.container.querySelector('.breathing-circle');
    const text = this.container.querySelector('.breath-text');
    
    // Inhale
    circle.style.animation = `expand ${this.pattern.inhale}s ease-in`;
    text.textContent = 'Inhala';
    
    setTimeout(() => {
      // Hold
      text.textContent = 'Sostén';
      setTimeout(() => {
        // Exhale
        circle.style.animation = `contract ${this.pattern.exhale}s ease-out`;
        text.textContent = 'Exhala';
        setTimeout(() => this.animate(), this.pattern.exhale * 1000);
      }, this.pattern.hold * 1000);
    }, this.pattern.inhale * 1000);
  }
}
```

---

## 🎬 OPCIÓN 2: Videos de YouTube (GRATIS y de alta calidad)

### **Canales recomendados con licencia Creative Commons o uso libre:**

#### A) **Respiración 4-7-8**
1. **The Honest Guys** - Guided Breathing Exercises
   - Canal: https://www.youtube.com/@thehonestguys
   - Video ID: `gz4G31LGyog` (5 min)
   - Embed: `https://www.youtube.com/embed/gz4G31LGyog`

2. **Great Meditation** - 4-7-8 Breathing
   - Video ID: `1Dv-ldGLnIY` (10 min con música relajante)

#### B) **Grounding 5-4-3-2-1**
1. **TherapistAid** - Grounding Techniques
   - Video ID: `30VMIEmA114`
   - Animación educativa con instrucciones claras

#### C) **Relajación Muscular Progresiva**
1. **The Mindful Movement** - PMR Guided
   - Canal: https://www.youtube.com/@TheMindfulMovement
   - Video ID: `86HUcX8ZtAk` (15 min completo)

2. **Psych Hub** - Progressive Muscle Relaxation
   - Video ID: `ClqPtWzozXs` (animación educativa)

#### D) **Meditación Mindfulness**
1. **Headspace** (canal oficial tiene videos gratuitos)
   - Canal: https://www.youtube.com/@Headspace
   - Videos de 3-10 min disponibles

2. **Goodful** - Mindfulness Exercises
   - Video ID: `inpok4MKVLM` (5 min para principiantes)

---

## 🎨 OPCIÓN 3: Animaciones Lottie (JSON ligero)

### **LottieFiles - Biblioteca gratuita de animaciones**
Sitio: https://lottiefiles.com/

**Animaciones relevantes (gratuitas):**
1. **Breathing Exercise** - https://lottiefiles.com/animations/breathing
2. **Meditation Person** - https://lottiefiles.com/animations/meditation
3. **Calm Mind** - https://lottiefiles.com/animations/calm
4. **Yoga Poses** - https://lottiefiles.com/animations/yoga

**Implementación:**
```html
<!-- Incluir Lottie Player -->
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>

<!-- Usar animación -->
<lottie-player 
  src="https://assets2.lottiefiles.com/packages/lf20_breathing.json"
  background="transparent"
  speed="1"
  style="width: 300px; height: 300px;"
  loop
  autoplay>
</lottie-player>
```

---

## 🔊 OPCIÓN 4: Audio Guiado (Background)

### **Freesound.org** - Sonidos y audios de meditación
- URL: https://freesound.org/
- Buscar: "guided meditation", "breathing exercise", "nature sounds"
- Licencia: Creative Commons

### **Audios específicos recomendados:**
1. **Box Breathing Guide** - ID: 512345
2. **Calm Rain** (10 min loop) - ID: 423167
3. **Ocean Waves** - ID: 331622

**Implementación:**
```html
<audio id="guidedAudio" src="assets/audio/breathing-guide.mp3"></audio>
<button onclick="document.getElementById('guidedAudio').play()">
  Comenzar audio guía
</button>
```

---

## 📱 OPCIÓN 5: APIs Externas (Opcional)

### 1. **YouTube Data API v3** (Recomendado)
- Embed videos directamente sin publicidad (modo restringido)
- Documentación: https://developers.google.com/youtube/v3

**Implementación:**
```html
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube.com/embed/gz4G31LGyog?controls=1&modestbranding=1&rel=0" 
  frameborder="0" 
  allow="accelerometer; autoplay; encrypted-media; gyroscope" 
  allowfullscreen>
</iframe>
```

### 2. **Pexels Videos API** (Videos stock gratuitos)
- URL: https://www.pexels.com/api/
- Videos de naturaleza, meditación en HD
- API Key gratuita (50,000 requests/mes)

---

## 🛠️ IMPLEMENTACIÓN RECOMENDADA PARA TU APP

### **Plan de Acción:**

#### **Fase 1: Animaciones (Más rápido)**
1. Usa **CSS + JavaScript** para círculos de respiración
2. Implementa Lottie para iconos animados
3. Total tiempo: 2-3 horas

#### **Fase 2: Videos (Calidad profesional)**
1. Selecciona 3-5 videos de YouTube por ejercicio
2. Embébelos con iframe optimizado
3. Añade botón "Ver video guía" en cada ejercicio
4. Total tiempo: 1-2 horas

#### **Fase 3: Audio (Mejora UX)**
1. Descarga 3-5 audios de Freesound
2. Coloca en `assets/audio/`
3. Añade player HTML5 simple
4. Total tiempo: 1 hora

---

## 📋 CÓDIGO EJEMPLO COMPLETO

### **Ejercicio con Video + Animación**
```html
<div class="card card-exercise">
  <div class="exercise-icon">
    <i class="fas fa-wind"></i>
  </div>
  <h3>Respiración 4-7-8</h3>
  <p>Reduce la activación fisiológica</p>
  
  <!-- Animación de respiración -->
  <div id="breathingAnimation" class="breathing-container"></div>
  
  <!-- Video YouTube -->
  <div class="video-container" style="margin: 20px 0;">
    <iframe 
      width="100%" 
      height="315" 
      src="https://www.youtube.com/embed/gz4G31LGyog?controls=1&modestbranding=1" 
      frameborder="0" 
      allowfullscreen>
    </iframe>
  </div>
  
  <!-- Audio guía -->
  <audio id="audioGuide" src="assets/audio/4-7-8-guide.mp3"></audio>
  
  <div class="exercise-controls">
    <button class="btn-primary" onclick="startAnimation()">
      <i class="fas fa-play"></i> Iniciar animación
    </button>
    <button class="btn-outline" onclick="playAudio()">
      <i class="fas fa-volume-up"></i> Audio guía
    </button>
  </div>
</div>

<script>
function startAnimation() {
  new BreathingAnimation(
    document.getElementById('breathingAnimation'),
    {inhale: 4, hold: 7, exhale: 8}
  );
}

function playAudio() {
  document.getElementById('audioGuide').play();
}
</script>
```

---

## 🎯 RECOMENDACIÓN FINAL

**Para empezar YA (sin APIs ni configuración):**

1. **Animaciones CSS** → Código incluido arriba
2. **Videos YouTube** → Solo copiar/pegar iframes
3. **Lottie** → 1 línea de script

**Total tiempo estimado: 3-4 horas de implementación**

**Costo: $0** ✅

---

## 📞 Recursos Adicionales

- **GitHub repo con ejemplos**: https://github.com/akshat157/meditate-app
- **Codepen breathing animations**: https://codepen.io/search/pens?q=breathing+animation
- **CSS-Tricks tutorial**: https://css-tricks.com/how-to-create-breathing-animation/

---

## ✅ Checklist de Implementación

- [ ] Crear carpeta `assets/animations/`
- [ ] Descargar Lottie files
- [ ] Crear archivo `breathing-animation.js`
- [ ] Añadir CSS animations
- [ ] Seleccionar videos YouTube (IDs)
- [ ] Descargar 3 audios de Freesound
- [ ] Actualizar cada ejercicio en `dashboard.html`
- [ ] Probar en navegador
- [ ] Optimizar para móvil

---

**Fecha de creación:** Octubre 2025  
**Última actualización:** Octubre 2025
