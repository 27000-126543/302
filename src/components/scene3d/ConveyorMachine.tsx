import * as THREE from 'three'

interface ConveyorMachineProps {
  position: [number, number, number]
  needsMaintenance?: boolean
}

export default function ConveyorMachine({ position, needsMaintenance = false }: ConveyorMachineProps) {
  const color = needsMaintenance ? '#ff8c00' : '#5a6a7a'
  const emissive = needsMaintenance ? '#ff6600' : '#000000'

  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.5, 0.2, 0.5]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={needsMaintenance ? 0.3 : 0} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.4, 0.05, 0.4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.6, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={needsMaintenance ? 0.2 : 0} />
      </mesh>
      <mesh position={[0.6, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={needsMaintenance ? 0.2 : 0} />
      </mesh>
      <mesh position={[-0.6, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 6]} />
        <meshStandardMaterial color="#4a5a6a" />
      </mesh>
      <mesh position={[0.6, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 6]} />
        <meshStandardMaterial color="#4a5a6a" />
      </mesh>
    </group>
  )
}
