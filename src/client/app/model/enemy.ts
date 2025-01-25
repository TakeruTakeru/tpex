import * as THREE from "three";
import { Model } from "./object";

export class Enemy extends Model {
  private mesh: THREE.Mesh;
  private speed: number;
  private health: number;
  private target: THREE.Vector3;

  constructor(
    private scene: THREE.Scene,
    private playerPosition: THREE.Vector3
  ) {
    super();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(
      (Math.random() - 0.5) * 20,
      0.5,
      (Math.random() - 0.5) * 20
    );
    scene.add(this.mesh);

    this.speed = 2 + Math.random() * 2;
    this.health = 100;
    this.target = new THREE.Vector3();
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3) {
    this.target.copy(playerPosition);
    const direction = new THREE.Vector3()
      .subVectors(this.target, this.mesh.position)
      .normalize();
    this.mesh.position.addScaledVector(direction, this.speed * deltaTime);
    this.mesh.position.y = 0.5;
    this.mesh.lookAt(playerPosition);
  }

  public takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  private destroy() {
    this.scene.remove(this.mesh);
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }
}
