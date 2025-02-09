import * as THREE from "three";
import { Moveable } from "./object";
import { getModel } from "./loader";

export class Player implements Moveable {
  public id: string;
  public model: THREE.Group;
  private gunModel: THREE.Group; // 銃モデル用
  private position: THREE.Vector3;
  private nextVector: THREE.Vector3 = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    id: string,
    position: THREE.Vector3,
    rotation: THREE.Euler
  ) {
    this.id = id;
    this.position = position;

    const player = getModel("dog");
    this.model = player;
    this.model.userData = { playerId: this.id };
    console.log(this.model);
    this.model.position.copy(position);
    this.model.rotation.copy(rotation);
    scene.add(this.model);

    const gun = getModel("gun");
    this.gunModel = gun;
    this.gunModel.userData = { playerId: this.id };
    this.model.add(this.gunModel); // **カメラの子要素に追加**
    this.gunModel.position.set(0.2, -0.1, -0.3); // **右下に配置**
    this.gunModel.rotation.set(0, 0, 0); // 角度調整
  }

  onHit(object: any): void {}

  getPosition(): THREE.Vector3 {
    return this.position;
  }

  getNextVector(): THREE.Vector3 {
    return this.nextVector;
  }

  move(vector: THREE.Vector3): void {
    this.position.copy(vector);
    this.model.position.copy(this.position);
  }

  public update(position: THREE.Vector3, rotation: THREE.Euler) {
    if (this.model) {
      this.nextVector = position;
      this.model.rotation.copy(rotation);
    }
  }

  public destroy(scene: THREE.Scene) {
    if (this.model) {
      scene.remove(this.model);
    }
  }
}

export type PlayerMoveMents = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
};
