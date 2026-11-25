import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { BrandConfig, ViewSide } from '../config/types';
import { layoutUnit } from '../configurator/layout';
import { productOf, systemOf, type Action, type State } from '../configurator/state';
import { Dimensions } from './Dimensions';
import { useDamped, useFrameMaterials, useHandleMaterial } from './parts';
import { Screen, Shutter } from './Shading';
import { Backdrops } from './Backdrops';
import { Wall, wallGeom } from './Wall';
import { WindowUnit } from './WindowUnit';

declare global {
  interface Window {
    __sceneReady?: boolean;
  }
}

const isSmall = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches;

export default function Viewer({ state, brand, dispatch }: { state: State; brand: BrandConfig; dispatch: React.Dispatch<Action> }) {
  const small = useMemo(isSmall, []);
  return (
    <Canvas
      className="viewer-canvas"
      shadows="percentage"
      dpr={[1, small ? 1.75 : 2]}
      frameloop="demand"
      camera={{ fov: 28, near: 0.05, far: 80, position: [1.2, 1.7, 5.2] }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
      aria-hidden
    >
      <color attach="background" args={[brand.tokens.scene.background]} />
      <Scene state={state} brand={brand} dispatch={dispatch} small={small} />
    </Canvas>
  );
}

function Scene({ state, brand, dispatch, small }: { state: State; brand: BrandConfig; dispatch: React.Dispatch<Action>; small: boolean }) {
  const product = productOf(brand, state.productId);
  const tokens = brand.tokens.scene;
  const W = useDamped(state.width);
  const H = useDamped(state.height);
  const shutterDef = brand.shutters.find((x) => x.id === state.shutterType);
  // csak a ráépíthető redőny tokja ül a nyílásban (növeli a nyílást); a többi a homlokzatban/előtte
  const boxH = useDamped(state.shutterType === 'raepitheto' ? (shutterDef?.box ?? 210) : 0, 8, 0.5);
  const p = useDamped(state.shutterType !== 'none' ? state.shutterPos : 0, 3.2, 0.002);
  const sill = product.kind === 'window' || product.kind === 'sill' ? 900 : 0;
  const depth = systemOf(product, state.systemId)?.depth;
  const L = useMemo(() => layoutUnit(product, W, H, state.fields, false, state.panelId, depth), [product, W, H, state.fields, state.panelId, depth]);
  const sills = useMemo(
    () => ({
      inner: product.sills ? (brand.sills.inner.find((c) => c.id === state.sillIn) ?? null) : null,
      innerDepth: state.sillInDepth,
      outer: product.sills ? (brand.sills.outer.find((c) => c.id === state.sillOut) ?? null) : null,
      outerDepth: state.sillOutDepth,
    }),
    [product, brand, state.sillIn, state.sillOut, state.sillInDepth, state.sillOutDepth],
  );
  const mats = useFrameMaterials(brand, state.colorId, state.colorOutsideOnly);
  const handle = brand.handles.find((h) => h.id === state.handleId) ?? brand.handles[0];
  const handleMat = useHandleMaterial(handle);
  const g = wallGeom(W, H, boxH, sill);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    window.__snapshot = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/jpeg', 0.9);
    };
    return () => {
      delete window.__snapshot;
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.__sceneReady = true;
      invalidate();
    }, 900);
    return () => window.clearTimeout(id);
  }, [invalidate]);

  // a kivágás a falmetszet-maketthez igazodik (+ hely a méretvonalaknak)
  const cy = ((g.Ybot + g.Ytop) / 2 + 60) / 1000;
  const fitW = (2 * g.X + 260) / 1000;
  const fitH = (g.Ytop - g.Ybot + 420) / 1000;

  return (
    <>
      <Sun target={[0, cy, 0]} intensity={tokens.sunIntensity} color={tokens.sun} small={small} />
      {/* derítés a néző oldaláról (árnyék nélkül), hogy a belső vakolat ne szürküljön be */}
      <directionalLight position={[1.6, cy + 2.4, 5]} intensity={1.25} color="#ffffff" />
      <directionalLight position={[-2.2, cy + 1.2, -4]} intensity={0.35} color="#ffffff" />
      <hemisphereLight args={['#ffffff', '#d8d3ca', 0.55]} />
      <Environment frames={1} resolution={256} environmentIntensity={tokens.envIntensity}>
        {/* a belső „szoba” fénye: ez tükröződik belülről az üvegen */}
        <Lightformer form="rect" intensity={1.6} color={tokens.roomLight} position={[0, 2.2, 5]} scale={[5, 2.6, 1]} />
        {/* kinti égbolt */}
        <Lightformer form="rect" intensity={1.25} color="#f4f7fb" position={[0, 3, -6]} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#ffffff" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        {/* függőleges csíkfények: élfények a profilon */}
        <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[-4, 1.6, 1.5]} rotation-y={Math.PI / 2} scale={[0.6, 5, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#ffffff" position={[4, 1.6, 1.5]} rotation-y={-Math.PI / 2} scale={[0.6, 5, 1]} />
        <Lightformer form="rect" intensity={0.3} color="#d9cbb6" position={[0, -1.5, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
        {/* tükröződő „ablakfény” – ez rajzol fényfoltot az üvegre a 3/4 nézetből */}
        <Lightformer form="rect" intensity={7} color="#ffffff" position={[-2.3, -0.4, 3.6]} target={[0, 0, 0]} scale={[1.1, 3.2, 1]} />
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[-1.2, -0.4, 4.1]} target={[0, 0, 0]} scale={[0.35, 3.2, 1]} />
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[-2.3, -0.4, -3.6]} target={[0, 0, 0]} scale={[1.1, 3.2, 1]} />
      </Environment>

      <group scale={0.001}>
        <Wall W={W} H={H} boxH={boxH} sill={sill} frameDepth={L.P.frameDepth} tokens={tokens} sills={sills} />
        <Backdrops W={W} H={H} boxH={boxH} sill={sill} />
        <group position={[-W / 2, sill, 0]}>
          <WindowUnit
            product={product}
            L={L}
            mats={mats}
            handleMat={handleMat}
            view={state.view}
            symbols={state.showSymbols && product.kind !== 'sill' && state.step !== 'parkany'}
            symbolColor={tokens.symbol}
            demo={state.demo}
            demoField={state.selectedField}
            screen={product.shading && state.screen}
          />
          {product.shading && <Shutter L={L} type={state.shutterType} box={state.shutterType === 'raepitheto' ? boxH : (shutterDef?.box ?? 165)} p={p} mats={mats} />}
          {product.shading && state.screen && <Screen L={L} mats={mats} />}
        </group>
        {state.showDims && (
          <Dimensions
            W={W}
            H={H}
            boxH={boxH}
            sill={sill}
            view={state.view}
            color={tokens.dimension}
            hideHeight={product.kind === 'sill' || state.step === 'parkany'}
            sillDims={
              state.step === 'parkany'
                ? { inDepth: sills.inner ? state.sillInDepth : null, outDepth: sills.outer ? state.sillOutDepth : null, frameDepth: L.P.frameDepth }
                : undefined
            }
          />
        )}
      </group>

      <mesh rotation-x={-Math.PI / 2} position-y={g.Ybot / 1000 - 0.0005} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.1} color="#1b1f22" />
      </mesh>

      <CameraRig
        cy={cy}
        fitW={fitW}
        fitH={fitH}
        view={state.view}
        focusY={state.step === 'parkany' ? sill / 1000 : null}
        onSide={(v) => v !== state.view && dispatch({ type: 'view', value: v })}
      />
    </>
  );
}

function Sun({ target, intensity, color, small }: { target: [number, number, number]; intensity: number; color: string; small: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null!);
  const tgt = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    tgt.position.set(...target);
    tgt.updateMatrixWorld();
    light.current.target = tgt;
  }, [target, tgt]);
  return (
    <>
      <primitive object={tgt} />
      <directionalLight
        ref={light}
        position={[target[0] + 2.2, target[1] + 5.2, target[2] - 3.2]}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize={[small ? 1024 : 2048, small ? 1024 : 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.012}
        shadow-radius={4}
      >
        <orthographicCamera attach="shadow-camera" args={[-2.8, 2.8, 2.8, -2.8, 0.5, 14]} />
      </directionalLight>
    </>
  );
}

const THETA = { inside: 0.5, outside: Math.PI - 0.5 } as const;

/** Renderekhez: kamera felülírása URL-ből (zoom, theta, phi, tx/ty mm-ben). */
const CAM = (() => {
  if (typeof window === 'undefined') return {};
  const q = new URLSearchParams(window.location.search);
  const n = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
  return { zoom: n('zoom'), theta: n('theta'), phi: n('phi'), tx: n('tx'), ty: n('ty') };
})();

/** Kamera: automatikus kivágás a valós mérethez, animált nézetváltás, a felhasználó felülírhatja. */
function CameraRig({ cy, fitW, fitH, view, focusY, onSide }: { cy: number; fitW: number; fitH: number; view: ViewSide; focusY: number | null; onSide: (v: ViewSide) => void }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<OrbitControlsImpl>(null!);
  const anim = useRef({ theta: true, radius: true, first: true });
  const tgt = useMemo(() => new THREE.Vector3(0, cy, 0), []); // eslint-disable-line react-hooks/exhaustive-deps
  const sph = useMemo(() => new THREE.Spherical(), []);
  const off = useMemo(() => new THREE.Vector3(), []);
  const onSideRef = useRef(onSide);
  onSideRef.current = onSide;

  const aspect = size.width / Math.max(1, size.height);
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  // párkány-lépésnél ráközelítünk a párkányra, és kicsit felülről nézünk rá
  const sillFocus = focusY !== null;
  const dist = Math.max(fitH / 2 / tan, fitW / 2 / (tan * aspect)) * 1.2 * (CAM.zoom ?? (sillFocus ? 0.62 : 1));
  const tx = (CAM.tx ?? 0) / 1000;
  const cyT = sillFocus ? focusY + 0.05 : cy + (CAM.ty ?? 0) / 1000;
  const phiT = CAM.phi ?? (sillFocus ? 1.12 : 1.36);

  useEffect(() => {
    anim.current.radius = true;
    invalidate();
  }, [dist, cyT, invalidate]);
  useEffect(() => {
    anim.current.theta = true;
    invalidate();
  }, [view, sillFocus, invalidate]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const start = () => {
      anim.current.theta = false;
      anim.current.radius = false;
    };
    const end = () => {
      off.copy(camera.position).sub(c.target);
      sph.setFromVector3(off);
      onSideRef.current(Math.abs(sph.theta) > Math.PI / 2 ? 'outside' : 'inside');
    };
    c.addEventListener('start', start);
    c.addEventListener('end', end);
    return () => {
      c.removeEventListener('start', start);
      c.removeEventListener('end', end);
    };
  }, [camera, off, sph]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.minDistance = dist * 0.5;
    c.maxDistance = dist * 1.7;
  }, [dist]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    const k = anim.current.first ? 1 : 1 - Math.exp(-4.2 * Math.min(dt, 1 / 30));
    const ty = cyT;
    const movingT = Math.abs(c.target.y - ty) > 0.0005 || Math.abs(c.target.x - tx) > 0.0005;
    if (!anim.current.theta && !anim.current.radius && !movingT) return;
    off.copy(camera.position).sub(c.target);
    sph.setFromVector3(off);
    if (anim.current.theta || anim.current.first) {
      const tt = CAM.theta ?? THETA[view];
      sph.theta += (tt - sph.theta) * k;
      sph.phi += (phiT - sph.phi) * k;
      if (Math.abs(tt - sph.theta) < 0.002 && Math.abs(phiT - sph.phi) < 0.002) anim.current.theta = false;
    }
    if (anim.current.radius || anim.current.first) {
      sph.radius += (dist - sph.radius) * k;
      if (Math.abs(dist - sph.radius) < 0.002) anim.current.radius = false;
    }
    tgt.set(c.target.x + (tx - c.target.x) * k, c.target.y + (ty - c.target.y) * k, 0);
    c.target.copy(tgt);
    camera.position.copy(tgt).add(off.setFromSpherical(sph));
    c.update();
    anim.current.first = false;
    invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.09}
      rotateSpeed={0.6}
      zoomSpeed={0.6}
      minPolarAngle={0.95}
      maxPolarAngle={1.75}
    />
  );
}
