# backend/config/config.py
import os
from datetime import timedelta

class Config:
    # Clave secreta para sesiones y JWT
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Sesión permanente (30 días)
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)
    
    # MongoDB
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/serenity_app')
    
    # CORS: limpia espacios y comas
    _raw_origins = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:5000,http://127.0.0.1:3000,http://192.168.100.69:5000'
    )
    CORS_ORIGINS = [
        origin.strip() 
        for origin in _raw_origins.split(',') 
        if origin.strip()
    ]
    
    # JWT
    JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-jwt-secret-change-me')
    JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
    JWT_EXP_SECONDS = int(os.environ.get('JWT_EXP_SECONDS', 60 * 60 * 24 * 7))  # 7 días