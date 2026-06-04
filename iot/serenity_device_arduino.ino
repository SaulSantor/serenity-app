/*
 * ============================================================================
 * DISPOSITIVO IOT ANTIESTRÉS - SERENITY APP
 * ============================================================================
 * 
 * Hardware:
 * - Arduino Nano 33 IoT
 * - 5x Sensores táctiles capacitivos TTP223
 * - Sensor de temperatura/humedad DHT11
 * - Sensor de presión MPX5010DP (10kPa, 5V)
 * - LED + Resistencia 220Ω
 * - Módulo regulador HW-131 (9V a 5V)
 * 
 * Funcionalidad:
 * - Captura patrones de toque (ansiedad/inquietud)
 * - Mide temperatura y humedad ambiental
 * - Detecta presión de agarre (tensión muscular)
 * - Envía datos al backend Flask vía WiFi
 * - Retroalimentación visual con LED (respiración guiada)
 * 
 * Conexiones:
 * - TTP223 (x5): Pines D2, D3, D4, D5, D6
 * - DHT11: Pin D7
 * - MPX5010DP: Pin A0 (analógico)
 * - LED: Pin D8
 * 
 * ============================================================================
 */

#include <WiFiNINA.h>
#include <DHT.h>

// === CONFIGURACIÓN WIFI ===
const char* ssid = "TU_RED_WIFI";           // ← CAMBIAR: Nombre de tu red WiFi
const char* password = "TU_PASSWORD_WIFI";  // ← CAMBIAR: Contraseña WiFi

// === CONFIGURACIÓN BACKEND ===
const char* backend_host = "192.168.X.X";  // ✅ IP de tu PC con el backend
const int backend_port = 5000;
const char* device_id = "ARDUINO_001";        // ID único del dispositivo
const char* user_id = "TU_USER_ID_MONGODB";  // ✅ Tu user_id de MongoDB

// === PINES ===
#define TOUCH_PIN_1  2   // Botón táctil 1
#define TOUCH_PIN_2  3   // Botón táctil 2
#define TOUCH_PIN_3  4   // Botón táctil 3
#define TOUCH_PIN_4  5   // Botón táctil 4
#define TOUCH_PIN_5  6   // Botón táctil 5
#define DHT_PIN      7   // Sensor DHT11
#define PRESSURE_PIN A0  // Sensor de presión (analógico)
#define LED_PIN      8   // LED de retroalimentación

// === CONFIGURACIÓN SENSORES ===
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// === VARIABLES GLOBALES ===
WiFiClient client;
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 5000;  // Enviar datos cada 5 segundos

// Contadores de toques
int touch_count = 0;
unsigned long last_touch_time = 0;
unsigned long session_start_time = 0;
float touch_frequency = 0.0;  // Toques por minuto

// Estados anteriores de botones (para detectar cambios)
bool last_touch_state[5] = {false, false, false, false, false};

// Session ID
String session_id = "";


// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000);  // Esperar puerto serial (máx 3s)
  
  Serial.println("\n=== DISPOSITIVO IOT ANTIESTRÉS - SERENITY ===");
  
  // Configurar pines
  pinMode(TOUCH_PIN_1, INPUT);
  pinMode(TOUCH_PIN_2, INPUT);
  pinMode(TOUCH_PIN_3, INPUT);
  pinMode(TOUCH_PIN_4, INPUT);
  pinMode(TOUCH_PIN_5, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Inicializar DHT11
  dht.begin();
  Serial.println("✓ DHT11 inicializado");
  
  // Conectar WiFi
  connectWiFi();
  
  // Generar session ID
  session_start_time = millis();
  session_id = String(device_id) + "_" + String(session_start_time);
  
  Serial.println("✓ Sistema listo");
  Serial.println("=====================================\n");
  
  // Parpadear LED 3 veces para indicar que está listo
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}


// ============================================================================
// LOOP PRINCIPAL
// ============================================================================
void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi desconectado, reconectando...");
    connectWiFi();
  }
  
  // Leer sensores táctiles
  bool touch_states[5];
  touch_states[0] = digitalRead(TOUCH_PIN_1);
  touch_states[1] = digitalRead(TOUCH_PIN_2);
  touch_states[2] = digitalRead(TOUCH_PIN_3);
  touch_states[3] = digitalRead(TOUCH_PIN_4);
  touch_states[4] = digitalRead(TOUCH_PIN_5);
  
  // Detectar nuevos toques (cambio de LOW a HIGH)
  for (int i = 0; i < 5; i++) {
    if (touch_states[i] == HIGH && last_touch_state[i] == LOW) {
      touch_count++;
      last_touch_time = millis();
      
      // Feedback visual: parpadear LED
      digitalWrite(LED_PIN, HIGH);
      delay(50);
      digitalWrite(LED_PIN, LOW);
      
      Serial.print("👆 Toque detectado en botón ");
      Serial.println(i + 1);
    }
    last_touch_state[i] = touch_states[i];
  }
  
  // Calcular frecuencia de toques (toques/minuto)
  unsigned long elapsed_minutes = (millis() - session_start_time) / 60000;
  if (elapsed_minutes > 0) {
    touch_frequency = (float)touch_count / elapsed_minutes;
  }
  
  // Enviar datos al backend cada 5 segundos
  if (millis() - lastSendTime >= sendInterval) {
    sendSensorData(touch_states);
    lastSendTime = millis();
  }
  
  delay(50);  // Pequeño delay para estabilidad
}


// ============================================================================
// CONECTAR A WIFI
// ============================================================================
void connectWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);
  
  int attempts = 0;
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi conectado");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    // Parpadear LED rápido para indicar conexión exitosa
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(100);
      digitalWrite(LED_PIN, LOW);
      delay(100);
    }
  } else {
    Serial.println("\n✗ No se pudo conectar a WiFi");
    Serial.println("Verifica SSID y contraseña en el código");
    
    // LED parpadeando lento = error de conexión
    while (true) {
      digitalWrite(LED_PIN, HIGH);
      delay(1000);
      digitalWrite(LED_PIN, LOW);
      delay(1000);
    }
  }
}


// ============================================================================
// LEER SENSORES Y ENVIAR AL BACKEND
// ============================================================================
void sendSensorData(bool touch_states[]) {
  // === LEER DHT11 ===
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("⚠ Error leyendo DHT11");
    temperature = 25.0;  // Valor por defecto
    humidity = 50.0;
  }
  
  // === LEER SENSOR DE PRESIÓN ===
  int pressure_raw = analogRead(PRESSURE_PIN);
  // Convertir a kPa (0-10 kPa para MPX5010DP)
  // Vout = Vs * (0.09 * P + 0.04) → P = (Vout/Vs - 0.04) / 0.09
  float voltage = (pressure_raw / 1023.0) * 5.0;  // Convertir ADC a voltaje
  float pressure_kpa = (voltage - 0.2) / 0.45;   // Calibración típica MPX5010DP
  
  if (pressure_kpa < 0) pressure_kpa = 0;
  if (pressure_kpa > 10) pressure_kpa = 10;
  
  // Determinar nivel de agarre
  String grip_strength = "normal";
  bool tension_detected = false;
  
  if (pressure_kpa > 7.0) {
    grip_strength = "high";
    tension_detected = true;
  } else if (pressure_kpa < 2.0) {
    grip_strength = "low";
  }
  
  // === CONSTRUIR JSON ===
  String json_data = "{";
  json_data += "\"device_id\":\"" + String(device_id) + "\",";
  json_data += "\"user_id\":\"" + String(user_id) + "\",";
  json_data += "\"session_id\":\"" + session_id + "\",";
  
  // Sensores táctiles
  json_data += "\"touch_1\":" + String(touch_states[0] ? "true" : "false") + ",";
  json_data += "\"touch_2\":" + String(touch_states[1] ? "true" : "false") + ",";
  json_data += "\"touch_3\":" + String(touch_states[2] ? "true" : "false") + ",";
  json_data += "\"touch_4\":" + String(touch_states[3] ? "true" : "false") + ",";
  json_data += "\"touch_5\":" + String(touch_states[4] ? "true" : "false") + ",";
  json_data += "\"touch_count\":" + String(touch_count) + ",";
  json_data += "\"touch_frequency\":" + String(touch_frequency, 2) + ",";
  
  // Ambiente
  json_data += "\"temperature\":" + String(temperature, 1) + ",";
  json_data += "\"humidity\":" + String(humidity, 1) + ",";
  
  // Presión
  json_data += "\"pressure\":" + String(pressure_kpa, 2) + ",";
  json_data += "\"grip_strength\":\"" + grip_strength + "\",";
  json_data += "\"tension_detected\":" + String(tension_detected ? "true" : "false");
  
  json_data += "}";
  
  // === ENVIAR AL BACKEND ===
  Serial.println("\n📤 Enviando datos al backend...");
  Serial.println("Datos: " + json_data);
  
  if (client.connect(backend_host, backend_port)) {
    // HTTP POST request
    client.println("POST /api/iot/sensors/data HTTP/1.1");
    client.print("Host: ");
    client.println(backend_host);
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(json_data.length());
    client.println("Connection: close");
    client.println();
    client.println(json_data);
    
    // Esperar respuesta
    unsigned long timeout = millis();
    while (client.available() == 0) {
      if (millis() - timeout > 5000) {
        Serial.println("✗ Timeout");
        client.stop();
        return;
      }
    }
    
    // Leer respuesta
    Serial.println("📥 Respuesta del servidor:");
    while (client.available()) {
      String line = client.readStringUntil('\n');
      Serial.println(line);
    }
    
    client.stop();
    Serial.println("✓ Datos enviados correctamente\n");
    
    // Parpadear LED para confirmar envío
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    
  } else {
    Serial.println("✗ No se pudo conectar al backend");
    Serial.print("Verifica que el backend esté corriendo en: ");
    Serial.print(backend_host);
    Serial.print(":");
    Serial.println(backend_port);
  }
}


// ============================================================================
// INFORMACIÓN DEL SISTEMA
// ============================================================================
void printSystemInfo() {
  Serial.println("\n=== INFORMACIÓN DEL SISTEMA ===");
  Serial.print("Device ID: ");
  Serial.println(device_id);
  Serial.print("User ID: ");
  Serial.println(user_id);
  Serial.print("Session ID: ");
  Serial.println(session_id);
  Serial.print("WiFi SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("IP Local: ");
  Serial.println(WiFi.localIP());
  Serial.print("Backend: ");
  Serial.print(backend_host);
  Serial.print(":");
  Serial.println(backend_port);
  Serial.println("===============================\n");
}
