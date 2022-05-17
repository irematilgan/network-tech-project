const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const cors = require('cors')
const mongoose = require('mongoose');
const Document = require('./Document');

mongoose.connect('mongodb://localhost/google-docs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const io = new Server(server, {
    cors:{
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
});

const defaultValue = ""

app.use(cors())


io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('get-document', async documentId => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, {data})
    });
  });

});

server.listen(3003, () => {
  console.log('listening on *:3003');
});

async function findOrCreateDocument(id) {
  if(id == null) return
  const document = await Document.findById(id);
  if(document) return document;
  return await Document.create({_id : id, data : defaultValue})
}