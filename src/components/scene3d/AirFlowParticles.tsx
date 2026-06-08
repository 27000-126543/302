import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AirFlowParticlesProps {
  position: [number, number, number]
  active: boolean
}

const COUNT = 50

export default function AirFlowParticles({ position, active }: AirFlowParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.5
      arr[i * 3 + 1] = Math.random() * -4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.5
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return
    const geo = pointsRef.current.geometry
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) - delta * 2
      let x = pos.getX(i) + (Math.random() - 0.5) * delta * 0.3
      let z = pos.getZ(i) + (Math.random() - 0.5) * delta * 0.3
      if (y < -5) {
        y = 0
        x = (Math.random() - 0.5) * 1.5
        z = (Math.random() - 0.5) * 1.5
      }
      pos.setXYZ(i, x, y, z)
    }
    pos.needsUpdate = true
  })

  if (!active) return null

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#00d4ff" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}
