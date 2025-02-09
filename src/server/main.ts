import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Player } from "./object";
import path from "path";
import fs from "fs";
import cors from "cors";
import {
  SocketBroadCastPlayerConnectEvent,
  SocketBroadCastInitializeEvent,
  SocketOnPlayerMoveEvent,
  SocketBroadCastPlayerMoveEvent,
  SocketOnPlayerShootEvent,
  SocketBroadCastPlayerShootEvent,
} from "./event";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", //アクセス許可するオリジン
    credentials: true, //レスポンスヘッダーにAccess-Control-Allow-Credentials追加
    optionsSuccessStatus: 200, //レスポンスstatusを200に設定
  })
);

app.get("/3d/rainbow", (req, res) => {
  const modelPath = path.join(__dirname, "assets", "rainbow_goldenretri.glb");
  const fileStream = fs.createReadStream(modelPath);
  fileStream.on("open", () => {
    res.setHeader("Content-Type", "model/gltf-binary");
    fileStream.pipe(res);
  });
  fileStream.on("error", (err) => {
    console.error("Error reading file:", err);
    res.status(500).send("Failed to send the file.");
  });
});

app.get("/3d/gun", (req, res) => {
  const modelPath = path.join(__dirname, "assets", "gun.glb");
  const fileStream = fs.createReadStream(modelPath);
  fileStream.on("open", () => {
    res.setHeader("Content-Type", "model/gltf-binary");
    fileStream.pipe(res);
  });
  fileStream.on("error", (err) => {
    console.error("Error reading file:", err);
    res.status(500).send("Failed to send the file.");
  });
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 許可するフロントエンドのオリジン
    methods: ["GET", "POST"],
  },
});

// Game state
const players: { [id: string]: Player } = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add new player to game state
  const player = (players[socket.id] = {
    id: socket.id,
    position: { x: 0, y: 1, z: 5 },
    rotation: { x: 0, y: 0, z: 0 },
    health: 100,
  });
  if (Object.keys(players).length === 1) {
    // nop
  } else {
    // 2人目以降のプレイヤーは前のプレイヤーの右隣に配置
    const lastPlayer =
      Object.values(players)[Object.values(players).length - 2];
    player.position.x = lastPlayer.position.x + 1;
    player.position.z = lastPlayer.position.z + 1;
  }

  // Send initial game state to new player
  socket.emit("init", {
    player,
    players: Object.values(players),
  } as SocketBroadCastInitializeEvent);

  // Broadcast new player to others
  socket.broadcast.emit("player-connected", {
    player,
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
  socket.on("player-shot", (data: SocketOnPlayerShootEvent) => {
    socket.broadcast.emit("player-shot", {
      playerId: socket.id,
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
