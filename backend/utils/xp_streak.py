# backend/utils/xp_streak.py
from datetime import datetime

def calculate_xp(activity_type, duration=None):
    xp_values = {
        'meditation': 50,
        'breathing': 30,
        'exercise': 40,
        'challenge': 100,
        'mood_tracking': 10,
        'journal': 20,
        'streak_bonus': 10,
        'achievement': 100
    }
    base_xp = xp_values.get(activity_type, 10)
    if duration and duration > 10:
        base_xp += (duration // 5) * 5
    return base_xp

def update_user_level(user_collection, user):
    new_level = (user.get('xp', 0) // 1000) + 1
    old_level = user.get('level', 1)
    if new_level > old_level:
        user_collection.update_one({'_id': user['_id']}, {'$set': {'level': new_level}})
        return True
    return False

def update_streak(user_collection, user):
    today = datetime.utcnow().date()
    last_practice = user.get('last_practice_date')
    if last_practice:
        if isinstance(last_practice, str):
            last_practice = datetime.fromisoformat(last_practice).date()
        elif isinstance(last_practice, datetime):
            last_practice = last_practice.date()
        days_diff = (today - last_practice).days
        if days_diff == 1:
            new_streak = user.get('streak', 0) + 1
        elif days_diff == 0:
            new_streak = user.get('streak', 0)
        else:
            new_streak = 1
    else:
        new_streak = 1
    user_collection.update_one({'_id': user['_id']}, {'$set': {'streak': new_streak, 'last_practice_date': today.isoformat()}})
    return new_streak