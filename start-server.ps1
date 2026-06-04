# Start Flask Server for Serenity App

Write-Host "🚀 Iniciando servidor Flask..." -ForegroundColor Cyan

# Navegar al directorio backend
Set-Location "d:\backup\PROGRAMS PROGRAMATION\Integrador_5th\backend"

# Verificar Python
$pythonPath = python --version
Write-Host "✓ Python encontrado: $pythonPath" -ForegroundColor Green

# Instalar dependencias si es necesario
Write-Host "`n📦 Verificando dependencias..." -ForegroundColor Cyan
pip install -q -r requirements.txt 2>$null

# Iniciar servidor
Write-Host "`n✅ Iniciando servidor en http://localhost:5000" -ForegroundColor Green
python app.py
