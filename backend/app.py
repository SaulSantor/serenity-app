# backend/app.py
from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

from config.config import Config
from database.db import init_db
from models.user_model import UserModel
from models.achievement_model import AchievementModel
from models.contact_model import ContactModel
from models.stats_model import StatsModel

# Blueprints
from routes.auth_routes import bp as auth_bp
from routes.user_routes import bp as user_bp
from routes.contact_routes import bp as contact_bp
from routes.stats_routes import bp as stats_bp
from routes.progress_routes import bp as progress_bp
from routes.content_routes import bp as content_bp
from routes.community_routes import bp as community_bp
from routes.iot_routes import bp as iot_bp
from routes.notifications_routes import notifications_bp

# RUTA DEL FRONTEND
FRONTEND_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app_web'))

# Bandera para log único
_startup_logged = False


def create_app():
    app = Flask(__name__, static_folder=None)

    # === CONFIGURACIÓN ===
    app.config.from_object(Config)

    # UPLOAD FOLDER
    upload_folder = os.path.join(FRONTEND_PATH, 'static', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = upload_folder

    # CORS: lista limpia
    cors_origins = app.config.get('CORS_ORIGINS', [])
    if isinstance(cors_origins, str):
        origins = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]
    else:
        origins = cors_origins
    app.config['CORS_ORIGINS'] = origins

    CORS(
        app,
        supports_credentials=True,
        origins=origins,
        expose_headers=["Content-Type", "Authorization"]
    )

    # === BASE DE DATOS ===
    db = init_db(app)

    # Colecciones
    collections = {
        'users': db.users,
        'practices': db.practices,
        'achievements': db.user_achievements,
        'contacts': db.contact_messages,
        'techniques': db.techniques,
        'recommended_paths': db.recommended_paths,
        'community_posts': db.community_posts,
        'community_likes': db.community_likes,
        'community_comments': db.community_comments,
        'iot_sensor_data': db.iot_sensor_data,
        'iot_devices': db.iot_devices
    }

    # Modelos
    app.extensions = {}
    app.extensions['collections'] = collections
    app.extensions['db'] = db  # Agregar referencia a DB para IoT
    app.extensions['models'] = {
        'UserModel': UserModel,
        'AchievementModel': AchievementModel
    }

    # === HEALTH CHECK (para detección automática de IP) ===
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'service': 'serenity-backend'}, 200

    # === BLUEPRINTS ===
    app.register_blueprint(auth_bp)      # /api/auth/*
    app.register_blueprint(user_bp)      # /api/users/*
    app.register_blueprint(contact_bp)   # /api/contact/*
    app.register_blueprint(stats_bp)     # /api/stats/*
    app.register_blueprint(progress_bp)  # /api/progress/*
    app.register_blueprint(content_bp)   # /api/content/*
    app.register_blueprint(community_bp) # /api/community/*
    app.register_blueprint(iot_bp)       # /api/iot/*
    app.register_blueprint(notifications_bp, url_prefix='/api') # /api/notifications/*

    # === SERVIR FRONTEND (SPA) ===
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        full_path = os.path.join(FRONTEND_PATH, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(FRONTEND_PATH, path)
        return send_from_directory(FRONTEND_PATH, 'index.html')

    # === SERVIR FOTOS SUBIDAS ===
    @app.route('/static/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # === LOGS DE INICIO (Flask 2.3+) ===
    @app.before_request
    def startup_log():
        global _startup_logged
        if not _startup_logged:
            _startup_logged = True
            print(f"\n{'='*60}")
            print("SERENITY BACKEND INICIADO")
            print(f"{'='*60}")
            print(f"Modo: {app.config.get('ENV', 'development')}")
            print(f"Frontend: {FRONTEND_PATH}")
            print(f"Uploads: {app.config['UPLOAD_FOLDER']}")
            print(f"CORS: {', '.join(origins) if origins else 'TODOS'}")
            print(f"\nEndpoints registrados:")
            print(f"  - /api/auth/*        → Autenticación")
            print(f"  - /api/users/*       → Perfil de usuario")
            print(f"  - /api/contact/*     → Mensajes de contacto")
            print(f"  - /api/stats/*       → Estadísticas")
            print(f"  - /api/community/*   → Comunidad")
            print(f"  - /api/progress/*    → Progreso")
            print(f"  - /api/content/*     → Contenido")
            print(f"{'='*60}\n")

    return app


# === EJECUCIÓN ===
if __name__ == '__main__':
    if not os.path.exists(FRONTEND_PATH):
        print(f"ERROR: No se encontró el frontend en: {FRONTEND_PATH}")
        print("   → Ejecuta: cd app_web && npm run build")
        exit(1)

    app = create_app()
    host = '0.0.0.0'  # Acepta conexiones desde cualquier IP (desarrollo móvil)
    debug = app.config.get('ENV') == 'development'
    app.run(host=host, port=5000, debug=debug)