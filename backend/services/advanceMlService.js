const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const METADATA_PATH = path.join(__dirname, '../data/advance_metadata.json');
const INFERENCE_SCRIPT = path.join(__dirname, '../scripts/predict_inference.py');

let cachedMetadata = null;

function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_PATH)) {
      const raw = fs.readFileSync(METADATA_PATH, 'utf-8');
      cachedMetadata = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading Advance ML metadata:', err);
  }
  return cachedMetadata;
}

// Initial load
loadMetadata();

/**
 * Get symptom categories and symptom checklist metadata
 */
function getMetadata() {
  if (!cachedMetadata) {
    loadMetadata();
  }
  return cachedMetadata;
}

/**
 * Predict diseases based on selected symptoms
 * @param {Array<string>} symptoms 
 * @returns {Promise<Object>}
 */
function predict(symptoms = []) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(symptoms);
    
    execFile('python', [INFERENCE_SCRIPT, payload], (error, stdout, stderr) => {
      if (error) {
        console.error('Advance ML inference execution error:', error, stderr);
        return reject(new Error('Failed to run ML disease classification inference: ' + (stderr || error.message)));
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (parseErr) {
        console.error('Failed to parse ML inference output:', stdout);
        reject(new Error('Invalid response format from ML inference service'));
      }
    });
  });
}

module.exports = {
  getMetadata,
  predict
};
