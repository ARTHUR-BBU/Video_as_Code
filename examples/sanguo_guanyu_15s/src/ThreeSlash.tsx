import React, { useEffect, useRef } from 'react';
// @ts-ignore
import * as THREE from './vendor/three.module.js';

interface ThreeSlashProps {
  frame: number;
  startFrame: number;
  durationFrames?: number;
  colorHex?: number; // e.g. 0x00FFA3
  accentHex?: number; // e.g. 0xFFD700
  scale?: number;
}

// Deterministic pseudo-random generator (lint-ok: deterministic seeded float 0-1)
const randSeeded = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * ThreeSlash: Deterministic 60fps WebGL 3D Blade Slash & Particle Shockwave
 * Renders a crescent blade streak with flying sparks and expanding shockwave ring.
 */
export const ThreeSlash: React.FC<ThreeSlashProps> = ({
  frame,
  startFrame,
  durationFrames = 28,
  colorHex = 0x00ffa3,
  accentHex = 0xffd700,
  scale = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Mesh refs
  const bladeMeshRef = useRef<any>(null);
  const particlesRef = useRef<any>(null);
  const shockwaveRef = useRef<any>(null);
  const particleGeoRef = useRef<any>(null);
  const basePositionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(1920, 1080);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1920 / 1080, 0.1, 2000);
    camera.position.set(0, 0, 800);
    cameraRef.current = camera;

    // 1. Crescent Blade Ribbon
    const numSegments = 40;
    const bladeGeo = new THREE.BufferGeometry();
    const positions = new Float32Array((numSegments + 1) * 2 * 3);
    const colors = new Float32Array((numSegments + 1) * 2 * 3);
    const indices: number[] = [];

    const colCore = new THREE.Color(accentHex);
    const colEdge = new THREE.Color(colorHex);

    for (let i = 0; i <= numSegments; i++) {
      const u = i / numSegments;
      const angle = -Math.PI * 0.75 + u * Math.PI * 1.1; // 200 degree sweep
      const rInner = 280 + Math.sin(u * Math.PI) * 40;
      const rOuter = 340 + Math.sin(u * Math.PI) * 120; // thickest in middle

      const xIn = Math.cos(angle) * rInner;
      const yIn = Math.sin(angle) * rInner * 0.7; // slight elliptical tilt
      const xOut = Math.cos(angle) * rOuter;
      const yOut = Math.sin(angle) * rOuter * 0.7;

      const idx = i * 2;
      // Inner vertex
      positions[idx * 3] = xIn;
      positions[idx * 3 + 1] = yIn;
      positions[idx * 3 + 2] = 0;

      // Outer vertex
      positions[(idx + 1) * 3] = xOut;
      positions[(idx + 1) * 3 + 1] = yOut;
      positions[(idx + 1) * 3 + 2] = 10;

      // Colors
      colors[idx * 3] = colCore.r;
      colors[idx * 3 + 1] = colCore.g;
      colors[idx * 3 + 2] = colCore.b;

      colors[(idx + 1) * 3] = colEdge.r;
      colors[(idx + 1) * 3 + 1] = colEdge.g;
      colors[(idx + 1) * 3 + 2] = colEdge.b;

      if (i < numSegments) {
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }

    bladeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bladeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    bladeGeo.setIndex(indices);
    bladeGeo.computeVertexNormals();

    const bladeMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    scene.add(bladeMesh);
    bladeMeshRef.current = bladeMesh;

    // 2. Shockwave Ring
    const ringGeo = new THREE.RingGeometry(10, 40, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shockwaveMesh = new THREE.Mesh(ringGeo, ringMat);
    scene.add(shockwaveMesh);
    shockwaveRef.current = shockwaveMesh;

    // 3. Spark Particles (100% deterministic seeded)
    const particleCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pBase = new Float32Array(particleCount * 3);
    const pVel = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = randSeeded(i * 3 + 1);
      const angle = -Math.PI * 0.75 + u * Math.PI * 1.1;
      const r = 300 + randSeeded(i * 3 + 2) * 80;

      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r * 0.7;
      const pz = (randSeeded(i * 3 + 3) - 0.5) * 60;

      pPos[i * 3] = px;
      pPos[i * 3 + 1] = py;
      pPos[i * 3 + 2] = pz;

      pBase[i * 3] = px;
      pBase[i * 3 + 1] = py;
      pBase[i * 3 + 2] = pz;

      // Velocity radiates outwards with tangent component
      const speed = 200 + randSeeded(i * 7 + 4) * 450;
      const spreadAngle = angle + (randSeeded(i * 7 + 5) - 0.5) * 0.6;
      pVel[i * 3] = Math.cos(spreadAngle) * speed;
      pVel[i * 3 + 1] = Math.sin(spreadAngle) * speed;
      pVel[i * 3 + 2] = (randSeeded(i * 7 + 6) - 0.5) * speed * 0.5;

      const pCol = randSeeded(i * 11 + 7) > 0.4 ? colEdge : colCore;
      pColors[i * 3] = pCol.r;
      pColors[i * 3 + 1] = pCol.g;
      pColors[i * 3 + 2] = pCol.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    particleGeoRef.current = pGeo;
    basePositionsRef.current = pBase;
    velocitiesRef.current = pVel;

    const pMat = new THREE.PointsMaterial({
      size: 6,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    return () => {
      renderer.dispose();
      bladeGeo.dispose();
      bladeMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      pGeo.dispose();
      pMat.dispose();
    };
  }, [accentHex, colorHex]);

  // Deterministic per-frame rendering
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const bladeMesh = bladeMeshRef.current;
    const particles = particlesRef.current;
    const shockwave = shockwaveRef.current;
    const pGeo = particleGeoRef.current;
    const pBase = basePositionsRef.current;
    const pVel = velocitiesRef.current;

    if (!renderer || !scene || !camera) return;

    const relFrame = frame - startFrame;
    if (relFrame < 0 || relFrame > durationFrames) {
      // Out of slash window: keep clear
      renderer.clear();
      if (bladeMesh) bladeMesh.material.opacity = 0;
      if (particles) particles.material.opacity = 0;
      if (shockwave) shockwave.material.opacity = 0;
      return;
    }

    const progress = relFrame / durationFrames; // 0 to 1

    // 1. Blade Mesh Sweep & Opacity
    if (bladeMesh) {
      if (progress < 0.25) {
        // Attack phase: instant flash
        bladeMesh.material.opacity = (progress / 0.25) * 0.95;
      } else {
        // Decay phase: dissipation
        bladeMesh.material.opacity = Math.max(0, 0.95 * (1 - (progress - 0.25) / 0.75));
      }
      bladeMesh.scale.set(
        (0.85 + progress * 0.35) * scale,
        (0.85 + progress * 0.35) * scale,
        1
      );
      bladeMesh.rotation.z = -0.3 + progress * 0.45;
    }

    // 2. Shockwave Ring Expansion
    if (shockwave) {
      const apexProg = Math.max(0, Math.min(1, (relFrame - 3) / (durationFrames * 0.7)));
      if (apexProg > 0 && apexProg < 1) {
        const ringScale = (10 + apexProg * 550) * scale;
        shockwave.scale.set(ringScale, ringScale, 1);
        shockwave.material.opacity = Math.sin(apexProg * Math.PI) * 0.8;
      } else {
        shockwave.material.opacity = 0;
      }
    }

    // 3. Particles Propagation
    if (particles && pGeo && pBase && pVel) {
      particles.material.opacity = Math.max(0, 1 - progress);

      const positions = pGeo.attributes.position.array as Float32Array;
      const count = pBase.length / 3;
      const dt = progress * 0.8; // normalized time

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        positions[idx] = pBase[idx] + pVel[idx] * dt;
        positions[idx + 1] = pBase[idx + 1] + pVel[idx + 1] * dt - 120 * dt * dt; // gravity
        positions[idx + 2] = pBase[idx + 2] + pVel[idx + 2] * dt;
      }
      pGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }, [frame, startFrame, durationFrames, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        pointerEvents: 'none',
      }}
    />
  );
};
