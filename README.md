# Serenity - Guía de Instalación

Aplicación de bienestar mental con app móvil (React Native), app web, y backend (Flask/Python).

---

## 📋 Requisitos Previos

Descarga e instala:

1. **Python 3.8+** → https://www.python.org/downloads/
2. **Node.js 18+** → https://nodejs.org/
3. **MongoDB 6.0+** → https://www.mongodb.com/try/download/community
4. **Expo Go** (en tu celular - Android/iOS)

---

## 🚀 Instalación Paso a Paso

### PASO 1: Instalar Expo CLI

Abre **PowerShell** y ejecuta:

```powershell
npm install -g expo-cli
```

📍 **Dónde:** Cualquier carpeta (es instalación global)

---

### PASO 2: Instalar dependencias del Backend

Abre **PowerShell** en la carpeta del proyecto:

```powershell
cd "d:\backup\PROGRAMS PROGRAMATION\Integrador_5th\backend"
pip install -r requirements.txt
```

📍 **Dónde:** `Integrador_5th/backend/`

---

### PASO 3: Instalar dependencias de la App Móvil

En **PowerShell**:

```powershell
cd "d:\backup\PROGRAMS PROGRAMATION\Integrador_5th\app_mobile"
npm install
```

📍 **Dónde:** `Integrador_5th/app_mobile/`

---

### PASO 4: Inicializar Base de Datos MongoDB

#### Opción A - MongoDB Compass (Recomendado):

1. Abre **MongoDB Compass**
2. Conecta a: `mongodb://localhost:27017`
3. Clic en **"+Create database"**
   - Database name: `serenity_db`
   - Collection name: `users`
4. Clic en el botón **Playground** (icono `>_` arriba a la derecha)
5. Abre el archivo: `Integrador_5th\database\init-serenity-db.js` con el Bloc de notas
6. **Copia TODO el contenido** (Ctrl+A → Ctrl+C)
7. **Pega en el Playground** (Ctrl+V)
8. Presiona **Ctrl+Enter** o clic en **"Run"** (botón verde)
9. Verifica que aparecieron las colecciones: `techniques`, `meditations`, `exercises`, etc.

📍 **Archivo:** `Integrador_5th\database\init-serenity-db.js`

#### Opción B - Terminal (mongosh):

```powershell
cd "d:\backup\PROGRAMS PROGRAMATION\Integrador_5th\database"
mongosh "mongodb://localhost:27017/serenity_db" init-serenity-db.js
```

📍 **Dónde:** `Integrador_5th/database/`

---

## ⚙️ Configuración Importante

### Cambiar IP del Backend (para App Móvil)

1. Abre el archivo: `Integrador_5th\app_mobile\src\api\backend.js`
2. Busca esta línea:
   ```javascript
   baseURL: "http://192.168.100.42:5000/api",
   ```
3. **Cámbiala por tu IP local:**
   ```javascript
   baseURL: "http://TU_IP_AQUI:5000/api",
   ```

**Para encontrar tu IP:**

```powershell
ipconfig
```

Busca **"Dirección IPv4"** (ejemplo: `192.168.1.100`)

📍 **Archivo a editar:** `Integrador_5th\app_mobile\src\api\backend.js`

⚠️ **Importante:** Tu celular debe estar en la **misma red WiFi** que tu PC.

---

## ▶️ Ejecutar el Proyecto

### PASO 1: Iniciar MongoDB

Abre **Servicios de Windows** (Win+R → `services.msc`) → Busca **"MongoDB Server"** → Clic derecho → **Iniciar**

O en PowerShell:

```powershell
mongod
```

---

### PASO 2: Iniciar el Backend

Abre **PowerShell** en la carpeta del proyecto:

```powershell
cd "d:\backup\PROGRAMS PROGRAMATION\Integrador_5th"
.\start-server.ps1
```

O manualmente:

```powershell
cd backend
python app.py
```

✅ Backend corriendo en: `http://localhost:5000`

---

### PASO 3: Iniciar la App Móvil

Abre **otra PowerShell**:

```powershell
cd "d:\backup\PROGRAMS PROGRAMATION\Integrador_5th\app_mobile"
npm start
```

**Opciones:**
- **Escanea el código QR** con **Expo Go** en tu celular
- Presiona **`a`** para Android (emulador)
- Presiona **`i`** para iOS (emulador)

---

### PASO 4: Acceder a la App Web

Abre tu navegador:

```
http://localhost:5000
```

O para login directo:

```
http://localhost:5000/login.html
```

---

## 🐛 Solución de Problemas

### ❌ MongoDB no conecta

**Error:** `Connection refused` o `MongoServerError`

**Solución:**
```powershell
# Verifica que MongoDB esté corriendo
mongosh

# Si da error, inicia MongoDB:
mongod
```

O inicia el servicio: Win+R → `services.msc` → **MongoDB Server** → Iniciar

---

### ❌ Backend no inicia - Módulos faltantes

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Solución:**
```powershell
cd "d:\backup\PROGRAMS PROGRAMACION\Integrador_5th\backend"
pip install -r requirements.txt --upgrade
```

---

### ❌ App móvil no conecta al backend

**Error:** `Network request failed` o `ERR_CONNECTION_REFUSED`

**Solución:**

1. Verifica que tu celular esté en la **misma red WiFi** que tu PC

2. Encuentra tu IP:
   ```powershell
   ipconfig
   ```
   Copia la **Dirección IPv4** (ej: `192.168.1.100`)

3. Edita el archivo: `app_mobile\src\api\backend.js`
   ```javascript
   baseURL: "http://192.168.1.100:5000/api", // ← Tu IP aquí
   ```

4. Verifica que el backend esté corriendo en `http://localhost:5000`

---

### ❌ Expo no encuentra módulos

**Error:** `Unable to resolve module`

**Solución:**
```powershell
cd "d:\backup\PROGRAMS PROGRAMACION\Integrador_5th\app_mobile"
# Limpiar caché y reinstalar
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
npm start
```

---

### ❌ Base de datos vacía - No aparecen meditaciones

**Error:** La app no muestra técnicas ni meditaciones

**Solución:**

1. Verifica que ejecutaste el script: `database\init-serenity-db.js` en MongoDB Compass
2. En MongoDB Compass, verifica que existan estas colecciones:
   - `techniques` (8 documentos)
   - `meditations` (5 documentos)
   - `exercises`
3. Si no existen, repite el **PASO 4** de la instalación

---

## 📂 Estructura del Proyecto

```
Integrador_5th/
├── backend/              # API Flask + Python
│   ├── app.py           # Archivo principal
│   ├── requirements.txt # Dependencias Python
│   ├── routes/          # Endpoints API (auth, iot, community, etc.)
│   └── models/          # Modelos de datos MongoDB
│
├── app_mobile/          # React Native + Expo
│   ├── src/
│   │   ├── api/        # backend.js ← Cambiar IP aquí
│   │   ├── screens/    # Pantallas (Dashboard, IoT Monitor, etc.)
│   │   ├── components/ # Componentes reutilizables
│   │   └── navigation/ # Navegación de la app
│   └── package.json
│
├── app_web/            # HTML/CSS/JS
│   ├── index.html      # Landing page
│   ├── login.html      # Login
│   └── dashboard.html  # Dashboard web
│
├── database/           # MongoDB
│   └── init-serenity-db.js ← Ejecutar en Compass
│
├── iot/                # Dispositivo IoT Arduino
│   ├── serenity_device_arduino.ino  # Firmware Arduino
│   └── INSTRUCCIONES_CONEXION_HARDWARE.md
│
└── start-server.ps1    # Script para iniciar backend
```

---

## 🤖 Dispositivo IoT (Opcional)

Si deseas usar el dispositivo IoT antiestrés con Arduino:

### Requisitos Hardware:
- Arduino Nano 33 IoT
- 5x Sensores táctiles TTP223
- 1x Sensor DHT11 (temperatura/humedad)
- 1x Sensor de presión MPX5010DP
- Conversor DC-DC HW-131 (9V → 5V)

### Configuración:

1. **Conectar hardware** siguiendo: `iot\INSTRUCCIONES_CONEXION_HARDWARE.md`

2. **Configurar Arduino IDE:**
   - Instalar: Arduino IDE → https://www.arduino.cc/en/software
   - Librería: WiFiNINA
   - Librería: DHT sensor library

3. **Configurar código:**
   Edita `iot\serenity_device_arduino.ino`:
   ```cpp
   const char* ssid = "TU_WIFI";          // Tu red WiFi
   const char* password = "TU_PASSWORD";  // Contraseña WiFi
   const char* backend_host = "TU_IP";    // IP de tu PC
   const char* user_id = "TU_USER_ID";    // ID de MongoDB
   ```

4. **Subir código al Arduino** y alimentar con 9V

5. **Ver datos en la app móvil:**
   - Abrir app → Dashboard → "Monitor IoT Antiestrés"
   - Datos se actualizan cada 3 segundos

---

## 📝 Resumen de Comandos

**Copiar y pegar todo en orden:**

```powershell
# 1. Instalar Expo CLI
npm install -g expo-cli

# 2. Instalar Backend
cd "d:\backup\PROGRAMS PROGRAMACION\Integrador_5th\backend"
pip install -r requirements.txt

# 3. Instalar App Móvil
cd "d:\backup\PROGRAMS PROGRAMACION\Integrador_5th\app_mobile"
npm install

# 4. Encontrar tu IP (anótala)
ipconfig

# 5. Editar app_mobile\src\api\backend.js con tu IP

# 6. Ejecutar MongoDB Compass → init-serenity-db.js

# 7. Iniciar Backend
cd "d:\backup\PROGRAMS PROGRAMACION\Integrador_5th"
.\start-server.ps1

# 8. Iniciar App Móvil (otra terminal)
cd "d:\backup\PROGRAMS PROGRAMACION\Integrador_5th\app_mobile"
npm start
```

---

## 🌟 Funcionalidades Principales

- ✅ **Meditaciones guiadas** (Mindfulness, Body Scan, Autocompasión, etc.)
- ✅ **Ejercicios de respiración** (4-7-8, Box Breathing, etc.)
- ✅ **Técnicas de relajación** (PMR, Grounding, etc.)
- ✅ **Seguimiento de progreso** con estadísticas y gráficas
- ✅ **Comunidad social** con posts, comentarios, likes y menciones
- ✅ **Notificaciones** de recordatorios de práctica
- ✅ **Modo oscuro** (próximamente)
- ✅ **Dispositivo IoT** para monitoreo de estrés en tiempo real

---

## 👥 Equipo de Desarrollo

Proyecto desarrollado en equipo como integrador universitario en la Universidad Tecnológica de Chihuahua.

| Integrante                                                  | Área               |
|-------------------------------------------------------------|--------------------|
| Saul Sanchez ([@SaulSantor](https://github.com/SaulSantor)) | App Móvil, IoT     |
| David                                                       | Backend, IoT       |
| Juan                                                        | Base de Datos, IoT |
| Mauricio                                                    | Frontend Web, IoT  |

**¡Listo!** 🎉 Tu aplicación Serenity está corriendo.
