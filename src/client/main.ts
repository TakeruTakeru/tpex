import * as THREE from "three";

import { InputHandler } from "./app/web";
import io from "socket.io-client";
import {
  CameraFactoryImpl,
  GameMangerFactoryImpl,
  SceneFactoryImpl,
} from "./app/factory";

// ゲームマネージャーの初期化
const gameManager = new GameMangerFactoryImpl(
  new SceneFactoryImpl(),
  new CameraFactoryImpl(),
  new THREE.WebGLRenderer({ antialias: true }),
  io("http://localhost:3000")
).create();

gameManager.init();
gameManager.enableDebugUI();
// リサイズ処理
window.addEventListener("resize", () => {
  gameManager.onResize(window.innerWidth, window.innerHeight);
});
// ゲーム終了時のクリーンアップ
window.addEventListener("beforeunload", () => {
  gameManager.dispose();
});

// 入力ハンドラーの初期化
const inputHandler = new InputHandler()
  .onMove(gameManager.handlePlayerMove)
  .onViewChange(gameManager.handlePlayerViewChange)
  .onShoot(gameManager.handlePlayerShoot);

// フレーム時間
let previousTime = 0;

// ゲームループ
function animate(currentTime: number) {
  requestAnimationFrame(animate);

  // デルタタイム計算（秒単位）
  const deltaTime = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  inputHandler.sync(deltaTime);

  // ゲームロジック更新
  gameManager.update(deltaTime);
}

animate(0);
