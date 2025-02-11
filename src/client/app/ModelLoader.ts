import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const models = {
  dog: "http://localhost:3000/3d/rainbow",
  gun: "http://localhost:3000/3d/gun",
} as const;

const modelCache = new Map<keyof typeof models, THREE.Group>();

export function getModel(key: keyof typeof models) {
  return modelCache.get(key)!.clone();
}

export async function loadBeforeGameStart() {
  await Promise.all([load("dog"), load("gun")]).then(([dog, gun]) => {
    const dogModel = dog.scene;
    dogModel.name = "dog";
    const gunModel = gun.scene;
    gunModel.name = "gun";
    modelCache.set("dog", dogModel);
    modelCache.set("gun", gunModel);
  });
}

async function load(key: keyof typeof models) {
  const loader = new GLTFLoader();
  return await loader.loadAsync(models[key]);
}
