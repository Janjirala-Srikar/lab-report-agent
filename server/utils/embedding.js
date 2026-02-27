// utils/embedding.js

const { env, AutoTokenizer, AutoModel } = require("@xenova/transformers");

env.allowLocalModels = true;
env.allowRemoteModels = true;

let model = null;
let tokenizer = null;

// ==========================================
// INITIALIZE MODEL (Lazy Load)
// ==========================================
async function initializeModel() {
  if (model && tokenizer) return;

  console.log("Loading MiniLM embedding model...");
  tokenizer = await AutoTokenizer.from_pretrained(
    "Xenova/all-MiniLM-L6-v2"
  );
  model = await AutoModel.from_pretrained(
    "Xenova/all-MiniLM-L6-v2"
  );
  console.log("MiniLM loaded successfully!");
}

// ==========================================
// MEAN POOLING (Correct 3D Handling)
// ==========================================
function meanPooling(lastHiddenState, attentionMask) {
  const data = lastHiddenState.data;

  // MiniLM output dims = [batchSize, seqLength, hiddenSize]
  const [batchSize, seqLength, hiddenSize] = lastHiddenState.dims;

  const meanPooled = new Array(hiddenSize).fill(0);
  let validTokens = 0;

  for (let i = 0; i < seqLength; i++) {
    // Skip padding tokens
    if (attentionMask && attentionMask[i] === 0) continue;

    validTokens++;

    for (let j = 0; j < hiddenSize; j++) {
      meanPooled[j] += data[i * hiddenSize + j];
    }
  }

  if (validTokens > 0) {
    for (let i = 0; i < hiddenSize; i++) {
      meanPooled[i] /= validTokens;
    }
  }

  return meanPooled;
}

// ==========================================
// NORMALIZE VECTOR (Unit Length)
// ==========================================
function normalizeVector(vec) {
  const magnitude = Math.sqrt(
    vec.reduce((sum, v) => sum + v * v, 0)
  );

  if (magnitude === 0) return vec;

  return vec.map((v) => v / magnitude);
}

// ==========================================
// COSINE SIMILARITY
// ==========================================
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  const dotProduct = vecA.reduce(
    (sum, a, i) => sum + a * vecB[i],
    0
  );

  const magnitudeA = Math.sqrt(
    vecA.reduce((sum, a) => sum + a * a, 0)
  );

  const magnitudeB = Math.sqrt(
    vecB.reduce((sum, b) => sum + b * b, 0)
  );

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

// ==========================================
// MAIN EMBEDDING FUNCTION
// ==========================================
async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text for embedding");
    }

    const trimmed = text.trim().slice(0, 512);

    await initializeModel();

    const encoded = tokenizer(trimmed, {
      padding: true,
      truncation: true,
    });

    const output = await model(encoded);

    const embedding = meanPooling(
      output.last_hidden_state,
      output.attention_mask?.data || output.attention_mask
    );

    const normalizedEmbedding = normalizeVector(embedding);

    console.log(
      "Embedding length:",
      normalizedEmbedding.length
    );

    return normalizedEmbedding;
  } catch (error) {
    console.error(
      "Local Embedding Error:",
      error.message
    );
    throw error;
  }
}

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  generateEmbedding,
  cosineSimilarity,
  normalizeVector,
};