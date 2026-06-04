"""
Rutas para gestión de notificaciones push
"""
from flask import Blueprint, request, jsonify, current_app
from utils.auth import jwt_required
from bson import ObjectId
import requests
import logging

notifications_bp = Blueprint('notifications', __name__)
logger = logging.getLogger(__name__)

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

@notifications_bp.route('/users/push-token', methods=['POST'])
@jwt_required
def save_push_token():
    """Guardar token de push notification del usuario"""
    try:
        user_id = request.jwt_user_id
        data = request.get_json()
        push_token = data.get('pushToken')
        
        if not push_token:
            return jsonify({'error': 'Token requerido'}), 400
        
        users_col = current_app.extensions['collections']['users']
        
        # Actualizar usuario con el token
        result = users_col.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'pushToken': push_token}}
        )
        
        if result.modified_count > 0:
            logger.info(f"Token push guardado para usuario {user_id}")
            return jsonify({'success': True, 'message': 'Token guardado'}), 200
        
        return jsonify({'error': 'No se pudo guardar el token'}), 500
        
    except Exception as e:
        logger.error(f"Error guardando push token: {str(e)}")
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/notifications/send', methods=['POST'])
@jwt_required
def send_notification():
    """Enviar notificación push a un usuario específico"""
    try:
        data = request.get_json()
        target_user_id = data.get('userId')
        title = data.get('title', 'Serenity')
        body = data.get('body', '')
        notification_data = data.get('data', {})
        
        if not target_user_id or not body:
            return jsonify({'error': 'userId y body son requeridos'}), 400
        
        users_col = current_app.extensions['collections']['users']
        
        # Obtener token del usuario objetivo
        user = users_col.find_one({'_id': ObjectId(target_user_id)})
        
        if not user or 'pushToken' not in user:
            return jsonify({'error': 'Usuario no tiene token registrado'}), 404
        
        push_token = user['pushToken']
        
        # Enviar notificación a Expo
        response = requests.post(
            EXPO_PUSH_URL,
            json={
                'to': push_token,
                'title': title,
                'body': body,
                'data': notification_data,
                'sound': 'default',
                'priority': 'high',
            },
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        )
        
        result = response.json()
        
        if result.get('data', {}).get('status') == 'error':
            logger.error(f"Error enviando notificación: {result}")
            return jsonify({'error': 'Error enviando notificación'}), 500
        
        logger.info(f"Notificación enviada a usuario {target_user_id}")
        return jsonify({'success': True, 'message': 'Notificación enviada'}), 200
        
    except Exception as e:
        logger.error(f"Error enviando notificación: {str(e)}")
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/notifications/broadcast', methods=['POST'])
@jwt_required
def broadcast_notification():
    """Enviar notificación a todos los usuarios (solo admin)"""
    try:
        data = request.get_json()
        title = data.get('title', 'Serenity')
        body = data.get('body', '')
        notification_data = data.get('data', {})
        
        if not body:
            return jsonify({'error': 'body es requerido'}), 400
        
        users_col = current_app.extensions['collections']['users']
        
        # Obtener todos los tokens
        users = users_col.find({'pushToken': {'$exists': True}})
        tokens = [user['pushToken'] for user in users]
        
        if not tokens:
            return jsonify({'message': 'No hay usuarios con tokens'}), 200
        
        # Enviar a Expo (máximo 100 tokens por request)
        messages = []
        for token in tokens:
            messages.append({
                'to': token,
                'title': title,
                'body': body,
                'data': notification_data,
                'sound': 'default',
                'priority': 'high',
            })
        
        response = requests.post(
            EXPO_PUSH_URL,
            json=messages,
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        )
        
        result = response.json()
        logger.info(f"Broadcast enviado a {len(tokens)} usuarios")
        
        return jsonify({
            'success': True, 
            'message': f'Notificaciones enviadas a {len(tokens)} usuarios',
            'details': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error en broadcast: {str(e)}")
        return jsonify({'error': str(e)}), 500
