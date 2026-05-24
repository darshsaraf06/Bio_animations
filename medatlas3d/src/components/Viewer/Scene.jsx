import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import HeartModel from './HeartModel'

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  )
}

export default function Scene({ onSelectPart, selectedPart, clipEnabled, clipPosition, clipAxis }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#fff5ee" />
      <directionalLight position={[-5, 3, -3]} intensity={0.4} color="#cce0ff" />
      <directionalLight position={[0, -2, -5]} intensity={0.3} color="#e8d5f5" />

      <Suspense fallback={<LoadingFallback />}>
        <Center>
          <HeartModel
            onSelect={onSelectPart}
            selectedPart={selectedPart}
            clipEnabled={clipEnabled}
            clipPosition={clipPosition}
            clipAxis={clipAxis}
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
      />
    </Canvas>
  )
}