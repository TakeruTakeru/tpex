import { SerializedPosition } from "./types";

export const CONFIG = {
  boundary: {
    min: { x: -10, y: 0, z: -10 },
    max: { x: 10, y: 50, z: 10 },
  },
} as const;

export const getBoundarySize = (): [x: number, z: number] => {
  return [
    CONFIG.boundary.max.x - CONFIG.boundary.min.x,
    CONFIG.boundary.max.z - CONFIG.boundary.min.z,
  ];
};

export const getBoundaryCenter = (): [x: number, z: number] => {
  return [
    (CONFIG.boundary.max.x + CONFIG.boundary.min.x) / 2,
    (CONFIG.boundary.max.z + CONFIG.boundary.min.z) / 2,
  ];
};

// 位置を範囲内に調整する
export const getClampedPosition = (
  position: SerializedPosition
): SerializedPosition => {
  return {
    x: Math.max(
      CONFIG.boundary.min.x,
      Math.min(CONFIG.boundary.max.x, position.x)
    ),
    y: Math.max(
      CONFIG.boundary.min.y,
      Math.min(CONFIG.boundary.max.y, position.y)
    ),
    z: Math.max(
      CONFIG.boundary.min.z,
      Math.min(CONFIG.boundary.max.z, position.z)
    ),
  };
};
