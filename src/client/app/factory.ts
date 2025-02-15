import * as THREE from "three";
import { GUI } from "dat.gui";
import { InputHandler } from "./InputHandler";
import { GameManager } from "./GameManager";
import { CONFIG, getBoundarySize } from "../../boundary";

export class GameMangerFactoryImpl {
  constructor(
    sceneFactoryImpl: SceneFactoryImpl,
    cameraFactoryImpl: CameraFactoryImpl,
    input: InputHandler,
    renderer: THREE.WebGLRenderer,
    socket: SocketIOClient.Socket
  ) {
    this.sceneFactoryImpl = sceneFactoryImpl;
    this.cameraFactoryImpl = cameraFactoryImpl;
    this.input = input;
    this.renderer = renderer;
    this.socket = socket;
  }

  private sceneFactoryImpl: SceneFactoryImpl;
  private cameraFactoryImpl: CameraFactoryImpl;
  private input: InputHandler;
  private renderer: THREE.WebGLRenderer;
  private socket: SocketIOClient.Socket;

  public create() {
    const scene = this.sceneFactoryImpl.create();
    const camera = this.cameraFactoryImpl.create();
    return new GameManager(
      scene,
      camera,
      this.input,
      this.renderer,
      this.socket
    );
  }
}

export class SceneFactoryImpl {
  public create() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ba5d3);

    // ライト設定
    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.name = "ambientLight";
    ambientLight.userData = { id: "ambientLight" };
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const floorGeometry = new THREE.PlaneGeometry(...getBoundarySize());
    floorGeometry.name = "floor";
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.userData = { id: "floor" };
    floor.rotation.x = -Math.PI / 2; // 床を垂直→水平に
    scene.add(floor);

    return scene;
  }
}

export class CameraFactoryImpl {
  public create() {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.fov = 104;
    return camera;
  }
}

export class DebugUIFactoryImpl {
  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  private camera: THREE.Camera;

  public create() {
    const gui = new GUI();
    const cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(this.camera.position, "x", -10, 10);
    cameraFolder.add(this.camera.position, "y", 0, 10);
    cameraFolder.add(this.camera.position, "z", -10, 10);
    cameraFolder.open();
    return gui;
  }
}
