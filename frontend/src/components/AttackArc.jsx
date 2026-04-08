import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Convert lat/lng to 3D spherical coordinates (x,y,z)
 */
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

const SEVERITY_COLORS = {
  LOW: '#34d399',      // Green
  MODERATE: '#fbbf24', // Yellow
  HIGH: '#fb923c',     // Orange
  CRITICAL: '#ef4444', // Red
};

export function AttackArc({ attack, earthRadius }) {
  const pointsRef = useRef(null);
  const lineRef = useRef(null);
  
  // Calculate the 3D curve only once
  const { curve, color } = useMemo(() => {
    const start = latLngToVector3(attack.source_coordinates.lat, attack.source_coordinates.lng, earthRadius);
    const end = latLngToVector3(attack.destination_coordinates.lat, attack.destination_coordinates.lng, earthRadius);

    // Calculate midpoint for the quadratic bezier curve
    const distance = start.distanceTo(end);
    let midHeight = earthRadius + distance * 0.3; // Higher arc for longer distances
    midHeight = Math.max(midHeight, earthRadius + 0.5);

    // Midpoint interpolated
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(midHeight);

    // Create curve
    const bezierCurve = new THREE.QuadraticBezierCurve3(start, mid, end);
    
    return {
      curve: bezierCurve,
      color: new THREE.Color(SEVERITY_COLORS[attack.severity_level] || '#38bdf8'),
    };
  }, [attack, earthRadius]);

  // Points along the arc for animation
  const particleCount = 40;
  const positions = useMemo(() => {
    const pts = new Float32Array(particleCount * 3);
    return pts;
  }, [particleCount]);

  // Animate particles flowing along the curve
  useFrame((state) => {
    if (!pointsRef.current || !lineRef.current) return;

    const time = state.clock.getElapsedTime();
    const speed = 0.5 + attack.severity_score; // Higher severity = faster particles
    const offset = (time * speed) % 1;

    // Update particle positions
    for (let i = 0; i < particleCount; i++) {
      // Create a trail effect by distributing particles
      let t = offset - (i / particleCount);
      if (t < 0) t += 1;
      
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Fade line based on attack lifecycle (simulated)
    const age = (Date.now() / 1000) - attack.timestamp;
    const opacity = age < attack.duration_seconds 
      ? Math.min(1.0, age / 2) // Fade in
      : Math.max(0.0, 1.0 - (age - attack.duration_seconds) / 5); // Fade out over 5s
      
    lineRef.current.material.opacity = opacity * 0.4;
    pointsRef.current.material.opacity = opacity;
  });

  // Static line geometry
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
    return geo;
  }, [curve]);

  return (
    <group>
      {/* The base static arc (dimmed) */}
      <line ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.4} linewidth={1} />
      </line>

      {/* The flowing particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          color={color} 
          size={0.06} 
          transparent 
          opacity={1} 
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Impact point glow (destination) */}
      <mesh position={curve.getPoint(1)}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
