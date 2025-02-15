import * as THREE from "three";
import { Player, PlayerMoveMents } from "./Player";
import Stats from "stats.js";
import { UI } from "./UI";
import { InputHandler } from "./InputHandler";
import { User } from "./User";
import { Bullet } from "./Bullet";
import { DebugUIFactoryImpl } from "./factory";
import {
  SerializedPosition,
  SerializedRotation,
  EmitInitializeEvent,
  EmitPlayerConnectEvent,
  EmitPlayerMoveEvent,
  EmitPlayerShootEvent,
  onPlayerShootEvent,
  SerializedPlayer,
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
      this.user = new User(this.camera, playerId);
      this.scene.add(this.user.getObject3D());
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
      const player = this.players.get(data.user.id);
      if (player) {
        player.update(
          toVector(data.user.position),
          toEuler(data.user.rotation)
        );
      }
    });

    // 他のプレイヤーの射撃処理
    this.socket.on(
      "player-shot",
      ({
        playerId,
        bullet: { origin, direction, speed, basicDamage },
      }: EmitPlayerShootEvent) => {
        const shotPlayer = this.getPlayer(playerId);
        if (shotPlayer === undefined) {
          return;
        }
        const bullet = new Bullet(
          toVector(origin),
          toVector(direction),
          speed,
          basicDamage
        );
        shotPlayer.shot(bullet);
        this.scene.add(bullet.getObject3D());
        this.bullets.push(bullet);
      }
    );

    // プレイヤーの切断処理
    this.socket.on("player-disconnected", (playerId: string) => {
      this.removePlayer(playerId);
    });
  };

  // マルチプレイヤー用メソッド
  initializePlayers = (playersData: SerializedPlayer[]) => {
    playersData.forEach(({ id, position, rotation }) => {
      const positionVector = new THREE.Vector3(
        position.x,
        position.y,
        position.z
      );
      const rotationEuler = new THREE.Euler(rotation.x, rotation.y, rotation.z);
      this.addPlayer(id, positionVector, rotationEuler);
    });
  };

  addPlayer = (id: string, position: THREE.Vector3, rotation: THREE.Euler) => {
    const player = new Player(id, position, rotation);
    this.scene.add(player.getObject3D());
    this.players.set(id, player);
  };

  getPlayer = (id: string) => {
    return this.players.get(id);
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
    const bullet = this.user.shoot();
    this.scene.add(bullet.getObject3D());
    this.bullets.push(bullet);
    const data: onPlayerShootEvent = {
      bullet: bullet.toJSON(),
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

      // 境界判定
      if (!boundary.containsPoint(vector)) {
        object.onHit({ type: "boundary", debugInfo: boundary });
        return;
      }

      // ユーザーはどこでも移動可能
      if (object instanceof Player || object instanceof User) {
        object.move(vector);
        return;
      }

      // 銃弾の衝突判定
      if (object instanceof Bullet) {
        const bullet = object;
        const players = [this.user!, ...this.players.values()]
          .filter((p) => !p.isOwn(bullet))
          .map((p) => p.getObject3D());
        const raycaster = new THREE.Raycaster();
        const position = bullet.getPosition();
        raycaster.set(position, vector);
        const intersects = raycaster.intersectObjects(players);
        if (intersects.length === 0) {
          bullet.move(vector);
        } else {
          intersects
            .map((e) => e.object.userData)
            .find((userData) => userData.playerId !== this.playerId);
          if (intersects.length > 0) {
            bullet.onHit({
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
    this.socket.emit("player-move", { user: this.user!.toJSON() });

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

  private getMoveable = () => {
    return [this.user!, ...this.players.values(), ...this.bullets] as const;
  };
}

const toVector = (position: SerializedPosition) => {
  return new THREE.Vector3(position.x, position.y, position.z);
};

const toEuler = (rotation: SerializedRotation) => {
  return new THREE.Euler(rotation.x, rotation.y, rotation.z, "XYZ");
};

const boundary = new THREE.Box3(
  toVector(CONFIG.boundary.min),
  toVector(CONFIG.boundary.max)
);
