# backend/routes/progress_routes.py
"""
Endpoints para cargar el progreso del usuario en el dashboard
Estos endpoints retornan datos dinámicos desde la BD
"""
import logging
from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from utils.auth import decode_token

logger = logging.getLogger('progress_routes')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

bp = Blueprint('progress', __name__, url_prefix='/api/progress')


# === MIDDLEWARE: Verificar token o sesión ===
def get_current_user():
    """Extrae y valida el token o sesión, retorna user_id o error"""
    from flask import session
    
    # 1. Verificar sesión primero (web)
    if 'user_id' in session:
        return session['user_id'], None
    
    # 2. Verificar token Bearer (mobile/API)
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None, (jsonify({'error': 'Token o sesión requerido'}), 401)
    
    token = auth_header.split(' ')[1]
    payload = decode_token(token)
    
    if not payload:
        return None, (jsonify({'error': 'Token inválido o expirado'}), 401)
    
    return payload['user_id'], None


@bp.route('/me', methods=['GET'])
def get_user_progress():
    """
    Obtener progreso del usuario autenticado
    Incluye: prácticas este mes, constancia, semanas activas, nivel, XP, racha, badges, actividades recientes
    """
    user_id, error = get_current_user()
    if error:
        return error
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"get_user_progress() - ID inválido: {user_id}")
        return jsonify({'error': 'ID de usuario inválido'}), 400
    
    users_col = current_app.extensions['collections']['users']
    practices_col = current_app.extensions['collections']['practices']
    
    try:
        # Obtener usuario
        user = users_col.find_one({'_id': user_id_obj})
        if not user:
            logger.error(f"get_user_progress() - Usuario no encontrado: {user_id}")
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # === ESTADÍSTICAS ===
        today = datetime.utcnow().date()
        month_start = today.replace(day=1)
        
        # Prácticas este mes (campo `created_at` en la colección de prácticas)
        practices_this_month = practices_col.count_documents({
            'user_id': user_id_obj,
            'created_at': {
                '$gte': datetime.combine(month_start, datetime.min.time()),
                '$lt': datetime.combine(today + timedelta(days=1), datetime.min.time())
            }
        })
        
        # Constancia (porcentaje de días activos en últimos 30 días)
        # Contar solo prácticas que tengan `created_at` válido
        recent_practices_cursor = practices_col.find({
            'user_id': user_id_obj,
            'created_at': {
                '$gte': datetime.utcnow() - timedelta(days=30)
            }
        })
        days_active = len(set(
            p.get('created_at').date()
            for p in recent_practices_cursor
            if p.get('created_at')
        ))
        consistency_rate = round((days_active / 30) * 100, 1)
        
        # Semanas activas consecutivas
        all_practices = list(practices_col.find(
            {'user_id': user_id_obj},
            sort=[('created_at', -1)],
            limit=100
        ))
        
        active_weeks = 0
        if all_practices:
            # Filtrar prácticas sin timestamp para evitar KeyError
            dates = [p.get('created_at').date() for p in all_practices if p.get('created_at')]
            if dates:
                current_week = dates[0].isocalendar()[1]
                for date in dates:
                    if date.isocalendar()[1] == current_week:
                        continue
                    elif date.isocalendar()[1] == current_week - 1:
                        active_weeks += 1
                        current_week = date.isocalendar()[1]
                    else:
                        break
        
        # Últimas actividades
        recent_activities = []
        if all_practices:
            for practice in all_practices[:5]:
                recent_activities.append({
                    'type': 'completed',
                    'title': 'Práctica completada',
                    'description': f"{practice.get('technique','')} ({practice.get('duration',0)} min)"
                })
        
        progress_data = {
            'practicesThisMonth': practices_this_month,
            'consistency': consistency_rate,
            'activeWeeks': active_weeks,
            'level': user.get('level', 1),
            'xp': user.get('xp', 0),
            'streak': user.get('streak', 0),
            'badges': user.get('badges', []),
            'recentActivities': recent_activities
        }
        
        logger.info(f"get_user_progress() - Progreso obtenido: {user_id}")
        return jsonify({
            'success': True,
            'progress': progress_data
        }), 200
    
    except Exception as e:
        logger.error(f"get_user_progress() - Error: {e}")
        return jsonify({'error': 'Error al obtener progreso'}), 500


# === MAPEO DE TÉCNICAS A CATEGORÍAS ===
TECHNIQUE_TO_CATEGORY = {
    'Respiración 4-7-8': 'Regulación somática',
    'Escaneo corporal': 'Regulación somática',
    'Relajación muscular progresiva': 'Regulación somática',
    'Yoga Nidra': 'Regulación somática',
    'EFT Tapping': 'Regulación somática',
    'Grounding 5-4-3-2-1': 'Regulación somática',
    'Mindfulness respiración': 'Mindfulness y aceptación',
    'Box Breathing': 'Mindfulness y aceptación',
    'Yoga suave': 'Mindfulness y aceptación',
    'Visualización': 'Mindfulness y aceptación',
    'Autocompasión': 'Autocompasión',
    'Autocompasion': 'Autocompasión',
}


@bp.route('/courses', methods=['GET'])
def get_user_courses():
    """
    Obtener cursos/técnicas en progreso del usuario
    Retorna datos que el usuario está practicando actualmente
    """
    user_id, error = get_current_user()
    if error:
        return error
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"get_user_courses() - ID inválido: {user_id}")
        return jsonify({'error': 'ID de usuario inválido'}), 400
    
    practices_col = current_app.extensions['collections']['practices']
    techniques_col = current_app.extensions['collections']['techniques']
    
    try:
        # Obtener técnicas únicas del usuario
        user_practices = list(practices_col.find(
            {'user_id': user_id_obj},
            projection={'technique': 1, 'created_at': 1, 'duration': 1}
        ))
        
        if not user_practices:
            logger.info(f"get_user_courses() - Sin cursos: {user_id}")
            return jsonify({
                'success': True,
                'courses': []
            }), 200
        
        # Agrupar por técnica
        techniques = {}
        for practice in user_practices:
            tech = practice['technique']
            if tech not in techniques:
                techniques[tech] = {
                    'count': 0,
                    'last_date': None,
                    'total_duration': 0
                }
            techniques[tech]['count'] += 1
            techniques[tech]['last_date'] = practice.get('created_at')
            techniques[tech]['total_duration'] += practice.get('duration', 0)
        
        # Construir datos de cursos
        courses = []
        progress_colors = [
            'linear-gradient(135deg, #FFD6A5 0%, #FFAB73 100%)',
            'linear-gradient(135deg, #A8E6CF 0%, #56CCF2 100%)',
            'linear-gradient(135deg, #C7CEEA 0%, #B5C6E0 100%)'
        ]
        
        icons = ['ri-lungs-line', 'ri-mental-health-line', 'ri-hand-heart-line']
        
        for idx, (tech_name, stats) in enumerate(techniques.items()):
            # Obtener el objetivo de prácticas requeridas de la BD (por defecto 5)
            tech_doc = techniques_col.find_one({'name': tech_name}, projection={'practicesRequired': 1})
            total_lessons = tech_doc.get('practicesRequired', 5) if tech_doc else 5
            
            current_lesson = min(stats['count'], total_lessons)
            progress = int((current_lesson / total_lessons) * 100)  # Porcentaje consistente
            is_completed = stats['count'] >= total_lessons
            
            # Usar mapeo explícito de técnicas a categorías
            category = TECHNIQUE_TO_CATEGORY.get(tech_name, 'Reestructuración cognitiva')
            
            courses.append({
                'id': f"course_{idx}",
                'name': tech_name,
                'category': category,
                'icon': icons[idx % len(icons)],
                'color': progress_colors[idx % len(progress_colors)],
                'status': 'completed' if is_completed else 'in_progress',
                'progress': progress,
                'currentLesson': current_lesson,
                'totalLessons': total_lessons,
                'duration': 15,
                'xp': 100 if is_completed else 50,
                'difficulty': 'Principiante' if stats['count'] < 3 else 'Intermedio',
                'objective': f"Domina {tech_name} completando {total_lessons} prácticas",
                'url': f"/ejercicio.html?technique={tech_name}"
            })
        
        logger.info(f"get_user_courses() - {len(courses)} cursos obtenidos: {user_id}")
        return jsonify({
            'success': True,
            'courses': courses
        }), 200
    
    except Exception as e:
        logger.error(f"get_user_courses() - Error: {e}")
        return jsonify({'error': 'Error al obtener cursos'}), 500


@bp.route('/practices', methods=['GET'])
def get_practices():
    """
    Obtener todas las prácticas del usuario ordenadas por fecha (más reciente primero)
    """
    user_id, error = get_current_user()
    if error:
        return error
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"get_practices() - ID inválido: {user_id}")
        return jsonify({'error': 'ID de usuario inválido'}), 400
    
    practices_col = current_app.extensions['collections']['practices']
    
    try:
        # Obtener prácticas ordenadas por fecha descendente
        practices = list(practices_col.find(
            {'user_id': user_id_obj}
        ).sort('created_at', -1))
        
        # Convertir ObjectId a string
        for practice in practices:
            practice['id'] = str(practice['_id'])
            practice['_id'] = str(practice['_id'])
            if 'user_id' in practice:
                practice['user_id'] = str(practice['user_id'])
            if 'created_at' in practice:
                practice['date'] = practice['created_at'].isoformat()
        
        logger.info(f"get_practices() - {len(practices)} prácticas obtenidas: {user_id}")
        return jsonify({
            'success': True,
            'practices': practices,
            'total': len(practices)
        }), 200
    
    except Exception as e:
        logger.error(f"get_practices() - Error: {e}")
        return jsonify({'error': 'Error al obtener prácticas'}), 500


@bp.route('/log-practice', methods=['POST'])
def log_practice():
    """
    Registrar una nueva práctica completada
    Body: { techniqueId, duration, completed }
    """
    user_id, error = get_current_user()
    if error:
        return error
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"log_practice() - ID inválido: {user_id}")
        return jsonify({'error': 'ID de usuario inválido'}), 400
    
    data = request.get_json()
    technique_id = data.get('techniqueId')
    duration = data.get('duration', 5)
    completed = data.get('completed', True)
    
    if not technique_id:
        return jsonify({'error': 'techniqueId es requerido'}), 400
    
    practices_col = current_app.extensions['collections']['practices']
    techniques_col = current_app.extensions['collections']['techniques']
    users_col = current_app.extensions['collections']['users']
    
    try:
        # Obtener la técnica
        technique = techniques_col.find_one({'_id': ObjectId(technique_id)})
        if not technique:
            return jsonify({'error': 'Técnica no encontrada'}), 404
        
        technique_name = technique.get('name', 'Práctica')
        category = technique.get('category', 'Mindfulness')
        
        # Crear práctica - AGREGAMOS techniqueId
        practice_doc = {
            'user_id': user_id_obj,
            'techniqueId': technique_id,  # Guardamos el ID de la técnica
            'technique': technique_name,
            'category': category,
            'duration': duration,
            'completed': completed,
            'created_at': datetime.utcnow(),
            'xp_earned': 50 if completed else 25
        }
        
        result = practices_col.insert_one(practice_doc)
        
        # Actualizar XP y nivel del usuario
        if completed:
            # Obtener XP actual
            user = users_col.find_one({'_id': user_id_obj}, projection={'xp': 1})
            current_xp = user.get('xp', 0) if user else 0
            new_xp = current_xp + 50
            
            # Calcular nuevo nivel (cada 500 XP = 1 nivel)
            new_level = (new_xp // 500) + 1
            
            # Actualizar XP y nivel
            users_col.update_one(
                {'_id': user_id_obj},
                {
                    '$set': {
                        'xp': new_xp,
                        'level': new_level
                    }
                }
            )
        
        logger.info(f"log_practice() - Práctica registrada: {technique_name} - Usuario: {user_id}")
        return jsonify({
            'success': True,
            'practiceId': str(result.inserted_id),
            'xp_earned': practice_doc['xp_earned']
        }), 201
    
    except Exception as e:
        logger.error(f"log_practice() - Error: {e}")
        return jsonify({'error': 'Error al registrar práctica'}), 500


@bp.route('/framework-stats', methods=['GET'])
def get_framework_stats():
    """
    Obtener estadísticas de frameworks (categorías) del usuario
    Retorna: técnicas completadas y total esperado por categoría
    """
    user_id, error = get_current_user()
    if error:
        return error
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"get_framework_stats() - ID inválido: {user_id}")
        return jsonify({'error': 'ID de usuario inválido'}), 400
    
    practices_col = current_app.extensions['collections']['practices']
    
    try:
        # Obtener todas las técnicas del usuario
        user_practices = list(practices_col.find(
            {'user_id': user_id_obj},
            projection={'technique': 1}
        ))
        
        # Contar técnicas por categoría
        category_stats = {}
        for practice in user_practices:
            tech = practice.get('technique')
            if tech:
                category = TECHNIQUE_TO_CATEGORY.get(tech, 'Reestructuración cognitiva')
                if category not in category_stats:
                    category_stats[category] = set()
                category_stats[category].add(tech)
        
        # Calcular totales esperados por categoría (contar técnicas en mapeo)
        expected_totals = {}
        for tech, cat in TECHNIQUE_TO_CATEGORY.items():
            if cat not in expected_totals:
                expected_totals[cat] = set()
            expected_totals[cat].add(tech)
        
        # Construir respuesta
        frameworks = {
            'Regulación somática': {
                'completed': len(category_stats.get('Regulación somática', set())),
                'total': len(expected_totals.get('Regulación somática', set()))
            },
            'Reestructuración cognitiva': {
                'completed': len(category_stats.get('Reestructuración cognitiva', set())),
                'total': len(expected_totals.get('Reestructuración cognitiva', set()))
            },
            'Mindfulness y aceptación': {
                'completed': len(category_stats.get('Mindfulness y aceptación', set())),
                'total': len(expected_totals.get('Mindfulness y aceptación', set()))
            },
            'Autocompasión': {
                'completed': len(category_stats.get('Autocompasión', set())),
                'total': len(expected_totals.get('Autocompasión', set()))
            }
        }
        
        logger.info(f"get_framework_stats() - Estadísticas obtenidas: {user_id}")
        return jsonify({
            'success': True,
            'frameworks': frameworks
        }), 200
    
    except Exception as e:
        logger.error(f"get_framework_stats() - Error: {e}")
        return jsonify({'error': 'Error al obtener estadísticas de frameworks'}), 500
