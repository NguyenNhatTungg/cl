const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = {}; // userId: socketId

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('call');
});

// Socket.io logic
io.on('connection', socket => {
  console.log('🟢 New socket:', socket.id);

  socket.on('add_user', userId => {
    users[userId] = socket.id;
    console.log(`🔗 ${userId} connected as ${socket.id}`);
  });

  socket.on('call_user', ({ to, offer }) => {
    const target = users[to];
    if (target) {
      io.to(target).emit('incoming_call', { from: socket.id, offer });
    }
  });

  socket.on('answer_call', ({ to, answer }) => {
    io.to(to).emit('call_answered', { answer });
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    io.to(to).emit('ice_candidate', { candidate });
  });

  socket.on('end_call', ({ to }) => {
    io.to(to).emit('call_ended');
  });

  socket.on('disconnect', () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`🔌 User ${userId} disconnected`);
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running: http://localhost:3000');
});
