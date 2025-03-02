import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

interface HighlightEffectProps {
  mesh: THREE.Mesh;
  color?: string;
}

export default function HighlightEffect({ mesh, color = '#ffffff' }: HighlightEffectProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (!mesh) return;

    // Store original material
    const originalMaterial = mesh.material;

    // Create highlight material
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8,
      wireframe: false,
      side: THREE.DoubleSide,
    });

    // Create outline effect
    const outlineMesh = new THREE.Mesh(
      mesh.geometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.5,
      })
    );
    outlineMesh.scale.multiplyScalar(1.05);
    outlineMesh.position.copy(mesh.position);
    outlineMesh.rotation.copy(mesh.rotation);
    outlineMesh.quaternion.copy(mesh.quaternion);
    
    // Apply highlight material and add outline
    mesh.material = highlightMaterial;
    mesh.parent?.add(outlineMesh);

    return () => {
      // Cleanup: restore original material and remove outline
      mesh.material = originalMaterial;
      mesh.parent?.remove(outlineMesh);
      highlightMaterial.dispose();
      outlineMesh.material.dispose();
    };
  }, [mesh, color]);

  return null;
}
