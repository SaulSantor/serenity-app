"""
Utilidades para el sistema de notificaciones de la comunidad
"""
import re
import logging
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)

def extract_mentions(content):
    """
    Extrae menciones @usuario del contenido
    Retorna lista de usernames sin el @
    """
    # Pattern: @seguido de letras, números, guiones y guiones bajos
    pattern = r'@([a-zA-Z0-9_-]+)'
    mentions = re.findall(pattern, content)
    return list(set(mentions))  # Eliminar duplicados


def find_users_by_username(users_col, usernames):
    """
    Busca usuarios por username
    Retorna lista de user_ids (ObjectId)
    """
    if not usernames:
        return []
    
    # Buscar usuarios con username o email que coincida
    users = users_col.find({
        '$or': [
            {'email': {'$in': [u.lower() for u in usernames]}},
            {'firstName': {'$regex': f'^({"|".join(usernames)})$', '$options': 'i'}},
            {'lastName': {'$regex': f'^({"|".join(usernames)})$', '$options': 'i'}}
        ]
    }, projection={'_id': 1, 'email': 1, 'firstName': 1, 'lastName': 1})
    
    return [user['_id'] for user in users]


async def send_notification_to_user(user_id, title, body, data=None):
    """
    Envía notificación push a un usuario específico
    (versión async para no bloquear el request)
    """
    try:
        from flask import current_app
        import requests
        
        users_col = current_app.extensions['collections']['users']
        user = users_col.find_one({'_id': ObjectId(user_id)})
        
        if not user or 'pushToken' not in user:
            logger.info(f"Usuario {user_id} no tiene pushToken registrado")
            return False
        
        push_token = user['pushToken']
        
        # Enviar notificación a Expo
        response = requests.post(
            'https://exp.host/--/api/v2/push/send',
            json={
                'to': push_token,
                'title': title,
                'body': body,
                'data': data or {},
                'sound': 'default',
                'priority': 'high',
            },
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            timeout=5
        )
        
        result = response.json()
        
        if result.get('data', {}).get('status') == 'error':
            logger.error(f"Error enviando notificación a {user_id}: {result}")
            return False
        
        logger.info(f"Notificación enviada a usuario {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando notificación: {e}")
        return False


def create_notification_record(db, notification_data):
    """
    Crea registro de notificación en BD (para historial)
    """
    try:
        notifications_col = db.notifications
        notification_data['created_at'] = datetime.utcnow()
        notification_data['read'] = False
        result = notifications_col.insert_one(notification_data)
        logger.info(f"Notificación guardada: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        logger.error(f"Error guardando notificación: {e}")
        return None
