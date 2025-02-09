import * as THREE from "three";
import { Moveable } from "./object";

export class Bullet implements Moveable {
  public mesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private lifespan: number;
  private nextVector: THREE.Vector3 = new THREE.Vector3();

  constructor(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number
  ) {
    const geometry = new THREE.SphereGeometry(0.1);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = "bullet";
    this.mesh.position.copy(position);

    this.velocity = direction.clone().multiplyScalar(speed);
    this.lifespan = 2;
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }

  getNextVector(): THREE.Vector3 {
    return this.mesh.position.clone().add(this.nextVector);
  }

  move(vector: THREE.Vector3): void {
    this.mesh.position.copy(vector);
  }

  onHit(object: any): void {
    console.log(object);
    // ヒットしたら消滅
    this.lifespan = 0;
  }

  public update(deltaTime: number): boolean {
    // 次の移動量を計算して保持
    this.nextVector.copy(this.velocity).multiplyScalar(deltaTime);

    // 寿命を減少させる（移動はしない）
    this.lifespan -= deltaTime;

    // 寿命が残っているかを返す
    return this.lifespan > 0;
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }
}
