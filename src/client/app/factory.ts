import * as THREE from "three";
import { GUI } from "dat.gui";
import { GameManager } from "./model/game";

export class GameMangerFactoryImpl {
  constructor(
    sceneFactoryImpl: SceneFactoryImpl,
    cameraFactoryImpl: CameraFactoryImpl,
    renderer: THREE.WebGLRenderer,
    socket: SocketIOClient.Socket
  ) {
    this.sceneFactoryImpl = sceneFactoryImpl;
    this.cameraFactoryImpl = cameraFactoryImpl;
    this.renderer = renderer;
    this.socket = socket;
  }

  private sceneFactoryImpl: SceneFactoryImpl;
  private cameraFactoryImpl: CameraFactoryImpl;
  private renderer: THREE.WebGLRenderer;
  private socket: SocketIOClient.Socket;

  public create() {
    const scene = this.sceneFactoryImpl.create();
    const camera = this.cameraFactoryImpl.create();
    return new GameManager(scene, camera, this.renderer, this.socket);
  }
}

export class SceneFactoryImpl {
  public create() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ba5d3);

    // ライト設定
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
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
    camera.position.set(0, 1.6, 5);
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
