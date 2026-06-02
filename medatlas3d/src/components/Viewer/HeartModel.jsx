import { useGLTF } from '@react-three/drei'
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import heartBase64 from '../../data/heartModelBase64'

// Approximate 3D positions for structures based on active view.
export const ANNOTATION_POINTS = {
  heart: {
    mesh_0:            { pos: [0, 0.2, 0.6],     label: 'Heart — Full Structure' },
    left_ventricle:    { pos: [-0.3, -0.4, 0.5],  label: 'Left Ventricle' },
    right_ventricle:   { pos: [0.35, -0.3, 0.55], label: 'Right Ventricle' },
    left_atrium:       { pos: [-0.3, 0.45, -0.2], label: 'Left Atrium' },
    right_atrium:      { pos: [0.4, 0.3, 0.3],    label: 'Right Atrium' },
    aorta:             { pos: [0.05, 0.85, 0.15],  label: 'Aorta' },
    pulmonary_artery:  { pos: [0.25, 0.7, 0.35],  label: 'Pulmonary Artery' },
    superior_vena_cava:{ pos: [0.35, 0.8, -0.1],  label: 'Superior Vena Cava' },
    inferior_vena_cava:{ pos: [0.3, -0.7, -0.3],  label: 'Inferior Vena Cava' },
    mitral_valve:      { pos: [-0.15, 0.05, 0.3], label: 'Mitral Valve' },
    tricuspid_valve:   { pos: [0.25, 0.05, 0.35], label: 'Tricuspid Valve' },
    coronary_arteries: { pos: [-0.1, 0.1, 0.65],  label: 'Coronary Arteries' }
  },
  lungs: {
    left_lung:         { pos: [-0.35, 0.0, 0.1],   label: 'Left Lung' },
    right_lung:        { pos: [0.35, 0.02, 0.1],   label: 'Right Lung' },
    trachea:           { pos: [0, 0.82, -0.1],   label: 'Trachea' },
    bronchi:           { pos: [-0.08, 0.26, -0.12], label: 'Bronchial Tree' },
    alveoli:           { pos: [-0.45, -0.25, 0.15], label: 'Alveoli' }
  },
  liver: {
    right_lobe:        { pos: [0.22, -0.08, 0.2],   label: 'Right Lobe' },
    left_lobe:         { pos: [-0.22, -0.15, 0.15],  label: 'Left Lobe' },
    gallbladder:       { pos: [0.08, -0.38, 0.25],  label: 'Gallbladder' },
    hepatic_portal:    { pos: [-0.05, -0.2, 0.18],  label: 'Hepatic Portal Vein' }
  },
  all: {
    heart:             { pos: [0, 0.15, 0.55],    label: 'Heart' },
    left_lung:         { pos: [-0.6, 0.15, 0.2],  label: 'Left Lung' },
    right_lung:        { pos: [0.6, 0.15, 0.2],   label: 'Right Lung' },
    liver:             { pos: [0.2, -0.65, 0.25], label: 'Liver' }
  }
}

// Axis vectors for the clipping plane
const AXIS_NORMALS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

// Smooth lerp helper
function lerpScalar(current, target, alpha) {
  return current + (target - current) * alpha
}

/* ─────────────────────────────────────────────
   PROCEDURAL LUNGS MODEL — High detail
   ───────────────────────────────────────────── */
function LungsModel({ clipEnabled, clippingPlane }) {
  const groupRef = useRef()
  
  const leftLungMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#d48a8a',
    roughness: 0.32,
    transmission: 0.4,
    thickness: 0.8,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    envMapIntensity: 0.6
  }), [])

  const rightLungMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#d89696',
    roughness: 0.32,
    transmission: 0.4,
    thickness: 0.8,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    envMapIntensity: 0.6
  }), [])

  const tracheaMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#c8dced',
    roughness: 0.15,
    transmission: 0.6,
    thickness: 0.5,
    clearcoat: 0.6,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    envMapIntensity: 0.5
  }), [])

  const cartilageMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e8eef5',
    roughness: 0.45,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 0.3
  }), [])

  const bronchioleMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#b5c8d9',
    roughness: 0.25,
    transmission: 0.5,
    thickness: 0.3,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  }), [])

  const alveoliMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#e8a8a8',
    roughness: 0.6,
    transmission: 0.3,
    thickness: 0.3,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  }), [])

  useEffect(() => {
    const planes = clipEnabled ? [clippingPlane] : []
    const allMats = [leftLungMat, rightLungMat, tracheaMat, cartilageMat, bronchioleMat, alveoliMat]
    allMats.forEach(mat => {
      mat.clippingPlanes = planes
      mat.needsUpdate = true
    })
  }, [clipEnabled, clippingPlane, leftLungMat, rightLungMat, tracheaMat, cartilageMat, bronchioleMat, alveoliMat])

  return (
    <group ref={groupRef}>
      {/* Trachea */}
      <mesh position={[0, 0.6, -0.15]} material={tracheaMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 32]} />
      </mesh>
      
      {/* C-shaped cartilage rings */}
      {[-0.22, -0.15, -0.08, -0.01, 0.06, 0.13, 0.2].map((y, idx) => (
        <mesh key={idx} position={[0, 0.6 + y, -0.15]} rotation={[Math.PI / 2, 0, 0]} material={cartilageMat}>
          <torusGeometry args={[0.063, 0.008, 8, 28, Math.PI * 1.5]} />
        </mesh>
      ))}

      {/* Left Bronchus */}
      <mesh position={[-0.1, 0.24, -0.15]} rotation={[0, 0, Math.PI / 4]} material={tracheaMat}>
        <cylinderGeometry args={[0.045, 0.038, 0.3, 20]} />
      </mesh>
      <mesh position={[-0.22, 0.12, -0.1]} rotation={[0.1, 0, Math.PI / 3.5]} material={bronchioleMat}>
        <cylinderGeometry args={[0.025, 0.018, 0.18, 12]} />
      </mesh>
      <mesh position={[-0.28, -0.02, -0.08]} rotation={[0.15, 0.1, Math.PI / 5]} material={bronchioleMat}>
        <cylinderGeometry args={[0.018, 0.012, 0.15, 10]} />
      </mesh>

      {/* Right Bronchus */}
      <mesh position={[0.1, 0.22, -0.15]} rotation={[0, 0, -Math.PI / 5]} material={tracheaMat}>
        <cylinderGeometry args={[0.05, 0.042, 0.25, 20]} />
      </mesh>
      <mesh position={[0.22, 0.1, -0.12]} rotation={[-0.05, 0, -Math.PI / 3.5]} material={bronchioleMat}>
        <cylinderGeometry args={[0.028, 0.02, 0.2, 12]} />
      </mesh>
      <mesh position={[0.3, -0.04, -0.1]} rotation={[0.1, -0.1, -Math.PI / 4.5]} material={bronchioleMat}>
        <cylinderGeometry args={[0.02, 0.013, 0.16, 10]} />
      </mesh>

      {/* Left Lung lobes */}
      <group position={[-0.32, 0.0, -0.05]}>
        <mesh position={[0, 0.22, 0.02]} rotation={[0.1, 0, 0.15]} scale={[0.25, 0.34, 0.21]} material={leftLungMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        <mesh position={[-0.04, -0.18, 0.03]} rotation={[-0.1, 0, 0.1]} scale={[0.27, 0.4, 0.25]} material={leftLungMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        <mesh position={[0.0, 0.02, 0.15]} rotation={[0.05, 0, 0.5]} scale={[0.22, 0.005, 0.02]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
      </group>

      {/* Alveoli clusters — left */}
      {[[-0.42, -0.18, 0.08], [-0.48, -0.05, 0.05], [-0.38, -0.32, 0.1], [-0.32, 0.28, 0.08]].map((p, i) => (
        <mesh key={`alv-l-${i}`} position={p} material={alveoliMat}>
          <icosahedronGeometry args={[0.035, 1]} />
        </mesh>
      ))}

      {/* Right Lung lobes */}
      <group position={[0.32, 0.02, -0.05]}>
        <mesh position={[0, 0.26, 0.01]} rotation={[0.08, 0, -0.12]} scale={[0.25, 0.32, 0.23]} material={rightLungMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        <mesh position={[0.04, 0.03, 0.05]} rotation={[0, 0, -0.08]} scale={[0.27, 0.24, 0.25]} material={rightLungMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        <mesh position={[0.01, -0.22, -0.01]} rotation={[-0.08, 0, -0.05]} scale={[0.29, 0.36, 0.27]} material={rightLungMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        <mesh position={[0.02, 0.14, 0.15]} rotation={[0.05, 0, -0.3]} scale={[0.24, 0.005, 0.02]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
        <mesh position={[0.0, -0.08, 0.15]} rotation={[0.05, 0, -0.6]} scale={[0.22, 0.005, 0.02]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
      </group>

      {/* Alveoli clusters — right */}
      {[[0.44, -0.15, 0.1], [0.5, 0.0, 0.06], [0.4, -0.3, 0.12], [0.36, 0.3, 0.1]].map((p, i) => (
        <mesh key={`alv-r-${i}`} position={p} material={alveoliMat}>
          <icosahedronGeometry args={[0.035, 1]} />
        </mesh>
      ))}
    </group>
  )
}

/* ─────────────────────────────────────────────
   PROCEDURAL LIVER MODEL — High detail
   ───────────────────────────────────────────── */
function LiverModel({ clipEnabled, clippingPlane }) {
  const liverMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#7a2a2a',
    roughness: 0.4,
    metalness: 0.03,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    envMapIntensity: 0.5
  }), [])

  const liverSurfaceMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#8e3535',
    roughness: 0.55,
    metalness: 0.02,
    clearcoat: 0.15,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  }), [])

  const gallbladderMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#3a7035',
    roughness: 0.25,
    metalness: 0.08,
    clearcoat: 0.5,
    transmission: 0.3,
    thickness: 0.3,
    transparent: true,
    opacity: 0.85
  }), [])

  const portalVeinMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a5a8f',
    roughness: 0.35,
    metalness: 0.15
  }), [])

  const hepaticArteryMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9e3333',
    roughness: 0.3,
    metalness: 0.1
  }), [])

  const bileDuctMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4a8a3a',
    roughness: 0.35,
    metalness: 0.05
  }), [])

  useEffect(() => {
    const planes = clipEnabled ? [clippingPlane] : []
    const allMats = [liverMat, liverSurfaceMat, gallbladderMat, portalVeinMat, hepaticArteryMat, bileDuctMat]
    allMats.forEach(mat => {
      mat.clippingPlanes = planes
      mat.needsUpdate = true
    })
  }, [clipEnabled, clippingPlane, liverMat, liverSurfaceMat, gallbladderMat, portalVeinMat, hepaticArteryMat, bileDuctMat])

  return (
    <group>
      <mesh position={[0.16, -0.08, 0]} rotation={[0.1, -0.15, -0.1]} scale={[0.44, 0.32, 0.36]} material={liverMat}>
        <dodecahedronGeometry args={[1, 2]} />
      </mesh>
      <mesh position={[0.2, -0.05, 0.2]} rotation={[0.1, -0.1, -0.08]} scale={[0.35, 0.25, 0.15]} material={liverSurfaceMat}>
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>
      <mesh position={[-0.24, -0.15, 0.04]} rotation={[0.15, 0.1, 0.25]} scale={[0.32, 0.22, 0.24]} material={liverMat}>
        <dodecahedronGeometry args={[1, 2]} />
      </mesh>
      <mesh position={[-0.02, 0.05, -0.18]} rotation={[0.1, 0, 0]} scale={[0.14, 0.1, 0.12]} material={liverMat}>
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>
      <mesh position={[-0.04, -0.2, 0.12]} rotation={[0.12, 0.05, 0.1]} scale={[0.12, 0.1, 0.1]} material={liverSurfaceMat}>
        <dodecahedronGeometry args={[1, 1]} />
      </mesh>
      <mesh position={[-0.04, -0.02, 0.22]} rotation={[0.1, 0, 0.15]} scale={[0.005, 0.25, 0.12]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#d4c4a8" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.08, -0.32, 0.2]} scale={[0.075, 0.12, 0.075]} rotation={[0.15, 0, -0.1]} material={gallbladderMat}>
        <sphereGeometry args={[1, 24, 24]} />
      </mesh>
      <mesh position={[0.06, -0.24, 0.16]} rotation={[0.3, 0, -0.15]} material={gallbladderMat}>
        <cylinderGeometry args={[0.02, 0.03, 0.08, 12]} />
      </mesh>
      <mesh position={[-0.05, -0.2, 0.12]} rotation={[0.3, 0, -0.2]} material={portalVeinMat}>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 16]} />
      </mesh>
      <mesh position={[0.05, -0.12, 0.08]} rotation={[0.2, 0.15, 0.4]} material={portalVeinMat}>
        <cylinderGeometry args={[0.018, 0.015, 0.15, 12]} />
      </mesh>
      <mesh position={[-0.08, -0.25, 0.08]} rotation={[0.4, 0.1, -0.3]} material={hepaticArteryMat}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 12]} />
      </mesh>
      <mesh position={[0.02, -0.26, 0.15]} rotation={[0.35, -0.05, 0.1]} material={bileDuctMat}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 10]} />
      </mesh>
    </group>
  )
}

/* ─────────────────────────────────────────────
   3D PIN DOTS (no Html labels — those are in CSS overlay)
   ───────────────────────────────────────────── */
function PinDot({ position, visible, onClick }) {
  const [hovered, setHovered] = useState(false)
  const dotRef = useRef()
  const glowRef = useRef()

  useFrame(({ clock }) => {
    if (dotRef.current && visible) {
      const pulse = 1 + 0.15 * Math.sin(clock.getElapsedTime() * 3)
      dotRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current && visible) {
      const glow = 0.12 + 0.06 * Math.sin(clock.getElapsedTime() * 2 + 1)
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
        <sphereGeometry args={[visible ? 0.035 : 0.02, 16, 16]} />
        <meshBasicMaterial
          color={visible ? '#f0a8d8' : hovered ? '#a8d8f0' : '#ffffff'}
          transparent
          opacity={visible ? 0.95 : hovered ? 0.8 : 0.35}
        />
      </mesh>

      {(visible || hovered) && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[visible ? 0.065 : 0.04, 16, 16]} />
          <meshBasicMaterial
            color={visible ? '#f0a8d8' : '#a8d8f0'}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}
    </group>
  )
}

/* ─────────────────────────────────────────────
   SCREEN-SPACE LABEL PROJECTOR
   Projects 3D annotation points to 2D screen coordinates
   every frame and pushes them to the parent via callback.
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

      // Convert NDC to pixel coords
      const x = (tempVec.x * 0.5 + 0.5) * size.width
      const y = (-tempVec.y * 0.5 + 0.5) * size.height
      const behind = tempVec.z > 1 // behind camera

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
   INNER SCENE CONTAINER
   ───────────────────────────────────────────── */
function HeartModelInner({ modelUrl, onSelect, selectedPart, clipEnabled, clipPosition, clipAxis, activeOrgan = 'heart', onProjectedLabels }) {
  const { scene } = useGLTF(modelUrl)
  const groupRef = useRef()
  const allModelsGroupRef = useRef()

  const heartGroupRef = useRef()
  const lungsGroupRef = useRef()
  const liverGroupRef = useRef()

  // Smooth scale targets
  const heartScaleTarget = useRef(1.5)
  const lungsScaleTarget = useRef(0.001)
  const liverScaleTarget = useRef(0.001)

  const clippingPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  useEffect(() => {
    const normal = AXIS_NORMALS[clipAxis] || AXIS_NORMALS.x
    clippingPlane.normal.copy(normal)
    clippingPlane.constant = -clipPosition
  }, [clipAxis, clipPosition, clippingPlane])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
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
  }, [scene, clipEnabled, clippingPlane])

  useEffect(() => {
    heartScaleTarget.current = (activeOrgan === 'heart') ? 1.5 : (activeOrgan === 'all') ? 1.0 : 0.001
    lungsScaleTarget.current = (activeOrgan === 'lungs') ? 1.4 : (activeOrgan === 'all') ? 1.0 : 0.001
    liverScaleTarget.current = (activeOrgan === 'liver') ? 1.5 : (activeOrgan === 'all') ? 1.0 : 0.001
  }, [activeOrgan])

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const transitionSpeed = Math.min(delta * 6, 1)

    if (heartGroupRef.current) {
      const currentS = heartGroupRef.current.scale.x
      let targetS = heartScaleTarget.current
      if (targetS > 0.01) {
        const cycle = t % 0.85
        let beatPulse = 0
        if (cycle < 0.1) {
          beatPulse = 0.025 * Math.sin(cycle * Math.PI / 0.1)
        } else if (cycle > 0.15 && cycle < 0.25) {
          beatPulse = 0.018 * Math.sin((cycle - 0.15) * Math.PI / 0.1)
        }
        targetS += beatPulse
      }
      heartGroupRef.current.scale.setScalar(lerpScalar(currentS, targetS, transitionSpeed))
    }

    if (lungsGroupRef.current) {
      const currentS = lungsGroupRef.current.scale.x
      let targetS = lungsScaleTarget.current
      if (targetS > 0.01) {
        const breathingCycle = (t % 4.0) / 4.0
        targetS += 0.02 * Math.sin(breathingCycle * Math.PI * 2)
      }
      lungsGroupRef.current.scale.setScalar(lerpScalar(currentS, targetS, transitionSpeed))
    }

    if (liverGroupRef.current) {
      const currentS = liverGroupRef.current.scale.x
      let targetS = liverScaleTarget.current
      if (targetS > 0.01) {
        targetS += 0.005 * Math.sin(t * 0.8)
      }
      liverGroupRef.current.scale.setScalar(lerpScalar(currentS, targetS, transitionSpeed))
    }
  })

  const activePoints = ANNOTATION_POINTS[activeOrgan] || {}

  return (
    <group ref={groupRef}>
      <group ref={allModelsGroupRef}>
        {/* Heart model */}
        <group
          ref={heartGroupRef}
          position={activeOrgan === 'all' ? [0, 0.15, 0.2] : [0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            if (activeOrgan === 'all') onSelect('heart')
            else onSelect('mesh_0')
          }}
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}
        >
          <primitive object={scene} />
        </group>

        {/* Lungs model */}
        <group
          ref={lungsGroupRef}
          position={activeOrgan === 'all' ? [0, 0.15, 0.0] : [0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            onSelect('left_lung')
          }}
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}
        >
          <LungsModel clipEnabled={clipEnabled} clippingPlane={clippingPlane} />
        </group>

        {/* Liver model */}
        <group
          ref={liverGroupRef}
          position={activeOrgan === 'all' ? [0.08, -0.6, 0.1] : [0, 0.05, 0]}
          onClick={(e) => {
            e.stopPropagation()
            if (activeOrgan === 'all') onSelect('liver')
            else onSelect('right_lobe')
          }}
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'default' }}
        >
          <LiverModel clipEnabled={clipEnabled} clippingPlane={clippingPlane} />
        </group>
      </group>

      {/* 3D Pin dots only — no Html labels */}
      {Object.entries(activePoints).map(([id, data]) => (
        <PinDot
          key={id}
          position={data.pos}
          visible={selectedPart === id}
          onClick={() => onSelect(id)}
        />
      ))}

      {/* Project 3D positions to screen coords for CSS overlay labels */}
      <LabelProjector
        activeOrgan={activeOrgan}
        selectedPart={selectedPart}
        onProjectedLabels={onProjectedLabels}
      />
    </group>
  )
}

export default function HeartModel(props) {
  const [modelUrl, setModelUrl] = useState(null)

  useEffect(() => {
    let url = null
    const loadModel = async () => {
      try {
        const res = await fetch(`data:model/gltf-binary;base64,${heartBase64}`)
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        setModelUrl(url)
      } catch (err) {
        console.error("Failed to decode inline GLB model:", err)
      }
    }
    loadModel()

    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  if (!modelUrl) {
    return null
  }

  return <HeartModelInner modelUrl={modelUrl} {...props} />
}