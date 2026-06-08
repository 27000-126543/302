import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { Granary } from '@/types'

interface FlatWarehouseProps {
  granary: Granary
  onClick: (id: string) => void
}

export default function FlatWarehouse({ granary, onClick }: FlatWarehouseProps) {
  const groupRef = useRef<THREE.Group>(null)
  const fanRef = useRef<THREE.Group>(null)
  const pestMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)

  const bodyColor = useMemo(() => {
    if (granary.avgTemp > 30) return '#ff3b3b'
    if (granary.fumigating) return '#9b59b6'
    return '#3a5a7c'
  }, [granary.avgTemp, granary.fumigating])

  const roofGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-1.6, 0)
    shape.lineTo(0, 0.8)
    shape.lineTo(1.6, 0)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false })
      .translate(0, 0, -1.1)
  }, [])

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
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[3.2, 1.5, 2.2]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={hovered ? '#ffffff' : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      <mesh position={[0, 1.5, 0]} geometry={roofGeometry}>
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {granary.pestDensity > 5 && (
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[3.25, 1.55, 2.25]} />
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
        <group ref={fanRef} position={[0, 2.4, 0]}>
          {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot, i) => (
            <mesh key={i} rotation={[0, rot, 0]}>
              <boxGeometry args={[0.6, 0.05, 0.1]} />
              <meshStandardMaterial color="#aaaaaa" />
            </mesh>
          ))}
        </group>
      )}

      <Html position={[0, 3, 0]} center>
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
