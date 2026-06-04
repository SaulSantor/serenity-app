# backend/utils/auth.py
import jwt
from functools import wraps
from flask import request, jsonify, current_app, session
from datetime import datetime, timedelta

def create_token(payload):
    payload = payload.copy()
    payload['exp'] = datetime.utcnow() + timedelta(seconds=current_app.config['JWT_EXP_SECONDS'])
    token = jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm=current_app.config['JWT_ALGORITHM'])
    # PyJWT returns bytes in older versions; ensure str
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token

def decode_token(token):
    try:
        data = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=[current_app.config['JWT_ALGORITHM']])
        return data
    except jwt.ExpiredSignatureError:
        return None
    except Exception:
        return None

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', None)
        if not auth:
            return jsonify({'error': 'Authorization header missing'}), 401
        parts = auth.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid Authorization header'}), 401
        token = parts[1]
        data = decode_token(token)
        if not data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        # attach user_id for convenience
        request.jwt_user_id = data.get('user_id')
        return f(*args, **kwargs)
    return decorated

def hybrid_auth_required(f):
    """Allows either session-cookie based auth OR JWT bearer token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1) Session (web)
        if 'user_id' in session:
            request.current_user_id = session['user_id']
            return f(*args, **kwargs)
        # 2) JWT (mobile/IoT)
        auth = request.headers.get('Authorization', None)
        if auth:
            parts = auth.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
                data = decode_token(token)
                if data:
                    request.current_user_id = data.get('user_id')
                    return f(*args, **kwargs)
                return jsonify({'error': 'Invalid or expired token'}), 401
        return jsonify({'error': 'No autorizado'}), 401
    return decorated