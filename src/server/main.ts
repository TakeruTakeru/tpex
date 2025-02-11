import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import cors from "cors";
import {
  EmitPlayerConnectEvent,
  EmitInitializeEvent,
  onPlayerMoveEvent,
  EmitPlayerMoveEvent,
  onPlayerShootEvent,
  EmitPlayerShootEvent,
  Player,
} from "../types";
import { getClampedPosition } from "../boundary";

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

const players: { [id: string]: Player } = {};

io.on("connection", (socket) => {
  const player = (players[socket.id] = {
    id: socket.id,
    position: getClampedPosition({ x: 0, y: 0, z: 0 }),
    rotation: { x: 0, y: 0, z: 0 },
    health: 100,
  });
  if (Object.keys(players).length === 1) {
    // nop
  } else {
    // 2人目以降のプレイヤーは前のプレイヤーの右隣に配置
    const lastPlayer =
      Object.values(players)[Object.values(players).length - 2];
    const newPosition = getClampedPosition({
      x: lastPlayer.position.x + 1,
      y: lastPlayer.position.y,
      z: lastPlayer.position.z + 1,
    });
    player.position = newPosition;
  }

  socket.emit("init", {
    player,
    players: Object.values(players),
  } as EmitInitializeEvent);

  socket.broadcast.emit("player-connected", {
    player,
  } as EmitPlayerConnectEvent);

  socket.on("player-move", (data: onPlayerMoveEvent) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      socket.broadcast.emit("player-moved", {
        id: socket.id,
        ...data,
      } as EmitPlayerMoveEvent);
    }
  });

  socket.on("player-shot", (data: onPlayerShootEvent) => {
    socket.broadcast.emit("player-shot", {
      playerId: socket.id,
      ...data,
    } as EmitPlayerShootEvent);
  });

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
