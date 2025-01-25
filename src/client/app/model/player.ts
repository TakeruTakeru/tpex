import * as THREE from "three";
import { Model } from "./object";

export class Player extends Model {
  public id: string;
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  public rotation: THREE.Euler;

  constructor(
    scene: THREE.Scene,
    id: string,
    position: THREE.Vector3,
    rotation: THREE.Euler
  ) {
    super();
    this.id = id;
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    this.mesh = new THREE.Mesh(geometry, material);
    this.position = position;
    this.rotation = rotation;
    this.mesh.position.copy(position);
    this.mesh.rotation.copy(rotation);
    scene.add(this.mesh);
  }

  public update(position: THREE.Vector3, rotation: THREE.Euler) {
    this.position.copy(position);
    this.rotation.copy(rotation);
    this.mesh.position.copy(position);
    this.mesh.rotation.copy(rotation);
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }
}
