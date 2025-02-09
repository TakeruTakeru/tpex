import * as THREE from "three";
import { PlayerMoveMents } from "./model/player";

export class InputHandler {
  private movements: PlayerMoveMents;
  private mouse: THREE.Vector2;
  private isLocked: boolean;
  private movementX: number;
  private movementY: number;

  constructor() {
    this.movements = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };
    this.mouse = new THREE.Vector2();
    this.isLocked = false;
    this.movementX = 0;
    this.movementY = 0;

    // キーボードイベント
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));

    // マウスイベント
    window.addEventListener("mousedown", () => this.lockPointer());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("click", () => this.onClick());

    // タッチイベント（モバイル対応）
    window.addEventListener("touchstart", (e) => this.onTouchStart(e));
    window.addEventListener("touchmove", (e) => this.onTouchMove(e));

    document.addEventListener("pointerlockchange", (event) => {
      this.isLocked = document.pointerLockElement === document.body;
    });
  }

  // ====== <User gestures> ======
  private _onMove: (movements: PlayerMoveMents, deltaTime: number) => void =
    () => {};

  public onMove(
    callback: (movements: PlayerMoveMents, deltaTime: number) => void
  ): this {
    this._onMove = callback;
    return this;
  }

  private _onViewChange: (movementX: number, movementY: number) => void =
    () => {};

  public onViewChange(
    callback: (movementX: number, movementY: number) => void
  ): this {
    this._onViewChange = callback;
    return this;
  }

  private _onShoot: () => void = () => {};

  public onShoot(callback: () => void): this {
    this._onShoot = callback;
    return this;
  }

  // ====== </User gestures> ======

  private lockPointer() {
    if (!this.isLocked) {
      document.body.requestPointerLock();
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    switch (key) {
      case "w":
        this.movements.forward = true;
        break;
      case "s":
        this.movements.backward = true;
        break;
      case "a":
        this.movements.left = true;
        break;
      case "d":
        this.movements.right = true;
        break;
      case "shift":
        this.movements.sprint = true;
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    switch (key) {
      case "w":
        this.movements.forward = false;
        break;
      case "s":
        this.movements.backward = false;
        break;
      case "a":
        this.movements.left = false;
        break;
      case "d":
        this.movements.right = false;
        break;
      case "shift":
        this.movements.sprint = false;
        break;
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (this.isLocked) {
      this.movementX = event.movementX;
      this.movementY = event.movementY;
    }
  }

  private onClick: () => void = () => {
    this._onShoot();
  };

  private onTouchStart(event: TouchEvent) {
    // モバイル用タッチ開始処理
    if (event.touches.length > 0) {
      this.mouse.set(
        (event.touches[0].clientX / window.innerWidth) * 2 - 1,
        -(event.touches[0].clientY / window.innerHeight) * 2 + 1
      );
    }
  }

  private onTouchMove(event: TouchEvent) {
    // モバイル用タッチ移動処理
    if (event.touches.length > 0) {
      this.movementX = event.touches[0].clientX - this.mouse.x;
      this.movementY = event.touches[0].clientY - this.mouse.y;
      this.mouse.set(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  public sync(deltaTime: number) {
    // マウスによるカメラ回転
    if (this.movementX !== 0 || this.movementY !== 0) {
      this._onViewChange(this.movementX, this.movementY);
      this.movementX = 0;
      this.movementY = 0;
    }

    // 移動
    this._onMove(this.movements, deltaTime);
  }
}
