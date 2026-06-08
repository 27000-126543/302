import * as THREE from 'three'
import { useRef, useMemo } from 'react'

export default function DryingWorkshop() {
  const smokeRef = useRef<THREE.Mesh>(null)

  return (
    <group position={[-10, 0, -5]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[4, 2, 3]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>

      <mesh position={[1.2, 2.6, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.2, 16]} />
        <meshStandardMaterial color="#5a4510" />
      </mesh>

      <mesh position={[1.2, 3.3, 0]}>
        <cylinderGeometry args={[0.3, 0.2, 0.3, 16]} />
        <meshStandardMaterial color="#4a3a0e" />
      </mesh>

      <mesh position={[-0.8, 1.0, 1.51]}>
        <boxGeometry args={[0.8, 1.0, 0.02]} />
        <meshStandardMaterial color="#6b5010" />
      </mesh>

      <mesh position={[0, 2.15, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[4.2, 0.3, 3.2]} />
        <meshStandardMaterial color="#7a5c12" />
      </mesh>
    </group>
  )
}
