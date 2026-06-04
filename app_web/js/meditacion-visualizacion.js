const scenes = {
  beach: {
    title: 'Playa tranquila',
    steps: [
      { instruction: 'Cierra los ojos. Respira profundamente tres veces. Imagina que estás caminando hacia una playa hermosa y tranquila...', sense: null },
      { instruction: 'VE el océano turquesa extendiéndose hasta el horizonte. La arena dorada bajo tus pies. El sol brillando suavemente en el cielo...', sense: 'senseVision' },
      { instruction: 'ESCUCHA el sonido rítmico de las olas rompiendo suavemente en la orilla. El graznido distante de las gaviotas. El susurro de la brisa...', sense: 'senseSound' },
      { instruction: 'SIENTE la arena cálida entre tus dedos. La brisa fresca acariciando tu piel. El sol tibio en tu rostro. La textura suave del agua...', sense: 'senseTouch' },
      { instruction: 'HUELE el aire salado del mar. La frescura del océano. Quizás una nota de coco de las palmeras cercanas...', sense: 'senseSmell' },
      { instruction: 'SIENTE la paz profunda que te invade. La seguridad completa. Aquí estás protegido. Este es TU lugar seguro. Puedes volver cuando lo necesites.', sense: 'senseFeeling' }
    ]
  },
  forest: {
    title: 'Bosque sereno',
    steps: [
      { instruction: 'Cierra los ojos. Respira profundamente tres veces. Te encuentras en un sendero dentro de un bosque antiguo y mágico...', sense: null },
      { instruction: 'VE los árboles altos a tu alrededor. La luz del sol filtrándose entre las hojas creando patrones dorados. El verde vibrante de la naturaleza...', sense: 'senseVision' },
      { instruction: 'ESCUCHA el canto de los pájaros. El susurro de las hojas con el viento. El crujir suave de ramitas bajo tus pies. Un arroyo burbujeante cerca...', sense: 'senseSound' },
      { instruction: 'SIENTE la corteza rugosa de un árbol al tocarlo. La suavidad del musgo. La temperatura fresca y agradable del bosque. La tierra firme bajo tus pies...', sense: 'senseTouch' },
      { instruction: 'HUELE la tierra húmeda. El aroma fresco de pino y hojas. La fragancia de flores silvestres. El aire limpio y puro del bosque...', sense: 'senseSmell' },
      { instruction: 'SIENTE la conexión profunda con la naturaleza. La calma ancestral del bosque te envuelve. Aquí estás completamente seguro y en paz.', sense: 'senseFeeling' }
    ]
  },
  mountain: {
    title: 'Cima de montaña',
    steps: [
      { instruction: 'Cierra los ojos. Respira profundamente tres veces. Estás en la cima de una montaña majestuosa, por encima de las nubes...', sense: null },
      { instruction: 'VE el horizonte infinito en todas direcciones. Las nubes blancas flotando abajo. El cielo azul profundo. Las montañas lejanas. El sol brillante...', sense: 'senseVision' },
      { instruction: 'ESCUCHA el silencio profundo. Solo el sonido suave del viento. La quietud absoluta. La paz del mundo desde las alturas...', sense: 'senseSound' },
      { instruction: 'SIENTE la roca sólida bajo ti. El aire fresco y puro. El viento jugando con tu cabello. La sensación de estabilidad y fortaleza de la montaña...', sense: 'senseTouch' },
      { instruction: 'HUELE el aire puro y limpio de la altura. La frescura del viento. La claridad cristalina que solo existe en las cimas...', sense: 'senseSmell' },
      { instruction: 'SIENTE la perspectiva amplia. Tus problemas parecen pequeños desde aquí. La claridad mental. La fuerza interior. Este es tu refugio elevado.', sense: 'senseFeeling' }
    ]
  },
  garden: {
    title: 'Jardín secreto',
    steps: [
      { instruction: 'Cierra los ojos. Respira profundamente tres veces. Descubres la entrada a un jardín secreto rodeado de muros cubiertos de hiedra...', sense: null },
      { instruction: 'VE las flores de mil colores: rosas, lirios, tulipanes. Un pequeño estanque con peces dorados. Mariposas danzando. Un banco de madera bajo un árbol...', sense: 'senseVision' },
      { instruction: 'ESCUCHA el zumbido suave de las abejas. El gorjeo de pájaros pequeños. El agua fluyendo en una fuente. El susurro de las hojas...', sense: 'senseSound' },
      { instruction: 'SIENTE los pétalos suaves de una rosa. La textura de la hierba bajo tus pies. La madera cálida del banco. La brisa gentil en tu piel...', sense: 'senseTouch' },
      { instruction: 'HUELE la fragancia dulce de las rosas. El aroma fresco de la hierba recién cortada. El perfume de jazmín. La tierra húmeda...', sense: 'senseSmell' },
      { instruction: 'SIENTE la privacidad y seguridad total de este espacio. Nadie puede entrar sin tu permiso. Aquí eres completamente libre y en paz.', sense: 'senseFeeling' }
    ]
  }
};

let selectedScene = null;
let currentStep = 0;

function selectScene(sceneName) {
  selectedScene = sceneName;
  document.querySelectorAll('.scene-card').forEach(card => { card.classList.remove('selected'); });
  event.currentTarget.classList.add('selected');
  setTimeout(() => {
    document.getElementById('visualizationPanel').style.display = 'flex';
    document.getElementById('sceneTitle').textContent = scenes[sceneName].title;
    currentStep = 0;
    updateStep();
    document.getElementById('visualizationPanel').scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

function updateStep() {
  if (!selectedScene) return;
  const scene = scenes[selectedScene];
  const step = scene.steps[currentStep];
  document.getElementById('sceneInstruction').textContent = step.instruction;
  document.querySelectorAll('.sense-icon-box').forEach(icon => { icon.classList.remove('active'); });
  if (step.sense) { document.getElementById(step.sense).classList.add('active'); }
  document.querySelectorAll('.progress-dot').forEach((dot, idx) => {
    dot.classList.remove('active', 'completed');
    if (idx === currentStep) { dot.classList.add('active'); }
    else if (idx < currentStep) { dot.classList.add('completed'); }
  });
  if (currentStep === scene.steps.length - 1) {
    document.getElementById('nextBtn').innerHTML = '<i class="ri-check-line"></i> Finalizar';
  } else {
    document.getElementById('nextBtn').innerHTML = 'Siguiente <i class="ri-arrow-right-line"></i>';
  }
}

function nextStep() {
  if (!selectedScene) return;
  const scene = scenes[selectedScene];
  if (currentStep < scene.steps.length - 1) {
    currentStep++;
    updateStep();
  } else {
    document.getElementById('sceneInstruction').textContent = '✨ Has creado tu lugar seguro. Recuerda: puedes volver aquí mentalmente cuando necesites calma. Solo cierra los ojos y visualiza este lugar.';
    document.getElementById('nextBtn').innerHTML = '<i class="ri-check-line"></i> Completado';
    document.querySelectorAll('.sense-icon-box').forEach(icon => { icon.classList.add('active'); });
  }
}

function resetVisualization() {
  selectedScene = null;
  currentStep = 0;
  document.getElementById('visualizationPanel').style.display = 'none';
  document.querySelectorAll('.scene-card').forEach(card => { card.classList.remove('selected'); });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
