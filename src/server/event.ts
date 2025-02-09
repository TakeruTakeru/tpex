import { Player, Position, Rotation } from "./object";

// Handle Events
export type SocketOnPlayerMoveEvent = {
  position: Position;
  rotation: Rotation;
};

export type SocketOnPlayerShootEvent = {
  origin: Position;
  direction: Position;
  speed: number;
};

// Broadcast
export type SocketBroadCastInitializeEvent = {
  player: Player;
  players: Player[];
};

export type SocketBroadCastPlayerConnectEvent = {
  player: Player;
};

export type SocketBroadCastPlayerMoveEvent = {
  id: string;
  position: Position;
  rotation: Rotation;
};

export type SocketBroadCastPlayerShootEvent = {
  playerId: string;
  origin: Position;
  direction: Position;
  speed: number;
};
