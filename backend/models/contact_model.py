# backend/models/contact_model.py
from datetime import datetime
from bson import ObjectId


class ContactModel:
    """Modelo para mensajes de contacto desde la landing page"""
    
    def __init__(self, collection):
        self.collection = collection
    
    def create(self, name, email, message, ip_address=None):
        """
        Crear un nuevo mensaje de contacto
        
        Args:
            name (str): Nombre del remitente
            email (str): Email del remitente
            message (str): Contenido del mensaje
            ip_address (str, optional): IP del remitente
        
        Returns:
            dict: Documento del mensaje creado
        """
        contact_data = {
            'name': name.strip(),
            'email': email.lower().strip(),
            'message': message.strip(),
            'ipAddress': ip_address,
            'status': 'unread',  # unread, read, replied
            'createdAt': datetime.utcnow(),
            'readAt': None,
            'repliedAt': None
        }
        
        result = self.collection.insert_one(contact_data)
        contact_data['_id'] = result.inserted_id
        
        return contact_data
    
    def find_by_id(self, contact_id):
        """Buscar mensaje por ID"""
        if isinstance(contact_id, str):
            contact_id = ObjectId(contact_id)
        
        return self.collection.find_one({'_id': contact_id})
    
    def find_all(self, status=None, limit=50, skip=0):
        """
        Obtener todos los mensajes con filtros opcionales
        
        Args:
            status (str, optional): Filtrar por estado (unread, read, replied)
            limit (int): Cantidad máxima de mensajes
            skip (int): Cantidad de mensajes a saltar (paginación)
        
        Returns:
            list: Lista de mensajes
        """
        query = {}
        if status:
            query['status'] = status
        
        cursor = self.collection.find(query).sort('createdAt', -1).limit(limit).skip(skip)
        return list(cursor)
    
    def count(self, status=None):
        """Contar mensajes, opcionalmente por estado"""
        query = {}
        if status:
            query['status'] = status
        
        return self.collection.count_documents(query)
    
    def mark_as_read(self, contact_id):
        """Marcar mensaje como leído"""
        if isinstance(contact_id, str):
            contact_id = ObjectId(contact_id)
        
        return self.collection.update_one(
            {'_id': contact_id},
            {
                '$set': {
                    'status': 'read',
                    'readAt': datetime.utcnow()
                }
            }
        )
    
    def mark_as_replied(self, contact_id):
        """Marcar mensaje como respondido"""
        if isinstance(contact_id, str):
            contact_id = ObjectId(contact_id)
        
        return self.collection.update_one(
            {'_id': contact_id},
            {
                '$set': {
                    'status': 'replied',
                    'repliedAt': datetime.utcnow()
                }
            }
        )
    
    def delete(self, contact_id):
        """Eliminar mensaje"""
        if isinstance(contact_id, str):
            contact_id = ObjectId(contact_id)
        
        return self.collection.delete_one({'_id': contact_id})
    
    def to_dict(self, contact):
        """Convertir documento a diccionario serializable"""
        if not contact:
            return None
        
        return {
            'id': str(contact['_id']),
            'name': contact.get('name'),
            'email': contact.get('email'),
            'message': contact.get('message'),
            'status': contact.get('status', 'unread'),
            'createdAt': contact.get('createdAt').isoformat() if contact.get('createdAt') else None,
            'readAt': contact.get('readAt').isoformat() if contact.get('readAt') else None,
            'repliedAt': contact.get('repliedAt').isoformat() if contact.get('repliedAt') else None
        }