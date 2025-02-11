// Server -> Client
export type onPlayerMoveEvent = {
  position: Position;
  rotation: Rotation;
};

export type onPlayerShootEvent = {
  origin: Position;
  direction: Position;
  speed: number;
};

// Client -> Server
export type EmitInitializeEvent = {
  player: Player;
  players: Player[];
};

export type EmitPlayerConnectEvent = {
  player: Player;
};

export type EmitPlayerMoveEvent = {
  id: string;
  position: Position;
  rotation: Rotation;
};

export type EmitPlayerShootEvent = {
  playerId: string;
  origin: Position;
  direction: Position;
  speed: number;
};

export type Player = {
  id: string;
  position: Position;
  rotation: Rotation;
  health: number;
};

export type Position = {
  x: number;
  y: number;
  z: number;
};

export type Rotation = {
  x: number;
  y: number;
  z: number;
};
