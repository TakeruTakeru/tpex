import * as THREE from "three";
import { Model } from "./object";

export class Bullet extends Model {
  private mesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private lifespan: number;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    direction: THREE.Vector3
  ) {
    super();
    const geometry = new THREE.SphereGeometry(0.1);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    this.velocity = direction.clone().multiplyScalar(50);
    this.lifespan = 2;
  }

  public update(deltaTime: number): boolean {
    this.mesh.position.addScaledVector(this.velocity, deltaTime);
    this.lifespan -= deltaTime;
    return this.lifespan > 0;
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }
}
