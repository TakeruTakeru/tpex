// ============ Client -> Server ============
export type InitializeEvent = {
  player: SerializedPlayer;
  players: SerializedPlayer[];
};

export type PlayerConnectEvent = {
  player: SerializedPlayer;
};

export type PlayerMoveEvent = {
  user: SerializedUser;
};

export type PlayerShootEvent = {
  playerId: string;
  bullet: SerializedBullet;
};

export type PlayerShotEvent = {
  playerId: string;
  player: SerializedPlayer;
};

// ============ I/F ============
export type SerializedUser = {
  id: string;
  position: SerializedPosition;
  rotation: SerializedRotation;
  health: number;
};

export type SerializedPlayer = {
  id: string;
  position: SerializedPosition;
  rotation: SerializedRotation;
  health: number;
};

export type SerializedPosition = {
  x: number;
  y: number;
  z: number;
};

export type SerializedRotation = {
  x: number;
  y: number;
  z: number;
};

export type SerializedBullet = {
  origin: SerializedPosition;
  direction: SerializedPosition;
  speed: number;
  basicDamage: number;
};

// ============ Event Name ============

export const EVENTS = {
  INIT: "init",
  PLAYER_CONNECT: "player-connected",
  PLAYER_MOVE: "player-moved",
  PLAYER_SHOOT: "player-shoot",
  PLAYER_UPDATE: "player-update",
  PLAYER_DISCONNECT: "player-disconnected",
};
