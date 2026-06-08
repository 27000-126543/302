import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FanAnimationProps {
  position: [number, number, number]
  active: boolean
}

export default function FanAnimation({ position, active }: FanAnimationProps) {
  const groupRef = useRef<THREE.Group>(null)

  const blades = useMemo(() => {
    const arr: [number, number, number][] = []
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3
      arr.push([Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6])
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (active && groupRef.current) {
      groupRef.current.rotation.y += delta * 5
    }
  })

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      <group ref={groupRef}>
        {blades.map((pos, i) => (
          <mesh key={i} position={pos} rotation={[0, (i * 2 * Math.PI) / 3, 0]}>
            <boxGeometry args={[0.8, 0.02, 0.15]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
