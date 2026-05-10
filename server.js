const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, 'public')));

// Game state
const rooms = {};

function createRoom(roomId) {
  rooms[roomId] = {
    players: {},
    bullets: [],
    lastUpdate: Date.now()
  };
}

function getRoomId(socket) {
  for (const [rid, room] of Object.entries(rooms)) {
    if (room.players[socket.id]) return rid;
  }
  return null;
}

const COLORS = ['#4a7a4a', '#7a4a22', '#4a4a7a', '#7a4a6a', '#7a6a2a', '#2a6a7a'];
let colorIdx = 0;

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Join or create room
  socket.on('joinRoom', ({ roomId, name }) => {
    if (!rooms[roomId]) createRoom(roomId);
    const room = rooms[roomId];

    const color = COLORS[colorIdx % COLORS.length];
    colorIdx++;

    room.players[socket.id] = {
      id: socket.id,
      name: name || ('Soldier_' + socket.id.slice(0, 4)),
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      angle: 0,
      hp: 100,
      maxHp: 100,
      kills: 0,
      deaths: 0,
      credits: 0,
      weapon: 'M4A1',
      color,
      alive: true,
      lastShot: 0
    };

    socket.join(roomId);

    // Send current room state to new player
    socket.emit('roomState', {
      yourId: socket.id,
      players: room.players
    });

    // Tell everyone else about the new player
    socket.to(roomId).emit('playerJoined', room.players[socket.id]);

    console.log(`${name} joined room ${roomId}. Players: ${Object.keys(room.players).length}`);
  });

  // Player movement/state update
  socket.on('playerUpdate', (data) => {
    const rid = getRoomId(socket);
    if (!rid) return;
    const room = rooms[rid];
    const player = room.players[socket.id];
    if (!player || !player.alive) return;

    player.x = data.x;
    player.y = data.y;
    player.angle = data.angle;
    player.weapon = data.weapon;

    // Broadcast to others in room
    socket.to(rid).emit('playerMoved', {
      id: socket.id,
      x: player.x,
      y: player.y,
      angle: player.angle,
      weapon: player.weapon
    });
  });

  // Player shoots
  socket.on('shoot', (bulletData) => {
    const rid = getRoomId(socket);
    if (!rid) return;
    const room = rooms[rid];
    const shooter = room.players[socket.id];
    if (!shooter || !shooter.alive) return;

    const bullet = {
      id: socket.id + '_' + Date.now() + '_' + Math.random(),
      owner: socket.id,
      ownerName: shooter.name,
      x: bulletData.x,
      y: bulletData.y,
      vx: bulletData.vx,
      vy: bulletData.vy,
      angle: bulletData.angle,
      dmg: bulletData.dmg,
      range: bulletData.range,
      dist: 0
    };

    // Broadcast bullet to everyone else in room
    socket.to(rid).emit('bulletFired', bullet);
  });

  // Hit detection reported by client
  socket.on('playerHit', ({ targetId, dmg }) => {
    const rid = getRoomId(socket);
    if (!rid) return;
    const room = rooms[rid];
    const target = room.players[targetId];
    const attacker = room.players[socket.id];
    if (!target || !target.alive || !attacker) return;

    target.hp = Math.max(0, target.hp - dmg);

    // Tell the target they got hit
    io.to(targetId).emit('youGotHit', { hp: target.hp, attackerId: socket.id });

    if (target.hp <= 0) {
      target.alive = false;
      target.deaths++;
      attacker.kills++;
      attacker.credits += 50;

      // Tell everyone about the kill
      io.to(rid).emit('playerKilled', {
        killerId: socket.id,
        killerName: attacker.name,
        targetId,
        targetName: target.name
      });

      // Respawn after 3 seconds
      setTimeout(() => {
        if (!rooms[rid]) return;
        target.hp = 100;
        target.alive = true;
        target.x = 150 + Math.random() * 380;
        target.y = 100 + Math.random() * 280;
        io.to(rid).emit('playerRespawned', {
          id: targetId,
          x: target.x,
          y: target.y
        });
      }, 3000);
    }
  });

  // Chat message
  socket.on('chatMsg', (msg) => {
    const rid = getRoomId(socket);
    if (!rid) return;
    const player = rooms[rid].players[socket.id];
    if (!player) return;
    io.to(rid).emit('chatMsg', { name: player.name, msg: msg.slice(0, 80) });
  });

  socket.on('disconnect', () => {
    const rid = getRoomId(socket);
    if (!rid) return;
    const room = rooms[rid];
    const player = room.players[socket.id];
    if (player) {
      io.to(rid).emit('playerLeft', { id: socket.id, name: player.name });
      delete room.players[socket.id];
      console.log(`${player.name} left room ${rid}`);
    }
    if (Object.keys(room.players).length === 0) {
      delete rooms[rid];
      console.log(`Room ${rid} deleted (empty)`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Warfare server running on port ${PORT}`);
});
