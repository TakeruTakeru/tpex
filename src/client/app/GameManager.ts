import * as THREE from "three";
import { Player, PlayerMoveMents } from "./Player";
import Stats from "stats.js";
import { UI } from "./UI";
import { InputHandler } from "./InputHandler";
import { User } from "./User";
import { Moveable } from "./Moveable";
import { Bullet } from "./Bullet";
import { DebugUIFactoryImpl } from "./factory";
import {
  Position,
  Rotation,
  EmitInitializeEvent,
  EmitPlayerConnectEvent,
  EmitPlayerMoveEvent,
  EmitPlayerShootEvent,
  onPlayerShootEvent,
} from "../../types";
import { CONFIG, getClampedPosition } from "../../boundary";

export class GameManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private input: InputHandler;
  private renderer: THREE.WebGLRenderer;
  private socket: SocketIOClient.Socket;
  private stats: Stats;
  private previousTime: number = 0;

  private playerId: string | undefined;
  private user: User | undefined;
  private bullets: Bullet[] = [];
  private players: Map<string, Player> = new Map();

  private ui: UI;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    input: InputHandler,
    renderer: THREE.WebGLRenderer,
    socket: SocketIOClient.Socket
  ) {
    this.scene = scene;
    this.camera = camera;
    this.input = input;
    this.ui = new UI(() => this.handlePlayerShoot());
    this.renderer = renderer;
    this.socket = socket;
    // パフォーマンスモニター
    this.stats = new Stats();
  }

  init = () => {
    // レンダラー設定
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);

    // サーバーからの初期データ受信
    this.socket.on("init", (data: EmitInitializeEvent) => {
      const playerId = data.player.id;
      this.playerId = playerId;
      const target =
        data.players.filter((p) => p.id !== data.player.id)[0]?.position ||
        toVector(getClampedPosition({ x: 0, y: 0, z: 0 }));
      const playerPos = toVector(data.player.position);
      const targetPos = toVector(target);
      this.user = new User(this.scene, this.camera, playerId);
      this.user.setInitialPositionAndRotation(playerPos, targetPos);

      this.initializePlayers(
        data.players.filter((p) => p.id !== data.player.id)
      );

      this.input
        .onMove(this.handlePlayerMove)
        .onViewChange(this.handlePlayerViewChange)
        .onShoot(this.handlePlayerShoot);
    });

    // 他のプレイヤーの接続処理
    this.socket.on("player-connected", ({ player }: EmitPlayerConnectEvent) => {
      console.log("Player connected:", player);
      this.addPlayer(
        player.id,
        toVector(player.position),
        toEuler(player.rotation)
      );
    });

    // 他のプレイヤーの移動処理
    this.socket.on("player-moved", (data: EmitPlayerMoveEvent) => {
      const player = this.players.get(data.id);
      if (player) {
        player.update(toVector(data.position), toEuler(data.rotation));
      }
    });

    // 他のプレイヤーの射撃処理
    this.socket.on(
      "player-shot",
      ({ origin, direction, speed }: EmitPlayerShootEvent) => {
        const bullet = new Bullet(toVector(origin), toVector(direction), speed);
        this.scene.add(bullet.mesh);
        this.bullets.push(bullet);
      }
    );

    // プレイヤーの切断処理
    this.socket.on("player-disconnected", (playerId: string) => {
      this.removePlayer(playerId);
    });
  };

  // マルチプレイヤー用メソッド
  initializePlayers = (playersData: any[]) => {
    playersData.forEach((playerData) => {
      const position = new THREE.Vector3(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z
      );
      const rotation = new THREE.Euler(
        playerData.rotation.x,
        playerData.rotation.y,
        playerData.rotation.z
      );
      this.addPlayer(playerData.id, position, rotation);
    });
  };

  addPlayer = (id: string, position: THREE.Vector3, rotation: THREE.Euler) => {
    const player = new Player(this.scene, id, position, rotation);
    this.players.set(id, player);
  };

  // 操作しているプレイヤーが動く
  handlePlayerMove = (movements: PlayerMoveMents, deltaTime: number) => {
    this.user?.handlePlayerMove(movements, deltaTime);
  };

  // 操作しているプレイヤーのカメラが動く
  handlePlayerViewChange = (movementX: number, movementY: number) => {
    this.user?.handleMouseMove(movementX, movementY);
  };

  handlePlayerShoot = () => {
    if (this.user === undefined) {
      return;
    }
    const [bullet, origin, direction, speed] = this.user.shoot();
    this.scene.add(bullet.mesh);
    this.bullets.push(bullet);
    const data: onPlayerShootEvent = {
      origin,
      direction,
      speed,
    };
    this.socket.emit("player-shot", data);
  };

  removePlayer = (id: string) => {
    const player = this.players.get(id);
    if (player) {
      player.destroy(this.scene);
      this.players.delete(id);
    }
  };

  dispose = () => {
    this.renderer.dispose();
    this.ui.dispose();
  };

  animate = (currentTime: number) => {
    requestAnimationFrame((time) => this.animate(time));
    const user = this.user;
    if (user === undefined) {
      return;
    }

    const deltaTime = (currentTime - this.previousTime) / 1000;
    this.previousTime = currentTime;

    this.input.sync(deltaTime);

    const objects = this.getMoveable();
    objects.forEach((object) => {
      const vector = object.getNextVector();
      if (!boundary.containsPoint(vector)) {
        object.onHit({ type: "boundary", boundary });
        return;
      }
      if (object instanceof Player || object instanceof User) {
        object.move(vector);
      }

      // 銃弾の衝突判定
      if (object instanceof Bullet) {
        const playerObjects = [
          ...[...this.players.values()].map((p) => p.model),
          user.hitBox,
        ];
        const raycaster = new THREE.Raycaster();
        const position = object.getPosition();
        raycaster.set(position, vector);
        const intersects = raycaster.intersectObjects(playerObjects, false);
        if (intersects.length === 0) {
          object.move(vector);
        } else {
          intersects
            .map((e) => e.object.userData)
            .find((userData) => userData.playerId !== this.playerId);
          if (intersects.length > 0) {
            object.onHit({
              type: "intersects",

              debugInfo: {
                name: intersects.map((e) => e.object.name).join("-"),
                intersects,
              },
            });
          }
        }
      }
    });

    // 操作しているプレイヤーの位置をサーバーに送信
    this.socket.emit("player-move", {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      rotation: {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y,
        z: this.camera.rotation.z,
      },
    });

    // 弾丸の更新
    this.bullets = this.bullets.filter((bullet) => {
      const alive = bullet.update(deltaTime);
      if (!alive) {
        bullet.destroy(this.scene);
      }
      return alive;
    });

    // レンダリング
    this.renderer.render(this.scene, this.camera);
    // パフォーマンスモニター更新
    this.stats.update();
  };

  onResize = (width: number, height: number) => {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  enableDebugUI = () => {
    new DebugUIFactoryImpl(this.camera).create();
  };

  private getMoveable = (): Moveable[] => {
    return [this.user!, ...this.players.values(), ...this.bullets];
  };
}

const toVector = (position: Position) => {
  return new THREE.Vector3(position.x, position.y, position.z);
};

const toEuler = (rotation: Rotation) => {
  return new THREE.Euler(rotation.x, rotation.y, rotation.z, "XYZ");
};

const boundary = new THREE.Box3(
  toVector(CONFIG.boundary.min),
  toVector(CONFIG.boundary.max)
);
