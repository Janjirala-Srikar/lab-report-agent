const Groq = require("groq-sdk");
const {
  generateEmbedding,
  cosineSimilarity,
} = require("../utils/embedding");
const reportModel = require("../models/reportModel");
const crypto = require("crypto");

// =========================================
// 🔥 GROQ CLIENT
// =========================================
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// =========================================
// 🔥 Safe embedding parser
// =========================================
const parseEmbedding = (value) => {
  if (!value) return null;

  if (Array.isArray(value)) return value;

  if (Buffer.isBuffer(value)) {
    return JSON.parse(value.toString());
  }

  if (typeof value === "string") {
    return JSON.parse(value);
  }

  return value;
};

exports.askAgent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ message: "Question is required" });
    }

    // =========================================
    // STEP 1: Generate embedding for question
    // =========================================
    const questionEmbedding = await generateEmbedding(question);

    // =========================================
    // STEP 2: SEMANTIC GROUPING
    // =========================================
    const previousQuestions = await reportModel.getUserQuestions(userId);

    let bestMatchGroup = null;
    let highestSimilarity = 0;

    for (const q of previousQuestions) {
      const storedEmbedding = parseEmbedding(q.embedding);
      if (!storedEmbedding) continue;

      const similarity = cosineSimilarity(
        questionEmbedding,
        storedEmbedding
      );

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatchGroup = q.group_id;
      }
    }

    let groupId;

    if (highestSimilarity > 0.45) {
      groupId = bestMatchGroup;
      console.log("🔁 Using existing semantic group");
    } else {
      groupId = crypto.randomUUID();
      console.log("🆕 Creating new semantic group");
    }

    // =========================================
    // STEP 3: Retrieve Medical Report Context (RAG)
    // =========================================
    const reports = await reportModel.getUserEmbeddings(userId);

    if (!reports || reports.length === 0) {
      return res.status(400).json({
        message: "No medical reports found for this user",
      });
    }

    let scoredReports = reports.map((r) => {
      const reportEmbedding = parseEmbedding(r.embedding);

      if (!reportEmbedding) {
        return { summary: r.summary_text, similarity: 0 };
      }

      return {
        summary: r.summary_text,
        similarity: cosineSimilarity(
          questionEmbedding,
          reportEmbedding
        ),
      };
    });

    scoredReports.sort((a, b) => b.similarity - a.similarity);
    const topReports = scoredReports.slice(0, 3);

    let medicalContext = "";
    topReports.forEach((r, i) => {
      medicalContext += `Medical Report ${i + 1}:\n${r.summary}\n\n`;
    });

    // =========================================
    // STEP 4: Retrieve Group Conversation History
    // =========================================
    const groupHistory = await reportModel.getGroupHistory(
      userId,
      groupId
    );

    let conversationContext = "";

    const recentHistory = groupHistory.slice(-5);

    recentHistory.forEach((item) => {
      conversationContext += `User: ${item.question}\n`;
      conversationContext += `AI: ${item.answer}\n\n`;
    });

    // =========================================
    // STEP 5: Build Prompt
    // =========================================
    const prompt = `
You are an advanced medical AI assistant with long-term memory.

Patient Medical History:
${medicalContext}

Previous Related Conversation:
${conversationContext}

User Question:
${question}

Instructions:
1. Analyze relevant medical history.
2. Compare values if needed.
3. Detect trends if applicable.
4. Provide reasoning before conclusion.
5. Answer clearly in:
   - English
   - Hindi
6. Add final note:
"This is AI-generated information. Please consult a licensed physician."
`;

    // =========================================
    // STEP 6: GROQ LLM RESPONSE
    // =========================================
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a professional medical AI assistant with reasoning capability.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 1000,
    });

    const answer =
      completion.choices[0]?.message?.content || "";

    if (!answer) {
      throw new Error("Empty response from Groq");
    }

    // =========================================
    // STEP 7: Save Chat History
    // =========================================
    await reportModel.saveChatHistory(
      userId,
      groupId,
      question,
      answer,
      questionEmbedding
    );

    res.json({
      groupId,
      similarityScore: highestSimilarity,
      answer,
    });

  } catch (error) {
    console.error("Agent Error FULL:", error);

    res.status(500).json({
      message: "Agent failed",
      error: error.message,
    });
  }
};