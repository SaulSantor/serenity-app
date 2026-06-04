# backend/routes/stats_routes.py
import logging
from flask import Blueprint, jsonify, current_app
from models.stats_model import StatsModel

# === CONFIGURAR LOGGER ===
logger = logging.getLogger('stats_routes')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

bp = Blueprint('stats', __name__, url_prefix='/api/stats')


@bp.route('', methods=['GET'])
def get_stats():
    """
    Obtener estadísticas generales de la plataforma (público)
    Este endpoint es público para mostrar en la landing page
    """
    try:
        collections = current_app.extensions['collections']
        Stats = StatsModel(collections)
        
        stats = Stats.get_all_stats()
        
        logger.info("get_stats() - Estadísticas obtenidas exitosamente")
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
    
    except Exception as e:
        logger.error(f"get_stats() - Error inesperado: {e}")
        return jsonify({'error': 'Error al obtener estadísticas'}), 500


@bp.route('/users', methods=['GET'])
def get_user_stats():
    """Obtener estadísticas específicas de usuarios"""
    try:
        collections = current_app.extensions['collections']
        Stats = StatsModel(collections)
        
        user_stats = {
            'totalUsers': Stats.get_total_users(),
            'activeUsers': Stats.get_active_users(30),
            'activeUsers7Days': Stats.get_active_users(7),
            'activeUsersToday': Stats.get_active_users(1)
        }
        
        logger.info("get_user_stats() - Estadísticas de usuarios obtenidas")
        
        return jsonify({
            'success': True,
            'stats': user_stats
        }), 200
    
    except Exception as e:
        logger.error(f"get_user_stats() - Error: {e}")
        return jsonify({'error': 'Error al obtener estadísticas de usuarios'}), 500


@bp.route('/practices', methods=['GET'])
def get_practice_stats():
    """Obtener estadísticas específicas de prácticas"""
    try:
        collections = current_app.extensions['collections']
        Stats = StatsModel(collections)
        
        practice_stats = {
            'totalPractices': Stats.get_total_practices(),
            'practicesToday': Stats.get_practices_today(),
            'totalUsers': Stats.get_total_users(),
            'averagePracticesPerUser': round(
                Stats.get_total_practices() / Stats.get_total_users() 
                if Stats.get_total_users() > 0 else 0, 
                1
            )
        }
        
        logger.info("get_practice_stats() - Estadísticas de prácticas obtenidas")
        
        return jsonify({
            'success': True,
            'stats': practice_stats
        }), 200
    
    except Exception as e:
        logger.error(f"get_practice_stats() - Error: {e}")
        return jsonify({'error': 'Error al obtener estadísticas de prácticas'}), 500


@bp.route('/wellness', methods=['GET'])
def get_wellness_stats():
    """Obtener estadísticas de bienestar (humor, estrés, etc.)"""
    try:
        collections = current_app.extensions['collections']
        Stats = StatsModel(collections)
        
        wellness_stats = {
            'stressReductionRate': Stats.get_stress_reduction_rate(),
            'totalMoodEntries': Stats.get_total_mood_entries(),
            'totalJournalEntries': Stats.get_total_journal_entries(),
            'averageRating': Stats.get_average_rating()
        }
        
        logger.info("get_wellness_stats() - Estadísticas de bienestar obtenidas")
        
        return jsonify({
            'success': True,
            'stats': wellness_stats
        }), 200
    
    except Exception as e:
        logger.error(f"get_wellness_stats() - Error: {e}")
        return jsonify({'error': 'Error al obtener estadísticas de bienestar'}), 500