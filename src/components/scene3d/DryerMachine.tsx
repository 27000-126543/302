interface DryerMachineProps {
  position: [number, number, number]
  needsMaintenance?: boolean
}

export default function DryerMachine({ position, needsMaintenance = false }: DryerMachineProps) {
  const color = needsMaintenance ? '#ff8c00' : '#7a5a2a'
  const emissive = needsMaintenance ? '#ff6600' : '#000000'

  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.2, 0.4, 1.0]} />
        <meshStandardMaterial color="#4a3a1a" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.8, 16]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={needsMaintenance ? 0.3 : 0} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 0.4, 16]} />
        <meshStandardMaterial color="#5a4a2a" />
      </mesh>
      <mesh position={[0.5, 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.0, 8]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  )
}
