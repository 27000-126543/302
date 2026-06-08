import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { Granary } from '@/types'

interface SiloWarehouseProps {
  granary: Granary
  onClick: (id: string) => void
}

export default function SiloWarehouse({ granary, onClick }: SiloWarehouseProps) {
  const groupRef = useRef<THREE.Group>(null)
  const fanRef = useRef<THREE.Group>(null)
  const pestMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)

  const bodyColor = useMemo(() => {
    if (granary.avgTemp > 30) return '#ff3b3b'
    if (granary.fumigating) return '#9b59b6'
    return '#3a5a7c'
  }, [granary.avgTemp, granary.fumigating])

  useFrame((_, delta) => {
    if (fanRef.current && granary.ventilating) {
      fanRef.current.rotation.y += delta * 5
    }
    if (pestMatRef.current && granary.pestDensity > 5) {
      pestMatRef.current.emissiveIntensity = (Math.sin(Date.now() * 0.005) + 1) * 0.3
    }
  })

  return (
    <group
      ref={groupRef}
      position={granary.position}
      onClick={() => onClick(granary.id)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.05 : 1}
    >
      <mesh position={[0, 1.75, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 3.5, 32]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={hovered ? '#ffffff' : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      <mesh position={[0, 3.5, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {granary.pestDensity > 5 && (
        <mesh position={[0, 1.75, 0]}>
          <cylinderGeometry args={[1.05, 1.05, 3.55, 32]} />
          <meshStandardMaterial
            ref={pestMatRef}
            color="#ff6600"
            emissive="#ff6600"
            emissiveIntensity={0.3}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}

      {granary.ventilating && (
        <group ref={fanRef} position={[0, 4.6, 0]}>
          {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot, i) => (
            <mesh key={i} rotation={[0, rot, 0]}>
              <boxGeometry args={[0.5, 0.05, 0.1]} />
              <meshStandardMaterial color="#aaaaaa" />
            </mesh>
          ))}
        </group>
      )}

      <Html position={[0, 5.2, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: 11,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{granary.name}</div>
          <div>品种: {granary.product}</div>
          <div style={{ color: granary.avgTemp > 30 ? '#ff3b3b' : '#8f8' }}>
            温度: {granary.avgTemp}°C
          </div>
          <div>水分: {granary.avgMoisture}%</div>
          <div style={{ color: granary.pestDensity > 5 ? '#ff8800' : '#8f8' }}>
            虫害: {granary.pestDensity}
          </div>
        </div>
      </Html>
    </group>
  )
}
