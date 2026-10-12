const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const dbPath = path.join(__dirname, '..', 'src', 'data', 'anatomyData.json');

function getDatabase() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Bio animations API', timestamp: new Date().toISOString() });
});

// List all organs with summaries (excluding combined view)
app.get('/api/organs', (req, res) => {
  const db = getDatabase();
  const organs = Object.entries(db)
    .filter(([key]) => key !== 'all')
    .map(([key, data]) => ({
      id: key,
      title: data.title,
      description: data.description,
      structuresCount: Object.keys(data.parts || {}).length,
      quizQuestionsCount: (data.quiz || []).length
    }));
  res.json(organs);
});

// Search / list structures with filtering by organ, category, and text query
app.get('/api/structures', (req, res) => {
  const db = getDatabase();
  const organKey = req.query.organ;
  const search = req.query.q ? req.query.q.toLowerCase().trim() : '';
  const category = req.query.category ? req.query.category.toLowerCase().trim() : '';

  let results = [];

  if (organKey && db[organKey]) {
    const organParts = db[organKey].parts || {};
    results = Object.entries(organParts).map(([id, part]) => ({
      id,
      organ: organKey,
      ...part
    }));
  } else {
    // Search across all organs
    Object.entries(db).forEach(([org, orgData]) => {
      Object.entries(orgData.parts || {}).forEach(([id, part]) => {
        results.push({
          id,
          organ: org,
          ...part
        });
      });
    });
  }

  if (category) {
    results = results.filter(item => (item.category || '').toLowerCase() === category);
  }

  if (search) {
    results = results.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      (item.function && item.function.toLowerCase().includes(search)) ||
      (item.category && item.category.toLowerCase().includes(search))
    );
  }

  res.json(results);
});

// Get a single structure by ID
app.get('/api/structures/:id', (req, res) => {
  const db = getDatabase();
  const id = req.params.id;
  const organKey = req.query.organ;

  if (organKey && db[organKey]?.parts?.[id]) {
    return res.json({
      id,
      organ: organKey,
      ...db[organKey].parts[id]
    });
  }

  // Scan across organs
  for (const [org, orgData] of Object.entries(db)) {
    if (orgData.parts && orgData.parts[id]) {
      return res.json({
        id,
        organ: org,
        ...orgData.parts[id]
      });
    }
  }

  res.status(404).json({ error: 'Structure not found' });
});

// Get quiz questions
app.get('/api/quiz', (req, res) => {
  const db = getDatabase();
  const organKey = req.query.organ || 'heart';

  if (db[organKey]?.quiz) {
    res.json({
      organ: organKey,
      organTitle: db[organKey].title,
      questions: db[organKey].quiz
    });
  } else {
    res.status(404).json({ error: `No quiz found for organ: ${organKey}` });
  }
});

// Overall atlas statistics
app.get('/api/stats', (req, res) => {
  const db = getDatabase();
  let totalStructures = 0;
  let totalQuestions = 0;
  const organCounts = {};

  Object.entries(db).forEach(([org, data]) => {
    const partsCount = Object.keys(data.parts || {}).length;
    const quizCount = (data.quiz || []).length;
    totalStructures += partsCount;
    totalQuestions += quizCount;
    organCounts[org] = {
      title: data.title,
      structures: partsCount,
      questions: quizCount
    };
  });

  res.json({
    totalOrgans: Object.keys(db).length,
    totalStructures,
    totalQuestions,
    breakdown: organCounts
  });
});

app.listen(PORT, () => {
  console.log(`MedAtlas3D API running on http://localhost:${PORT}`);
});
