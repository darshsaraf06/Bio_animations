import { useGLTF, Html } from '@react-three/drei'
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import heartBase64 from '../../data/heartModelBase64'

// Approximate 3D positions for each structure on the heart model.
// These are relative to the centered model. Adjust if your GLB differs.
const ANNOTATION_POINTS = {
  mesh_0:            { pos: [0, 0.2, 0.6],     label: 'Heart' },
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
  coronary_arteries: { pos: [-0.1, 0.1, 0.65],  label: 'Coronary Arteries' },
}

// Axis vectors for the clipping plane
const AXIS_NORMALS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

function Annotation({ position, label, visible }) {
  if (!visible) return null

  return (
    <group position={position}>
      {/* Pulsing dot pinned in 3D space */}
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#a8d8f0" transparent opacity={0.95} />
      </mesh>

      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#a8d8f0" transparent opacity={0.2} />
      </mesh>

      {/* HTML label — transform mode keeps it fixed in 3D space at this position */}
      <Html
        position={[0, 0.12, 0]}
        center
        sprite
        distanceFactor={3.5}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
        zIndexRange={[50, 0]}
      >
        <div className="annotation-label">
          <div className="annotation-connector" />
          <div className="annotation-text">{label}</div>
        </div>
      </Html>
    </group>
  )
}

function HeartModelInner({ modelUrl, onSelect, selectedPart, clipEnabled, clipPosition, clipAxis }) {
  const { scene } = useGLTF(modelUrl)
  const groupRef = useRef()

  // Create a single clipping plane, memoized so Three.js can track it
  const clippingPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  // Update clipping plane normal & constant reactively
  useEffect(() => {
    const normal = AXIS_NORMALS[clipAxis] || AXIS_NORMALS.x
    clippingPlane.normal.copy(normal)
    clippingPlane.constant = -clipPosition   // negative because Plane equation is n·x + d = 0
  }, [clipAxis, clipPosition, clippingPlane])

  // Walk every mesh in the loaded scene and toggle clipping
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

  // Also update materials when clipPosition/clipAxis changes (plane itself is mutated)
  useEffect(() => {
    if (!clipEnabled) return
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
          mat.clippingPlanes = [clippingPlane]
          mat.needsUpdate = true
        })
      }
    })
  }, [scene, clipEnabled, clipPosition, clipAxis, clippingPlane])

  // Gentle beating/breathing animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      const cycle = t % 0.85
      let scale = 1.5
      if (cycle < 0.1) {
        scale = 1.5 + 0.03 * Math.sin(cycle * Math.PI / 0.1)
      } else if (cycle > 0.15 && cycle < 0.25) {
        scale = 1.5 + 0.02 * Math.sin((cycle - 0.15) * Math.PI / 0.1)
      }
      groupRef.current.scale.setScalar(scale)
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    onSelect('mesh_0')
  }

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
    >
      <primitive object={scene} scale={1} position={[0, 0, 0]} />

      {/* Render annotation for the selected part */}
      {Object.entries(ANNOTATION_POINTS).map(([id, data]) => (
        <Annotation
          key={id}
          position={data.pos}
          label={data.label}
          visible={selectedPart === id}
        />
      ))}
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