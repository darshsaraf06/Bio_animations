import { useState, useEffect, useCallback, useRef } from 'react'
import Scene from '../components/Viewer/Scene'
import anatomyData from '../data/anatomyData.json'

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
        <button className="close-btn" onClick={onClose}>×</button>
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
              <h3 className="section-label">Function</h3>
              <p className="section-text accent">{partInfo.function}</p>
            </div>
          </>
        )}

        {activeTab === 'clinical' && (
          <div className="info-section">
            <h3 className="section-label">Clinical Significance</h3>
            <p className="section-text">{partInfo.clinical}</p>
          </div>
        )}

        {activeTab === 'facts' && (
          <div className="info-section">
            <h3 className="section-label">Key Facts</h3>
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
          p.description.toLowerCase().includes(query.toLowerCase())
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
              onClick={() => { onSelectResult(r.id); setQuery(''); setOpen(false) }}
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
    organ: '🧬 Organs',
    chamber: '🫀 Chambers',
    vessel: '🩸 Vessels & Airways',
    valve: '🔒 Valves & Alveoli'
  }

  return (
    <div className="glass-panel parts-panel">
      <h3 className="panel-small-title">Structures</h3>
      {Object.entries(categories).map(([cat, parts]) => (
        <div key={cat} className="category-group">
          <div className="category-label">{categoryLabels[cat] || cat}</div>
          {parts.map(p => (
            <button
              key={p.id}
              className={`part-btn ${selectedPart === p.id ? 'active' : ''}`}
              onClick={() => onSelectPart(p.id)}
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
      {/* Header with toggle */}
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

      {/* Controls — visible when enabled */}
      <div className={`cs-controls ${clipEnabled ? 'visible' : ''}`}>
        {/* Axis selector */}
        <div className="cs-section">
          <label className="cs-label">Slice Plane</label>
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

        {/* Position slider */}
        <div className="cs-section">
          <div className="cs-slider-header">
            <label className="cs-label">Slice Position</label>
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

        {/* Hint */}
        <div className="cs-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>Drag the slider to slice through the heart and reveal internal structures</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   QUIZ MODULE — Bottom overlay quiz
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
    let msg = 'Outstanding!'
    if (pct < 50) { emoji = '📚'; msg = 'Keep studying!' }
    else if (pct < 80) { emoji = '👍'; msg = 'Good job!' }

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
            <button className="cta-btn" onClick={handleRestart}>Try Again</button>
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
              {current + 1 >= questions.length ? 'See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN VIEWER PAGE
   ───────────────────────────────────────────── */
const ORGAN_BANNERS = {
  heart: { icon: '🫀', title: 'Human Heart', desc: 'Muscular organ pumping ~2,000 gallons of blood daily through 60,000 miles of vessels' },
  lungs: { icon: '🫁', title: 'Respiratory System', desc: 'Two spongy organs facilitating gas exchange across 70m² of alveolar surface area' },
  liver: { icon: '🧬', title: 'Liver', desc: 'Largest internal organ performing 500+ vital functions including detoxification & bile production' },
  all:   { icon: '🧍', title: 'Thoracic & Abdominal Organs', desc: 'Combined view — heart, lungs, and liver in anatomical position' }
}

export default function ViewerPage() {
  const [selectedPart, setSelectedPart] = useState(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const [activeOrgan, setActiveOrgan] = useState('heart')

  // Cross-section state
  const [clipEnabled, setClipEnabled] = useState(false)
  const [clipPosition, setClipPosition] = useState(0)
  const [clipAxis, setClipAxis] = useState('x')

  // Screen-space projected labels — stored in ref to avoid re-renders each frame
  const [projectedLabels, setProjectedLabels] = useState({})
  const labelsRef = useRef({})
  const rafId = useRef(null)

  // Throttle projected label updates to ~30fps to avoid excessive React re-renders
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
  }, [])

  const banner = ORGAN_BANNERS[activeOrgan]

  return (
    <div className="viewer-root">
      {/* ── Top Bar ── */}
      <header className="top-bar">
        <div className="logo-group">
          <span className="logo-icon">🫀</span>
          <h1 className="logo-text">MedAtlas3D</h1>
        </div>
        <nav className="organ-tabs">
          {[
            { id: 'heart', label: '🫀 Heart' },
            { id: 'lungs', label: '🫁 Lungs' },
            { id: 'liver', label: '🧬 Liver' },
            { id: 'all', label: '🧍 All Organs' }
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
      </header>

      {/* ── Left Column ── */}
      <aside className="left-column">
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
        onSelectPart={handleSelectPart}
        selectedPart={selectedPart}
        clipEnabled={clipEnabled}
        clipPosition={clipPosition}
        clipAxis={clipAxis}
        activeOrgan={activeOrgan}
        onProjectedLabels={handleProjectedLabels}
      />

      {/* ── Screen-space Labels Overlay ── */}
      <div className="labels-overlay">
        {Object.entries(projectedLabels).map(([id, data]) => {
          if (data.behind) return null
          const isSelected = selectedPart === id
          const showLabel = isSelected

          return (
            <div
              key={id}
              className={`screen-label ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${data.x}px`,
                top: `${data.y}px`,
              }}
              onClick={() => handleSelectPart(id)}
            >
              <div className="screen-label-dot" />
              {showLabel && (
                <div className="screen-label-tag">
                  <div className="screen-label-connector" />
                  <div className="screen-label-text">{data.label}</div>
                </div>
              )}
            </div>
          )
        })}
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
        <span>Left click to rotate · Scroll to zoom · Right click to pan</span>
      </footer>
    </div>
  )
}