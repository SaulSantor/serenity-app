# backend/models/user_model.py
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger('user_model')

class UserModel:
    def __init__(self, collection):
        self.col = collection

    def create(self, email, password, first_name, last_name):
        user_data = {
            'email': email.lower().strip(),
            'password': generate_password_hash(password),
            'firstName': first_name.strip(),
            'lastName': last_name.strip(),
            'name': f"{first_name} {last_name}".strip(),
            'createdAt': datetime.utcnow(),
            'lastLogin': None,
            'profile': {
                # AVATAR POR DEFECTO: RUTA CORRECTA DESDE /app_web/static
                'avatar': '/static/img/default-avatar.png',
                'preferences': {
                    'notifications': True,
                    'theme': "light",
                    'language': "es"
                },
                'stats': {
                    'totalPractices': 0,
                    'currentStreak': 0,
                    'longestStreak': 0,
                    'totalMinutes': 0,
                    'level': 1,
                    'experience': 0
                }
            },
            'subscription': {
                'plan': "free",
                'startDate': datetime.utcnow(),
                'expiryDate': None
            }
        }
        try:
            res = self.col.insert_one(user_data)
            user_data['_id'] = res.inserted_id
            return user_data
        except Exception as e:
            if "duplicate key error" in str(e):
                return None
            logger.error(f"create() - Error: {e}")
            raise e

    def find_by_email(self, email):
        return self.col.find_one({'email': email.lower().strip()})

    def find_by_id(self, user_id):
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            return self.col.find_one({'_id': user_id})
        except Exception:
            return None

    def update(self, user_id, updates):
        try:
            obj_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            result = self.col.update_one({'_id': obj_id}, {'$set': updates})
            return result
        except Exception as e:
            logger.error(f"User.update() - Error: {e} - ID: {user_id}")
            return None

    def check_password(self, user, password):
        return check_password_hash(user['password'], password)

    def to_dict(self, user):
        if not user:
            return None
        
        # Usar firstName y lastName si existen, sino extraer del name
        first_name = user.get('firstName', '')
        last_name = user.get('lastName', '')
        
        if not first_name and not last_name:
            full_name = user.get('name', '')
            first_name = full_name.split(' ', 1)[0] if ' ' in full_name else full_name
            last_name = full_name.split(' ', 1)[1] if ' ' in full_name else ''
        
        full_name = user.get('name', f"{first_name} {last_name}".strip())
        
        profile = user.get('profile', {})
        stats = profile.get('stats', {})

        # Fallback: si no hay avatar o está vacío
        photo = profile.get('avatar') or '/static/img/default-avatar.png'

        return {
            'id': str(user['_id']),
            'name': full_name,
            'email': user['email'],
            'firstName': first_name,
            'lastName': last_name,
            'bio': profile.get('bio', ''),
            'photo': photo,
            'createdAt': user.get('createdAt', datetime.utcnow()).isoformat(),
            'lastLogin': user.get('lastLogin').isoformat() if user.get('lastLogin') else None,
            'xp': stats.get('experience', 0),
            'level': stats.get('level', 1),
            'streak': stats.get('currentStreak', 0),
            'practicesThisMonth': stats.get('practicesThisMonth', 0),
            'consistency': stats.get('consistency', 0),
            'activeWeeks': stats.get('activeWeeks', 0)
        }