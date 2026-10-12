import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Center, ContactShadows, Environment } from '@react-three/drei'
import { Suspense, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import HeartModel, { ANNOTATION_POINTS } from './HeartModel'

function LoadingFallback() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#38bdf8" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#0ea5e9" wireframe transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

/**
 * Handles smooth animated camera transitions for View Presets and Structure Focus
 */
function CameraRig({ viewPreset, selectedPart, activeOrgan, controlsRef }) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 0, 4))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (!viewPreset) return

    switch (viewPreset) {
      case 'anterior':
        targetPos.current.set(0, 0, 3.8)
        targetLook.current.set(0, 0, 0)
        break
      case 'posterior':
        targetPos.current.set(0, 0, -3.8)
        targetLook.current.set(0, 0, 0)
        break
      case 'left':
        targetPos.current.set(-3.8, 0, 0)
        targetLook.current.set(0, 0, 0)
        break
      case 'right':
        targetPos.current.set(3.8, 0, 0)
        targetLook.current.set(0, 0, 0)
        break
      case 'superior':
        targetPos.current.set(0, 3.8, 0.05)
        targetLook.current.set(0, 0, 0)
        break
      case 'isometric':
        targetPos.current.set(2.6, 2.0, 2.6)
        targetLook.current.set(0, 0, 0)
        break
      default:
        targetPos.current.set(0, 0, 4)
        targetLook.current.set(0, 0, 0)
    }
  }, [viewPreset])

  useEffect(() => {
    if (selectedPart && ANNOTATION_POINTS[activeOrgan]?.[selectedPart]) {
      const pos = ANNOTATION_POINTS[activeOrgan][selectedPart].pos
      targetLook.current.set(pos[0] * 0.45, pos[1] * 0.45, pos[2] * 0.45)
    } else {
      targetLook.current.set(0, 0, 0)
    }
  }, [selectedPart, activeOrgan])

  useFrame((_, delta) => {
    const alpha = Math.min(delta * 4, 1)
    camera.position.lerp(targetPos.current, alpha)

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, alpha)
      controlsRef.current.update()
    }
  })

  return null
}

const Scene = forwardRef(function Scene(
  {
    onSelectPart,
    selectedPart,
    clipEnabled,
    clipPosition,
    clipAxis,
    activeOrgan,
    visualMode = 'standard',
    viewPreset = null,
    bpm = 72,
    isAnimating = true,
    autoRotate = true,
    onProjectedLabels
  },
  ref
) {
  const controlsRef = useRef()
  const canvasRef = useRef()

  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL('image/png')
      }
      return null
    }
  }))

  return (
    <Canvas
      ref={canvasRef}
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{
        antialias: true,
        alpha: true,
        localClippingEnabled: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        preserveDrawingBuffer: true
      }}
      dpr={[1, 2]}
    >
      {/* Lighting Rig */}
      <ambientLight intensity={visualMode === 'wireframe' ? 0.8 : 0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fff7f0" castShadow />
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#cce0ff" />
      <directionalLight position={[0, -3, -4]} intensity={0.35} color="#94a3b8" />
      <pointLight position={[0, 0, 3]} intensity={0.35} color="#38bdf8" distance={8} />

      {visualMode !== 'wireframe' && (
        <Environment preset="city" environmentIntensity={0.2} />
      )}

      <Suspense fallback={<LoadingFallback />}>
        <Center>
          <HeartModel
            onSelect={onSelectPart}
            selectedPart={selectedPart}
            clipEnabled={clipEnabled}
            clipPosition={clipPosition}
            clipAxis={clipAxis}
            activeOrgan={activeOrgan}
            visualMode={visualMode}
            bpm={bpm}
            isAnimating={isAnimating}
            onProjectedLabels={onProjectedLabels}
          />
        </Center>

        {visualMode !== 'wireframe' && (
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.35}
            scale={5}
            blur={2.5}
            far={4}
          />
        )}
      </Suspense>

      <CameraRig
        viewPreset={viewPreset}
        selectedPart={selectedPart}
        activeOrgan={activeOrgan}
        controlsRef={controlsRef}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={autoRotate && !selectedPart && !clipEnabled}
        autoRotateSpeed={0.8}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 1.2}
        enableDamping={true}
        dampingFactor={0.08}
      />
    </Canvas>
  )
})

export default Scene