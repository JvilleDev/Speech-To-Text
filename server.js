const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const fs = require('fs')
const path = require('path')
const PORT = process.env.PORT || 3100;
app.use(express.static(__dirname + '/public'));
app.use('/static', express.static('static'));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Expires', '0');
  res.setHeader('Pragma', 'no-cache');
  next();
});

let viewerConnectedClients = 0;

io.on('connection', (socket) => {

  socket.on('transcription', (transcription) => {
    io.emit('viewer', transcription);
  });
  socket.on('newAlert', (data) => {
    io.emit('alert', data);
  });
  socket.on('alertTest', (data) => {
    io.emit('test', data);
  });

  socket.on('disconnect', () => {

    if (socket === viewerSocket) {
      viewerConnectedClients--;
      console.log('Cliente del viewer desconectado');
      console.log(`Clientes conectados al viewer: ${viewerConnectedClients}`);
    }
  });


  if (socket.handshake.query.viewer === 'true') {
    viewerConnectedClients++;
    console.log('Cliente del viewer conectado');
    console.log(`Clientes conectados al viewer: ${viewerConnectedClients}`);
  }
  socket.on('allText', (text) => {
    io.emit('updateText', text);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});
const viewerSocket = io.of('/viewer');
viewerSocket.on('connection', (socket) => {
  console.log('Cliente del viewer conectado');
  viewerConnectedClients++;
  console.log(`Clientes conectados al viewer: ${viewerConnectedClients}`);

  socket.on('disconnect', () => {
    console.log('Cliente del viewer desconectado');
    viewerConnectedClients--;
    console.log(`Clientes conectados al viewer: ${viewerConnectedClients}`);
  });
});
app.post('/reemplazar', (req, res) => {
  try {
    const { palabra, reemplazar } = req.body;
    const data = fs.readFileSync('reemplazar.json', 'utf8');
    const reemplazarArray = JSON.parse(data);
    reemplazarArray.push({ palabra, reemplazar });
    fs.writeFileSync('reemplazar.json', JSON.stringify(reemplazarArray, null, 2));
    res.json({ message: 'Elemento agregado con éxito' });
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar el elemento' });
  }
});

app.put('/reemplazar/:indice', (req, res) => {
  try {
    const indice = parseInt(req.params.indice);
    const { palabra, reemplazar } = req.body.body;

    const data = fs.readFileSync('reemplazar.json', 'utf8');
    const reemplazarArray = JSON.parse(data);

    if (indice >= 0 && indice < reemplazarArray.length) {
      const elementoExistente = reemplazarArray[indice];

      elementoExistente.palabra = palabra;
      elementoExistente.reemplazar = reemplazar;

      fs.writeFileSync('reemplazar.json', JSON.stringify(reemplazarArray, null, 2));
      res.json({ message: 'Elemento editado con éxito' });
    } else {
      res.status(404).json({ error: 'Índice de elemento no válido' });
    }
  } catch (err) {
    console.error('Error al editar el elemento:', err);
    res.status(500).json({ error: 'Error al editar el elemento', err });
  }
});

app.delete('/reemplazar/:palabra', (req, res) => {
  try {
    const palabraToDelete = req.params.palabra;
    const data = fs.readFileSync('reemplazar.json', 'utf8');
    const reemplazarArray = JSON.parse(data);
    const index = reemplazarArray.findIndex((elem) => elem.palabra === palabraToDelete);
    if (index !== -1) {
      reemplazarArray.splice(index, 1);
      fs.writeFileSync('reemplazar.json', JSON.stringify(reemplazarArray, null, 2));
      res.json({ message: 'Elemento eliminado con éxito' });
    } else {
      res.status(404).json({ error: 'Elemento no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el elemento' });
  }
});
app.get('/reemplazar', (req, res) => {
  try {
    const data = fs.readFileSync('reemplazar.json', 'utf8');
    const reemplazarArray = JSON.parse(data);
    res.json(reemplazarArray);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer el archivo reemplazar.json' });
  }
});

app.get('/api/reemplazar', (req, res) => {
    fs.readFile('reemplazar.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al leer el archivo reemplazar.json' });
      }
  
      try {
        const reemplazos = JSON.parse(data);
        res.json(reemplazos);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al analizar el archivo reemplazar.json' });
      }
    });
  });
 app.get('/programa', (req,res)=>{
    res.sendFile(path.join(__dirname,'public','view.html'))
 }) 
 app.get('/transcripcion', (req,res)=>{
  res.sendFile(path.join(__dirname,'public','transcripcion.html'))
}) 
 app.get('/alertas', (req,res)=>{
  res.sendFile(path.join(__dirname,'public','alerts.html'))
}) 

server.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});

