# backend/routes/community_routes.py
"""
Endpoints para la comunidad: posts, comentarios, likes
Todos los datos se cargan dinámicamente de MongoDB
"""
import logging
import threading
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from utils.auth import decode_token
from utils.notification_helpers import (
    extract_mentions, 
    find_users_by_username, 
    send_notification_to_user
)

logger = logging.getLogger('community_routes')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

bp = Blueprint('community', __name__, url_prefix='/api/community')


# === MIDDLEWARE: Verificar token ===
def get_current_user():
    """Extrae y valida el token, retorna user_id o error"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        logger.error(f"get_current_user() - No token provided")
        return None, jsonify({'error': 'Token requerido'}), 401
    
    try:
        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        
        if not payload:
            logger.error(f"get_current_user() - Token inválido o expirado")
            return None, jsonify({'error': 'Token inválido o expirado'}), 401
        
        user_id = payload.get('user_id')
        if not user_id:
            logger.error(f"get_current_user() - user_id no en payload: {payload}")
            return None, jsonify({'error': 'Token no contiene user_id'}), 401
        
        logger.info(f"get_current_user() - user_id: {user_id}")
        return str(user_id), None, None
    
    except Exception as e:
        logger.error(f"get_current_user() - Exception: {e}")
        return None, jsonify({'error': f'Error autenticación: {str(e)}'}), 500


# ==========================================
# POSTS
@bp.route('/posts/<post_id>', methods=['PUT'])
def edit_community_post(post_id):
    """Editar un post (solo el autor puede)"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    try:
        posts_col = current_app.extensions['collections']['community_posts']
        user_id_obj = ObjectId(user_id)
        post_id_obj = ObjectId(post_id)
        post = posts_col.find_one({'_id': post_id_obj})
        if not post:
            return jsonify({'error': 'Post no encontrado'}), 404
        if post['author_id'] != user_id_obj:
            return jsonify({'error': 'No puedes editar posts de otros usuarios'}), 403
        data = request.get_json(silent=True) or {}
        content = data.get('content', '').strip()
        if not content or len(content) < 2 or len(content) < 1:
            return jsonify({'error': 'El contenido debe tener al menos 2 caracteres'}), 400
        if len(content) > 2000:
            return jsonify({'error': 'El contenido no puede exceder 2000 caracteres'}), 400
        update = {'content': content}
        if 'image' in data:
            update['image'] = data['image']
        posts_col.update_one({'_id': post_id_obj}, {'$set': update})
        return jsonify({'success': True, 'message': 'Post editado'}), 200
    except Exception as e:
        logger.error(f"edit_community_post() - Error: {e}")
        return jsonify({'error': 'Error al editar post'}), 500
# ==========================================

@bp.route('/posts', methods=['GET'])
def get_community_posts():
    """
    Obtener posts del feed de la comunidad
    Parámetros:
    - limit: cantidad de posts (default: 10)
    - offset: para paginación (default: 0)
    """
    limit = request.args.get('limit', 10, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    try:
        posts_col = current_app.extensions['collections']['community_posts']
        users_col = current_app.extensions['collections']['users']
        likes_col = current_app.extensions['collections']['community_likes']
        comments_col = current_app.extensions['collections']['community_comments']
        
        current_user_id = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = decode_token(token)
            if payload:
                current_user_id = ObjectId(payload['user_id'])
        
        # Obtener posts ordenados por fecha descendente
        posts_cursor = posts_col.find({}).sort('created_at', -1).skip(offset).limit(limit)
        posts = list(posts_cursor)
        
        logger.info(f"get_community_posts() - Total posts en BD: {posts_col.count_documents({})}")
        logger.info(f"get_community_posts() - Posts encontrados en query: {len(posts)}")
        
        # Enriquecer posts con información de autor y likes del usuario
        enriched_posts = []
        for post in posts:
            # Aceptar author_id tanto si es ObjectId como si fue guardado como string
            author_id_val = post.get('author_id')
            author_query_id = None
            try:
                if isinstance(author_id_val, str):
                    # intentar convertir string de 24 hex chars a ObjectId
                    try:
                        author_query_id = ObjectId(author_id_val) if len(author_id_val) == 24 else author_id_val
                    except Exception:
                        author_query_id = author_id_val
                else:
                    author_query_id = author_id_val
            except Exception:
                author_query_id = author_id_val

            author = users_col.find_one({'_id': author_query_id}, projection={'_id': 1, 'name': 1, 'profile': 1})
            logger.info(f"get_community_posts() - Post ID: {post.get('_id')}, Author: {author.get('name', 'Unknown') if author else 'No encontrado'}")
            
            # Verificar si el usuario actual ya le dio like
            user_liked = False
            if current_user_id:
                user_liked = likes_col.find_one({'post_id': post['_id'], 'user_id': current_user_id}) is not None
            
            enriched_posts.append({
                '_id': str(post['_id']),
                'content': post['content'],
                'image': post.get('image'),
                'created_at': post['created_at'].isoformat() if isinstance(post['created_at'], datetime) else post['created_at'],
                'author': {
                    'id': str(author['_id']) if author else 'unknown',
                    'name': author.get('name', 'Usuario desconocido') if author else 'Usuario desconocido',
                    'photo': (author.get('profile', {}).get('avatar') if author and author.get('profile', {}).get('avatar') else 'https://i.pravatar.cc/150')
                },
                'likes_count': post.get('likes_count', 0),
                'comments_count': post.get('comments_count', 0),
                'user_liked': user_liked
            })
        
        total = posts_col.count_documents({})
        
        logger.info(f"get_community_posts() - {len(enriched_posts)} posts enriquecidos retornados (limit={limit}, offset={offset}, total={total})")
        
        return jsonify({
            'success': True,
            'posts': enriched_posts,
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
    
    except Exception as e:
        logger.error(f"get_community_posts() - Error: {e}")
        return jsonify({'error': 'Error al obtener posts'}), 500


@bp.route('/posts/debug', methods=['GET'])
def debug_list_posts():
    """Endpoint temporal para desarrollo: devuelve documentos crudos de community_posts"""
    try:
        posts_col = current_app.extensions['collections'].get('community_posts')
        if posts_col is None:
            logger.error('debug_list_posts() - community_posts no registrada')
            return jsonify({'error': 'Colección community_posts no inicializada'}), 500

        docs = list(posts_col.find({}).sort('created_at', -1))

        # Serializar ObjectId y fechas
        def serialize(doc):
            out = {}
            for k, v in doc.items():
                try:
                    if isinstance(v, ObjectId):
                        out[k] = str(v)
                    elif hasattr(v, 'isoformat'):
                        out[k] = v.isoformat()
                    else:
                        out[k] = v
                except Exception:
                    out[k] = str(v)
            return out

        serialized = [serialize(d) for d in docs]
        logger.info(f"debug_list_posts() - {len(serialized)} documentos retornados")
        return jsonify({'success': True, 'count': len(serialized), 'posts': serialized}), 200
    except Exception as e:
        import traceback
        logger.error(f"debug_list_posts() - Error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Error interno'}), 500


@bp.route('/posts', methods=['POST'])
def create_community_post():
    """Crear un nuevo post en la comunidad"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    
    try:
        logger.info(f"create_community_post() - START - user_id: {user_id}")
        
        data = request.get_json(silent=True) or {}
        logger.info(f"create_community_post() - Data recibido: {data}")
        
        content = data.get('content', '').strip()
        
        if not content or len(content) < 2 or len(content) < 1:
            logger.warning(f"create_community_post() - Contenido muy corto: {len(content)} caracteres")
            return jsonify({'error': 'El contenido debe tener al menos 2 caracteres'}), 400
        
        if len(content) > 2000:
            logger.warning(f"create_community_post() - Contenido muy largo: {len(content)} caracteres")
            return jsonify({'error': 'El contenido no puede exceder 2000 caracteres'}), 400
        
        logger.info(f"create_community_post() - Accediendo colecciones...")
        posts_col = current_app.extensions['collections']['community_posts']
        users_col = current_app.extensions['collections']['users']
        logger.info(f"create_community_post() - Colecciones obtenidas OK")
        
        logger.info(f"create_community_post() - Convirtiendo user_id a ObjectId: {user_id}")
        user_id_obj = ObjectId(user_id)
        
        new_post = {
            'author_id': user_id_obj,
            'content': content,
            'image': data.get('image'),
            'created_at': datetime.utcnow(),
            'likes_count': 0,
            'comments_count': 0
        }
        
        result = posts_col.insert_one(new_post)
        new_post['_id'] = result.inserted_id
        
        # Obtener información del autor
        author = users_col.find_one({'_id': user_id_obj}, projection={'_id': 1, 'name': 1, 'profile': 1, 'firstName': 1, 'lastName': 1})
        author_name = f"{author.get('firstName', '')} {author.get('lastName', '')}" if author else 'Usuario'
        
        # Detectar menciones @usuario
        mentions = extract_mentions(content)
        if mentions:
            mentioned_user_ids = find_users_by_username(users_col, mentions)
            for mentioned_id in mentioned_user_ids:
                if str(mentioned_id) != user_id:  # No notificar al autor
                    # Enviar notificación en thread separado
                    threading.Thread(target=send_notification_to_user, args=(
                        mentioned_id,
                        f"💬 {author_name} te mencionó",
                        f"En su publicación: {content[:50]}...",
                        {'type': 'mention', 'postId': str(result.inserted_id)}
                    )).start()
        
        logger.info(f"create_community_post() - Post creado: {result.inserted_id}")
        
        return jsonify({
            'success': True,
            'post': {
                '_id': str(result.inserted_id),
                'content': content,
                'image': data.get('image'),
                'created_at': new_post['created_at'].isoformat(),
                'author': {
                    'id': str(user_id_obj),
                    'name': author.get('name', 'Usuario') if author else 'Usuario',
                    'photo': (author.get('profile', {}).get('avatar') if author and author.get('profile', {}).get('avatar') else 'https://i.pravatar.cc/150')
                },
                'likes_count': 0,
                'comments_count': 0,
                'user_liked': False
            }
        }), 201
    
    except Exception as e:
        import traceback
        logger.error(f"create_community_post() - Error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': f'Error al crear post: {str(e)}'}), 500


@bp.route('/posts/<post_id>', methods=['DELETE'])
def delete_community_post(post_id):
    """Eliminar un post (solo el autor puede)"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    
    try:
        posts_col = current_app.extensions['collections']['community_posts']
        user_id_obj = ObjectId(user_id)
        post_id_obj = ObjectId(post_id)
        
        post = posts_col.find_one({'_id': post_id_obj})
        if not post:
            return jsonify({'error': 'Post no encontrado'}), 404
        
        if post['author_id'] != user_id_obj:
            return jsonify({'error': 'No puedes eliminar posts de otros usuarios'}), 403
        
        # Eliminar el post
        posts_col.delete_one({'_id': post_id_obj})


        # Eliminar comentarios asociados (solo por ObjectId)
        comments_col = current_app.extensions['collections']['community_comments']
        deleted_comments = comments_col.delete_many({'post_id': post_id_obj})
        logger.info(f"delete_community_post() - Comentarios eliminados: {deleted_comments.deleted_count}")

        # Eliminar likes asociados (solo por ObjectId)
        likes_col = current_app.extensions['collections']['community_likes']
        deleted_likes = likes_col.delete_many({'post_id': post_id_obj})
        logger.info(f"delete_community_post() - Likes eliminados: {deleted_likes.deleted_count}")

        logger.info(f"delete_community_post() - Post eliminado: {post_id}")
        return jsonify({'success': True, 'message': 'Post, comentarios y likes eliminados'}), 200
    
    except Exception as e:
        logger.error(f"delete_community_post() - Error: {e}")
        return jsonify({'error': 'Error al eliminar post'}), 500


@bp.route('/posts/<post_id>', methods=['GET'])
def get_community_post(post_id):
    """Obtener un post por id, con información enriquecida (autor, likes, comments_count)."""
    try:
        posts_col = current_app.extensions['collections']['community_posts']
        users_col = current_app.extensions['collections']['users']
        likes_col = current_app.extensions['collections']['community_likes']
        comments_col = current_app.extensions['collections']['community_comments']

        post_obj_id = ObjectId(post_id)
        post = posts_col.find_one({'_id': post_obj_id})
        if not post:
            return jsonify({'error': 'Post no encontrado'}), 404

        # Obtener autor
        author_id_val = post.get('author_id')
        try:
            author_query_id = ObjectId(author_id_val) if isinstance(author_id_val, str) and len(author_id_val) == 24 else author_id_val
        except Exception:
            author_query_id = author_id_val

        author = users_col.find_one({'_id': author_query_id}, projection={'_id': 1, 'name': 1, 'profile': 1})

        # Determinar si el usuario actual le dio like (si viene token)
        current_user_id = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = decode_token(token)
            if payload:
                try:
                    current_user_id = ObjectId(payload['user_id'])
                except Exception:
                    current_user_id = None

        user_liked = False
        if current_user_id:
            user_liked = likes_col.find_one({'post_id': post['_id'], 'user_id': current_user_id}) is not None

        enriched = {
            '_id': str(post['_id']),
            'content': post.get('content'),
            'image': post.get('image'),
            'created_at': post['created_at'].isoformat() if hasattr(post.get('created_at'), 'isoformat') else post.get('created_at'),
            'author': {
                'id': str(author['_id']) if author else 'unknown',
                'name': author.get('name', 'Usuario') if author else 'Usuario',
                'photo': (author.get('profile', {}).get('avatar') if author and author.get('profile', {}).get('avatar') else 'https://i.pravatar.cc/150')
            },
            'likes_count': post.get('likes_count', 0),
            'comments_count': post.get('comments_count', 0),
            'user_liked': user_liked
        }

        return jsonify({'success': True, 'post': enriched}), 200
    except Exception as e:
        logger.error(f"get_community_post() - Error: {e}")
        return jsonify({'error': 'Error al obtener post'}), 500


# ==========================================
# LIKES
# ==========================================

@bp.route('/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    """Dar like a un post"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    
    try:
        posts_col = current_app.extensions['collections']['community_posts']
        likes_col = current_app.extensions['collections']['community_likes']
        
        user_id_obj = ObjectId(user_id)
        post_id_obj = ObjectId(post_id)
        
        post = posts_col.find_one({'_id': post_id_obj})
        if not post:
            return jsonify({'error': 'Post no encontrado'}), 404
        
        # Verificar si ya le dio like
        existing_like = likes_col.find_one({'post_id': post_id_obj, 'user_id': user_id_obj})
        if existing_like:
            return jsonify({'error': 'Ya le diste like a este post'}), 400
        
        # Agregar like
        likes_col.insert_one({
            'post_id': post_id_obj,
            'user_id': user_id_obj,
            'created_at': datetime.utcnow()
        })
        
        # Incrementar contador
        posts_col.update_one({'_id': post_id_obj}, {'$inc': {'likes_count': 1}})
        
        # Notificar al dueño del post (si no es el mismo que da like)
        if str(post['author_id']) != user_id:
            users_col = current_app.extensions['collections']['users']
            liker = users_col.find_one({'_id': user_id_obj}, projection={'firstName': 1, 'lastName': 1})
            liker_name = f"{liker.get('firstName', '')} {liker.get('lastName', '')}" if liker else 'Alguien'
            
            post_preview = post.get('content', '')[:50]
            threading.Thread(target=send_notification_to_user, args=(
                post['author_id'],
                f"❤️ {liker_name} le gustó tu publicación",
                post_preview,
                {'type': 'like', 'postId': post_id}
            )).start()
        
        logger.info(f"like_post() - Like agregado al post: {post_id}")
        
        return jsonify({'success': True, 'message': 'Like agregado'}), 200
    
    except Exception as e:
        logger.error(f"like_post() - Error: {e}")
        return jsonify({'error': 'Error al agregar like'}), 500


@bp.route('/posts/<post_id>/unlike', methods=['POST'])
def unlike_post(post_id):
    """Remover like de un post"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    
    try:
        posts_col = current_app.extensions['collections']['community_posts']
        likes_col = current_app.extensions['collections']['community_likes']
        
        user_id_obj = ObjectId(user_id)
        post_id_obj = ObjectId(post_id)
        
        post = posts_col.find_one({'_id': post_id_obj})
        if not post:
            return jsonify({'error': 'Post no encontrado'}), 404
        
        # Remover like
        result = likes_col.delete_one({'post_id': post_id_obj, 'user_id': user_id_obj})
        
        if result.deleted_count > 0:
            posts_col.update_one({'_id': post_id_obj}, {'$inc': {'likes_count': -1}})
        
        logger.info(f"unlike_post() - Like removido del post: {post_id}")
        
        return jsonify({'success': True, 'message': 'Like removido'}), 200
    
    except Exception as e:
        logger.error(f"unlike_post() - Error: {e}")
        return jsonify({'error': 'Error al remover like'}), 500


# ==========================================
# COMENTARIOS
@bp.route('/comments/<comment_id>', methods=['PUT'])
def edit_comment(comment_id):
    """Editar un comentario (solo el autor puede)"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    try:
        comments_col = current_app.extensions['collections']['community_comments']
        user_id_obj = ObjectId(user_id)
        comment_id_obj = ObjectId(comment_id)
        comment = comments_col.find_one({'_id': comment_id_obj})
        if not comment:
            return jsonify({'error': 'Comentario no encontrado'}), 404
        if comment['author_id'] != user_id_obj:
            return jsonify({'error': 'No puedes editar comentarios de otros usuarios'}), 403
        data = request.get_json(silent=True) or {}
        content = data.get('content', '').strip()
        if not content or len(content) < 2 or len(content) < 1:
            return jsonify({'error': 'El comentario debe tener al menos 2 caracteres'}), 400
        if len(content) > 500:
            return jsonify({'error': 'El comentario no puede exceder 500 caracteres'}), 400
        comments_col.update_one({'_id': comment_id_obj}, {'$set': {'content': content}})
        return jsonify({'success': True, 'message': 'Comentario editado'}), 200
    except Exception as e:
        logger.error(f"edit_comment() - Error: {e}")
        return jsonify({'error': 'Error al editar comentario'}), 500

@bp.route('/comments/<comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    """Eliminar un comentario (solo el autor puede)"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    try:
        comments_col = current_app.extensions['collections']['community_comments']
        user_id_obj = ObjectId(user_id)
        comment_id_obj = ObjectId(comment_id)
        comment = comments_col.find_one({'_id': comment_id_obj})
        if not comment:
            return jsonify({'error': 'Comentario no encontrado'}), 404
        if comment['author_id'] != user_id_obj:
            return jsonify({'error': 'No puedes eliminar comentarios de otros usuarios'}), 403
        # Borrar el comentario
        del_res = comments_col.delete_one({'_id': comment_id_obj})

        # Actualizar contador de comentarios en el post correspondiente
        try:
            posts_col = current_app.extensions['collections']['community_posts']
            post_id = comment.get('post_id')
            if post_id:
                posts_col.update_one({'_id': post_id}, {'$inc': {'comments_count': -1}})

                # Asegurar que no quede un contador negativo
                post_after = posts_col.find_one({'_id': post_id}, projection={'comments_count': 1})
                if post_after and post_after.get('comments_count', 0) < 0:
                    posts_col.update_one({'_id': post_id}, {'$set': {'comments_count': 0}})
        except Exception as e:
            logger.error(f"delete_comment() - Error actualizando comments_count: {e}")

        return jsonify({'success': True, 'message': 'Comentario eliminado'}), 200
    except Exception as e:
        logger.error(f"delete_comment() - Error: {e}")
        return jsonify({'error': 'Error al eliminar comentario'}), 500
# ==========================================

@bp.route('/posts/<post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    """Obtener comentarios de un post"""
    try:
        comments_col = current_app.extensions['collections']['community_comments']
        users_col = current_app.extensions['collections']['users']
        
        post_id_obj = ObjectId(post_id)
        
        comments_cursor = comments_col.find({'post_id': post_id_obj}).sort('created_at', -1)
        comments = list(comments_cursor)
        
        enriched_comments = []
        for comment in comments:
            author = users_col.find_one({'_id': comment['author_id']}, projection={'_id': 1, 'name': 1, 'photoUrl': 1, 'profile': 1})
            # Usar la misma lógica que los posts para el avatar
            avatar = 'https://i.pravatar.cc/150'
            if author:
                if author.get('profile', {}) and author['profile'].get('avatar'):
                    avatar = author['profile']['avatar']
                elif author.get('photoUrl'):
                    avatar = author['photoUrl']
            enriched_comments.append({
                '_id': str(comment['_id']),
                'content': comment['content'],
                'created_at': comment['created_at'].isoformat() if isinstance(comment['created_at'], datetime) else comment['created_at'],
                'author': {
                    'id': str(author['_id']) if author else 'unknown',
                    'name': author.get('name', 'Usuario desconocido') if author else 'Usuario desconocido',
                    'photo': avatar
                }
            })
        
        logger.info(f"get_post_comments() - {len(enriched_comments)} comentarios retornados para post: {post_id}")
        
        return jsonify({
            'success': True,
            'comments': enriched_comments,
            'total': len(enriched_comments)
        }), 200
    
    except Exception as e:
        logger.error(f"get_post_comments() - Error: {e}")
        return jsonify({'error': 'Error al obtener comentarios'}), 500


@bp.route('/posts/<post_id>/comments', methods=['POST'])
def create_comment(post_id):
    """Crear un comentario en un post"""
    user_id, error, status = get_current_user()
    if error:
        return error, status
    
    try:
        data = request.get_json(silent=True) or {}
        content = data.get('content', '').strip()
        
        if not content or len(content) < 2 or len(content) < 1:
            return jsonify({'error': 'El comentario debe tener al menos 2 caracteres'}), 400
        
        if len(content) > 500:
            return jsonify({'error': 'El comentario no puede exceder 500 caracteres'}), 400
        
        posts_col = current_app.extensions['collections']['community_posts']
        comments_col = current_app.extensions['collections']['community_comments']
        users_col = current_app.extensions['collections']['users']
        
        user_id_obj = ObjectId(user_id)
        post_id_obj = ObjectId(post_id)
        
        post = posts_col.find_one({'_id': post_id_obj})
        if not post:
            return jsonify({'error': 'Post no encontrado'}), 404
        
        new_comment = {
            'post_id': post_id_obj,
            'author_id': user_id_obj,
            'content': content,
            'created_at': datetime.utcnow()
        }
        
        result = comments_col.insert_one(new_comment)
        
        # Incrementar contador de comentarios
        posts_col.update_one({'_id': post_id_obj}, {'$inc': {'comments_count': 1}})
        
        author = users_col.find_one({'_id': user_id_obj}, projection={'_id': 1, 'name': 1, 'photoUrl': 1, 'firstName': 1, 'lastName': 1})
        author_name = f"{author.get('firstName', '')} {author.get('lastName', '')}" if author else 'Usuario'
        
        # Notificar al dueño del post (si no es el mismo que comenta)
        if str(post['author_id']) != user_id:
            threading.Thread(target=send_notification_to_user, args=(
                post['author_id'],
                f"💬 {author_name} comentó tu publicación",
                content[:100],
                {'type': 'comment', 'postId': post_id, 'commentId': str(result.inserted_id)}
            )).start()
        
        # Detectar menciones en el comentario
        mentions = extract_mentions(content)
        if mentions:
            mentioned_user_ids = find_users_by_username(users_col, mentions)
            for mentioned_id in mentioned_user_ids:
                if str(mentioned_id) != user_id and str(mentioned_id) != str(post['author_id']):
                    threading.Thread(target=send_notification_to_user, args=(
                        mentioned_id,
                        f"💬 {author_name} te mencionó",
                        f"En un comentario: {content[:50]}...",
                        {'type': 'mention', 'postId': post_id, 'commentId': str(result.inserted_id)}
                    )).start()
        
        logger.info(f"create_comment() - Comentario creado: {result.inserted_id}")
        
        return jsonify({
            'success': True,
            'comment': {
                '_id': str(result.inserted_id),
                'content': content,
                'created_at': new_comment['created_at'].isoformat(),
                'author': {
                    'id': str(user_id_obj),
                    'name': author.get('name', 'Usuario') if author else 'Usuario',
                    'photo': author.get('photoUrl', 'https://i.pravatar.cc/150') if author else 'https://i.pravatar.cc/150'
                }
            }
        }), 201
    
    except Exception as e:
        logger.error(f"create_comment() - Error: {e}")
        return jsonify({'error': 'Error al crear comentario'}), 500
