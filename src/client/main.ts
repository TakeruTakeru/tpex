import * as THREE from "three";
import { InputHandler } from "./app/InputHandler";
import io from "socket.io-client";
import {
  CameraFactoryImpl,
  GameMangerFactoryImpl,
  SceneFactoryImpl,
} from "./app/factory";
import { loadBeforeGameStart } from "./app/ModelLoader";

main();

async function main() {
  await loadBeforeGameStart();

  // ゲームマネージャーの初期化
  const gameManager = new GameMangerFactoryImpl(
    new SceneFactoryImpl(),
    new CameraFactoryImpl(),
    new InputHandler(),
    new THREE.WebGLRenderer({ antialias: true }),
    io("http://localhost:3000")
  ).create();

  gameManager.init();
  gameManager.enableDebugUI();

  window.addEventListener("resize", () => {
    gameManager.onResize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener("beforeunload", () => {
    gameManager.dispose();
  });

  gameManager.animate(0);
}
