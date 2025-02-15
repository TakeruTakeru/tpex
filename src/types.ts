// Server -> Client
export type onPlayerMoveEvent = {
  user: SerializedUser;
};

export type onPlayerShootEvent = {
  bullet: SerializedBullet;
};

// Client -> Server
export type EmitInitializeEvent = {
  player: SerializedPlayer;
  players: SerializedPlayer[];
};

export type EmitPlayerConnectEvent = {
  player: SerializedPlayer;
};

export type EmitPlayerMoveEvent = {
  user: SerializedUser;
};

export type EmitPlayerShootEvent = {
  playerId: string;
  bullet: SerializedBullet;
};

export type EmitPlayerShotEvent = {
  byPlayerId: string;
};

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
