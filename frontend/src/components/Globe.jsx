import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AttackArc } from './AttackArc';

// We import the geojson directly since Vite can handle JSON imports
import countries from '../assets/countries.json';

export function Globe({ attacks }) {
  const earthRef = useRef();
  const atmosphereRef = useRef();
  const radius = 5;
  
  // Parse GeoJSON to Three.js BufferGeometries
  const borders = useMemo(() => {
    const geometries = [];

    // Helper to convert lat/lon to 3D point
    const vertexNode = (line) => {
      const lon = line[0];
      const lat = line[1];

      // Convert to spherical
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      // Slightly above the surface (5.02) to avoid z-fighting
      const r = radius + 0.02;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      return new THREE.Vector3(x, y, z);
    };

    if (countries && countries.features) {
      countries.features.forEach((feature) => {
        if (!feature.geometry) return;

        const type = feature.geometry.type;
        const coordinates = feature.geometry.coordinates;

        if (type === 'Polygon') {
          coordinates.forEach((polygon) => {
            const points = polygon.map(vertexNode);
            geometries.push(new THREE.BufferGeometry().setFromPoints(points));
          });
        } else if (type === 'MultiPolygon') {
          coordinates.forEach((multiPolygon) => {
            multiPolygon.forEach((polygon) => {
              const points = polygon.map(vertexNode);
              geometries.push(new THREE.BufferGeometry().setFromPoints(points));
            });
          });
        }
      });
    }

    return geometries;
  }, []);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001; // Slow rotation
    }
  });

  return (
    <group ref={earthRef}>
      {/* Base Earth Sphere */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          color="#0f1623"
          emissive="#0a0e17"
          specular="#141c2e"
          shininess={10}
          transparent={true}
          opacity={0.9}
        />
      </mesh>

      {/* Wireframe Overlay for Cyber Look */}
      <mesh>
        <sphereGeometry args={[radius + 0.01, 32, 32]} />
        <meshBasicMaterial
          color="#1e293b"
          wireframe={true}
          transparent={true}
          opacity={0.15}
        />
      </mesh>
      
      {/* Country Borders (GeoJSON) */}
      <group>
        {borders.map((geometry, index) => (
          <line key={`border-${index}`} geometry={geometry}>
            <lineBasicMaterial color="#38bdf8" transparent opacity={0.25} />
          </line>
        ))}
      </group>

      {/* Atmosphere Glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[radius + 0.2, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent={true}
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Attack Arcs */}
      {attacks.slice(-50).map((attack, i) => (
        <AttackArc
          key={attack.attack_id || i}
          attack={attack}
          earthRadius={radius}
        />
      ))}
    </group>
  );
}
