#!/bin/bash

# Definir rutas
SCRIPT_DIR="/volume2/Script/proxy-iptv"
PID_FILE="${SCRIPT_DIR}/proxy.pid"
LOG_FILE="${SCRIPT_DIR}/proxy_startup.log"

# Verificar si el archivo PID existe
if [ ! -f "${PID_FILE}" ]; then
    echo "No se encontró el archivo PID. El proxy posiblemente no está en ejecución." >> "${LOG_FILE}"
    exit 0
fi

# Leer el PID
PROXY_PID=$(cat "${PID_FILE}")

# Verificar si el proceso está en ejecución
if ps -p "${PROXY_PID}" > /dev/null; then
    echo "Deteniendo proxy IPTV con PID ${PROXY_PID}..." >> "${LOG_FILE}"
    kill "${PROXY_PID}"
    
    # Esperar hasta 5 segundos para que el proceso termine
    COUNT=0
    while ps -p "${PROXY_PID}" > /dev/null && [ ${COUNT} -lt 5 ]; do
        sleep 1
        COUNT=$((COUNT + 1))
    done
    
    # Si el proceso sigue activo, forzar la terminación
    if ps -p "${PROXY_PID}" > /dev/null; then
        echo "El proceso no respondió, forzando terminación..." >> "${LOG_FILE}"
        kill -9 "${PROXY_PID}"
    fi
    
    echo "Proxy detenido correctamente" >> "${LOG_FILE}"
else
    echo "No se encontró proceso con PID ${PROXY_PID}" >> "${LOG_FILE}"
fi

# Eliminar el archivo PID
rm -f "${PID_FILE}"