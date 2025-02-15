import * as THREE from "three";
import { HitEvent, Model, Moveable } from "./Models";
import { getModel } from "./ModelLoader";
import { Bullet } from "./Bullet";
import { SerializedPlayer } from "../../types";

export class Player implements Model, Moveable {
  private id: string;
  private model: THREE.Group;
  private gunModel: THREE.Group; // 銃モデル用
  private position: THREE.Vector3;
  private nextVector: THREE.Vector3 = new THREE.Vector3();
  health: number = 100;

  bullets: Bullet[] = [];

  constructor(id: string, position: THREE.Vector3, rotation: THREE.Euler) {
    this.id = id;
    this.position = position;

    const player = getModel("dog");
    this.model = player;
    this.model.userData = { playerId: this.id };
    this.model.position.copy(position);
    this.model.rotation.copy(rotation);

    const gun = getModel("gun");
    this.gunModel = gun;
    this.gunModel.userData = { playerId: this.id };
    this.model.add(this.gunModel); // **カメラの子要素に追加**
    this.gunModel.position.set(0.2, -0.1, -0.3); // **右下に配置**
    this.gunModel.rotation.set(0, 0, 0); // 角度調整
  }

  getObject3D(): THREE.Object3D {
    return this.model;
  }

  getPosition(): THREE.Vector3 {
    return this.position;
  }

  getRotation(): THREE.Euler {
    return this.model.rotation;
  }

  destroy(scene: THREE.Scene) {
    scene.remove(this.model);
  }

  getNextVector(): THREE.Vector3 {
    return this.nextVector;
  }

  move(vector: THREE.Vector3): void {
    this.position.copy(vector);
    this.model.position.copy(this.position);
  }

  updateHealth(player: SerializedPlayer) {
    this.health = player.health;
  }

  updatePosition(position: THREE.Vector3, rotation: THREE.Euler) {
    if (this.model) {
      this.nextVector = position;
      this.model.rotation.copy(rotation);
    }
  }

  // update()

  onHit(e: HitEvent): void {}

  shot = (bullet: Bullet) => {
    this.bullets.push(bullet);
  };

  isOwn = (bullet: Bullet) => {
    return this.bullets.includes(bullet);
  };
}

export type PlayerMoveMents = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
};
