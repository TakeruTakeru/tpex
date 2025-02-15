import * as THREE from "three";
import { PlayerMoveMents } from "./Player";
import { HitEvent, Model, Moveable, Serializable } from "./Models";
import { getModel } from "./ModelLoader";
import { Bullet } from "./Bullet";
import { SerializedUser } from "../../types";

export class User implements Model, Moveable, Serializable<SerializedUser> {
  playerId: string;
  health: number;
  camera: THREE.Camera;
  sensitivity: number; // マウス感度
  speed: number; // 移動速度
  yaw: number = 0; // 左右回転
  pitch: number = 0; // 上下回転
  pitchLimit: number = (Math.PI / 180) * 60; // 上下80度
  bullets: Bullet[] = [];

  baseObject: THREE.Object3D; // カメラに追従するオブジェクト（相対座標を持つためのもの）
  hitBox: THREE.Mesh; // 当たり判定用
  gunModel: THREE.Group; // 銃モデル用

  nextVector: THREE.Vector3 = new THREE.Vector3();

  private bobTime: number = 0; // ヘッドボブの時間管理
  private bobIntensity: number = 0.002; // 揺れの強さ
  private bobSpeed: number = 10; // 揺れの速度

  constructor(
    camera: THREE.Camera,
    playerID: string,
    speed: number = 2,
    sensitivity: number = 0.003
  ) {
    this.playerId = playerID;
    this.camera = camera;
    this.speed = speed;
    this.sensitivity = sensitivity;
    this.health = 100;

    // **ベースオブジェクト（カメラの位置に追従する）**
    this.baseObject = new THREE.Object3D();
    this.baseObject.name = "userBaseObject";

    // **当たり判定用の Box を追加**
    const hitBoxGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.5); // 幅・高さ・奥行き
    hitBoxGeometry.name = "userHitBoxGeometry"; // 名前をつける
    const hitBoxMaterial = new THREE.MeshBasicMaterial({
      visible: false, // **透明にする**
    });
    const hitBox = new THREE.Mesh(hitBoxGeometry, hitBoxMaterial);
    hitBox.name = "userHitBox"; // 名前をつける
    hitBox.userData = { playerId: playerID, controller: this }; // 衝突時に識別するための情報
    this.hitBox = hitBox;
    this.baseObject.add(hitBox);

    // **銃モデル**
    const gun = getModel("gun");
    this.gunModel = gun;
    this.baseObject.add(this.gunModel);
    this.gunModel.position.set(0.2, -0.1, -0.3);
  }

  getObject3D(): THREE.Object3D {
    return this.baseObject;
  }

  getRotation(): THREE.Euler {
    return this.baseObject.rotation;
  }

  destroy(scene: THREE.Scene): void {
    scene.remove(this.baseObject);
  }

  handleMouseMove = (movementX: number, movementY: number) => {
    this.yaw -= movementX * this.sensitivity;
    this.pitch -= movementY * this.sensitivity;

    this.pitch = Math.max(
      -this.pitchLimit,
      Math.min(this.pitchLimit, this.pitch)
    );

    this.updateCameraRotation();
  };

  handlePlayerMove = (movements: PlayerMoveMents, deltaTime: number) => {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.camera.quaternion);

    forward.y = 0;
    forward.normalize();
    right.y = 0;
    right.normalize();

    const velocity = new THREE.Vector3();
    if (movements.forward) velocity.add(forward);
    if (movements.backward) velocity.sub(forward);
    if (movements.left) velocity.sub(right);
    if (movements.right) velocity.add(right);

    if (velocity.length() > 0) {
      const sprintMultiplier = movements.sprint ? 3 : 1.0; // スプリント時は1.5倍
      const speed = deltaTime * this.speed * sprintMultiplier;
      velocity.normalize().multiplyScalar(speed);

      // **ヘッドボブ（ピッチを揺らす）**
      this.bobTime += deltaTime * this.bobSpeed;
      this.pitch += Math.sin(this.bobTime) * this.bobIntensity;
    }

    this.nextVector = velocity;
    this.updateCameraRotation();
  };

  updateCameraRotation = () => {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, "YXZ"));

    // カメラの回転を適用
    this.camera.quaternion.copy(quaternion);
    this.baseObject.quaternion.copy(quaternion);
  };

  /** カメラの初期位置と向きを設定 */
  setInitialPositionAndRotation = (
    position: THREE.Vector3,
    target: THREE.Vector3
  ) => {
    this.camera.position.copy(position);

    const direction = new THREE.Vector3()
      .subVectors(target, position)
      .normalize();

    this.yaw = Math.atan2(direction.x, direction.z);
    this.pitch = Math.asin(direction.y);

    this.updateCameraRotation();
  };

  getPosition = () => {
    return this.camera.position;
  };

  getNextVector = () => {
    return this.camera.position.clone().add(this.nextVector);
  };

  move = (vector: THREE.Vector3) => {
    this.camera.position.copy(vector);
    this.baseObject.position.copy(vector);
  };

  onHit(e: HitEvent): void {}

  shoot(): Bullet {
    const direction = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.camera.quaternion)
      .normalize();
    const speed = 5;
    const bullet = new Bullet(this.camera.position, direction, speed, 10);
    this.bullets.push(bullet);
    return bullet;
  }

  shot(bullet: Bullet) {
    const damage = bullet.getDamageValue();
    this.health = Math.max(this.health - damage, 0);
  }

  isOwn = (bullet: Bullet) => {
    return this.bullets.includes(bullet);
  };

  toJSON(): SerializedUser {
    return {
      id: this.playerId,
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      rotation: {
        x: this.baseObject.rotation.x,
        y: this.baseObject.rotation.y,
        z: this.baseObject.rotation.z,
      },
      health: this.health,
    };
  }
}
