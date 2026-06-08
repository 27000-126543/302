import { Grid } from '@react-three/drei'

export default function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0d1b2a" metalness={0.3} roughness={0.7} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a2d42"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#243b53"
        fadeDistance={50}
        infiniteGrid
      />
    </group>
  )
}
