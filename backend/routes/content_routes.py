# backend/routes/content_routes.py
"""
Endpoints para obtener contenido (técnicas, meditaciones, etc.)
"""
import logging
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from utils.auth import decode_token
from database.db import get_db

logger = logging.getLogger('content_routes')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

bp = Blueprint('content', __name__, url_prefix='/api/content')


# === MIDDLEWARE: Verificar token (opcional) ===
def get_current_user_optional():
    """Obtiene user_id si existe token, None si no"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    payload = decode_token(token)
    
    return payload['user_id'] if payload else None


@bp.route('/techniques', methods=['GET'])
def get_techniques():
    """
    Obtener todas las técnicas disponibles desde la BD.
    Parámetros opcionales:
    - category: filtra por categoría (regulación-somática, tcc, mindfulness, autocompasión)
    - difficulty: filtra por dificultad (Principiante, Intermedio, Avanzado)
    - type: tipo de técnica (audio, video, interactive)
    """
    category = request.args.get('category', 'all')
    difficulty = request.args.get('difficulty', 'all')
    tech_type = request.args.get('type', 'all')
    
    try:
        db = get_db()
        techniques_col = db.get_collection('techniques')

        # Construir filtros de consulta
        query = {}
        if category != 'all':
            query['category'] = {'$regex': f'^{category}$', '$options': 'i'}
        if difficulty != 'all':
            query['difficulty'] = difficulty
        if tech_type != 'all':
            query['type'] = tech_type

        docs = list(techniques_col.find(query))

        # Convertir ObjectId a id
        techniques = []
        for d in docs:
            d['id'] = str(d.get('_id'))
            d.pop('_id', None)
            techniques.append(d)

        logger.info(f"get_techniques() - {len(techniques)} técnicas retornadas desde DB")
        return jsonify({'success': True, 'techniques': techniques, 'total': len(techniques)}), 200

    except Exception as e:
        logger.error(f"get_techniques() - Error: {e}")
        return jsonify({'error': 'Error al obtener técnicas'}), 500


@bp.route('/techniques/<technique_id>', methods=['GET'])
def get_technique(technique_id):
    """Obtener una técnica específica por ID"""
    try:
        logger.info(f"get_technique() - Técnica solicitada: {technique_id}")
        
        db = get_db()
        techniques_col = db.get_collection('techniques')
        
        # Buscar técnica por ID
        technique = techniques_col.find_one({'_id': ObjectId(technique_id)})
        
        if not technique:
            return jsonify({'error': 'Técnica no encontrada'}), 404
        
        # Convertir ObjectId a string
        technique['id'] = str(technique['_id'])
        technique.pop('_id', None)
        
        logger.info(f"get_technique() - Técnica encontrada: {technique.get('name')}")
        
        return jsonify({
            'success': True,
            'technique': technique
        }), 200
    
    except Exception as e:
        logger.error(f"get_technique() - Error: {e}")
        return jsonify({'error': 'Error al obtener técnica'}), 500


@bp.route('/quotes', methods=['GET'])
def get_quotes():
    """Retorna frases/inspiraciones desde la colección `quotes`."""
    try:
        db = get_db()
        col = db.get_collection('quotes')
        docs = list(col.find({}))
        quotes = []
        for d in docs:
            d['id'] = str(d.get('_id'))
            d.pop('_id', None)
            quotes.append(d)
        logger.info(f"get_quotes() - {len(quotes)} frases retornadas")
        return jsonify({'success': True, 'quotes': quotes, 'total': len(quotes)}), 200
    except Exception as e:
        logger.error(f"get_quotes() - Error: {e}")
        return jsonify({'error': 'Error al obtener frases'}), 500


@bp.route('/prompts', methods=['GET'])
def get_prompts():
    """Retorna prompts/ejercicios desde la colección `prompts`."""
    try:
        db = get_db()
        col = db.get_collection('prompts')
        docs = list(col.find({}))
        prompts = []
        for d in docs:
            d['id'] = str(d.get('_id'))
            d.pop('_id', None)
            prompts.append(d)
        logger.info(f"get_prompts() - {len(prompts)} prompts retornados")
        return jsonify({'success': True, 'prompts': prompts, 'total': len(prompts)}), 200
    except Exception as e:
        logger.error(f"get_prompts() - Error: {e}")
        return jsonify({'error': 'Error al obtener prompts'}), 500


@bp.route('/recommended_paths', methods=['GET'])
def get_recommended_paths():
    """Retorna rutas recomendadas desde la colección `recommended_paths`."""
    try:
        db = get_db()
        col = db.get_collection('recommended_paths')
        docs = list(col.find({}))
        paths = []
        for d in docs:
            d['id'] = str(d.get('_id'))
            d.pop('_id', None)
            paths.append(d)
        logger.info(f"get_recommended_paths() - {len(paths)} rutas retornadas")
        return jsonify({'success': True, 'paths': paths, 'total': len(paths)}), 200
    except Exception as e:
        logger.error(f"get_recommended_paths() - Error: {e}")
        return jsonify({'error': 'Error al obtener rutas recomendadas'}), 500


@bp.route('/path_techniques/<path_name>', methods=['GET'])
def get_path_techniques(path_name):
    """
    Obtener todas las técnicas de una ruta recomendada específica
    """
    try:
        from urllib.parse import unquote
        # Decodificar el nombre de la ruta (en caso de espacios, caracteres especiales)
        path_name = unquote(path_name)
        
        db = get_db()
        paths_col = db.get_collection('recommended_paths')
        techniques_col = db.get_collection('techniques')  # CORREGIDO: usar 'techniques' en lugar de 'content'
        
        # Encontrar la ruta
        path = paths_col.find_one({'name': path_name})
        if not path:
            logger.warning(f"get_path_techniques() - Ruta no encontrada: {path_name}")
            return jsonify({'success': False, 'error': 'Ruta no encontrada'}), 404
        
        # Obtener los nombres de técnicas de esa ruta
        technique_names = path.get('techniques', [])
        
        # Buscar todas esas técnicas en la colección 'techniques'
        techniques = []
        for tech_name in technique_names:
            tech = techniques_col.find_one({'name': tech_name})
            if tech:
                tech['id'] = str(tech.get('_id'))
                tech.pop('_id', None)
                techniques.append(tech)
        
        logger.info(f"get_path_techniques() - {len(techniques)} técnicas retornadas para ruta '{path_name}'")
        return jsonify({
            'success': True,
            'path_name': path_name,
            'path_description': path.get('description', ''),
            'path_objectives': path.get('objectives', []),
            'techniques': techniques,
            'total': len(techniques)
        }), 200
    except Exception as e:
        logger.error(f"get_path_techniques() - Error: {e}")
        return jsonify({'error': 'Error al obtener técnicas de la ruta'}), 500