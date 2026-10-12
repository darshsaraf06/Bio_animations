import fallbackData from '../data/anatomyData.json'

/**
 * Robust API service for MedAtlas3D.
 * Communicates with the Express backend if available (/api/...)
 * and gracefully falls back to local anatomyData.json if offline.
 */
export async function getOrgans() {
  try {
    const res = await fetch('/api/organs')
    if (!res.ok) throw new Error('API request failed')
    return await res.json()
  } catch {
    return Object.entries(fallbackData)
      .filter(([key]) => key !== 'all')
      .map(([key, data]) => ({
        id: key,
        title: data.title,
        description: data.description,
        structuresCount: Object.keys(data.parts || {}).length,
        quizQuestionsCount: (data.quiz || []).length
      }))
  }
}

export async function getStructures(organKey = null, query = '') {
  try {
    const params = new URLSearchParams()
    if (organKey) params.set('organ', organKey)
    if (query) params.set('q', query)
    const res = await fetch(`/api/structures?${params.toString()}`)
    if (!res.ok) throw new Error('API request failed')
    return await res.json()
  } catch {
    let results = []
    if (organKey && fallbackData[organKey]) {
      results = Object.entries(fallbackData[organKey].parts || {}).map(([id, part]) => ({
        id,
        organ: organKey,
        ...part
      }))
    } else {
      Object.entries(fallbackData).forEach(([org, orgData]) => {
        Object.entries(orgData.parts || {}).forEach(([id, part]) => {
          results.push({ id, organ: org, ...part })
        })
      })
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      results = results.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.function && item.function.toLowerCase().includes(q))
      )
    }
    return results
  }
}

export async function getStructureById(id, organKey = null) {
  try {
    const params = organKey ? `?organ=${organKey}` : ''
    const res = await fetch(`/api/structures/${id}${params}`)
    if (!res.ok) throw new Error('API request failed')
    return await res.json()
  } catch {
    if (organKey && fallbackData[organKey]?.parts?.[id]) {
      return { id, organ: organKey, ...fallbackData[organKey].parts[id] }
    }
    for (const [org, orgData] of Object.entries(fallbackData)) {
      if (orgData.parts?.[id]) {
        return { id, organ: org, ...orgData.parts[id] }
      }
    }
    return null
  }
}

export async function getQuiz(organKey = 'heart') {
  try {
    const res = await fetch(`/api/quiz?organ=${organKey}`)
    if (!res.ok) throw new Error('API request failed')
    const json = await res.json()
    return json.questions || []
  } catch {
    return fallbackData[organKey]?.quiz || []
  }
}

export async function getStats() {
  try {
    const res = await fetch('/api/stats')
    if (!res.ok) throw new Error('API request failed')
    return await res.json()
  } catch {
    let totalStructures = 0
    let totalQuestions = 0
    const organCounts = {}

    Object.entries(fallbackData).forEach(([org, data]) => {
      const partsCount = Object.keys(data.parts || {}).length
      const quizCount = (data.quiz || []).length
      totalStructures += partsCount
      totalQuestions += quizCount
      organCounts[org] = {
        title: data.title,
        structures: partsCount,
        questions: quizCount
      }
    })

    return {
      totalOrgans: Object.keys(fallbackData).length,
      totalStructures,
      totalQuestions,
      breakdown: organCounts
    }
  }
}
