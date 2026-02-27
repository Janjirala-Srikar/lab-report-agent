const Groq = require("groq-sdk");
const {
  generateEmbedding,
  cosineSimilarity,
} = require("../utils/embedding");
const reportModel = require("../models/reportModel");
const crypto = require("crypto");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// -----------------------------
// Safe JSON parser
// -----------------------------
const parseJSON = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// -----------------------------
// Medical Intent Detection
// -----------------------------
const isMedicalQuestion = (question) => {
  const medicalKeywords = [
    "blood", "report", "hemoglobin", "hb",
    "glucose", "sugar", "cholesterol",
    "anemia", "tlc", "hba1c",
    "rbc", "wbc", "platelet",
    "test", "level", "count",
    "thyroid", "creatinine"
  ];

  return medicalKeywords.some(keyword =>
    question.toLowerCase().includes(keyword)
  );
};

// -----------------------------
// Generate Tags
// -----------------------------
const generateTags = async (question) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `
Generate 2-3 short single-word topic tags.
Return ONLY a JSON array.
No explanation.
Example:
["identity","name"]
        `
      },
      { role: "user", content: question }
    ],
    temperature: 0.2,
    max_tokens: 100,
  });

  const raw = completion.choices[0]?.message?.content || "";

  try {
    const match = raw.match(/\[[^\]]+\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(tag => tag.toLowerCase());

  } catch (err) {
    console.log("Tag parse failed:", raw);
    return [];
  }
};

// -----------------------------
// MAIN AGENT
// -----------------------------
exports.askAgent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ message: "Question is required" });
    }

    // STEP 1: Intent Detection
    const medicalIntent = isMedicalQuestion(question);

    // STEP 2: Embedding + Tags
    const questionEmbedding = await generateEmbedding(question);
    const newTags = await generateTags(question);

    // STEP 3: Tag-Based Grouping (30% rule)
    const previousChats = await reportModel.getUserQuestions(userId);

    let groupId = null;

    for (const chat of previousChats) {
      const oldTags = parseJSON(chat.tags);
      if (!oldTags || oldTags.length === 0) continue;

      const overlap = oldTags.filter(tag =>
        newTags.includes(tag)
      );

      const similarityScore = overlap.length / newTags.length;

      if (similarityScore >= 0.3) {
        groupId = chat.group_id;
        break;
      }
    }

    if (!groupId) {
      groupId = crypto.randomUUID();
    }

    // STEP 4: Retrieve Group Conversation Memory
    const groupHistory = await reportModel.getGroupHistory(
      userId,
      groupId
    );

    let conversationContext = "";

    groupHistory.slice(-5).forEach((item) => {
      conversationContext += `User: ${item.question}\n`;
      conversationContext += `Assistant: ${item.answer}\n\n`;
    });

    // ======================================================
    // 🔥 NON-MEDICAL MODE
    // ======================================================
    if (!medicalIntent) {

      const prompt = `
Previous Conversation:
${conversationContext}

User Question:
${question}

Instructions:
- Use previous conversation context if relevant.
- If the user shared their name earlier in this group, use it.
- Answer naturally and conversationally.
`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a smart assistant with memory."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const answer =
        completion.choices[0]?.message?.content || "Okay!";

      await reportModel.saveChatHistory(
        userId,
        groupId,
        question,
        answer,
        questionEmbedding,
        newTags
      );

      return res.json({
        groupId,
        tags: newTags,
        answer,
      });
    }

    // ======================================================
    // 🔥 MEDICAL MODE (RAG)
    // ======================================================

    const reports = await reportModel.getUserEmbeddings(userId);

    if (!reports || reports.length === 0) {
      return res.status(400).json({
        message: "No medical reports found",
      });
    }

    let scoredReports = reports.map((r) => {
      const reportEmbedding = parseJSON(r.embedding);
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

    const prompt = `
You are an advanced medical AI assistant.

Patient Medical History:
${medicalContext}

Previous Conversation:
${conversationContext}

User Question:
${question}

Instructions:
- Analyze medical data carefully.
- Compare values if needed.
- Detect trends if applicable.
- Provide clear reasoning.
- End with:
"This is AI-generated information. Please consult a licensed physician."
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional medical AI assistant with reasoning capability."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1000,
    });

    const answer =
      completion.choices[0]?.message?.content || "";

    await reportModel.saveChatHistory(
      userId,
      groupId,
      question,
      answer,
      questionEmbedding,
      newTags
    );

    res.json({
      groupId,
      tags: newTags,
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