import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function DispatchCenter() {
  const antennaLightRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    if (antennaLightRef.current) {
      antennaLightRef.current.emissiveIntensity = (Math.sin(Date.now() * 0.003) + 1) * 0.5
    }
  })

  return (
    <group position={[5, 0, -6]}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[3.5, 2, 3]} />
        <meshStandardMaterial color="#1a3a5c" />
      </mesh>

      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[3.7, 0.2, 3.2]} />
        <meshStandardMaterial color="#0f2840" />
      </mesh>

      <mesh position={[0, 1.0, 1.51]}>
        <boxGeometry args={[1.4, 1.2, 0.02]} />
        <meshStandardMaterial color="#0d2040" transparent opacity={0.5} />
      </mesh>

      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      <mesh position={[0, 3.3, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          ref={antennaLightRef}
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>

      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.02]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      <mesh position={[0, 2.95, 0]}>
        <boxGeometry args={[0.4, 0.02, 0.02]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </group>
  )
}
