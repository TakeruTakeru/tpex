import * as THREE from "three";

export interface Moveable {
  getPosition(): THREE.Vector3;

  getNextVector(): THREE.Vector3;

  move(vector: THREE.Vector3): void;

  onHit(object: any): void;
}
