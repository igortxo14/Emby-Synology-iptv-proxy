#!/bin/bash

# Definir rutas
SCRIPT_DIR="/volume2/Script/proxy-iptv"
NODE_PATH="/usr/local/bin/node"
PROXY_SCRIPT="${SCRIPT_DIR}/proxy.js"
LOG_FILE="${SCRIPT_DIR}/proxy_startup.log"
PID_FILE="${SCRIPT_DIR}/proxy.pid"

# Crear log con timestamp
echo "===== Iniciando proxy IPTV $(date) =====" >> "${LOG_FILE}"

# Verificar si Node.js está instalado
if [ ! -f "${NODE_PATH}" ]; then
    echo "ERROR: Node.js no encontrado en ${NODE_PATH}. Verifique la instalación." >> "${LOG_FILE}"
    
    # Intentar encontrar node en otras ubicaciones comunes
    NODE_PATH=$(which node)
    if [ -z "${NODE_PATH}" ]; then
        echo "ERROR: Node.js no encontrado en el sistema. Por favor instale Node.js." >> "${LOG_FILE}"
        exit 1
    else
        echo "Node.js encontrado en ${NODE_PATH}" >> "${LOG_FILE}"
    fi
fi

# Verificar si el script existe
if [ ! -f "${PROXY_SCRIPT}" ]; then
    echo "ERROR: Script de proxy no encontrado en ${PROXY_SCRIPT}" >> "${LOG_FILE}"
    exit 1
fi

# Verificar si ya está corriendo
if [ -f "${PID_FILE}" ]; then
    OLD_PID=$(cat "${PID_FILE}")
    if ps -p "${OLD_PID}" > /dev/null; then
        echo "ADVERTENCIA: El proxy ya está ejecutándose con PID ${OLD_PID}" >> "${LOG_FILE}"
        # Si quieres parar la instancia anterior y reiniciar, descomenta la siguiente línea
        # kill "${OLD_PID}"
        exit 0
    else
        echo "ADVERTENCIA: Encontrado PID antiguo (${OLD_PID}) pero el proceso no está activo" >> "${LOG_FILE}"
    fi
fi

# Configurar el directorio de trabajo
cd "${SCRIPT_DIR}" || {
    echo "ERROR: No se puede cambiar al directorio ${SCRIPT_DIR}" >> "${LOG_FILE}"
    exit 1
}

# Iniciar el proxy en segundo plano y guardar el PID
echo "Iniciando proxy IPTV..." >> "${LOG_FILE}"
"${NODE_PATH}" "${PROXY_SCRIPT}" >> "${LOG_FILE}" 2>&1 &
PROXY_PID=$!

# Verificar que el proceso se haya iniciado correctamente
if ps -p "${PROXY_PID}" > /dev/null; then
    echo "Proxy iniciado correctamente con PID ${PROXY_PID}" >> "${LOG_FILE}"
    echo "${PROXY_PID}" > "${PID_FILE}"
    exit 0
else
    echo "ERROR: No se pudo iniciar el proxy" >> "${LOG_FILE}"
    exit 1
fi