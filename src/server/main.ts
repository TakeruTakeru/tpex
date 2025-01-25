import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Player } from "./object";
import {
  SocketBroadCastPlayerConnectEvent,
  SocketBroadCastInitializeEvent,
  SocketOnPlayerMoveEvent,
  SocketBroadCastPlayerMoveEvent,
  SocketOnPlayerShootEvent,
  SocketBroadCastPlayerShootEvent,
} from "./event";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Game state
const players: { [id: string]: Player } = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add new player to game state
  players[socket.id] = {
    id: socket.id,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, order: "XYZ" },
    health: 100,
  };

  // Send initial game state to new player
  socket.emit("init", {
    playerId: socket.id,
    players: Object.values(players),
  } as SocketBroadCastInitializeEvent);

  // Broadcast new player to others
  socket.broadcast.emit("player-connected", {
    player: players[socket.id],
  } as SocketBroadCastPlayerConnectEvent);

  // Handle player movement updates
  socket.on("player-move", (data: SocketOnPlayerMoveEvent) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      socket.broadcast.emit("player-moved", {
        id: socket.id,
        ...data,
      } as SocketBroadCastPlayerMoveEvent);
    }
  });

  // Handle player shooting
  socket.on("player-shoot", (data: SocketOnPlayerShootEvent) => {
    socket.broadcast.emit("player-shot", {
      id: socket.id,
      ...data,
    } as SocketBroadCastPlayerShootEvent);
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("player-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`FPS server running on port ${PORT}`);
});
