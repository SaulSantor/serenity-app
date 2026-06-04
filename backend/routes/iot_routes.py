# backend/routes/iot_routes.py
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from functools import wraps

bp = Blueprint('iot', __name__, url_prefix='/api/iot')

# === DECORADOR PARA AUTH OPCIONAL ===
def optional_auth(f):
    """Permite acceso con o sin token (para dispositivos IoT)."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # IoT puede usar device_id en lugar de JWT
        return f(*args, **kwargs)
    return decorated_function


# === VERIFICAR CONEXIÓN IOT ===
@bp.route('/ping', methods=['GET'])
def ping():
    """Endpoint para verificar que el dispositivo puede conectarse."""
    return jsonify({
        'status': 'ok',
        'message': 'IoT API is running',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# === REGISTRAR DISPOSITIVO ===
@bp.route('/devices/register', methods=['POST'])
def register_device():
    """
    Registra un nuevo dispositivo IoT.
    
    Body:
    {
        "device_id": "ARDUINO_MAC_ADDRESS",
        "user_id": "user123",
        "device_name": "Mi dispositivo antiestrés",
        "firmware_version": "1.0.0"
    }
    """
    try:
        data = request.get_json()
        
        device_id = data.get('device_id')
        user_id = data.get('user_id')
        
        if not device_id:
            return jsonify({'error': 'device_id es requerido'}), 400
        
        if not user_id:
            return jsonify({'error': 'user_id es requerido'}), 400
        
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        # Registrar dispositivo
        device = iot_model.register_device(device_id, user_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Dispositivo registrado correctamente',
            'device': device
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === ENVIAR DATOS DE SENSORES ===
@bp.route('/sensors/data', methods=['POST'])
@optional_auth
def receive_sensor_data():
    """
    Recibe datos de sensores del Arduino.
    
    Body:
    {
        "device_id": "ARDUINO_MAC_ADDRESS",
        "user_id": "user123",
        "touch_1": true,
        "touch_2": false,
        "touch_3": true,
        "touch_4": false,
        "touch_5": false,
        "touch_count": 3,
        "touch_frequency": 12.5,
        "temperature": 24.5,
        "humidity": 55.0,
        "pressure": 6.8,
        "grip_strength": "high",
        "tension_detected": true,
        "session_id": "session_20250124_001"
    }
    """
    try:
        data = request.get_json()
        
        device_id = data.get('device_id')
        user_id = data.get('user_id')
        
        if not device_id:
            return jsonify({'error': 'device_id es requerido'}), 400
        
        if not user_id:
            return jsonify({'error': 'user_id es requerido'}), 400
        
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        # Guardar lectura
        reading = iot_model.create_sensor_reading(device_id, user_id, data)
        
        # Actualizar última conexión del dispositivo
        iot_model.update_device_connection(device_id)
        
        return jsonify({
            'success': True,
            'message': 'Datos recibidos correctamente',
            'reading_id': reading['_id'],
            'stress_level': reading['stress_analysis']['stress_level'],
            'recommendation': reading['stress_analysis']['recommendation']
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === OBTENER LECTURAS DEL USUARIO ===
@bp.route('/sensors/readings/<user_id>', methods=['GET'])
def get_user_readings(user_id):
    """
    Obtiene las lecturas de sensores de un usuario.
    
    Query params:
    - limit: número de lecturas (default: 50)
    - skip: saltar lecturas (paginación)
    """
    try:
        limit = int(request.args.get('limit', 50))
        skip = int(request.args.get('skip', 0))
        
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        readings = iot_model.get_user_readings(user_id, limit, skip)
        
        return jsonify({
            'success': True,
            'count': len(readings),
            'readings': readings
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === OBTENER ESTADÍSTICAS DEL DÍA ===
@bp.route('/sensors/statistics/<user_id>', methods=['GET'])
def get_daily_statistics(user_id):
    """
    Obtiene estadísticas de sensores del día.
    
    Query params:
    - date: fecha en formato YYYY-MM-DD (default: hoy)
    """
    try:
        date_str = request.args.get('date')
        
        if date_str:
            date = datetime.strptime(date_str, '%Y-%m-%d')
        else:
            date = datetime.utcnow()
        
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        stats = iot_model.get_daily_statistics(user_id, date)
        
        return jsonify({
            'success': True,
            'date': date.strftime('%Y-%m-%d'),
            'statistics': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === OBTENER LECTURAS POR RANGO DE FECHAS ===
@bp.route('/sensors/readings/<user_id>/range', methods=['GET'])
def get_readings_by_range(user_id):
    """
    Obtiene lecturas en un rango de fechas.
    
    Query params:
    - start_date: fecha inicio (YYYY-MM-DD)
    - end_date: fecha fin (YYYY-MM-DD)
    """
    try:
        start_str = request.args.get('start_date')
        end_str = request.args.get('end_date')
        
        if not start_str or not end_str:
            return jsonify({'error': 'start_date y end_date son requeridos'}), 400
        
        start_date = datetime.strptime(start_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        readings = iot_model.get_readings_by_date_range(user_id, start_date, end_date)
        
        return jsonify({
            'success': True,
            'start_date': start_str,
            'end_date': end_str,
            'count': len(readings),
            'readings': readings
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === OBTENER DISPOSITIVOS DEL USUARIO ===
@bp.route('/devices/<user_id>', methods=['GET'])
def get_user_devices(user_id):
    """Obtiene todos los dispositivos registrados por un usuario."""
    try:
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        devices = iot_model.get_user_devices(user_id)
        
        return jsonify({
            'success': True,
            'count': len(devices),
            'devices': devices
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === OBTENER ÚLTIMA LECTURA (TIEMPO REAL) ===
@bp.route('/sensors/latest/<user_id>', methods=['GET'])
def get_latest_reading(user_id):
    """Obtiene la última lectura de sensores (para monitoreo en tiempo real)."""
    try:
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        readings = iot_model.get_user_readings(user_id, limit=1)
        
        if readings:
            return jsonify({
                'success': True,
                'reading': readings[0]
            }), 200
        else:
            return jsonify({
                'success': True,
                'reading': None,
                'message': 'No hay lecturas disponibles'
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# === ANÁLISIS DE PATRONES DE ANSIEDAD ===
@bp.route('/analysis/anxiety-patterns/<user_id>', methods=['GET'])
def analyze_anxiety_patterns(user_id):
    """
    Analiza patrones de ansiedad basados en datos históricos.
    
    Query params:
    - days: número de días a analizar (default: 7)
    """
    try:
        days = int(request.args.get('days', 7))
        
        # Obtener modelo
        db = current_app.extensions['db']
        from models.iot_sensor_model import IoTSensorModel
        iot_model = IoTSensorModel(db)
        
        # Obtener lecturas de los últimos N días
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        readings = iot_model.get_readings_by_date_range(user_id, start_date, end_date)
        
        if not readings:
            return jsonify({
                'success': True,
                'message': 'No hay suficientes datos para análisis',
                'patterns': {}
            }), 200
        
        # Análisis básico
        total_readings = len(readings)
        high_stress_count = sum(1 for r in readings if r['stress_analysis']['stress_level'] >= 70)
        avg_stress = sum(r['stress_analysis']['stress_level'] for r in readings) / total_readings
        avg_touch_freq = sum(r['touch_sensors']['touch_frequency'] for r in readings) / total_readings
        
        # Detectar hora del día con más ansiedad
        hour_stress = {}
        for reading in readings:
            hour = reading['timestamp'].hour
            stress = reading['stress_analysis']['stress_level']
            
            if hour not in hour_stress:
                hour_stress[hour] = []
            hour_stress[hour].append(stress)
        
        peak_anxiety_hour = max(hour_stress.items(), key=lambda x: sum(x[1])/len(x[1]))[0] if hour_stress else None
        
        return jsonify({
            'success': True,
            'analysis_period': f'{days} días',
            'patterns': {
                'total_sessions': total_readings,
                'high_stress_sessions': high_stress_count,
                'high_stress_percentage': round((high_stress_count / total_readings) * 100, 1),
                'average_stress_level': round(avg_stress, 1),
                'average_touch_frequency': round(avg_touch_freq, 1),
                'peak_anxiety_hour': peak_anxiety_hour,
                'recommendation': _get_pattern_recommendation(avg_stress, high_stress_count, total_readings)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _get_pattern_recommendation(avg_stress, high_stress_count, total_readings):
    """Genera recomendación basada en patrones."""
    high_stress_ratio = high_stress_count / total_readings if total_readings > 0 else 0
    
    if high_stress_ratio > 0.5:
        return "Se detectan episodios frecuentes de ansiedad alta. Considera consultar con un profesional."
    elif avg_stress > 60:
        return "Tu nivel promedio de estrés es elevado. Te recomendamos practicar meditación diariamente."
    elif avg_stress > 40:
        return "Nivel de estrés moderado. Continúa usando técnicas de relajación."
    else:
        return "¡Excelente! Tus niveles de estrés se mantienen controlados."
