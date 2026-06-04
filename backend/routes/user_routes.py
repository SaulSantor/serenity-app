# backend/routes/user_routes.py
import logging
import os
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from utils.auth import decode_token

# === CONFIGURAR LOGGER ===
logger = logging.getLogger('user_routes')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

bp = Blueprint('users', __name__, url_prefix='/api/users')


# === MIDDLEWARE: Verificar token ===
def get_current_user():
    """Extrae y valida el token, retorna user_id o (error_response, status_code)"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        logger.warning(f"Token ausente - IP: {request.remote_addr}")
        return jsonify({'error': 'Token requerido'}), 401
    
    token = auth_header.split(' ')[1]
    payload = decode_token(token)
    
    if not payload:
        logger.warning("Token inválido o expirado")
        return jsonify({'error': 'Token inválido o expirado'}), 401
    
    return payload['user_id']


@bp.route('/me', methods=['GET'])
def get_profile():
    """Obtener perfil del usuario autenticado"""
    user_id = get_current_user()
    
    # Si hay error, retornar
    if isinstance(user_id, tuple):
        return user_id
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"get_profile() - ID inválido: {user_id}")
        return jsonify({'error': 'ID de usuario inválido'}), 400
    
    users_col = current_app.extensions['collections']['users']
    User = current_app.extensions['models']['UserModel'](users_col)
    user = User.find_by_id(user_id_obj)
    
    if not user:
        logger.error(f"get_profile() - Usuario no encontrado: {user_id}")
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    logger.debug(f"get_profile() - Perfil solicitado: {user_id}")
    return jsonify({
        'success': True,
        'user': User.to_dict(user)
    }), 200


@bp.route('/me', methods=['PUT'])
def update_profile():
    """Actualizar perfil del usuario autenticado"""
    from werkzeug.security import generate_password_hash, check_password_hash
    
    user_id = get_current_user()
    
    if isinstance(user_id, tuple):
        return user_id
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"update_profile() - ID inválido: {user_id}")
        return jsonify({'error': 'ID de usuario inválido'}), 400
    
    users_col = current_app.extensions['collections']['users']
    current_user = users_col.find_one({'_id': user_id_obj})
    
    if not current_user:
        logger.error(f"update_profile() - Usuario no encontrado: {user_id}")
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    data = request.get_json(silent=True) or {}
    updates = {}
    
    # Actualizar firstName y lastName
    new_first = data.get('firstName', '').strip()
    new_last = data.get('lastName', '').strip()
    
    if new_first and new_first != current_user.get('firstName', ''):
        updates['firstName'] = new_first
    
    if new_last and new_last != current_user.get('lastName', ''):
        updates['lastName'] = new_last
    
    # Actualizar nombre completo si cambiaron firstName o lastName
    if new_first or new_last:
        first = new_first or current_user.get('firstName', '')
        last = new_last or current_user.get('lastName', '')
        updates['name'] = f"{first} {last}".strip()
    
    # Actualizar email
    new_email = data.get('email', '').strip()
    if new_email and new_email != current_user.get('email', ''):
        # Verificar si el email ya existe
        existing = users_col.find_one({'email': new_email, '_id': {'$ne': user_id_obj}})
        if existing:
            return jsonify({'error': 'El email ya está en uso'}), 400
        updates['email'] = new_email
    
    # Cambiar contraseña
    current_password = data.get('currentPassword', '').strip()
    new_password = data.get('newPassword', '').strip()
    
    if current_password and new_password:
        # Verificar contraseña actual
        if not check_password_hash(current_user.get('password', ''), current_password):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 400
        
        # Actualizar con nueva contraseña
        updates['password'] = generate_password_hash(new_password)
    
    # Actualizar biografía
    new_bio = data.get('bio', '').strip()
    if new_bio != current_user.get('profile', {}).get('bio', ''):
        updates['profile.bio'] = new_bio
    
    # Si no hay cambios
    if not updates:
        User = current_app.extensions['models']['UserModel'](users_col)
        logger.info(f"update_profile() - Sin cambios: {user_id}")
        return jsonify({
            'success': True,
            'user': User.to_dict(current_user),
            'message': 'Datos sin cambios'
        }), 200
    
    # Actualizar updated_at
    updates['updated_at'] = datetime.utcnow()
    
    # Guardar cambios
    try:
        result = users_col.update_one(
            {'_id': user_id_obj},
            {'$set': updates}
        )
        updated_user = users_col.find_one({'_id': user_id_obj})
        User = current_app.extensions['models']['UserModel'](users_col)
        
        logger.info(f"update_profile() - Actualizado: {user_id} | Cambios: {list(updates.keys())}")
        return jsonify({
            'success': True,
            'user': User.to_dict(updated_user),
            'message': 'Perfil actualizado correctamente'
        }), 200
    
    except Exception as e:
        logger.error(f"update_profile() - Error DB: {e} - User: {user_id}")
        return jsonify({'error': 'Error al guardar en base de datos'}), 500


@bp.route('/photo', methods=['POST'])
def upload_photo():
    """Subir foto de perfil"""
    user_id = get_current_user()
    
    if isinstance(user_id, tuple):
        return user_id
    
    try:
        user_id_obj = ObjectId(user_id)
    except Exception:
        logger.error(f"upload_photo() - ID inválido: {user_id}")
        return jsonify({'error': 'ID inválido'}), 400
    
    # Validar archivo
    if 'photo' not in request.files:
        logger.warning("upload_photo() - Archivo no enviado")
        return jsonify({'error': 'No se envió ningún archivo'}), 400
    
    file = request.files['photo']
    if file.filename == '':
        logger.warning("upload_photo() - Nombre de archivo vacío")
        return jsonify({'error': 'Archivo vacío'}), 400
    
    # Validar extensión
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in {'png', 'jpg', 'jpeg', 'gif', 'webp'}:
        logger.warning(f"upload_photo() - Formato no permitido: {ext}")
        return jsonify({'error': 'Formato no permitido. Usa: png, jpg, jpeg, gif, webp'}), 400
    
    # Guardar archivo
    filename = secure_filename(f"{user_id}.{ext}")
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'static/uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    
    try:
        file.save(file_path)
    except Exception as e:
        logger.error(f"upload_photo() - Error al guardar archivo: {e}")
        return jsonify({'error': 'Error al guardar el archivo'}), 500
    
    photo_url = f"/static/uploads/{filename}"
    
    # Verificar si ya tiene la misma foto
    users_col = current_app.extensions['collections']['users']
    existing = users_col.find_one({
        '_id': user_id_obj,
        'profile.avatar': photo_url
    })
    
    if existing:
        logger.info(f"upload_photo() - Foto idéntica (sin cambios): {user_id}")
        return jsonify({'success': True, 'photoUrl': photo_url}), 200
    
    # Actualizar en base de datos
    try:
        result = users_col.update_one(
            {'_id': user_id_obj},
            {'$set': {'profile.avatar': photo_url}}
        )
        
        if result.modified_count == 0:
            logger.info(f"upload_photo() - Sin cambios en DB: {user_id}")
        
        logger.info(f"upload_photo() - ÉXITO: {user_id} → {photo_url}")
        return jsonify({
            'success': True,
            'photoUrl': photo_url,
            'message': 'Foto actualizada correctamente'
        }), 200
    
    except Exception as e:
        logger.error(f"upload_photo() - Error DB: {e} - User: {user_id}")
        
        # Eliminar archivo si falló la DB
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"upload_photo() - Archivo eliminado tras error: {file_path}")
            except:
                pass
        
        return jsonify({'error': 'Error al guardar en base de datos'}), 500


# === NUEVA SECCIÓN: RUTAS RECOMENDADAS ===

@bp.route('/active-path', methods=['GET'])
def get_active_path():
    """Obtener la ruta activa del usuario"""
    user_id = get_current_user()
    if isinstance(user_id, tuple):
        return user_id
    
    try:
        user_id_obj = ObjectId(user_id)
        users_col = current_app.extensions['collections']['users']
        user = users_col.find_one({'_id': user_id_obj}, projection={'active_path': 1})
        
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        active_path = user.get('active_path', None)
        
        logger.info(f"get_active_path() - Usuario: {user_id}, Ruta activa: {active_path}")
        return jsonify({
            'success': True,
            'activePath': active_path
        }), 200
    
    except Exception as e:
        logger.error(f"get_active_path() - Error: {e}")
        return jsonify({'error': 'Error al obtener ruta activa'}), 500


@bp.route('/active-path', methods=['POST'])
def set_active_path():
    """Actualizar la ruta activa del usuario"""
    user_id = get_current_user()
    if isinstance(user_id, tuple):
        return user_id
    
    try:
        data = request.get_json()
        path_name = data.get('pathName')
        
        if not path_name:
            return jsonify({'error': 'pathName requerido'}), 400
        
        user_id_obj = ObjectId(user_id)
        users_col = current_app.extensions['collections']['users']
        
        result = users_col.update_one(
            {'_id': user_id_obj},
            {'$set': {'active_path': path_name, 'updated_at': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        logger.info(f"set_active_path() - Usuario: {user_id}, Ruta: {path_name}")
        return jsonify({
            'success': True,
            'message': f'Ruta activa actualizada a: {path_name}',
            'activePath': path_name
        }), 200
    
    except Exception as e:
        logger.error(f"set_active_path() - Error: {e}")
        return jsonify({'error': 'Error al actualizar ruta'}), 500