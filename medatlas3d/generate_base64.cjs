const fs = require('fs');
const path = require('path');

const glbPath = '/Users/darshmsaraf/Documents/Code /bio animation/medatlas3d/public/models/heart.glb';
const outputPath = '/Users/darshmsaraf/Documents/Code /bio animation/medatlas3d/src/data/heartModelBase64.js';

console.log("Reading GLB file...");
const data = fs.readFileSync(glbPath);
console.log("Converting to base64...");
const base64 = data.toString('base64');
console.log("Writing to JS file...");
fs.writeFileSync(outputPath, `export default "${base64}";\n`);
console.log("Done! Created heartModelBase64.js successfully.");
