# backend/routes/contact_routes.py
import logging
from flask import Blueprint, request, jsonify, current_app
from models.contact_model import ContactModel

# === CONFIGURAR LOGGER ===
logger = logging.getLogger('contact_routes')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

bp = Blueprint('contact', __name__, url_prefix='/api/contact')


@bp.route('', methods=['POST'])
def create_contact():
    """Crear un nuevo mensaje de contacto desde la landing page"""
    # Soportar JSON y datos tipo form
    if request.is_json:
        data = request.get_json(silent=True) or {}
    else:
        data = request.form.to_dict() or {}
    
    # Validar campos requeridos
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    message = data.get('message', '').strip()
    
    if not name:
        logger.warning(f"create_contact() - Nombre faltante - IP: {request.remote_addr}")
        return jsonify({'error': 'El nombre es requerido'}), 400
    
    if not email:
        logger.warning(f"create_contact() - Email faltante - IP: {request.remote_addr}")
        return jsonify({'error': 'El email es requerido'}), 400
    
    if not message:
        logger.warning(f"create_contact() - Mensaje faltante - IP: {request.remote_addr}")
        return jsonify({'error': 'El mensaje es requerido'}), 400
    
    # Validar formato de email básico
    if '@' not in email or '.' not in email:
        logger.warning(f"create_contact() - Email inválido: {email}")
        return jsonify({'error': 'Email inválido'}), 400
    
    # Validar longitud de mensaje (mínimo 10 caracteres)
    if len(message) < 10:
        logger.warning(f"create_contact() - Mensaje muy corto: {len(message)} caracteres")
        return jsonify({'error': 'El mensaje debe tener al menos 10 caracteres'}), 400
    
    # Validar longitud máxima (prevenir spam)
    if len(message) > 5000:
        logger.warning(f"create_contact() - Mensaje muy largo: {len(message)} caracteres")
        return jsonify({'error': 'El mensaje es demasiado largo (máximo 5000 caracteres)'}), 400
    
    try:
        # Obtener colección y modelo
        contacts_col = current_app.extensions['collections'].get('contacts')
        if contacts_col is None:
            logger.error("create_contact() - Colección 'contacts' no encontrada")
            return jsonify({'error': 'Error de configuración del servidor'}), 500
        
        Contact = ContactModel(contacts_col)
        
        # Obtener IP del cliente
        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ',' in ip_address:
            ip_address = ip_address.split(',')[0].strip()
        
        # Crear mensaje
        contact = Contact.create(name, email, message, ip_address)
        
        logger.info(f"create_contact() - Mensaje creado: {email} - ID: {contact['_id']}")
        
        return jsonify({
            'success': True,
            'message': '¡Gracias por tu mensaje! Te contactaremos pronto.',
            'contact': Contact.to_dict(contact)
        }), 201
    
    except Exception as e:
        logger.error(f"create_contact() - Error inesperado: {e}")
        return jsonify({'error': 'Error al guardar el mensaje'}), 500


@bp.route('', methods=['GET'])
def get_contacts():
    """Obtener todos los mensajes de contacto (requiere autenticación de admin)"""
    # TODO: Agregar middleware de autenticación para admins
    
    status = request.args.get('status')  # unread, read, replied
    limit = int(request.args.get('limit', 50))
    skip = int(request.args.get('skip', 0))
    
    try:
        contacts_col = current_app.extensions['collections'].get('contacts')
        if not contacts_col:
            return jsonify({'error': 'Error de configuración'}), 500
        
        Contact = ContactModel(contacts_col)
        
        contacts = Contact.find_all(status=status, limit=limit, skip=skip)
        total = Contact.count(status=status)
        
        logger.info(f"get_contacts() - Obtenidos {len(contacts)} mensajes")
        
        return jsonify({
            'success': True,
            'contacts': [Contact.to_dict(c) for c in contacts],
            'total': total,
            'limit': limit,
            'skip': skip
        }), 200
    
    except Exception as e:
        logger.error(f"get_contacts() - Error: {e}")
        return jsonify({'error': 'Error al obtener mensajes'}), 500


@bp.route('/<contact_id>', methods=['GET'])
def get_contact(contact_id):
    """Obtener un mensaje específico (requiere autenticación de admin)"""
    # TODO: Agregar middleware de autenticación para admins
    
    try:
        contacts_col = current_app.extensions['collections'].get('contacts')
        if not contacts_col:
            return jsonify({'error': 'Error de configuración'}), 500
        
        Contact = ContactModel(contacts_col)
        contact = Contact.find_by_id(contact_id)
        
        if not contact:
            logger.warning(f"get_contact() - Mensaje no encontrado: {contact_id}")
            return jsonify({'error': 'Mensaje no encontrado'}), 404
        
        logger.info(f"get_contact() - Mensaje obtenido: {contact_id}")
        
        return jsonify({
            'success': True,
            'contact': Contact.to_dict(contact)
        }), 200
    
    except Exception as e:
        logger.error(f"get_contact() - Error: {e}")
        return jsonify({'error': 'Error al obtener mensaje'}), 500


@bp.route('/<contact_id>/read', methods=['PATCH'])
def mark_as_read(contact_id):
    """Marcar mensaje como leído (requiere autenticación de admin)"""
    # TODO: Agregar middleware de autenticación para admins
    
    try:
        contacts_col = current_app.extensions['collections'].get('contacts')
        if not contacts_col:
            return jsonify({'error': 'Error de configuración'}), 500
        
        Contact = ContactModel(contacts_col)
        result = Contact.mark_as_read(contact_id)
        
        if result.modified_count == 0:
            logger.warning(f"mark_as_read() - No se modificó: {contact_id}")
            return jsonify({'error': 'Mensaje no encontrado o ya estaba leído'}), 404
        
        logger.info(f"mark_as_read() - Marcado como leído: {contact_id}")
        
        return jsonify({
            'success': True,
            'message': 'Mensaje marcado como leído'
        }), 200
    
    except Exception as e:
        logger.error(f"mark_as_read() - Error: {e}")
        return jsonify({'error': 'Error al actualizar mensaje'}), 500


@bp.route('/<contact_id>/replied', methods=['PATCH'])
def mark_as_replied(contact_id):
    """Marcar mensaje como respondido (requiere autenticación de admin)"""
    # TODO: Agregar middleware de autenticación para admins
    
    try:
        contacts_col = current_app.extensions['collections'].get('contacts')
        if not contacts_col:
            return jsonify({'error': 'Error de configuración'}), 500
        
        Contact = ContactModel(contacts_col)
        result = Contact.mark_as_replied(contact_id)
        
        if result.modified_count == 0:
            logger.warning(f"mark_as_replied() - No se modificó: {contact_id}")
            return jsonify({'error': 'Mensaje no encontrado o ya estaba respondido'}), 404
        
        logger.info(f"mark_as_replied() - Marcado como respondido: {contact_id}")
        
        return jsonify({
            'success': True,
            'message': 'Mensaje marcado como respondido'
        }), 200
    
    except Exception as e:
        logger.error(f"mark_as_replied() - Error: {e}")
        return jsonify({'error': 'Error al actualizar mensaje'}), 500


@bp.route('/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Eliminar mensaje (requiere autenticación de admin)"""
    # TODO: Agregar middleware de autenticación para admins
    
    try:
        contacts_col = current_app.extensions['collections'].get('contacts')
        if not contacts_col:
            return jsonify({'error': 'Error de configuración'}), 500
        
        Contact = ContactModel(contacts_col)
        result = Contact.delete(contact_id)
        
        if result.deleted_count == 0:
            logger.warning(f"delete_contact() - No se eliminó: {contact_id}")
            return jsonify({'error': 'Mensaje no encontrado'}), 404
        
        logger.info(f"delete_contact() - Mensaje eliminado: {contact_id}")
        
        return jsonify({
            'success': True,
            'message': 'Mensaje eliminado correctamente'
        }), 200
    
    except Exception as e:
        logger.error(f"delete_contact() - Error: {e}")
        return jsonify({'error': 'Error al eliminar mensaje'}), 500