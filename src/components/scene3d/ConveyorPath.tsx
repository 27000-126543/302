import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ConveyorPathProps {
  points: [number, number, number][]
  color: string
  active: boolean
}

const PARTICLE_COUNT = 8

export default function ConveyorPath({ points, color, active }: ConveyorPathProps) {
  const particlesRef = useRef<THREE.Group>(null)
  const progressRef = useRef<number[]>([])

  const curve = useMemo(() => {
    const pts = points.map((p) => new THREE.Vector3(...p))
    return new THREE.CatmullRomCurve3(pts)
  }, [points])

  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.05, 8, false)
  }, [curve])

  useMemo(() => {
    progressRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT)
  }, [])

  useFrame((_, delta) => {
    if (!active || !particlesRef.current) return
    particlesRef.current.children.forEach((child, i) => {
      progressRef.current[i] += delta * 0.3
      if (progressRef.current[i] > 1) progressRef.current[i] -= 1
      const pt = curve.getPointAt(progressRef.current[i])
      child.position.copy(pt)
    })
  })

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial color={color} transparent opacity={0.4} />
      </mesh>
      {active && (
        <group ref={particlesRef}>
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
