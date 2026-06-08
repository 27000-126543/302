import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PestAlertEffectProps {
  position: [number, number, number]
  active: boolean
}

export default function PestAlertEffect({ position, active }: PestAlertEffectProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!active) return
    const t = clock.getElapsedTime()
    const intensity = (Math.sin(t * 4) + 1) * 1.5
    if (lightRef.current) lightRef.current.intensity = intensity
    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.3
      ringRef.current.scale.set(scale, scale, scale)
    }
  })

  if (!active) return null

  return (
    <group position={position}>
      <pointLight ref={lightRef} color="#ff8c00" intensity={0} distance={8} />
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 8, 32]} />
        <meshStandardMaterial color="#ff8c00" emissive="#ff8c00" emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}
