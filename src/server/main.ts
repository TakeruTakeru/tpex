import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import cors from "cors";
import {
  PlayerConnectEvent,
  InitializeEvent,
  PlayerMoveEvent,
  PlayerShootEvent,
  SerializedPlayer,
  EVENTS,
  PlayerShotEvent,
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

const players: { [id: string]: SerializedPlayer } = {};

io.on("connect", (socket) => {
  const player = (players[socket.id] = {
    id: socket.id,
    position: getClampedPosition({ x: 0, y: 0.5, z: 0 }),
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

  socket.emit(EVENTS.INIT, {
    player,
    players: Object.values(players),
  } as InitializeEvent);

  socket.broadcast.emit(EVENTS.PLAYER_CONNECT, {
    player,
  } as PlayerConnectEvent);

  socket.on(EVENTS.PLAYER_MOVE, (data: PlayerMoveEvent) => {
    if (players[socket.id]) {
      players[socket.id].position = data.user.position;
      players[socket.id].rotation = data.user.rotation;
      socket.broadcast.emit(EVENTS.PLAYER_MOVE, {
        id: data.user.id,
        ...data,
      } as PlayerMoveEvent);
    }
  });

  socket.on(EVENTS.PLAYER_SHOOT, (data: PlayerShootEvent) => {
    socket.broadcast.emit(EVENTS.PLAYER_SHOOT, {
      ...data,
    } as PlayerShootEvent);
  });

  socket.on(EVENTS.PLAYER_UPDATE, (data: PlayerShotEvent) => {
    socket.broadcast.emit(EVENTS.PLAYER_UPDATE, {
      ...data,
    } as PlayerShotEvent);
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit(EVENTS.PLAYER_DISCONNECT, socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`FPS server running on port ${PORT}`);
});
