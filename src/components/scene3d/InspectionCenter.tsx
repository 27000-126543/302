import * as THREE from 'three'

export default function InspectionCenter() {
  return (
    <group position={[-2, 0, -6]}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[3, 1.8, 2.5]} />
        <meshStandardMaterial color="#2d8b8b" />
      </mesh>

      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[3.2, 0.1, 2.7]} />
        <meshStandardMaterial color="#1f7070" />
      </mesh>

      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[1.5, 0.3, 1.5]} />
        <meshStandardMaterial color="#3aa0a0" />
      </mesh>

      <mesh position={[0, 0.85, 1.26]}>
        <boxGeometry args={[1.2, 1.2, 0.02]} />
        <meshStandardMaterial color="#1a6060" transparent opacity={0.6} />
      </mesh>

      <mesh position={[-1.0, 0.85, 1.26]}>
        <boxGeometry args={[0.6, 0.8, 0.02]} />
        <meshStandardMaterial color="#1a6060" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
