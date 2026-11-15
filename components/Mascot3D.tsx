'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Text, useGLTF, useTexture } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Euler, Group, Mesh, Object3D } from 'three';
import { useTutorStore, type TutorMood } from '@/lib/store';
import React from 'react';

function useLook(ref: { current: Group | null }, mood: TutorMood) {
  useFrame(({ pointer, clock }) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += (pointer.x * .27 - g.rotation.y) * .055;
    g.rotation.x += (-pointer.y * .12 - g.rotation.x) * .055;
    g.position.y = Math.sin(clock.elapsedTime * 1.5) * .045;
    if (mood === 'encouraging') g.rotation.z = Math.sin(clock.elapsedTime * 1.1) * .035;
    else g.rotation.z += (0 - g.rotation.z) * .06;
  });
}

function CharacterModel({ compact }: { compact: boolean }) {
  const gltf = useGLTF('/models/alan.glb');
  const group = useRef<Group>(null);
  const mood = useTutorStore(s => s.mood);
  useLook(group, mood);
  // قەبارەی مۆدێلەکە بۆ دۆخی چاتەکە بچووکتر کراوەتەوە تا جوان جێی ببێتەوە
  const scale = compact ? 0.95 : 1.35;
  const positionY = compact ? -0.3 : -0.45;
  
  return (
    <group ref={group} scale={scale} position={[0, positionY, 0]}>
      <primitive object={gltf.scene.clone()} />
      {mood === 'happy' && <Sparkles count={70} scale={3.3} size={4} speed={1.2} color="#ffd166" />}
    </group>
  );
}

function ImageCharacter({ compact }: { compact: boolean }) {
  const tex = useTexture('/images/alan.png');
  const group = useRef<Group>(null);
  const mood = useTutorStore(s => s.mood);
  useLook(group, mood);
  useFrame(({ pointer, clock }) => {
    if (group.current) {
      group.current.rotation.y += (pointer.x * .18 - group.current.rotation.y) * .04;
      group.current.rotation.x += (-pointer.y * .09 - group.current.rotation.x) * .04;
      group.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.7) * .012;
    }
  });
  
  const scale = compact ? 0.75 : 1;
  const positionY = compact ? -0.1 : -0.2;

  return (
    <group ref={group} scale={scale} position={[0, positionY, 0]}>
      <mesh position={[0, 0, -.14]}>
        <circleGeometry args={[1.2, 64]} />
        <meshBasicMaterial color="#7452bf" transparent opacity={.28} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.3, 2.65]} />
        <meshBasicMaterial map={tex} transparent alphaTest={.03} toneMapped={false} />
      </mesh>
      <pointLight position={[0, .2, 1]} color="#ad8cff" intensity={1.5} />
      <mesh position={[0, 0, -.08]}>
        <ringGeometry args={[1.22, 1.245, 64]} />
        <meshBasicMaterial color="#c8a9ff" transparent opacity={.65} />
      </mesh>
      {mood === 'happy' && <Sparkles count={60} scale={3.4} size={4} speed={1.3} color="#ffd166" />}
    </group>
  );
}

function Glasses({ x }: { x: number }) {
  return (
    <mesh position={[x, .32, .9]}>
      <torusGeometry args={[.16, .018, 8, 32]} />
      <meshStandardMaterial color="#b9a9e8" metalness={.8} roughness={.2} />
    </mesh>
  );
}

function ProceduralAlan({ compact }: { compact: boolean }) {
  const root = useRef<Group>(null);
  const mouth = useRef<Mesh>(null);
  const mood = useTutorStore(s => s.mood);
  useLook(root, mood);
  useFrame(({ clock }) => {
    if (mouth.current) mouth.current.scale.y = mood === 'speaking' ? .65 + Math.abs(Math.sin(clock.elapsedTime * 11)) * .8 : mood === 'happy' ? .75 : .5;
  });

  const scale = compact ? 0.8 : 1;

  return (
    <Float speed={1.25} rotationIntensity={.04} floatIntensity={.16}>
      <group ref={root} scale={scale}>
        <mesh position={[0, -.57, -.03]} castShadow><capsuleGeometry args={[.48, .7, 8, 24]} /><meshStandardMaterial color="#423270" roughness={.45} /></mesh>
        <mesh position={[0, -.48, .43]}><torusGeometry args={[.37, .075, 10, 40, Math.PI]} /><meshStandardMaterial color="#e3b957" metalness={.55} /></mesh>
        <mesh position={[0, -.87, .1]}><boxGeometry args={[.79, .16, .18]} /><meshStandardMaterial color="#2b7b72" /></mesh>
        <mesh position={[0, .36, 0]} castShadow><sphereGeometry args={[.75, 48, 40]} /><meshStandardMaterial color="#d89f83" roughness={.55} /></mesh>
        <mesh position={[0, .82, .03]}><sphereGeometry args={[.74, .42, 32, 16, Math.PI * 2, 0, Math.PI * .48]} /><meshStandardMaterial color="#24202c" roughness={.7} /></mesh>
        <mesh position={[-.67, .48, .13]} rotation={[0, 0, .4]}><sphereGeometry args={[.22, 18, 18]} /><meshStandardMaterial color="#25212c" /></mesh>
        <mesh position={[.67, .48, .13]} rotation={[0, 0, -.4]}><sphereGeometry args={[.22, 18, 18]} /><meshStandardMaterial color="#25212c" /></mesh>
        {[-.25, .25].map((x, i) => <group key={i}><mesh position={[x, .38, .64]}><sphereGeometry args={[.115, 20, 20]} /><meshStandardMaterial color="#fffaf2" /></mesh><mesh position={[x, .38, .735]}><sphereGeometry args={[.058, 16, 16]} /><meshBasicMaterial color="#2c2540" /></mesh><Glasses x={x} /></group>)}
        <mesh position={[0, .52, .8]}><boxGeometry args={[.1, .025, .025]} /><meshStandardMaterial color="#c1b2db" /></mesh>
        <mesh position={[0, .12, .72]}><sphereGeometry args={[.085, 16, 16]} /><meshStandardMaterial color="#bb806d" /></mesh>
        <mesh ref={mouth} position={[0, -.02, .694]} scale={[.2, .5, .09]}><sphereGeometry args={[.19, 20, 16]} /><meshBasicMaterial color={mood === 'happy' ? '#8f355c' : '#6c3545'} /></mesh>
        <mesh position={[-.25, .63, .67]} rotation={[0, 0, mood === 'encouraging' ? .2 : 0]}><boxGeometry args={[.23, .035, .06]} /><meshStandardMaterial color="#29232f" /></mesh>
        <mesh position={[.25, .63, .67]} rotation={[0, 0, mood === 'encouraging' ? -.2 : 0]}><boxGeometry args={[.23, .035, .06]} /><meshStandardMaterial color="#29232f" /></mesh>
        <mesh position={[-.18, -.72, .55]} rotation={[0, 0, .12]}><boxGeometry args={[.3, .34, .12]} /><meshStandardMaterial color="#dcaf54" /></mesh>
        <mesh position={[-.18, -.72, .62]}><boxGeometry args={[.24, .28, .012]} /><meshStandardMaterial color="#f4e5bd" /></mesh>
        <mesh position={[.22, -.73, .55]} rotation={[0, 0, -.1]}><boxGeometry args={[.3, .36, .12]} /><meshStandardMaterial color="#496bb1" /></mesh>
        {!compact && <Text position={[-1.15, .55, .1]} fontSize={.32} color="#e8bd65" rotation={[0, 0, .12]}>A</Text>}
        {!compact && <Text position={[1.1, -.4, .15]} fontSize={.28} color="#bd9cff" rotation={[0, 0, -.1]}>abc</Text>}
        <Sparkles count={mood === 'happy' ? 70 : 22} scale={3.2} size={mood === 'happy' ? 4 : 2} speed={mood === 'happy' ? 1.2 : .35} color={mood === 'happy' ? '#ffd166' : '#a58bff'} />
      </group>
    </Float>
  );
}

class BoundaryInner extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function FallbackBoundary({ children, onError }: { children: React.ReactNode; onError: () => void }) {
  return <BoundaryInner onError={onError}>{children}</BoundaryInner>;
}

function Scene({ compact }: { compact: boolean }) {
  const [asset, setAsset] = useState<'model' | 'image' | 'procedural'>('procedural');
  const mood = useTutorStore(s => s.mood);
  useEffect(() => {
    let live = true;
    (async () => {
      try { const r = await fetch('/models/alan.glb', { method: 'HEAD' }); if (r.ok) { if (live) setAsset('model'); return; } } catch { }
      try { const r = await fetch('/images/alan.png', { method: 'HEAD' }); if (r.ok && live) setAsset('image'); } catch { }
    })();
    return () => { live = false; };
  }, []);
  const fail = () => setAsset(prev => prev === 'model' ? 'image' : 'procedural');
  return (
    <Suspense fallback={<ProceduralAlan compact={compact} />}>
      <FallbackBoundary key={asset} onError={fail}>
        {asset === 'model' ? <CharacterModel compact={compact} /> : asset === 'image' ? <ImageCharacter compact={compact} /> : <ProceduralAlan compact={compact} />}
      </FallbackBoundary>
      {mood === 'happy' && <Sparkles count={55} scale={4.4} size={4} speed={1.1} color="#ffcb69" />}
    </Suspense>
  );
}

export default function Mascot3D({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={className} aria-label="Alan, your interactive tutor">
      {/* کامێرا دوورتر خراوەتەوە لە دۆخی چاتەکە بۆ ئەوەی بە جوانی جێی ببێتەوە */}
      <Canvas camera={{ position: [0, 0, compact ? 6.5 : 4.2], fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.65} />
        <directionalLight position={[3, 4, 5]} intensity={2.4} color="#fff4e9" />
        <pointLight position={[-3, 1, 2]} intensity={2} color="#a276ff" />
        <Suspense fallback={<ProceduralAlan compact={compact} />}>
          <Scene compact={compact} />
        </Suspense>
      </Canvas>
    </div>
  );
}