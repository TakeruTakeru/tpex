import { Player, Position, Rotation } from "./object";

// Handle Events
export type SocketOnPlayerMoveEvent = {
  position: Position;
  rotation: Rotation;
};

export type SocketOnPlayerShootEvent = {
  origin: Position;
  direction: Position;
}

// Broadcast
export type SocketBroadCastInitializeEvent = {
  playerId: string;
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
  id: string;
  origin: Position;
  direction: Position;
};