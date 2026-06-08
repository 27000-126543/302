import { useMemo } from 'react'
import * as THREE from 'three'

interface ConveyorBridgeProps {
  from: [number, number, number]
  to: [number, number, number]
  needsMaintenance?: boolean
}

export default function ConveyorBridge({ from, to, needsMaintenance = false }: ConveyorBridgeProps) {
  const { midPos, length, angle } = useMemo(() => {
    const dx = to[0] - from[0]
    const dz = to[2] - from[2]
    const len = Math.sqrt(dx * dx + dz * dz)
    const ang = Math.atan2(dx, dz)
    const mx = (from[0] + to[0]) / 2
    const mz = (from[2] + to[2]) / 2
    return { midPos: [mx, 2.5, mz] as [number, number, number], length: len, angle: ang }
  }, [from, to])

  const color = needsMaintenance ? '#ff8c00' : '#4a6a8a'
  const emissive = needsMaintenance ? '#ff6600' : '#000000'

  return (
    <group>
      <group position={midPos} rotation={[0, angle, 0]}>
        <mesh>
          <boxGeometry args={[0.6, 0.8, length]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={needsMaintenance ? 0.3 : 0} />
        </mesh>
        {/* conveyor belt inside - a thin strip */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.4, 0.05, length * 0.98]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
      {/* Support legs */}
      <mesh position={[from[0], 1.25, from[2]]}>
        <cylinderGeometry args={[0.08, 0.08, 2.5, 8]} />
        <meshStandardMaterial color="#3a5a7a" />
      </mesh>
      <mesh position={[to[0], 1.25, to[2]]}>
        <cylinderGeometry args={[0.08, 0.08, 2.5, 8]} />
        <meshStandardMaterial color="#3a5a7a" />
      </mesh>
    </group>
  )
}
