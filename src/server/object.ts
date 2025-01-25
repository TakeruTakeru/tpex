import { EulerOrder } from "three";

export interface Player {
  id: string;
  position: Position;
  rotation: Rotation;
  health: number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}


export interface Rotation {
  x: number;
  y: number;
  z: number;
  order: EulerOrder;
}
