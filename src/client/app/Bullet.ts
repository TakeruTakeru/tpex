import * as THREE from "three";
import { HitEvent, Model, Moveable, Serializable } from "./Models";
import { SerializedBullet } from "../../types";

export class Bullet implements Model, Moveable, Serializable<SerializedBullet> {
  private bulletMesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private direction: THREE.Vector3;
  private speed: number;
  private basicDamage: number;
  private lifespan: number;
  private nextVector: THREE.Vector3 = new THREE.Vector3();

  constructor(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    basicDamage: number
  ) {
    const geometry = new THREE.SphereGeometry(0.1);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    this.bulletMesh = new THREE.Mesh(geometry, material);
    this.bulletMesh.name = "bullet";
    this.bulletMesh.position.copy(position);

    this.direction = direction;
    this.speed = speed;
    this.basicDamage = basicDamage;
    this.velocity = direction.clone().multiplyScalar(speed);
    this.lifespan = 2;
  }

  getObject3D(): THREE.Object3D {
    return this.bulletMesh;
  }

  getPosition(): THREE.Vector3 {
    return this.bulletMesh.position;
  }

  getRotation(): THREE.Euler {
    throw new Error("Method not implemented.");
  }

  getDamageValue() {
    return this.basicDamage;
  }

  destroy(scene: THREE.Scene) {
    scene.remove(this.bulletMesh);
  }

  getNextVector(): THREE.Vector3 {
    return this.bulletMesh.position.clone().add(this.nextVector);
  }

  move(vector: THREE.Vector3): void {
    this.bulletMesh.position.copy(vector);
  }

  onHit(e: HitEvent): void {
    console.log(e);
    // ヒットしたら消滅
    this.lifespan = 0;
  }

  update(deltaTime: number): boolean {
    // 次の移動量を計算して保持
    this.nextVector.copy(this.velocity).multiplyScalar(deltaTime);

    // 寿命を減少させる（移動はしない）
    this.lifespan -= deltaTime;

    // 寿命が残っているかを返す
    return this.lifespan > 0;
  }

  toJSON(): SerializedBullet {
    return {
      origin: this.getPosition(),
      direction: this.direction,
      speed: this.speed,
      basicDamage: this.basicDamage,
    };
  }
}
