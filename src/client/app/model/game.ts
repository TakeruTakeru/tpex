import { Model } from "./object";
import * as THREE from "three";
import { Player } from "./player";
import { Bullet } from "./bullet";
import { Enemy } from "./enemy";
import { UI } from "./UI";
import { DebugUIFactoryImpl } from "../factory";
import Stats from "stats.js";
import {
  SocketBroadCastInitializeEvent,
  SocketBroadCastPlayerConnectEvent,
  SocketBroadCastPlayerMoveEvent,
} from "../../../server/event";
import { Position, Rotation } from "../../../server/object";

export class GameManager extends Model {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private socket: SocketIOClient.Socket;
  private stats: Stats;

  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private players: Map<string, Player> = new Map();
  private score: number = 0;
  private ui: UI;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    socket: SocketIOClient.Socket
  ) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.ui = new UI(() => this.handlePlayerShoot());
    this.renderer = renderer;
    this.socket = socket;
    // パフォーマンスモニター
    this.stats = new Stats();

    this.spawnEnemies(5);
  }

  init = () => {
    // レンダラー設定
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);

    // サーバーからの初期データ受信
    this.socket.on("init", (data: SocketBroadCastInitializeEvent) => {
      console.log("Initial game state received:", data);
      this.initializePlayers(data.players);
    });

    // 他のプレイヤーの接続処理
    this.socket.on(
      "player-connected",
      ({ player }: SocketBroadCastPlayerConnectEvent) => {
        console.log("Player connected:", player);
        this.addPlayer(
          player.id,
          position2vector(player.position),
          rotation2Euler(player.rotation)
        );
      }
    );

    // 他のプレイヤーの移動処理
    this.socket.on("player-moved", (data: SocketBroadCastPlayerMoveEvent) => {
      this.updatePlayerPosition(
        data.id,
        position2vector(data.position),
        rotation2Euler(data.rotation)
      );
    });

    // 他のプレイヤーの射撃処理
    this.socket.on("player-shot", (data: any) => {
      this.handlePlayerShot(data.id, data);
    });

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
  handlePlayerMove = (
    movements: Record<Movement, boolean>,
    deltaTime: number
  ) => {
    // 移動速度
    const speed = 5 * deltaTime;

    if (movements.forward) {
      this.camera.position.x -= Math.sin(this.camera.rotation.y) * speed;
      this.camera.position.z -= Math.cos(this.camera.rotation.y) * speed;
    }

    if (movements.backward) {
      this.camera.position.x += Math.sin(this.camera.rotation.y) * speed;
      this.camera.position.z += Math.cos(this.camera.rotation.y) * speed;
    }

    if (movements.left) {
      this.camera.position.x -= Math.cos(this.camera.rotation.y) * speed;
      this.camera.position.z += Math.sin(this.camera.rotation.y) * speed;
    }

    if (movements.right) {
      this.camera.position.x += Math.cos(this.camera.rotation.y) * speed;
      this.camera.position.z -= Math.sin(this.camera.rotation.y) * speed;
    }

    if (movements.jump) {
      // ジャンプ処理を実装
    }
  };

  // 操作しているプレイヤーのカメラが動く
  handlePlayerViewChange = (movementX: number, movementY: number) => {
    const sensitivity = 0.005;
    this.camera.rotation.y -= movementX * sensitivity;
    this.camera.rotation.x -= movementY * sensitivity;
    this.camera.rotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, this.camera.rotation.x)
    );
  };

  handlePlayerShoot = () => {
    const direction = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.camera.quaternion)
      .normalize();
    const bullet = new Bullet(this.scene, this.camera.position, direction);
    this.bullets.push(bullet);
  };

  updatePlayerPosition = (
    id: string,
    position: THREE.Vector3,
    rotation: THREE.Euler
  ) => {
    const player = this.players.get(id);
    if (player) {
      player.update(position, rotation);
    }
  };

  handlePlayerShot = (id: string, shotData: any) => {
    const player = this.players.get(id);
    if (player) {
      // 射撃エフェクトなどの処理をここに追加
    }
  };

  removePlayer = (id: string) => {
    const player = this.players.get(id);
    if (player) {
      player.destroy(this.scene);
      this.players.delete(id);
    }
  };

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      const enemy = new Enemy(this.scene, this.camera.position);
      this.enemies.push(enemy);
    }
  }

  dispose = () => {
    this.renderer.dispose();
    this.ui.dispose();
  };

  getCurrentPlayer = (): Player | null => {
    // 最初に見つかったプレイヤーを返す（シングルプレイヤーの場合）
    for (const player of this.players.values()) {
      return player;
    }
    return null;
  };

  update = (deltaTime: number) => {
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

    // 敵の更新
    this.enemies.forEach((enemy) => {
      enemy.update(deltaTime, this.camera.position);
    });

    // 弾丸の更新
    this.bullets = this.bullets.filter((bullet) => {
      const alive = bullet.update(deltaTime);
      if (!alive) {
        bullet.destroy(this.scene);
      }
      return alive;
    });

    // 当たり判定
    this.bullets.forEach((bullet) => {
      this.enemies.forEach((enemy) => {
        if (bullet.position.distanceTo(enemy.position) < 1) {
          if (enemy.takeDamage(100)) {
            this.score += 100;
            this.ui.updateScore(this.score);
          }
          bullet.destroy(this.scene);
        }
      });
    });

    // 生きている敵のみ保持
    this.enemies = this.enemies.filter((enemy) => enemy.position.y > -1);

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
}

export type Movement = "forward" | "backward" | "left" | "right" | "jump";

const position2vector = (position: Position) => {
  return new THREE.Vector3(position.x, position.y, position.z);
};

const rotation2Euler = (rotation: Rotation) => {
  return new THREE.Euler(rotation.x, rotation.y, rotation.z, rotation.order);
};
