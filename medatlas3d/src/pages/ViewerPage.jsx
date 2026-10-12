import { useState, useEffect, useCallback, useRef } from 'react'
import Scene from '../components/Viewer/Scene'
import anatomyData from '../data/anatomyData.json'
import { soundEngine } from '../services/soundEngine'
import { getStats } from '../services/api'

/* ─────────────────────────────────────────────
   INFO PANEL — Right side anatomy details
   ───────────────────────────────────────────── */
function InfoPanel({ selectedPart, onClose, onStartQuiz, activeOrgan }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!selectedPart) return null

  const partInfo = anatomyData[activeOrgan]?.parts?.[selectedPart]
  if (!partInfo) return null

  return (
    <div className="glass-panel info-panel">
      <div className="panel-header">
        <div>
          <span className="category-badge">{partInfo.category}</span>
          <h2 className="panel-title">{partInfo.name}</h2>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close panel">×</button>
      </div>

      <div className="tab-row">
        {['overview', 'clinical', 'facts'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <>
            <div className="info-section">
              <h3 className="section-label">Description</h3>
              <p className="section-text">{partInfo.description}</p>
            </div>
            <div className="info-section">
              <h3 className="section-label">Physiological Function</h3>
              <p className="section-text accent">{partInfo.function}</p>
            </div>
          </>
        )}

        {activeTab === 'clinical' && (
          <div className="info-section">
            <h3 className="section-label">Clinical Significance & Pathology</h3>
            <p className="section-text">{partInfo.clinical}</p>
          </div>
        )}

        {activeTab === 'facts' && (
          <div className="info-section">
            <h3 className="section-label">Key Anatomical Facts</h3>
            <ul className="facts-list">
              {partInfo.facts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button className="cta-btn" onClick={onStartQuiz}>
        🧠 Test Your Knowledge
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SEARCH PANEL — Left side anatomy search
   ───────────────────────────────────────────── */
function SearchPanel({ onSelectResult, activeOrgan }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const allParts = Object.entries(anatomyData[activeOrgan]?.parts || {}).map(([id, data]) => ({
    id,
    ...data,
  }))

  const filtered = query.trim()
    ? allParts.filter(
        p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          (p.category && p.category.toLowerCase().includes(query.toLowerCase()))
      )
    : []

  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search structures..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button className="clear-btn" onClick={() => { setQuery(''); setOpen(false) }}>×</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="search-results">
          {filtered.map(r => (
            <div
              key={r.id}
              className="search-result-item"
              onClick={() => {
                onSelectResult(r.id)
                soundEngine.playClick()
                setQuery('')
                setOpen(false)
              }}
            >
              <span className="result-name">{r.name}</span>
              <span className="result-category">{r.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   PARTS LIST — Left side structure browser
   ───────────────────────────────────────────── */
function PartsList({ selectedPart, onSelectPart, activeOrgan }) {
  const categories = {}
  Object.entries(anatomyData[activeOrgan]?.parts || {}).forEach(([id, data]) => {
    const cat = data.category || 'other'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push({ id, ...data })
  })

  const categoryLabels = {
    organ: '🧬 Major Organs & Lobes',
    chamber: '🫀 Chambers & Cortices',
    vessel: '🩸 Great Vessels & Ducts',
    valve: '🔒 Valves, Calyces & Alveoli'
  }

  return (
    <div className="glass-panel parts-panel">
      <h3 className="panel-small-title">Anatomical Structures</h3>
      {Object.entries(categories).map(([cat, parts]) => (
        <div key={cat} className="category-group">
          <div className="category-label">{categoryLabels[cat] || cat}</div>
          {parts.map(p => (
            <button
              key={p.id}
              className={`part-btn ${selectedPart === p.id ? 'active' : ''}`}
              onClick={() => {
                onSelectPart(p.id)
                soundEngine.playClick()
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   CROSS-SECTION PANEL — Clipping plane controls
   ───────────────────────────────────────────── */
function CrossSectionPanel({ clipEnabled, setClipEnabled, clipPosition, setClipPosition, clipAxis, setClipAxis }) {
  const axisLabels = { x: 'Sagittal', y: 'Coronal', z: 'Transverse' }

  return (
    <div className="glass-panel cross-section-panel">
      <div className="cs-header">
        <div className="cs-title-group">
          <svg className="cs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M3 12h18M12 3v18M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
          <h3 className="panel-small-title" style={{ margin: 0 }}>Cross Section</h3>
        </div>
        <button
          className={`cs-toggle ${clipEnabled ? 'active' : ''}`}
          onClick={() => setClipEnabled(!clipEnabled)}
          aria-label="Toggle cross-section"
        >
          <span className="cs-toggle-knob" />
        </button>
      </div>

      <div className={`cs-controls ${clipEnabled ? 'visible' : ''}`}>
        <div className="cs-section">
          <label className="cs-label">Anatomical Plane</label>
          <div className="cs-axis-row">
            {['x', 'y', 'z'].map(axis => (
              <button
                key={axis}
                className={`cs-axis-btn ${clipAxis === axis ? 'active' : ''}`}
                onClick={() => setClipAxis(axis)}
              >
                {axis.toUpperCase()}
                <span className="cs-axis-sub">{axisLabels[axis]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cs-section">
          <div className="cs-slider-header">
            <label className="cs-label">Slice Depth</label>
            <span className="cs-value">{Math.round(((clipPosition + 1) / 2) * 100)}%</span>
          </div>
          <div className="cs-slider-wrap">
            <input
              type="range"
              className="cs-slider"
              min={-1}
              max={1}
              step={0.01}
              value={clipPosition}
              onChange={e => setClipPosition(parseFloat(e.target.value))}
            />
            <div
              className="cs-slider-fill"
              style={{ width: `${((clipPosition + 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="cs-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>Slice through tissue layers to reveal internal cavities and morphology</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   QUIZ MODULE — Interactive clinical review
   ───────────────────────────────────────────── */
function QuizModule({ onClose, activeOrgan }) {
  const questions = anatomyData[activeOrgan]?.quiz || []
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)

  const q = questions[current]

  const handleAnswer = (idx) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === q.answer) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowResult(false)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setShowResult(false)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    let emoji = '🎉'
    let msg = 'Outstanding Mastery!'
    if (pct < 50) { emoji = '📚'; msg = 'Needs Review' }
    else if (pct < 80) { emoji = '👍'; msg = 'Solid Foundation!' }

    return (
      <div className="quiz-overlay">
        <div className="glass-panel quiz-panel quiz-results">
          <div className="quiz-emoji">{emoji}</div>
          <h2 className="quiz-score-title">{msg}</h2>
          <div className="quiz-score-ring">
            <span className="quiz-score-number">{score}/{questions.length}</span>
            <span className="quiz-score-pct">{pct}%</span>
          </div>
          <div className="quiz-actions">
            <button className="cta-btn" onClick={handleRestart}>Retake Quiz</button>
            <button className="cta-btn secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-overlay">
      <div className="glass-panel quiz-panel">
        <div className="quiz-header">
          <span className="quiz-progress">Question {current + 1} of {questions.length}</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
        <h3 className="quiz-question">{q.question}</h3>
        <div className="quiz-options">
          {q.options.map((opt, idx) => {
            let cls = 'quiz-option'
            if (showResult) {
              if (idx === q.answer) cls += ' correct'
              else if (idx === selected) cls += ' wrong'
            } else if (idx === selected) {
              cls += ' selected'
            }
            return (
              <button key={idx} className={cls} onClick={() => handleAnswer(idx)}>
                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            )
          })}
        </div>
        {showResult && (
          <div className="quiz-explanation">
            <p>{q.explanation}</p>
            <button className="cta-btn" onClick={handleNext}>
              {current + 1 >= questions.length ? 'View Performance' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SHORTCUTS MODAL
   ───────────────────────────────────────────── */
function ShortcutsModal({ onClose }) {
  const shortcuts = [
    { key: 'Space', desc: 'Toggle auto-rotation' },
    { key: 'M', desc: 'Toggle cardiac/respiratory sound' },
    { key: 'X', desc: 'Toggle cross-section slice' },
    { key: '1 - 6', desc: 'Quick switch organ systems' },
    { key: 'P', desc: 'Toggle animation pause/play' },
    { key: 'Esc', desc: 'Deselect structure / Close modal' },
    { key: '?', desc: 'Open keyboard guide' }
  ]

  return (
    <div className="quiz-overlay" onClick={onClose}>
      <div className="glass-panel modal-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2 className="panel-title">⌨️ Keyboard Shortcuts</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="shortcuts-list">
          {shortcuts.map((s, i) => (
            <div key={i} className="shortcut-row">
              <kbd className="shortcut-key">{s.key}</kbd>
              <span className="shortcut-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   STATS MODAL
   ───────────────────────────────────────────── */
function StatsModal({ onClose }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

  return (
    <div className="quiz-overlay" onClick={onClose}>
      <div className="glass-panel modal-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h2 className="panel-title">📊 Anatomical Atlas Scope</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.totalOrgans}</span>
              <span className="stat-label">Organ Systems</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.totalStructures}</span>
              <span className="stat-label">Mapped Structures</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.totalQuestions}</span>
              <span className="stat-label">Board-Style Questions</span>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Loading atlas metadata...</p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN VIEWER PAGE
   ───────────────────────────────────────────── */
const ORGAN_BANNERS = {
  heart: {
    icon: '🫀',
    title: 'The Human Heart',
    desc: 'Muscular pump generating ~100,000 beats daily to circulate 7,500L of blood through 60,000 miles of vessels'
  },
  lungs: {
    icon: '🫁',
    title: 'Respiratory System',
    desc: 'Bilateral gas exchange organs presenting 70–100 m² of alveolar diffusion membrane surface area'
  },
  liver: {
    icon: '🧬',
    title: 'The Liver & Biliary System',
    desc: 'Massive metabolic laboratory performing 500+ vital functions with dual arterial and portal venous inflow'
  },
  brain: {
    icon: '🧠',
    title: 'The Human Brain',
    desc: 'Central neurological command containing 86B neurons and 100T synapses consuming 20% of basal metabolic rate'
  },
  kidneys: {
    icon: '🫘',
    title: 'Renal & Excretory System',
    desc: 'Retroperitoneal filtration organs processing 180L of plasma daily to maintain fluid-electrolyte homeostasis'
  }
}

export default function ViewerPage() {
  const [selectedPart, setSelectedPart] = useState(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [activeOrgan, setActiveOrgan] = useState('heart')

  // Visual mode: 'standard' | 'xray' | 'wireframe'
  const [visualMode, setVisualMode] = useState('standard')

  // Camera preset trigger
  const [viewPreset, setViewPreset] = useState('anterior')

  // Cardiac BPM & animation
  const [bpm, setBpm] = useState(72)
  const [isAnimating, setIsAnimating] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Cross-section state
  const [clipEnabled, setClipEnabled] = useState(false)
  const [clipPosition, setClipPosition] = useState(0)
  const [clipAxis, setClipAxis] = useState('x')

  // Mobile sidebar collapse
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true)

  // Scene ref for screenshot
  const sceneRef = useRef(null)

  // Screen-space projected labels
  const [projectedLabels, setProjectedLabels] = useState({})
  const labelsRef = useRef({})
  const rafId = useRef(null)

  const handleProjectedLabels = useCallback((labels) => {
    labelsRef.current = labels
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        setProjectedLabels({ ...labelsRef.current })
        rafId.current = null
      })
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  const handleSelectPart = useCallback((partId) => {
    setSelectedPart(partId)
  }, [])

  const handleOrganChange = useCallback((organId) => {
    setActiveOrgan(organId)
    setSelectedPart(null)
    soundEngine.setOrgan(organId)
  }, [])

  const handleToggleSound = useCallback(() => {
    const next = soundEngine.toggle()
    setSoundEnabled(next)
  }, [])

  const handleBpmChange = useCallback((newBpm) => {
    setBpm(newBpm)
    soundEngine.setBpm(newBpm)
  }, [])

  const handleCaptureScreenshot = useCallback(() => {
    if (sceneRef.current) {
      const dataUrl = sceneRef.current.captureScreenshot()
      if (dataUrl) {
        const link = document.createElement('a')
        link.download = `BioAnimations-${activeOrgan}-${Date.now()}.png`
        link.href = dataUrl
        link.click()
      }
    }
  }, [activeOrgan])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return

      if (e.code === 'Space') {
        e.preventDefault()
        setAutoRotate(r => !r)
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleSound()
      } else if (e.key === 'x' || e.key === 'X') {
        setClipEnabled(c => !c)
      } else if (e.key === 'p' || e.key === 'P') {
        setIsAnimating(a => !a)
      } else if (e.key === 'Escape') {
        setSelectedPart(null)
        setQuizOpen(false)
        setShortcutsOpen(false)
        setStatsOpen(false)
      } else if (e.key === '?') {
        setShortcutsOpen(s => !s)
      } else if (e.key === '1') handleOrganChange('heart')
      else if (e.key === '2') handleOrganChange('lungs')
      else if (e.key === '3') handleOrganChange('liver')
      else if (e.key === '4') handleOrganChange('brain')
      else if (e.key === '5') handleOrganChange('kidneys')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleSound, handleOrganChange])

  const banner = ORGAN_BANNERS[activeOrgan]

  return (
    <div className="viewer-root">
      {/* ── Top Bar ── */}
      <header className="top-bar">
        <div className="logo-group">
          <span className="logo-icon">🧬</span>
          <div>
            <h1 className="logo-text">Bio animations</h1>
            <span className="logo-subtitle">Interactive 3D Anatomy</span>
          </div>
        </div>

        {/* Organ Selector Tabs */}
        <nav className="organ-tabs">
          {[
            { id: 'heart', label: '🫀 Heart' },
            { id: 'lungs', label: '🫁 Lungs' },
            { id: 'liver', label: '🧬 Liver' },
            { id: 'brain', label: '🧠 Brain' },
            { id: 'kidneys', label: '🫘 Kidneys' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`organ-tab-btn ${activeOrgan === tab.id ? 'active' : ''}`}
              onClick={() => handleOrganChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Utility Buttons */}
        <div className="top-utils">
          <button
            className={`util-btn sound-btn ${soundEnabled ? 'active' : ''}`}
            onClick={handleToggleSound}
            title={soundEnabled ? 'Mute Audio (M)' : 'Play Physiological Audio (M)'}
          >
            {soundEnabled ? (
              <>
                <span className="sound-wave" />
                <span className="sound-wave" />
                <span className="sound-wave" />
                <span>Audio ON</span>
              </>
            ) : (
              <span>🔇 Audio</span>
            )}
          </button>

          <button
            className="util-btn"
            onClick={handleCaptureScreenshot}
            title="Download HD Snapshot"
          >
            📸 Snapshot
          </button>

          <button
            className="util-btn icon-only"
            onClick={() => setStatsOpen(true)}
            title="Atlas Statistics"
          >
            📊
          </button>

          <button
            className="util-btn icon-only"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard Shortcuts (?)"
          >
            ⌨️
          </button>
        </div>
      </header>

      {/* ── Left Column Drawer Toggle (Mobile) ── */}
      <button
        className={`drawer-toggle-btn ${leftDrawerOpen ? 'open' : ''}`}
        onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
        title="Toggle Structures Drawer"
      >
        {leftDrawerOpen ? '◀' : '▶'}
      </button>

      {/* ── Left Column ── */}
      <aside className={`left-column ${leftDrawerOpen ? 'open' : 'closed'}`}>
        <SearchPanel onSelectResult={handleSelectPart} activeOrgan={activeOrgan} />
        <PartsList selectedPart={selectedPart} onSelectPart={handleSelectPart} activeOrgan={activeOrgan} />
        <CrossSectionPanel
          clipEnabled={clipEnabled}
          setClipEnabled={setClipEnabled}
          clipPosition={clipPosition}
          setClipPosition={setClipPosition}
          clipAxis={clipAxis}
          setClipAxis={setClipAxis}
        />
      </aside>

      {/* ── 3D Canvas ── */}
      <Scene
        ref={sceneRef}
        onSelectPart={handleSelectPart}
        selectedPart={selectedPart}
        clipEnabled={clipEnabled}
        clipPosition={clipPosition}
        clipAxis={clipAxis}
        activeOrgan={activeOrgan}
        visualMode={visualMode}
        viewPreset={viewPreset}
        bpm={bpm}
        isAnimating={isAnimating}
        autoRotate={autoRotate}
        onProjectedLabels={handleProjectedLabels}
      />

      {/* ── Screen-space Labels Overlay ── */}
      <div className="labels-overlay">
        {Object.entries(projectedLabels).map(([id, data]) => {
          if (data.behind) return null
          const isSelected = selectedPart === id

          return (
            <div
              key={id}
              className={`screen-label ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${data.x}px`,
                top: `${data.y}px`,
              }}
              onClick={() => {
                handleSelectPart(id)
                soundEngine.playClick()
              }}
            >
              <div className="screen-label-dot" />
              {isSelected && (
                <div className="screen-label-tag">
                  <div className="screen-label-connector" />
                  <div className="screen-label-text">{data.label}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Viewport Floating Toolbars ── */}
      <div className="viewport-floating-bar top-center">
        {/* View Presets Toolbar */}
        <div className="glass-pill-bar">
          {[
            { id: 'anterior', label: 'Anterior' },
            { id: 'posterior', label: 'Posterior' },
            { id: 'left', label: 'Left' },
            { id: 'right', label: 'Right' },
            { id: 'superior', label: 'Superior' },
            { id: 'isometric', label: 'Isometric' }
          ].map(p => (
            <button
              key={p.id}
              className={`pill-btn ${viewPreset === p.id ? 'active' : ''}`}
              onClick={() => setViewPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Visual Shaders Mode */}
        <div className="glass-pill-bar">
          {[
            { id: 'standard', label: 'Realistic' },
            { id: 'xray', label: 'X-Ray' },
            { id: 'wireframe', label: 'Hologram' }
          ].map(m => (
            <button
              key={m.id}
              className={`pill-btn ${visualMode === m.id ? 'active' : ''}`}
              onClick={() => setVisualMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Controls Bottom Center */}
      <div className="viewport-floating-bar bottom-center">
        <div className="glass-pill-bar playback-bar">
          <button
            className={`pill-btn ${isAnimating ? 'active' : ''}`}
            onClick={() => setIsAnimating(!isAnimating)}
            title="Toggle Animation (P)"
          >
            {isAnimating ? '⏸ Pause' : '▶ Animate'}
          </button>

          <button
            className={`pill-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto-Rotation (Space)"
          >
            {autoRotate ? '🔄 Rotating' : '⏹ Fixed'}
          </button>

          {activeOrgan === 'heart' && (
            <div className="bpm-control-wrap">
              <span className="bpm-label">Rate: {bpm} BPM</span>
              <input
                type="range"
                className="bpm-slider"
                min={50}
                max={140}
                value={bpm}
                onChange={e => handleBpmChange(parseInt(e.target.value, 10))}
              />
              <div className="bpm-quick-presets">
                <button
                  className={`bpm-chip ${bpm === 60 ? 'active' : ''}`}
                  onClick={() => handleBpmChange(60)}
                >
                  Resting (60)
                </button>
                <button
                  className={`bpm-chip ${bpm === 75 ? 'active' : ''}`}
                  onClick={() => handleBpmChange(75)}
                >
                  Normal (75)
                </button>
                <button
                  className={`bpm-chip ${bpm === 110 ? 'active' : ''}`}
                  onClick={() => handleBpmChange(110)}
                >
                  Elevated (110)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <InfoPanel
        selectedPart={selectedPart}
        onClose={() => setSelectedPart(null)}
        onStartQuiz={() => setQuizOpen(true)}
        activeOrgan={activeOrgan}
      />

      {/* ── Quiz Overlay ── */}
      {quizOpen && <QuizModule onClose={() => setQuizOpen(false)} activeOrgan={activeOrgan} />}

      {/* ── Shortcuts Modal ── */}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {/* ── Stats Modal ── */}
      {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}

      {/* ── Organ Description Banner ── */}
      {banner && !selectedPart && (
        <div className="organ-banner" key={activeOrgan}>
          <span className="organ-banner-icon">{banner.icon}</span>
          <div className="organ-banner-content">
            <span className="organ-banner-title">{banner.title}</span>
            <span className="organ-banner-desc">{banner.desc}</span>
          </div>
          <span className="organ-banner-pulse" />
        </div>
      )}

      {/* ── Bottom Bar ── */}
      <footer className="bottom-bar">
        <span>Rotate: Left Click · Zoom: Wheel · Pan: Right Click · Shortcuts: Press ?</span>
      </footer>
    </div>
  )
}