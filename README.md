Synology IPTV Proxy

Un proxy simple para mejorar la compatibilidad de streams IPTV en servidores Synology, especialmente útil para Emby.

Descripción

Este proxy permite que streams IPTV que funcionan correctamente en VLC también funcionen en aplicaciones como Emby en Synology NAS. El proxy emula el comportamiento y cabeceras HTTP de VLC, manejando correctamente redirecciones y tokens de autenticación.

Características

•	Emulación de cabeceras de VLC para mejorar compatibilidad
•	Manejo automático de redirecciones HTTP
•	Soporte para tokens de autenticación
•	Rotación de User-Agents para superar bloqueos
•	Registro detallado para solucionar problemas
•	Scripts de inicio/parada para integración en DSM

Requisitos previos

•	Synology NAS con DSM 6.x o posterior
•	Node.js instalado en el NAS (disponible en el Centro de paquetes)
•	Acceso SSH habilitado (temporalmente)

Instalación
1.	Conéctate a tu Synology vía SSH: 
ssh usuario@ip-del-synology
2.	Crea la carpeta para el proxy: 
mkdir -p /volume2/Script/proxy-iptv
3.	Copia los archivos proxy.js, start_proxy.sh y stop_proxy.sh a la carpeta: 
nano /volume2/Script/proxy-iptv/proxy.js
nano /volume2/Script/proxy-iptv/scripts/start_proxy.sh
nano /volume2/Script/proxy-iptv/scripts/stop_proxy.sh
4.	Haz ejecutables los scripts: 
chmod +x /volume2/Script/proxy-iptv/proxy.js
chmod +x /volume2/Script/proxy-iptv/scripts/start_proxy.sh
chmod +x /volume2/Script/proxy-iptv/scripts/stop_proxy.sh
5.	Configura el firewall de Synology: 
o	En DSM, ve a Panel de control > Seguridad > Firewall
o	Crea una regla para permitir el tráfico en el puerto 8889 (TCP)
6.	Configura una tarea programada: 
o	En DSM, ve a Panel de control > Tareas programadas
o	Crea una nueva tarea programada, tipo "Definido por el usuario"
o	Establece el usuario como "root"
o	Establece el comando como /volume2/Script/proxy-iptv/scripts/start_proxy.sh
o	Configura la tarea para ejecutarse al inicio del sistema
Uso
En Emby
Para usar streams IPTV con Emby, necesitas añadir el proxy a las URLs:
http://IP-DEL-SYNOLOGY:8889/http://tu-url-iptv-original
Por ejemplo, si tu URL IPTV es http://line.pro-iptv.cc:80/XXXXXX/YYYYYY/ZZZZZ, deberías usar:
http://192.168.1.10:8889/http://line.pro-iptv.cc:80/XXXXXX/YYYYYY/ZZZZZ

Gestión del proxy

Para iniciar manualmente el proxy:

/volume2/Script/proxy-iptv/scripts/start_proxy.sh

Para detener el proxy:

/volume2/Script/proxy-iptv/scripts/stop_proxy.sh

Solución de problemas

•	Revisa los logs en /volume2/Script/proxy-iptv/log.txt y /volume2/Script/proxy-iptv/proxy_startup.log
•	Verifica que el puerto 8889 esté abierto en el firewall
•	Asegúrate de que Node.js esté instalado y funcionando correctamente

Personalización

Puedes modificar el puerto del proxy editando la variable PORT en proxy.js:
const PORT = 8889; // Cámbialo al puerto que desees

Licencia

Este proyecto está licenciado bajo la licencia MIT - ver el archivo LICENSE para más detalles

