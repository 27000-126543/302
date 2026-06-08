import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useGranaryStore } from '@/stores/useGranaryStore'
import { useEquipmentStore } from '@/stores/useEquipmentStore'
import useAlertStore from '@/stores/useAlertStore'
import FlatWarehouse from './FlatWarehouse'
import SiloWarehouse from './SiloWarehouse'
import DryingWorkshop from './DryingWorkshop'
import InspectionCenter from './InspectionCenter'
import DispatchCenter from './DispatchCenter'
import ConveyorBridge from './ConveyorBridge'
import ConveyorMachine from './ConveyorMachine'
import DryerMachine from './DryerMachine'
import FumigationZone from './FumigationZone'
import PestAlertEffect from './PestAlertEffect'
import Ground from './Ground'

interface GrainDepotSceneProps {
  onGranaryClick: (id: string) => void
}

function SceneContent({ onGranaryClick }: GrainDepotSceneProps) {
  const granaries = useGranaryStore(s => s.granaries)
  const equipment = useEquipmentStore(s => s.equipment)
  const alerts = useAlertStore(s => s.alerts)

  const flatGranaries = granaries.filter(g => g.type === 'flat')
  const siloGranaries = granaries.filter(g => g.type === 'silo')
  const fumigatingGranaries = granaries.filter(g => g.fumigating)
  const pestAlertGranaries = granaries.filter(g => g.pestDensity > 5)

  const conveyorBridges = [
    { from: [-6, 2.5, 2] as [number, number, number], to: [-2.5, 2.5, 2] as [number, number, number] },
    { from: [0.5, 2.5, 2] as [number, number, number], to: [4, 2.5, 2] as [number, number, number] },
    { from: [7.5, 2.5, 2] as [number, number, number], to: [11, 2.5, 2] as [number, number, number] },
    { from: [11, 2.5, 2] as [number, number, number], to: [14, 2.5, 4] as [number, number, number] },
    { from: [-10, 2.5, -4] as [number, number, number], to: [-6, 2.5, 2] as [number, number, number] },
    { from: [-10, 2.5, -4] as [number, number, number], to: [-2, 2.5, -5] as [number, number, number] },
  ]

  return (
    <>
      <ambientLight intensity={0.3} color="#b0c4de" />
      <directionalLight position={[10, 15, 10]} intensity={0.8} color="#ffe4b5" />
      <pointLight position={[-5, 8, 0]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[10, 8, 0]} intensity={0.3} color="#00d4ff" />

      <Ground />

      {flatGranaries.map(g => (
        <FlatWarehouse key={g.id} granary={g} onClick={onGranaryClick} />
      ))}

      {siloGranaries.map(g => (
        <SiloWarehouse key={g.id} granary={g} onClick={onGranaryClick} />
      ))}

      <DryingWorkshop />
      <InspectionCenter />
      <DispatchCenter />

      {conveyorBridges.map((bridge, i) => (
        <ConveyorBridge key={`cb_${i}`} from={bridge.from} to={bridge.to} />
      ))}

      {equipment.filter(e => e.type === 'conveyor').map(eq => (
        <ConveyorMachine
          key={eq.id}
          position={[eq.position[0], 0, eq.position[2] + 2.5]}
          needsMaintenance={eq.runningHours >= eq.maintenanceThreshold}
        />
      ))}

      {equipment.filter(e => e.type === 'dryer').map(eq => (
        <DryerMachine
          key={eq.id}
          position={eq.position}
          needsMaintenance={eq.runningHours >= eq.maintenanceThreshold}
        />
      ))}

      {fumigatingGranaries.map(g => (
        <FumigationZone
          key={`fz_${g.id}`}
          position={[g.position[0], g.position[1] + 1.5, g.position[2]]}
          visible={true}
        />
      ))}

      {pestAlertGranaries.map(g => (
        <PestAlertEffect
          key={`pe_${g.id}`}
          position={[g.position[0], g.position[1] + 2, g.position[2]]}
          active={true}
        />
      ))}

      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.2}
        target={[3, 0, 0]}
      />

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}

export default function GrainDepotScene({ onGranaryClick }: GrainDepotSceneProps) {
  return (
    <Canvas
      camera={{ position: [15, 12, 18], fov: 50 }}
      style={{ background: '#050d1a' }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <SceneContent onGranaryClick={onGranaryClick} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.8} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
