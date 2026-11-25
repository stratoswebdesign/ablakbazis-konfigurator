import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { insideViewTexture, outsideViewTexture } from './textures';

/**
 * Az üveg mögötti, elmosott „kilátás” (mm-ben, a falmetszet koordinátáiban). Csak az üvegen át
 * látszik: a falmetszet takarja, és szélső kameraszögnél elrejtjük, hogy ne lógjon ki.
 */
export function Backdrops({ W, H, boxH, sill }: { W: number; H: number; boxH: number; sill: number }) {
  const outRef = useRef<THREE.Mesh>(null!);
  const inRef = useRef<THREE.Mesh>(null!);
  const camera = useThree((s) => s.camera);
  const v = useMemo(() => new THREE.Vector3(), []);
  const mOut = useMemo(() => new THREE.MeshBasicMaterial({ map: outsideViewTexture(), toneMapped: false }), []);
  const mIn = useMemo(() => new THREE.MeshBasicMaterial({ map: insideViewTexture(), toneMapped: false }), []);
  const w = W + 360;
  const h = H + boxH + 360;
  const cy = Math.max(sill + (H + boxH) / 2, h / 2);
  useFrame(() => {
    v.copy(camera.position);
    const theta = Math.atan2(v.x, v.z);
    outRef.current.visible = Math.abs(theta) < 1.05;
    inRef.current.visible = Math.abs(theta) > Math.PI - 1.05;
  });
  return (
    <>
      <mesh ref={outRef} position={[0, cy, -360]} material={mOut}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh ref={inRef} position={[0, cy, 360]} rotation-y={Math.PI} material={mIn}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </>
  );
}
