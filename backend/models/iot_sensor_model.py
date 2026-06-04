# backend/models/iot_sensor_model.py
from datetime import datetime
from bson import ObjectId

class IoTSensorModel:
    """
    Modelo para datos del dispositivo IoT antiestrés.
    
    Captura datos de:
    - 5 sensores táctiles capacitivos (TTP223)
    - Sensor de temperatura y humedad (DHT11)
    - Sensor de presión (MPX5010DP)
    """
    
    def __init__(self, db):
        self.collection = db.iot_sensor_data
        self.devices_collection = db.iot_devices
    
    # === CREAR LECTURA DE SENSORES ===
    def create_sensor_reading(self, device_id, user_id, sensor_data):
        """
        Guarda una lectura del dispositivo IoT.
        
        Args:
            device_id (str): ID único del Arduino
            user_id (str): ID del usuario asociado
            sensor_data (dict): Datos de sensores
        
        Returns:
            dict: Lectura guardada con ID
        """
        reading = {
            'device_id': device_id,
            'user_id': user_id,
            'timestamp': datetime.utcnow(),
            
            # Sensores táctiles (5 botones TTP223)
            'touch_sensors': {
                'button_1': sensor_data.get('touch_1', False),
                'button_2': sensor_data.get('touch_2', False),
                'button_3': sensor_data.get('touch_3', False),
                'button_4': sensor_data.get('touch_4', False),
                'button_5': sensor_data.get('touch_5', False),
                'touch_count': sensor_data.get('touch_count', 0),  # Total de toques
                'touch_frequency': sensor_data.get('touch_frequency', 0.0)  # Toques/minuto
            },
            
            # Sensor ambiental (DHT11)
            'environment': {
                'temperature': sensor_data.get('temperature', 0.0),  # °C
                'humidity': sensor_data.get('humidity', 0.0),  # %
                'comfort_index': self._calculate_comfort_index(
                    sensor_data.get('temperature', 25), 
                    sensor_data.get('humidity', 50)
                )
            },
            
            # Sensor de presión (MPX5010DP)
            'pressure': {
                'value': sensor_data.get('pressure', 0.0),  # kPa
                'grip_strength': sensor_data.get('grip_strength', 'normal'),  # low, normal, high
                'tension_detected': sensor_data.get('tension_detected', False)
            },
            
            # Análisis de estrés calculado
            'stress_analysis': {
                'stress_level': self._calculate_stress_level(sensor_data),  # 0-100
                'anxiety_indicators': sensor_data.get('anxiety_indicators', []),
                'recommendation': self._get_recommendation(sensor_data)
            },
            
            # Metadata
            'session_id': sensor_data.get('session_id'),  # ID de sesión de uso
            'device_status': 'active'
        }
        
        result = self.collection.insert_one(reading)
        reading['_id'] = str(result.inserted_id)
        return reading
    
    # === OBTENER LECTURAS POR USUARIO ===
    def get_user_readings(self, user_id, limit=50, skip=0):
        """Obtiene las últimas lecturas de un usuario."""
        readings = list(self.collection.find(
            {'user_id': user_id}
        ).sort('timestamp', -1).skip(skip).limit(limit))
        
        for reading in readings:
            reading['_id'] = str(reading['_id'])
        
        return readings
    
    # === OBTENER LECTURAS POR RANGO DE FECHA ===
    def get_readings_by_date_range(self, user_id, start_date, end_date):
        """Obtiene lecturas en un rango de fechas."""
        readings = list(self.collection.find({
            'user_id': user_id,
            'timestamp': {
                '$gte': start_date,
                '$lte': end_date
            }
        }).sort('timestamp', -1))
        
        for reading in readings:
            reading['_id'] = str(reading['_id'])
        
        return readings
    
    # === ESTADÍSTICAS DEL DÍA ===
    def get_daily_statistics(self, user_id, date=None):
        """Obtiene estadísticas de sensores del día."""
        if date is None:
            date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            date = date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        next_day = date.replace(hour=23, minute=59, second=59)
        
        pipeline = [
            {
                '$match': {
                    'user_id': user_id,
                    'timestamp': {'$gte': date, '$lte': next_day}
                }
            },
            {
                '$group': {
                    '_id': None,
                    'total_readings': {'$sum': 1},
                    'avg_stress_level': {'$avg': '$stress_analysis.stress_level'},
                    'avg_temperature': {'$avg': '$environment.temperature'},
                    'avg_humidity': {'$avg': '$environment.humidity'},
                    'avg_pressure': {'$avg': '$pressure.value'},
                    'total_touch_events': {'$sum': '$touch_sensors.touch_count'},
                    'high_stress_count': {
                        '$sum': {
                            '$cond': [{'$gte': ['$stress_analysis.stress_level', 70]}, 1, 0]
                        }
                    }
                }
            }
        ]
        
        result = list(self.collection.aggregate(pipeline))
        
        if result:
            stats = result[0]
            stats.pop('_id', None)
            return stats
        
        return {
            'total_readings': 0,
            'avg_stress_level': 0,
            'avg_temperature': 0,
            'avg_humidity': 0,
            'avg_pressure': 0,
            'total_touch_events': 0,
            'high_stress_count': 0
        }
    
    # === REGISTRAR DISPOSITIVO ===
    def register_device(self, device_id, user_id, device_info):
        """Registra un nuevo dispositivo IoT."""
        device = {
            'device_id': device_id,
            'user_id': user_id,
            'device_name': device_info.get('device_name', 'Dispositivo Antiestrés'),
            'device_type': 'Arduino Nano 33 IoT',
            'registered_at': datetime.utcnow(),
            'last_connection': datetime.utcnow(),
            'status': 'active',
            'firmware_version': device_info.get('firmware_version', '1.0.0')
        }
        
        # Actualizar o insertar
        self.devices_collection.update_one(
            {'device_id': device_id},
            {'$set': device},
            upsert=True
        )
        
        return device
    
    # === ACTUALIZAR ÚLTIMA CONEXIÓN ===
    def update_device_connection(self, device_id):
        """Actualiza el timestamp de última conexión."""
        self.devices_collection.update_one(
            {'device_id': device_id},
            {'$set': {'last_connection': datetime.utcnow()}}
        )
    
    # === OBTENER DISPOSITIVOS DEL USUARIO ===
    def get_user_devices(self, user_id):
        """Obtiene todos los dispositivos registrados por un usuario."""
        devices = list(self.devices_collection.find({'user_id': user_id}))
        for device in devices:
            device['_id'] = str(device['_id'])
        return devices
    
    # === CÁLCULOS AUXILIARES ===
    
    def _calculate_stress_level(self, sensor_data):
        """
        Calcula nivel de estrés basado en sensores (0-100).
        
        Factores:
        - Alta frecuencia de toques → ansiedad/inquietud
        - Alta presión de agarre → tensión
        - Temperatura/humedad fuera de confort → estrés ambiental
        """
        stress_score = 0
        
        # Factor 1: Frecuencia de toques (0-40 puntos)
        touch_freq = sensor_data.get('touch_frequency', 0)
        if touch_freq > 20:  # Más de 20 toques/minuto - ansiedad alta
            stress_score += 40
        elif touch_freq > 10:  # Más de 10 toques/minuto - inquietud
            stress_score += 25
        elif touch_freq > 3:  # Más de 3 toques/minuto - ligera ansiedad
            stress_score += 10
        
        # Factor 2: Presión de agarre (0-30 puntos)
        pressure = sensor_data.get('pressure', 0)
        if pressure > 6:  # Alta presión (>6 kPa) - tensión alta
            stress_score += 30
        elif pressure > 4:  # Presión moderada (>4 kPa) - tensión moderada
            stress_score += 15
        
        # Factor 3: Ambiente (0-30 puntos)
        temp = sensor_data.get('temperature', 25)
        humidity = sensor_data.get('humidity', 50)
        
        if temp > 28 or temp < 18:  # Fuera de zona confort
            stress_score += 15
        if humidity > 70 or humidity < 30:
            stress_score += 15
        
        return min(stress_score, 100)  # Máximo 100
    
    def _calculate_comfort_index(self, temp, humidity):
        """
        Calcula índice de confort térmico.
        
        Returns:
            str: 'comfortable', 'warm', 'cold', 'humid'
        """
        if 20 <= temp <= 26 and 30 <= humidity <= 60:
            return 'comfortable'
        elif temp > 26:
            return 'warm'
        elif temp < 20:
            return 'cold'
        elif humidity > 60:
            return 'humid'
        else:
            return 'dry'
    
    def _get_recommendation(self, sensor_data):
        """
        Genera recomendación basada en los datos de sensores.
        """
        stress_level = self._calculate_stress_level(sensor_data)
        touch_freq = sensor_data.get('touch_frequency', 0)
        pressure = sensor_data.get('pressure', 0)
        
        # 🌟 CASO ESPECIAL: Usuario está usando el dispositivo correctamente (técnica grounding)
        if 10 <= touch_freq <= 20 and 3 <= pressure <= 6:
            return "¡Excelente! Estás usando la técnica de grounding correctamente. Continúa así para reducir tu ansiedad."
        
        # Nivel crítico
        if stress_level >= 70:
            if touch_freq > 30:
                return "Nivel de ansiedad alto detectado. Respira profundo y haz el ejercicio de respiración 4-7-8."
            else:
                return "Nivel de estrés alto. Te recomendamos hacer una meditación guiada de 5 minutos."
        
        # Nivel moderado
        elif stress_level >= 40:
            if pressure > 7:
                return "Detectamos tensión muscular. Intenta el ejercicio de relajación muscular progresiva (PMR)."
            else:
                return "Se detecta algo de tensión. Prueba una meditación corta de 3 minutos."
        
        # Nivel bajo
        else:
            return "Tu nivel de estrés es normal. ¡Sigue así! Puedes practicar meditación preventiva."
