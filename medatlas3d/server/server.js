const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

const dbPath = path.join(__dirname, '..', 'src', 'data', 'anatomyData.json');

function getDatabase() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

// Search / list all structures
app.get('/api/structures', (req, res) => {
  const db = getDatabase();
  const search = req.query.q ? req.query.q.toLowerCase() : '';

  const allParts = db.heart.parts;
  const results = Object.keys(allParts).map(key => ({
    id: key,
    ...allParts[key]
  }));

  if (search) {
    const filtered = results.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      (item.category && item.category.toLowerCase().includes(search))
    );
    res.json(filtered);
  } else {
    res.json(results);
  }
});

// Get a single structure by ID
app.get('/api/structures/:id', (req, res) => {
  const db = getDatabase();
  const partData = db.heart.parts[req.params.id];
  if (partData) {
    res.json(partData);
  } else {
    res.status(404).json({ error: 'Structure not found' });
  }
});

// Get quiz questions
app.get('/api/quiz', (req, res) => {
  const db = getDatabase();
  res.json(db.heart.quiz || []);
});

app.listen(PORT, () => {
  console.log(`MedAtlas3D API running on http://localhost:${PORT}`);
});
