# backend/routes/auth_routes.py
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, session, current_app
from utils.auth import create_token

# === CONFIGURAR LOGGER ===
logger = logging.getLogger('auth_routes')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/register', methods=['POST'])
def register():
    """Registrar un nuevo usuario"""
    data = request.get_json(silent=True) or {}
    
    # Validar campos específicos con mensajes claros
    if not data.get('email'):
        return jsonify({'error': 'Por favor ingresa tu email'}), 400
    if not data.get('password'):
        return jsonify({'error': 'Por favor ingresa una contraseña'}), 400
    if not data.get('firstName'):
        return jsonify({'error': 'Por favor ingresa tu nombre'}), 400
    if not data.get('lastName'):
        return jsonify({'error': 'Por favor ingresa tu apellido'}), 400

    users_col = current_app.extensions['collections']['users']
    User = current_app.extensions['models']['UserModel'](users_col)

    email = data['email'].lower().strip()

    if User.find_by_email(email):
        logger.info(f"register() - Email duplicado: {email}")
        return jsonify({'error': 'El email ya está registrado'}), 400

    try:
        user = User.create(
            email,
            data['password'],
            data['firstName'],
            data['lastName']
        )
        
        if not user:
            logger.warning(f"register() - Creación fallida (duplicado): {email}")
            return jsonify({'error': 'El email ya está registrado'}), 400

        # Crear sesión
        session['user_id'] = str(user['_id'])
        session.permanent = True
        
        # Generar token JWT
        token = create_token({'user_id': str(user['_id'])})

        logger.info(f"register() - Usuario creado: {email} (ID: {user['_id']})")
        return jsonify({
            'success': True,
            'user': User.to_dict(user),
            'token': token,
            'message': 'Usuario registrado correctamente'
        }), 201

    except Exception as e:
        logger.error(f"register() - Error inesperado: {e} - Email: {email}")
        return jsonify({'error': 'Error interno al crear usuario'}), 500


@bp.route('/login', methods=['POST'])
def login():
    """Iniciar sesión"""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    password = data.get('password')
    remember = data.get('remember', True)

    logger.info(f"login() - Intento de login - Email: {email} - IP: {request.remote_addr}")
    
    # Validar campos vacíos con mensajes específicos
    if not email and not password:
        logger.warning(f"login() - Email y contraseña vacíos")
        return jsonify({'error': 'Por favor ingresa tu email y contraseña'}), 400
    
    if not email:
        logger.warning(f"login() - Email vacío")
        return jsonify({'error': 'Por favor ingresa tu email'}), 400
    
    if not password:
        logger.warning(f"login() - Contraseña vacía - Email: {email}")
        return jsonify({'error': 'Por favor ingresa tu contraseña'}), 400

    users_col = current_app.extensions['collections']['users']
    User = current_app.extensions['models']['UserModel'](users_col)

    logger.info(f"login() - Buscando usuario por email: {email.lower()}")
    user = User.find_by_email(email.lower())
    
    if not user:
        logger.warning(f"login() - ❌ Usuario NO encontrado en DB: {email.lower()}")
        return jsonify({'error': f'El email {email} no está registrado. ¿Deseas crear una cuenta?'}), 404

    logger.info(f"login() - ✅ Usuario encontrado: {email} (ID: {user['_id']})")
    logger.info(f"login() - Verificando contraseña...")
    
    if not User.check_password(user, password):
        logger.warning(f"login() - ❌ Contraseña incorrecta para: {email} - IP: {request.remote_addr}")
        logger.debug(f"login() - Hash en DB existe: {bool(user.get('password'))} - Length: {len(user.get('password', ''))}")
        return jsonify({'error': 'La contraseña es incorrecta. Verifica e intenta nuevamente.'}), 401
    
    logger.info(f"login() - ✅ Contraseña correcta para: {email}")

    # Actualizar último login
    try:
        result = User.update(user['_id'], {'lastLogin': datetime.utcnow()})
        if result and result.modified_count == 0:
            logger.info(f"login() - lastLogin ya actualizado: {user['_id']}")
    except Exception as e:
        logger.error(f"login() - Error actualizando lastLogin: {e}")

    # Crear sesión
    session['user_id'] = str(user['_id'])
    session.permanent = remember
    
    # Obtener usuario actualizado
    updated_user = User.find_by_id(user['_id'])
    
    # Generar token JWT
    token = create_token({'user_id': str(user['_id'])})

    logger.info(f"login() - Éxito: {email} (ID: {user['_id']}) - Remember: {remember}")
    return jsonify({
        'success': True,
        'user': User.to_dict(updated_user),
        'token': token,
        'message': 'Inicio de sesión exitoso'
    }), 200


@bp.route('/logout', methods=['POST'])
def logout():
    """Cerrar sesión"""
    user_id = session.get('user_id')
    session.clear()
    
    if user_id:
        logger.info(f"logout() - Usuario cerró sesión: {user_id}")
    
    return jsonify({
        'success': True,
        'message': 'Sesión cerrada correctamente'
    }), 200


@bp.route('/debug-user', methods=['POST'])
def debug_user():
    """Endpoint temporal para debug: verificar si usuario existe en DB"""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email requerido'}), 400
    
    users_col = current_app.extensions['collections']['users']
    user = users_col.find_one({'email': email})
    
    if user:
        return jsonify({
            'found': True,
            'email': user.get('email'),
            'firstName': user.get('firstName'),
            'lastName': user.get('lastName'),
            'hasPassword': bool(user.get('password')),
            'passwordLength': len(user.get('password', '')),
            'createdAt': user.get('createdAt').isoformat() if user.get('createdAt') else None
        }), 200
    else:
        return jsonify({
            'found': False,
            'message': 'Usuario no encontrado en la base de datos'
        }), 404


@bp.route('/search-users', methods=['GET'])
def search_users():
    """Busca usuarios por nombre o email para menciones"""
    query = request.args.get('q', '').strip()
    
    if not query or len(query) < 1:
        return jsonify({'users': []}), 200
    
    try:
        users_col = current_app.extensions['collections']['users']
        
        # Buscar por firstName, lastName o parte del email
        search_regex = {'$regex': query, '$options': 'i'}
        users = list(users_col.find(
            {
                '$or': [
                    {'firstName': search_regex},
                    {'lastName': search_regex},
                    {'email': search_regex}
                ]
            },
            {
                '_id': 1,
                'firstName': 1,
                'lastName': 1,
                'email': 1,
                'profilePhoto': 1
            }
        ).limit(10))
        
        # Convertir ObjectId a string
        for user in users:
            user['_id'] = str(user['_id'])
        
        return jsonify({'users': users}), 200
    
    except Exception as e:
        logger.error(f"search_users() - Error: {e}")
        return jsonify({'error': 'Error al buscar usuarios'}), 500


@bp.route('/verify', methods=['GET'])
def verify():
    """Verifica si el usuario tiene una sesión activa"""
    user_id = session.get('user_id')
    
    if not user_id:
        logger.info(f"verify() - Sin sesión activa - IP: {request.remote_addr}")
        return jsonify({
            'authenticated': False,
            'message': 'No hay sesión activa'
        }), 401
    
    try:
        from bson import ObjectId
        user_id_obj = ObjectId(user_id)
        users_col = current_app.extensions['collections']['users']
        user = users_col.find_one({'_id': user_id_obj})
        
        if not user:
            logger.warning(f"verify() - Usuario no encontrado: {user_id}")
            session.clear()
            return jsonify({
                'authenticated': False,
                'message': 'Usuario no encontrado'
            }), 404
        
        logger.info(f"verify() - Sesión válida: {user.get('email')}")
        return jsonify({
            'authenticated': True,
            'user_id': str(user['_id']),
            'email': user.get('email'),
            'firstName': user.get('firstName'),
            'lastName': user.get('lastName')
        }), 200
    
    except Exception as e:
        logger.error(f"verify() - Error: {e}")
        return jsonify({
            'authenticated': False,
            'message': 'Error al verificar sesión'
        }), 500