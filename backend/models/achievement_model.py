# backend/models/achievement_model.py
from datetime import datetime
from bson import ObjectId

class AchievementModel:
    def __init__(self, collection):
        self.col = collection

    def create(self, user_id, achievement_type, xp_reward=100):
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)

        achievement_data = {
            'user_id': user_id,
            'type': achievement_type,
            'xp_reward': xp_reward,
            'created_at': datetime.utcnow()
        }

        res = self.col.insert_one(achievement_data)
        achievement_data['_id'] = res.inserted_id
        return achievement_data

    def find_by_user(self, user_id):
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)

        return list(self.col.find({'user_id': user_id}).sort('created_at', -1))

    def to_dict(self, achievement):
        return {
            'id': str(achievement['_id']),
            'type': achievement['type'],
            'xpReward': achievement.get('xp_reward', 0),
            'createdAt': achievement['created_at'].isoformat()
        }