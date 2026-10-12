import { useGLTF, Center } from '@react-three/drei'
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Preload all high-detail GLB models for instantaneous switching
useGLTF.preload('/models/heart.glb')
useGLTF.preload('/models/lungs.glb')
useGLTF.preload('/models/liver.glb')
useGLTF.preload('/models/brain.glb')
useGLTF.preload('/models/kidneys.glb')

// 3D anatomical annotation markers per organ system
export const ANNOTATION_POINTS = {
  heart: {
    mesh_0:            { pos: [0, 0.2, 0.6],       label: 'Heart — Pericardium' },
    left_ventricle:    { pos: [-0.35, -0.35, 0.5],  label: 'Left Ventricle' },
    right_ventricle:   { pos: [0.35, -0.3, 0.55],   label: 'Right Ventricle' },
    left_atrium:       { pos: [-0.3, 0.45, -0.2],   label: 'Left Atrium' },
    right_atrium:      { pos: [0.4, 0.3, 0.3],      label: 'Right Atrium' },
    aorta:             { pos: [0.05, 0.85, 0.15],    label: 'Aorta' },
    pulmonary_artery:  { pos: [0.25, 0.7, 0.35],    label: 'Pulmonary Artery' },
    superior_vena_cava:{ pos: [0.35, 0.8, -0.1],    label: 'Superior Vena Cava' },
    inferior_vena_cava:{ pos: [0.3, -0.7, -0.3],    label: 'Inferior Vena Cava' },
    mitral_valve:      { pos: [-0.15, 0.05, 0.3],   label: 'Mitral Valve' },
    tricuspid_valve:   { pos: [0.25, 0.05, 0.35],   label: 'Tricuspid Valve' },
    coronary_arteries: { pos: [-0.1, 0.1, 0.65],    label: 'Coronary Arteries' }
  },
  lungs: {
    left_lung:         { pos: [-0.55, 0.05, 0.15],   label: 'Left Lung (2 Lobes)' },
    right_lung:        { pos: [0.55, 0.05, 0.15],    label: 'Right Lung (3 Lobes)' },
    trachea:           { pos: [0, 0.75, 0.0],        label: 'Trachea' },
    bronchi:           { pos: [-0.12, 0.32, 0.05],   label: 'Bronchial Arbor' },
    alveoli:           { pos: [0.65, -0.3, 0.2],    label: 'Alveolar Fields' }
  },
  liver: {
    right_lobe:        { pos: [0.4, 0.05, 0.1],     label: 'Right Lobe' },
    left_lobe:         { pos: [-0.4, -0.05, 0.1],    label: 'Left Lobe' },
    gallbladder:       { pos: [0.1, -0.45, 0.25],    label: 'Gallbladder' },
    hepatic_portal:    { pos: [-0.05, -0.22, 0.18],  label: 'Hepatic Portal System' }
  },
  brain: {
    cerebrum:          { pos: [0, 0.45, 0.1],        label: 'Cerebrum (Cortex)' },
    frontal_lobe:      { pos: [0, 0.3, 0.65],        label: 'Frontal Lobe' },
    parietal_lobe:     { pos: [0, 0.65, -0.1],       label: 'Parietal Lobe' },
    temporal_lobe:     { pos: [-0.65, 0.05, 0.15],   label: 'Temporal Lobe' },
    occipital_lobe:    { pos: [0, 0.15, -0.65],      label: 'Occipital Lobe' },
    cerebellum:        { pos: [0, -0.5, -0.4],       label: 'Cerebellum' },
    brainstem:         { pos: [0, -0.7, -0.05],      label: 'Brainstem & Medulla' }
  },
  kidneys: {
    renal_cortex:      { pos: [0.38, 0.15, 0.1],     label: 'Renal Cortex' },
    renal_medulla:     { pos: [0.18, 0.05, 0.05],    label: 'Renal Medulla & Pyramids' },
    renal_pelvis:      { pos: [-0.05, -0.05, 0.05],  label: 'Renal Pelvis' },
    renal_artery:      { pos: [-0.22, 0.12, 0.0],    label: 'Renal Artery' },
    renal_vein:        { pos: [-0.22, -0.1, 0.05],   label: 'Renal Vein' },
    ureter:            { pos: [-0.08, -0.6, 0.08],   label: 'Ureter' },
    adrenal_gland:     { pos: [0.18, 0.6, 0.05],     label: 'Adrenal Gland' }
  }
}

const AXIS_NORMALS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

function applyClippingAndShaders(rootScene, clipEnabled, clippingPlane, visualMode) {
  if (!rootScene) return
  rootScene.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((mat) => {
        if (!mat.userData) mat.userData = {}
        if (mat.userData.origColor === undefined) {
          mat.userData.origColor = mat.color ? mat.color.clone() : new THREE.Color(0xffffff)
          mat.userData.origRoughness = mat.roughness ?? 0.4
          mat.userData.origTransparent = mat.transparent ?? false
          mat.userData.origOpacity = mat.opacity ?? 1.0
        }

        if (visualMode === 'wireframe') {
          mat.wireframe = true
          if (mat.color) mat.color.set('#0ea5e9')
          mat.transparent = false
          mat.opacity = 1.0
        } else if (visualMode === 'xray') {
          mat.wireframe = false
          mat.transparent = true
          mat.opacity = 0.38
          mat.depthWrite = false
          if (mat.color) mat.color.set('#38bdf8')
        } else {
          mat.wireframe = false
          mat.transparent = mat.userData.origTransparent
          mat.opacity = mat.userData.origOpacity
          mat.depthWrite = true
          if (mat.color && mat.userData.origColor) mat.color.copy(mat.userData.origColor)
        }

        if (clipEnabled) {
          mat.clippingPlanes = [clippingPlane]
          mat.clipShadows = true
        } else {
          mat.clippingPlanes = []
        }
        mat.needsUpdate = true
      })
    }
  })
}

/* ─────────────────────────────────────────────
   INDIVIDUAL GLB ORGAN RENDERERS
   ───────────────────────────────────────────── */

function HeartGLB({ clipEnabled, clippingPlane, visualMode, bpm, isAnimating, onSelect }) {
  const { scene } = useGLTF('/models/heart.glb')
  const groupRef = useRef()

  useEffect(() => {
    applyClippingAndShaders(scene, clipEnabled, clippingPlane, visualMode)
  }, [scene, clipEnabled, clippingPlane, visualMode])

  useFrame(({ clock }) => {
    if (!groupRef.current || !isAnimating) return
    const t = clock.getElapsedTime()
    const cycleSec = 60 / bpm
    const cycle = (t % cycleSec) / cycleSec
    let pulse = 0
    if (cycle < 0.12) {
      pulse = 0.035 * Math.sin((cycle / 0.12) * Math.PI)
    } else if (cycle > 0.18 && cycle < 0.3) {
      pulse = 0.02 * Math.sin(((cycle - 0.18) / 0.12) * Math.PI)
    }
    groupRef.current.scale.setScalar(1.2 + pulse)
  })

  return (
    <group
      ref={groupRef}
      scale={1.2}
      onClick={(e) => { e.stopPropagation(); onSelect('mesh_0') }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

function LungsGLB({ clipEnabled, clippingPlane, visualMode, isAnimating, onSelect }) {
  const { scene } = useGLTF('/models/lungs.glb')
  const groupRef = useRef()

  useEffect(() => {
    applyClippingAndShaders(scene, clipEnabled, clippingPlane, visualMode)
  }, [scene, clipEnabled, clippingPlane, visualMode])

  useFrame(({ clock }) => {
    if (!groupRef.current || !isAnimating) return
    const t = clock.getElapsedTime()
    const breathCycle = (t % 4.4) / 4.4
    const expansion = 0.025 * Math.sin(breathCycle * Math.PI * 2)
    groupRef.current.scale.set(7.2 + expansion, 7.2 + expansion * 1.2, 7.2 + expansion)
  })

  return (
    <group
      ref={groupRef}
      scale={7.2}
      onClick={(e) => { e.stopPropagation(); onSelect('left_lung') }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

function LiverGLB({ clipEnabled, clippingPlane, visualMode, onSelect }) {
  const { scene } = useGLTF('/models/liver.glb')

  useEffect(() => {
    applyClippingAndShaders(scene, clipEnabled, clippingPlane, visualMode)
  }, [scene, clipEnabled, clippingPlane, visualMode])

  return (
    <group
      scale={8.8}
      onClick={(e) => { e.stopPropagation(); onSelect('right_lobe') }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

function BrainGLB({ clipEnabled, clippingPlane, visualMode, onSelect }) {
  const { scene } = useGLTF('/models/brain.glb')

  useEffect(() => {
    applyClippingAndShaders(scene, clipEnabled, clippingPlane, visualMode)
  }, [scene, clipEnabled, clippingPlane, visualMode])

  return (
    <group
      scale={10.5}
      onClick={(e) => { e.stopPropagation(); onSelect('cerebrum') }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

function KidneysGLB({ clipEnabled, clippingPlane, visualMode, onSelect }) {
  const { scene } = useGLTF('/models/kidneys.glb')

  useEffect(() => {
    applyClippingAndShaders(scene, clipEnabled, clippingPlane, visualMode)
  }, [scene, clipEnabled, clippingPlane, visualMode])

  return (
    <group
      scale={15.0}
      onClick={(e) => { e.stopPropagation(); onSelect('renal_cortex') }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

/* ─────────────────────────────────────────────
   3D PIN DOTS
   ───────────────────────────────────────────── */
function PinDot({ position, visible, onClick }) {
  const [hovered, setHovered] = useState(false)
  const dotRef = useRef()
  const glowRef = useRef()

  useFrame(({ clock }) => {
    if (dotRef.current && visible) {
      const pulse = 1 + 0.16 * Math.sin(clock.getElapsedTime() * 3.5)
      dotRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current && visible) {
      const glow = 0.15 + 0.08 * Math.sin(clock.getElapsedTime() * 2.5 + 1)
      glowRef.current.material.opacity = glow
    }
  })

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      <mesh ref={dotRef}>
        <sphereGeometry args={[visible ? 0.036 : 0.022, 16, 16]} />
        <meshBasicMaterial
          color={visible ? '#38bdf8' : hovered ? '#0284c7' : '#94a3b8'}
          transparent
          opacity={visible ? 0.98 : hovered ? 0.85 : 0.45}
        />
      </mesh>

      {(visible || hovered) && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[visible ? 0.07 : 0.045, 16, 16]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  )
}

/* ─────────────────────────────────────────────
   SCREEN-SPACE LABEL PROJECTOR
   ───────────────────────────────────────────── */
function LabelProjector({ activeOrgan, selectedPart, onProjectedLabels }) {
  const { camera, size } = useThree()
  const tempVec = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const points = ANNOTATION_POINTS[activeOrgan] || {}
    const projected = {}

    Object.entries(points).forEach(([id, data]) => {
      tempVec.set(data.pos[0], data.pos[1], data.pos[2])
      tempVec.project(camera)

      const x = (tempVec.x * 0.5 + 0.5) * size.width
      const y = (-tempVec.y * 0.5 + 0.5) * size.height
      const behind = tempVec.z > 1

      projected[id] = {
        x,
        y,
        label: data.label,
        behind,
        visible: selectedPart === id
      }
    })

    onProjectedLabels(projected)
  })

  return null
}

/* ─────────────────────────────────────────────
   MASTER ORGAN MODEL COMPONENT
   ───────────────────────────────────────────── */
export default function HeartModel({
  onSelect,
  selectedPart,
  clipEnabled,
  clipPosition,
  clipAxis,
  activeOrgan = 'heart',
  visualMode = 'standard',
  bpm = 72,
  isAnimating = true,
  onProjectedLabels
}) {
  const clippingPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  useEffect(() => {
    const normal = AXIS_NORMALS[clipAxis] || AXIS_NORMALS.x
    clippingPlane.normal.copy(normal)
    clippingPlane.constant = -clipPosition
  }, [clipAxis, clipPosition, clippingPlane])

  const activePoints = ANNOTATION_POINTS[activeOrgan] || {}

  return (
    <group>
      {/* 3D GLB Models */}
      {activeOrgan === 'heart' && (
        <HeartGLB
          clipEnabled={clipEnabled}
          clippingPlane={clippingPlane}
          visualMode={visualMode}
          bpm={bpm}
          isAnimating={isAnimating}
          onSelect={onSelect}
        />
      )}
      {activeOrgan === 'lungs' && (
        <LungsGLB
          clipEnabled={clipEnabled}
          clippingPlane={clippingPlane}
          visualMode={visualMode}
          isAnimating={isAnimating}
          onSelect={onSelect}
        />
      )}
      {activeOrgan === 'liver' && (
        <LiverGLB
          clipEnabled={clipEnabled}
          clippingPlane={clippingPlane}
          visualMode={visualMode}
          onSelect={onSelect}
        />
      )}
      {activeOrgan === 'brain' && (
        <BrainGLB
          clipEnabled={clipEnabled}
          clippingPlane={clippingPlane}
          visualMode={visualMode}
          onSelect={onSelect}
        />
      )}
      {activeOrgan === 'kidneys' && (
        <KidneysGLB
          clipEnabled={clipEnabled}
          clippingPlane={clippingPlane}
          visualMode={visualMode}
          onSelect={onSelect}
        />
      )}

      {/* 3D Pin dots */}
      {Object.entries(activePoints).map(([id, data]) => (
        <PinDot
          key={id}
          position={data.pos}
          visible={selectedPart === id}
          onClick={() => onSelect(id)}
        />
      ))}

      {/* Projected 2D Label Coordinates */}
      <LabelProjector
        activeOrgan={activeOrgan}
        selectedPart={selectedPart}
        onProjectedLabels={onProjectedLabels}
      />
    </group>
  )
}