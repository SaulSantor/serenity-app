# 🔌 Conexiones Paso a Paso - Dispositivo IoT Serenity

## ⚠️ IMPORTANTE: Orden de Conexión
**Sigue estos pasos EN ORDEN para evitar daños al Arduino Nano 33 IoT**

---

## 📋 Paso A — Ajustar HW-131 a 5.00V (SIN conectar Arduino)

### Procedimiento:
1. **Conecta la pila 9V** al **IN+** e **IN-** del módulo HW-131 (DC-DC Step-Down)
   - Cable rojo (+) → IN+
   - Cable negro (-) → IN-

2. **Con multímetro en modo DC Voltage:**
   - Punta roja → OUT+ del HW-131
   - Punta negra → OUT- del HW-131

3. **Ajusta el potenciómetro** (tornillo pequeño en el HW-131):
   - Gira lentamente con destornillador de precisión
   - Ajusta hasta que el multímetro marque **exactamente 5.00V**
   - Sentido horario aumenta voltaje, antihorario disminuye

4. **Verifica OUT-** = 0V (GND de referencia)

### ✅ Checkpoint:
- **OUT+ = 5.00V** (tolerancia: ±0.05V)
- **OUT- = 0V** (GND)
- **NO continúes si no obtienes 5.00V estable**

---

## 📋 Paso B — Alimentar el Arduino Nano 33 IoT

### ⚡ Configuración de Alimentación:
Con el HW-131 **ya ajustado a 5.00V**:

1. **Conecta HW-131 OUT+ → Arduino VIN** (pin de entrada regulado)
2. **Conecta HW-131 OUT- → Arduino GND**

3. **Enciende** conectando la pila al circuito

4. **Mide con multímetro el pin 3.3V del Arduino:**
   - Debería dar **≈ 3.3V**
   - Este pin provee la alimentación a los sensores

### ⚠️ CRÍTICO - Diferencia con Arduino UNO:
- El **Nano 33 IoT** usa procesador **SAMD21 a 3.3V**
- Los pines GPIO **NO son tolerantes a 5V** (pueden dañarse)
- **NUNCA conectes señales de 5V directamente a los pines**
- Usa **SOLO el pin 3.3V** para alimentar sensores

### 📚 Por qué alimentar por VIN:
El Arduino Nano 33 IoT tiene reguladores internos que:
- Acepta 5-21V en VIN
- Genera 3.3V estable en el pin "3.3V" (para sensores y lógica)
- **NO tiene pin 5V** (a diferencia del UNO)
- Protege el procesador SAMD21 que opera a 3.3V

**Documentación oficial:** https://docs.arduino.cc/hardware/nano-33-iot

---

## 📋 Paso C — Crear Riel de 3.3V para Sensores

### ⚠️ IMPORTANTE: Sensores a 3.3V
Usa el **pin 3.3V del Arduino** como fuente de alimentación para **TODOS los sensores**:

| Sensor | VCC → | GND → |
|--------|-------|-------|
| TTP223 (x5) | **3.3V** Arduino | GND Arduino |
| DHT11 | **3.3V** Arduino | GND Arduino |
| MPX5010DP | **5V** HW-131 OUT+ | GND Arduino |

### ✅ Verificación con Multímetro:
Antes de conectar las salidas de datos de cada sensor:
1. Mide **VCC de TTP223 y DHT11 ≈ 3.3V**
2. Mide **VCC de MPX5010DP ≈ 5.0V** (este sensor necesita 5V para funcionar correctamente)
3. Verifica **GND común** entre todos los sensores y Arduino

### 💡 Por qué 3.3V en sensores digitales:
- **Arduino Nano 33 IoT**: Pines GPIO operan a **3.3V** (NO tolerantes a 5V)
- **Sensores a 3.3V**: Sus salidas dan **3.3V (HIGH)** y **0V (LOW)** → Seguro para Arduino
- **Sensores a 5V**: Salidas de 5V **DAÑARÍAN** los pines GPIO del SAMD21
- **TTP223 y DHT11**: Funcionan perfectamente con 3.3V (rango 3-5.5V)
- **MPX5010DP**: Necesita 5V para precisión, pero su salida analógica es segura (0.2-4.7V)

---

## 📋 Paso D — Conectar Sensores TTP223 y DHT11

### 🔘 Sensores Táctiles TTP223 (x5)
**Conexión por cada TTP223:**

| Pin TTP223 | → | Pin Arduino |
|------------|---|-------------|
| VCC | → | **3.3V** |
| GND | → | GND |
| OUT | → | D2, D3, D4, D5, D6 (uno por sensor) |

**Mapeo específico:**
- TTP223 #1 (OUT) → **D2**
- TTP223 #2 (OUT) → **D3**
- TTP223 #3 (OUT) → **D4**
- TTP223 #4 (OUT) → **D5**
- TTP223 #5 (OUT) → **D6**

### 🌡️ Sensor DHT11
| Pin DHT11 | → | Pin Arduino |
|-----------|---|-------------|
| VCC | → | **3.3V** |














| GND | → | GND |
| DATA | → | **D7** |

**Nota:** Si el módulo DHT11 NO tiene resistor pull-up integrado:
- Conecta resistor de **10kΩ** entre DATA (pin 2) y VCC (**3.3V**)

### ✅ Prueba de Funcionamiento:
1. Con multímetro en modo DC:
   - Toca un sensor TTP223
   - OUT debe cambiar entre **0V (LOW)** y **3.3V (HIGH)**
2. Observa en Monitor Serie (115200 baud) las lecturas del DHT11

---

## 📋 Paso E — Conectar Sensor de Presión MPX5010DP

### ⚠️ IMPORTANTE: Divisor de Voltaje Necesario
**El MPX5010DP necesita divisor resistivo porque:**
- Alimentado a 5V: Su Vout puede llegar a **4.7V**
- Arduino Nano 33 IoT: Entradas analógicas soportan **máximo 3.3V**
- **Sin divisor = DAÑO al pin A0**

### Conexión con Divisor Resistivo:
| Pin MPX5010DP | → | Conexión |
|---------------|---|----------|
| Vs (Pin 1) | → | **5V** (HW-131 OUT+) |
| Vout (Pin 2) | → | **Divisor resistivo** → A0 |
| GND (Pin 3) | → | GND |

### 🔧 Divisor de Voltaje:
```
MPX5010 Vout (0.2-4.7V)
    │
    ├─── Rtop = 4.3kΩ ───┐
    │                     ├─── Vscaled → Arduino A0
    └─── Rbot = 10kΩ ────┘
                          │
                         GND
```

**Cálculo:**
- Vscaled = Vout × (Rbot / (Rtop + Rbot))
- Vscaled = 4.7V × (10kΩ / 14.3kΩ) = **3.29V** ✅ Seguro
- Sin presión: 0.2V → 0.14V
- Máxima presión: 4.7V → 3.29V

### ✅ Verificación ANTES de conectar a A0:
1. **Monta el divisor resistivo** en protoboard
2. Con multímetro mide **Vscaled** (punto medio del divisor):
   - Sin presión: Vscaled ≈ **0.14V**
   - Simula presión máxima: Vscaled debe ser **< 3.3V**
3. **Si Vscaled > 3.3V**: Aumenta Rtop o disminuye Rbot
4. **Solo después de verificar**, conecta Vscaled a A0

### 📄 Lectura de Datos:
```cpp
// En el código Arduino:
int sensorValue = analogRead(A0);              // Lee 0-1023
float vscaled = sensorValue * (3.3 / 1023.0);  // Vscaled en A0

// Reconstruir Vout original del sensor:
float vout = vscaled * (14.3 / 10.0);  // Inverso del divisor

// Cálculo de presión:
float pressure_kpa = (vout - 0.2) / 0.45;
```

**Datasheet MPX5010DP:** Vout = 0.2V (0 kPa) a 4.7V (10 kPa) cuando Vs=5V

---

## 📋 Paso F — LED de Estado (Retroalimentación Visual)

### Conexión:
| Componente | → | Pin Arduino |
|------------|---|-------------|
| LED Ánodo (+) pata larga | → | **D8** |
| LED Cátodo (-) pata corta | → | Resistor 220Ω → GND |

### Funcionamiento:
El LED parpadea cada vez que:
- Se detecta un toque en algún sensor TTP223
- Se envían datos al backend
- Indica que el sistema está funcionando

---

## 📋 Paso G — Verificación Final y Encendido

### Checklist Pre-Encendido:

#### 1️⃣ Verifica GND Común:
- [ ] Pila 9V (negativo)
- [ ] HW-131 (OUT-)
- [ ] Arduino GND
- [ ] Todos los sensores GND
- [ ] LED cátodo (a través de resistor)

#### 2️⃣ Verifica Voltajes:
- [ ] HW-131 OUT+ = **5.00V** ±0.05V
- [ ] Arduino pin 3.3V = **≈3.3V**
- [ ] VCC de TTP223 y DHT11 = **≈3.3V**
- [ ] VCC de MPX5010DP (Vs) = **≈5.0V**
- [ ] Vscaled (divisor MPX) = **< 3.3V**

#### 3️⃣ Verifica Conexiones de Datos:
- [ ] TTP223 OUTs → D2, D3, D4, D5, D6 (señales 3.3V ✅)
- [ ] DHT11 DATA → D7 (señal 3.3V ✅)
- [ ] MPX5010DP Vout → **Divisor resistivo** → Vscaled → A0 (señal <3.3V ✅)
- [ ] LED → D8 + resistor 220Ω

#### 4️⃣ Enciende y Observa:
- [ ] Conecta la pila al HW-131
- [ ] NO debe haber humo
- [ ] NO debe haber calentamiento excesivo
- [ ] LED debe parpadear cuando toques sensores
- [ ] Abre Monitor Serie (115200 baud) y verifica lecturas

---

## 🗺️ Mapeo Final Completo

### Alimentación:
```
Pila 9V (+) ──→ HW-131 (IN+)
Pila 9V (-) ──→ HW-131 (IN-)

HW-131 (OUT+ 5V) ──┬──→ Arduino VIN
                   └──→ MPX5010DP (Vs)

Arduino 3.3V pin ──┬──→ TTP223 #1, #2, #3, #4, #5 (VCC)
                   └──→ DHT11 (VCC)

HW-131 (OUT- GND) ──→ GND COMÚN (todos los sensores + Arduino)
```

### Pines Digitales:
```
Arduino D2 ←── TTP223 #1 (OUT)
Arduino D3 ←── TTP223 #2 (OUT)
Arduino D4 ←── TTP223 #3 (OUT)
Arduino D5 ←── TTP223 #4 (OUT)
Arduino D6 ←── TTP223 #5 (OUT)
Arduino D7 ←── DHT11 (DATA)
Arduino D8 ──→ LED (+) ──→ R220Ω ──→ GND
```

### Pines Analógicos:
```
Arduino A0 ←── Vscaled ←── Divisor (Rtop 4.3k + Rbot 10k) ←── MPX5010DP (Vout)
```

---

## 🔋 Interruptor ON/OFF (Opcional pero Recomendado)

### Conexión:
```
Pila 9V (+) ──→ Interruptor ──→ HW-131 (IN+)
Pila 9V (-) ──────────────────→ HW-131 (IN-)
```

Esto permite apagar todo el sistema sin desconectar la pila.

---

## 📐 Diagrama ASCII Completo

```
┌─────────────┐
│  Pila 9V    │
│  (+)   (-)  │
└──┬─────┬────┘
   │     │
   │   ┌─┴──────────┐
   │   │ Interruptor│
   │   └─┬──────────┘
   │     │
┌──▼─────▼─────┐
│   HW-131     │
│ IN+      IN- │
│              │
│ OUT+    OUT- │
└──┬───────┬───┘
   │5V     │GND
   │       │
┌──▼───────▼────────────────────────────┐
│  Arduino Nano 33 IoT                  │
│                                       │
│  VIN    GND    5V    3.3V            │
│   ↓      ↓     ↓      ↓              │
│  [Regulador Interno]                 │
│                                       │
│  D2 ← TTP223#1    A0 ← MPX5010       │
│  D3 ← TTP223#2                       │
│  D4 ← TTP223#3                       │
│  D5 ← TTP223#4                       │
│  D6 ← TTP223#5                       │
│  D7 ← DHT11                          │
│  D8 → LED → R220Ω → GND              │
└───────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE: Diferencias con Arduino UNO

### ❌ Arduino Nano 33 IoT NO ES como el UNO:

| Característica | Arduino UNO | Nano 33 IoT |
|----------------|-------------|-------------|
| Voltaje lógico | 5V | **3.3V** |
| Tolerancia 5V en pines | ✅ Sí | ❌ **NO** |
| Pin de alimentación sensores | 5V | **3.3V** |
| Entradas analógicas | 0-5V | **0-3.3V** |
| Procesador | ATmega328P | **SAMD21** |

### ✅ LO QUE SÍ NECESITAS (VERSIÓN CORRECTA):
1. **HW-131 ajustado a 5.00V exacto**
2. **Alimentación por VIN (5V regulado internamente a 3.3V)**
3. **TTP223 y DHT11 a 3.3V** (pin 3.3V del Arduino)
4. **MPX5010DP a 5V + divisor resistivo** (4.3kΩ + 10kΩ)
5. **DHT11 en pin D7** (con pull-up de 10kΩ a 3.3V)
6. **LED en pin D8** con resistor 220Ω
7. **NUNCA conectes señales de 5V directamente a los pines GPIO**

### 🔥 LO QUE DAÑA EL ARDUINO:
- Conectar salidas de 5V a pines digitales/analógicos
- Alimentar sensores a 5V y conectar sus OUT a pines GPIO
- Vout del MPX5010DP directo a A0 (sin divisor)

---

## 🎯 Configuración del Software

### 1️⃣ Configurar Arduino IDE:

**Instalar Librerías:**
- Abre Arduino IDE → Tools → Manage Libraries
- Busca e instala: **WiFiNINA**
- Busca e instala: **DHT sensor library** (by Adafruit)

**Seleccionar Placa:**
- Tools → Board → Arduino SAMD Boards → **Arduino Nano 33 IoT**
- Tools → Port → Selecciona el puerto COM del Arduino

### 2️⃣ Configurar el Código:

Abre `iot/serenity_device_arduino.ino` y edita estas líneas:

```cpp
// === CONFIGURACIÓN WiFi ===
const char* ssid = "TU_RED_WIFI";          // ← Nombre de tu WiFi
const char* password = "TU_CONTRASEÑA";     // ← Contraseña WiFi

// === CONFIGURACIÓN BACKEND ===
const char* backend_host = "192.168.100.69"; // ← IP de tu PC
const int backend_port = 5000;
const char* user_id = "6924729c100ab1e57c770641"; // ← Tu user_id de MongoDB
```

**Para obtener tu user_id:**
1. Inicia sesión en la app móvil o web
2. En MongoDB Compass, abre la colección `users`
3. Busca tu usuario por email
4. Copia el valor `_id` (ejemplo: `6924729c100ab1e57c770641`)

### 3️⃣ Subir el Código:

1. Conecta el Arduino a tu PC por USB
2. Clic en **Upload** (→) en Arduino IDE
3. Espera a que termine la compilación y subida
4. Abre **Tools → Serial Monitor** (115200 baud)
5. Verás:
   ```
   === DISPOSITIVO IOT ANTIESTRÉS - SERENITY ===
   ✓ DHT11 inicializado
   Conectando a WiFi: TU_RED_WIFI
   ✓ WiFi conectado
   IP: 192.168.X.X
   ✓ Sistema listo
   =====================================
   
   📤 Enviando datos al backend...
   ```

---

## 📱 Integración con la App Móvil

### Ver Datos en Tiempo Real:

1. **Asegúrate que el backend esté corriendo:**
   ```powershell
   cd "d:\backup\PROGRAMS PROGRAMATION\Integrador_5th"
   .\start-server.ps1
   ```

2. **Abre la app móvil:**
   - Navega a: **Dashboard** (Inicio)
   - Toca la card: **"Monitor IoT Antiestrés"**

3. **Verás en pantalla:**
   - 🎯 **Nivel de Estrés** (0-100) en círculo con color
   - 🖐️ **5 botones táctiles** (se iluminan al tocar)
   - 🌡️ **Temperatura y Humedad** del ambiente
   - 📊 **Presión de agarre** y fuerza
   - 💡 **Recomendación personalizada**

4. **Actualización automática:**
   - Los datos se refrescan cada **3 segundos**
   - No necesitas recargar manualmente

### 🌟 Uso Óptimo del Dispositivo:

El sistema detecta cuando usas correctamente la técnica de grounding:
- **Toca sensores 10-20 veces/min** (ritmo calmado)
- **Presiona con fuerza moderada** (3-6V en presión)
- Recibirás: _"¡Excelente! Estás usando la técnica correctamente"_

### 📊 Estadísticas Disponibles:

La app muestra:
- Lecturas del día actual
- Promedio de nivel de estrés
- Total de toques registrados
- Episodios de estrés alto

---

## 🔍 Verificación de Datos en Backend

### Ver logs detallados en terminal:

Cuando el Arduino envía datos, verás en la terminal del backend:

```
192.168.100.86 - - [26/Nov/2025 16:25:17] "POST /api/iot/sensors/data HTTP/1.1" 201 -
```

### Ver datos en MongoDB Compass:

1. Abre MongoDB Compass
2. Conecta a: `mongodb://localhost:27017`
3. Base de datos: `serenity_db`
4. Colección: `iot_sensor_data`
5. Verás documentos con estructura:
   ```json
   {
     "_id": "...",
     "device_id": "ARDUINO_001",
     "user_id": "6924729c100ab1e57c770641",
     "timestamp": "2025-11-26T16:25:17.000Z",
     "touch_sensors": {
       "button_1": false,
       "button_2": true,
       "touch_count": 1,
       "touch_frequency": 12.5
     },
     "environment": {
       "temperature": 25.0,
       "humidity": 50.0
     },
     "pressure": {
       "value": 3.47,
       "grip_strength": "normal"
     },
     "stress_analysis": {
       "stress_level": 35,
       "recommendation": "Tu nivel de estrés es normal..."
     }
   }
   ```

---

## 🛠️ Troubleshooting Hardware

### ❌ Arduino no conecta a WiFi

**Síntomas:** Monitor Serie muestra "Connecting to WiFi..." infinito

**Solución:**
1. Verifica SSID y contraseña en el código
2. Asegúrate que tu WiFi sea **2.4GHz** (el Nano 33 IoT no soporta 5GHz)
3. Acerca el Arduino al router

### ❌ Sensor DHT11 da error

**Síntomas:** "⚠ Error leyendo DHT11"

**Solución:**
1. Verifica conexiones: VCC→3.3V, DATA→D7, GND→GND
2. Confirma resistor pull-up de 10kΩ entre DATA y 3.3V
3. Espera 2 segundos entre lecturas (el DHT11 es lento)
4. Prueba con otro DHT11 (puede estar defectuoso)

### ❌ Sensores TTP223 no responden

**Solución:**
1. Verifica VCC = 3.3V con multímetro
2. Toca con el dedo directamente el pad metálico
3. Revisa que OUT esté conectado a D2-D6
4. Verifica GND común

### ❌ Presión siempre en 0

**Solución:**
1. Verifica MPX5010DP Vs = 5V
2. Mide Vscaled en el punto medio del divisor (<3.3V)
3. Confirma divisor: 4.3kΩ + 10kΩ
4. Verifica tubo conectado al puerto de presión
5. Sopla suavemente en el tubo para probar

### ❌ Backend no recibe datos

**Síntomas:** Monitor Serie muestra "HTTP error" o "Connection failed"

**Solución:**
1. Verifica que el backend esté corriendo (`http://TU_IP:5000`)
2. Confirma IP correcta en el código Arduino
3. PC y Arduino deben estar en la misma red WiFi
4. Desactiva firewall temporalmente para probar
5. Verifica ruta: `/api/iot/sensors/data`

---

## 📞 Soporte Adicional

Si persisten los problemas:

1. **Hardware:** Revisa todas las conexiones con el diagrama
2. **Voltajes:** Mide con multímetro cada punto de alimentación
3. **Monitor Serie:** Lee los mensajes de error (115200 baud)
4. **MongoDB:** Verifica que exista la colección `iot_sensor_data`
5. **Backend:** Revisa logs en la terminal para errores

---

**¡Listo!** 🎉 Tu dispositivo IoT está configurado y funcionando.

Ahora puedes usar el dispositivo antiestrés y ver tus datos en tiempo real en la app móvil. El sistema aprenderá tus patrones de estrés y te dará recomendaciones personalizadas. 🚀
