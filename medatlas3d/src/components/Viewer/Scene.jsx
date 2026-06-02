import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, ContactShadows, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import HeartModel from './HeartModel'

function LoadingFallback() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#a8d8f0" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#f0a8d8" wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

export default function Scene({ onSelectPart, selectedPart, clipEnabled, clipPosition, clipAxis, activeOrgan, onProjectedLabels }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true, localClippingEnabled: true, toneMapping: 3 }}
      dpr={[1, 2]}
    >
      {/* Premium lighting rig */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} color="#fff5ee" castShadow />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} color="#cce0ff" />
      <directionalLight position={[0, -2, -5]} intensity={0.3} color="#e8d5f5" />
      <pointLight position={[0, 0, 3]} intensity={0.3} color="#a8d8f0" distance={8} />

      {/* Subtle environment reflections for physical materials */}
      <Environment preset="city" environmentIntensity={0.15} />

      <Suspense fallback={<LoadingFallback />}>
        <Center>
          <HeartModel
            onSelect={onSelectPart}
            selectedPart={selectedPart}
            clipEnabled={clipEnabled}
            clipPosition={clipPosition}
            clipAxis={clipAxis}
            activeOrgan={activeOrgan}
            onProjectedLabels={onProjectedLabels}
          />
        </Center>

        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.35}
          scale={5}
          blur={2.5}
          far={4}
        />
      </Suspense>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={!selectedPart && !clipEnabled}
        autoRotateSpeed={0.8}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        enableDamping={true}
        dampingFactor={0.08}
      />
    </Canvas>
  )
}