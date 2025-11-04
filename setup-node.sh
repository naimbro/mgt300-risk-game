#!/bin/bash
# Script para asegurar que se use Node.js v20

# Cargar NVM si está disponible
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use v20.19.5
fi

# Verificar versión de Node
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Instalar dependencias
npm install

echo "Configuración completada. Ejecuta 'npm run dev' para iniciar la aplicación."