Synology IPTV Proxy
Un proxy simple para mejorar la compatibilidad de streams IPTV en servidores Synology, especialmente útil para Emby.
Descripción
Este proxy permite que streams IPTV que funcionan correctamente en VLC también funcionen en aplicaciones como Emby en Synology NAS. El proxy emula el comportamiento y cabeceras HTTP de VLC, manejando correctamente redirecciones y tokens de autenticación.
Características

Emulación de cabeceras de VLC para mejorar compatibilidad
Manejo automático de redirecciones HTTP
Soporte para tokens de autenticación
Rotación de User-Agents para superar bloqueos
Registro detallado para solucionar problemas
Scripts de inicio/parada para integración en DSM

Requisitos previos

Synology NAS con DSM 6.x o posterior
Node.js instalado en el NAS (disponible en el Centro de paquetes)
Acceso SSH habilitado (temporalmente)

Instalación

Conéctate a tu Synology vía SSH:
bashCopyssh usuario@ip-del-synology

Crea la carpeta para el proxy:
bashCopymkdir -p /volume2/Script/proxy-iptv

Copia los archivos proxy.js, start_proxy.sh y stop_proxy.sh a la carpeta:
bashCopy# Puedes usar SCP o editar los archivos directamente
nano /volume2/Script/proxy-iptv/proxy.js
nano /volume2/Script/proxy-iptv/scripts/start_proxy.sh
nano /volume2/Script/proxy-iptv/scripts/stop_proxy.sh

Haz ejecutables los scripts:
bashCopychmod +x /volume2/Script/proxy-iptv/proxy.js
chmod +x /volume2/Script/proxy-iptv/scripts/start_proxy.sh
chmod +x /volume2/Script/proxy-iptv/scripts/stop_proxy.sh

Configura el firewall de Synology:

En DSM, ve a Panel de control > Seguridad > Firewall
Crea una regla para permitir el tráfico en el puerto 8889 (TCP)


Configura una tarea programada:

En DSM, ve a Panel de control > Tareas programadas
Crea una nueva tarea programada, tipo "Definido por el usuario"
Establece el usuario como "root"
Establece el comando como /volume2/Script/proxy-iptv/scripts/start_proxy.sh
Configura la tarea para ejecutarse al inicio del sistema



Uso
En Emby
Para usar streams IPTV con Emby, necesitas añadir el proxy a las URLs:
Copyhttp://IP-DEL-SYNOLOGY:8889/http://tu-url-iptv-original
Por ejemplo, si tu URL IPTV es http://line.pro-iptv.cc:80/XXXXXX/YYYYYY/ZZZZZ, deberías usar:
Copyhttp://192.168.1.10:8889/http://line.pro-iptv.cc:80/XXXXXX/YYYYYY/ZZZZZ
Gestión del proxy
Para iniciar manualmente el proxy:
bashCopy/volume2/Script/proxy-iptv/scripts/start_proxy.sh
Para detener el proxy:
bashCopy/volume2/Script/proxy-iptv/scripts/stop_proxy.sh
Solución de problemas

Revisa los logs en /volume2/Script/proxy-iptv/log.txt y /volume2/Script/proxy-iptv/proxy_startup.log
Verifica que el puerto 8889 esté abierto en el firewall
Asegúrate de que Node.js esté instalado y funcionando correctamente

Personalización
Puedes modificar el puerto del proxy editando la variable PORT en proxy.js:
javascriptCopyconst PORT = 8889; // Cámbialo al puerto que desees
Licencia
Este proyecto está licenciado bajo la licencia MIT - ver el archivo LICENSE para más detalles.
Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para cualquier mejora o corrección.
