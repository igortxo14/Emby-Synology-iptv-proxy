const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Forzar el uso de DNS de Cloudflare (1.1.1.1)
dns.setServers(['1.1.1.1']);

// Configuración de logs
const LOG_FILE = path.join(__dirname, 'log.txt');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB en bytes
const MAX_REDIRECTS = 10; // Aumentado a 10 redirecciones máximas permitidas

// Función para escribir logs con rotación de archivos
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size >= MAX_LOG_SIZE) {
        const backupFile = `${LOG_FILE}.old.${timestamp.replace(/:/g, '-')}`;
        fs.renameSync(LOG_FILE, backupFile);
        console.log(`Archivo de log rotado a: ${backupFile}`);
      }
    }
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error(`Error al gestionar el archivo de log: ${error.message}`);
  }
}

// Función mejorada para verificar si la URL es de un stream de Emby
function isEmbyStream(requestUrl) {
  // Dominios conocidos
  const knownDomains = [
    'line.pro-iptv.cc',
    'z-slop.com',
    'fcmax11-1.z-slop.com',
    'fcmax12-1.z-slop.com'
  ];
  
  const parsedUrl = url.parse(requestUrl);
  if (knownDomains.some(domain => parsedUrl.hostname && parsedUrl.hostname.includes(domain))) {
    return true;
  }
  
  // Patrones de URL
  const streamPatterns = [
    /\/\d{5,}$/,         // URLs que terminan con 5+ dígitos
    /\/\w+\/\w+\/\d+$/,  // Patrón /XXX/XXX/NNNNN
    /fcmax\d+-\d+/,       // Patrón fcmaxNN-N
    /\?token=/           // URLs con parámetro token
  ];
  
  return streamPatterns.some(pattern => pattern.test(requestUrl));
}

// Función para obtener las cabeceras idénticas a VLC
function getVlcHeaders(hostname) {
  return {
    'User-Agent': 'VLC/3.0.21 LibVLC/3.0.21',
    'Accept': '*/*',
    'Accept-Language': 'es',
    'Range': 'bytes=0-',
    'Connection': 'keep-alive', // Cambiado de 'close' a 'keep-alive'
    'Host': hostname
  };
}

// Función para manejar solicitudes HTTP con soporte para redirecciones y encabezados personalizados
function handleRequest(clientReq, clientRes, targetUrl, redirectCount = 0, customHeaders) {
  if (redirectCount > MAX_REDIRECTS) {
    writeLog(`ERROR: Demasiadas redirecciones (${redirectCount}) para ${targetUrl}`);
    clientRes.writeHead(500);
    clientRes.end('Error: Demasiadas redirecciones');
    return;
  }
  
  const parsedUrl = url.parse(targetUrl);
  const headers = customHeaders || getVlcHeaders(parsedUrl.hostname);
  
  // Asegurarnos de que el Host siempre coincida con la URL actual
  headers['Host'] = parsedUrl.hostname + (parsedUrl.port ? `:${parsedUrl.port}` : '');
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.path,
    method: clientReq.method,
    headers: headers,
    timeout: 60000 // Aumentado a 60 segundos
  };
  
  writeLog(`Solicitud iniciada: ${clientReq.method} ${targetUrl} (redirección #${redirectCount}) User-Agent: ${headers['User-Agent']}`);
  
  const protocol = parsedUrl.protocol === 'https:' ? https : http;
  
  // Reducir el retraso entre solicitudes
  setTimeout(() => {
    const proxyReq = protocol.request(options, (proxyRes) => {
      // Manejo de redirecciones (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
        writeLog(`Redirección detectada: ${proxyRes.statusCode} a ${proxyRes.headers.location} desde ${targetUrl}`);
        
        let redirectUrl = proxyRes.headers.location;
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
          redirectUrl = new URL(redirectUrl, baseUrl).toString();
        }
        
        // Reducir el retraso entre redirecciones
        const redirectDelay = 200;
        setTimeout(() => {
          // Propagar los encabezados actuales a la siguiente llamada
          handleRequest(clientReq, clientRes, redirectUrl, redirectCount + 1, headers);
        }, redirectDelay);
        return;
      }
      
      // Si se recibe un error 451, intenta con un User-Agent alternativo
      if (proxyRes.statusCode === 451 || proxyRes.statusCode === 403) {
        writeLog(`Error ${proxyRes.statusCode} detectado. Intentando con User-Agent alternativo para ${targetUrl}`);
        if (redirectCount < MAX_REDIRECTS - 1) {
          const altUserAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'IPTV Smarters/1.5.1',
            'Lavf/58.29.100',
            'Emby/4.7.0.29',
            'Dalvik/2.1.0'
          ];
          // Crear nuevos encabezados basados en los actuales, cambiando solo el User-Agent
          const newHeaders = { ...headers, 'User-Agent': altUserAgents[redirectCount % altUserAgents.length] };
          writeLog(`Reintentando con User-Agent: ${newHeaders['User-Agent']}`);
          setTimeout(() => {
            handleRequest(clientReq, clientRes, targetUrl, redirectCount + 1, newHeaders);
          }, 500);
          return;
        }
      }
      
      writeLog(`Respuesta recibida: ${proxyRes.statusCode} para ${targetUrl}`);
      
      // Conservamos todas las cabeceras originales excepto las mencionadas
      const responseHeaders = {};
      Object.keys(proxyRes.headers).forEach(key => {
        if (!['content-length', 'content-security-policy', 'x-frame-options'].includes(key.toLowerCase())) {
          responseHeaders[key] = proxyRes.headers[key];
        }
      });
      
      clientRes.writeHead(proxyRes.statusCode, responseHeaders);
      
      let bytesTransferred = 0;
      proxyRes.on('data', (chunk) => {
        bytesTransferred += chunk.length;
        clientRes.write(chunk);
      });
      
      proxyRes.on('end', () => {
        writeLog(`Transferencia completada: ${targetUrl} - ${bytesTransferred} bytes`);
        clientRes.end();
      });
    });
    
    proxyReq.on('timeout', () => {
      writeLog(`TIMEOUT: La solicitud a ${targetUrl} excedió el tiempo de espera`);
      proxyReq.destroy();
      if (!clientRes.headersSent) {
        clientRes.writeHead(504);
        clientRes.end('Timeout: La solicitud al servidor remoto tardó demasiado');
      }
    });
    
    // Manejo de datos para métodos POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(clientReq.method)) {
      clientReq.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
    
    proxyReq.on('error', (e) => {
      writeLog(`ERROR: ${e.message} para ${targetUrl}`);
      console.error(`Error de proxy: ${e.message}`);
      if (!clientRes.headersSent) {
        clientRes.writeHead(500);
        clientRes.end(`Error de proxy: ${e.message}`);
      }
    });
  }, 50); // Reducido de 100-300ms a un valor fijo de 50ms
}

const server = http.createServer((req, res) => {
  // Se elimina la barra inicial para obtener la URL destino
  const targetUrl = req.url.slice(1);
  
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    res.writeHead(400);
    res.end('URL inválida');
    writeLog(`Solicitud rechazada - URL inválida: ${targetUrl}`);
    return;
  }
  
  // Verificamos si es un stream IPTV pero ahora con comprobación más permisiva
  const isIptvRequest = isEmbyStream(targetUrl);
  if (!isIptvRequest) {
    res.writeHead(403);
    res.end('Solo se permite el tráfico de streams IPTV');
    writeLog(`Solicitud bloqueada - No es stream IPTV: ${targetUrl}`);
    return;
  }
  
  // Manejar la solicitud con soporte para redirecciones
  handleRequest(req, res, targetUrl);
});

const PORT = 8889;
server.listen(PORT, () => {
  const message = `Servidor proxy ejecutándose en http://localhost:${PORT}`;
  console.log(message);
  writeLog(`INICIO: ${message}`);
});

// Manejadores de errores y cierre
process.on('SIGINT', () => {
  writeLog('Servidor proxy apagado');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  writeLog(`ERROR no capturado: ${err.message}`);
  console.error('Error no capturado:', err);
});