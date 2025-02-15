import * as THREE from "three";

export interface Model {
  getObject3D(): THREE.Object3D;

  getPosition(): THREE.Vector3;

  getRotation(): THREE.Euler;

  destroy(scene: THREE.Scene): void;
}

export interface Moveable {
  getPosition(): THREE.Vector3;

  getNextVector(): THREE.Vector3;

  move(vector: THREE.Vector3): void;

  onHit(event: HitEvent): void;
}

export interface Serializable<T> {
  toJSON(): T;
}

export type HitEvent = {
  type: "boundary" | "intersects";
  debugInfo: any;
};
