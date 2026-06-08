import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FumigationZoneProps {
  position: [number, number, number]
  visible: boolean
}

export default function FumigationZone({ position, visible }: FumigationZoneProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const wireMatRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    if (!visible) return
    const t = clock.getElapsedTime()
    const opacity = 0.2 + Math.sin(t * 2) * 0.1
    if (matRef.current) matRef.current.opacity = opacity
    if (wireMatRef.current) wireMatRef.current.opacity = 0.1 + Math.sin(t * 2) * 0.05
  })

  if (!visible) return null

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial
          ref={matRef}
          color="#9b59b6"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshStandardMaterial ref={wireMatRef} color="#9b59b6" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  )
}
