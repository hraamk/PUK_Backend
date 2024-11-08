// routes/ai.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Apply auth middleware
router.use(auth);

// Helper function to create AI messages
const createAIMessage = async (prompt, options = {}) => {
  const defaultOptions = {
    model: "claude-3-haiku-20240307",
    max_tokens: 1000,
    temperature: 0
  };

  return await anthropic.messages.create({
    ...defaultOptions,
    ...options,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }]
      }
    ]
  });
};

// Writing Enhancement Endpoint
router.post('/enhance', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'No text provided for enhancement' });
    }

    const msg = await createAIMessage(
      `Enhance this text to improve clarity, engagement, and impact while maintaining the original meaning and style. Focus on:
      - Clarity and conciseness
      - Active voice and strong verbs
      - Proper flow and transitions
      - Professional tone
      
      Original text:
      ${text}
      
      Provide just the enhanced text without any explanations or meta-commentary.`,
      { temperature: 0.3 }
    );

    res.json({ enhanced: msg.content[0].text });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ 
      message: 'Failed to enhance text',
      details: error.message 
    });
  }
});

// Summarization Endpoint
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'No text provided for summarization' });
    }

    const msg = await createAIMessage(
      `Create a clear, concise summary of the following text in bullet points. Focus on the key ideas and main points.

      Text to summarize:
      ${text}

      Provide the summary with each point on a new line, starting with a dash (-).`,
      { temperature: 0.1 }
    );

    res.json({ summary: msg.content[0].text });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ 
      message: 'Failed to summarize text',
      details: error.message 
    });
  }
});

// Writing Analysis Endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'No text provided for analysis' });
    }

    const msg = await createAIMessage(
      `Analyze this text and provide a detailed writing assessment. Focus on:

      1. Style & Tone: Evaluate the writing style, voice, and tone
      2. Structure: Assess organization, flow, and paragraph structure
      3. Clarity: Review for clarity, conciseness, and readability
      4. Suggestions: Provide specific recommendations for improvement
      
      Text to analyze:
      ${text}
      
      Format your response as a structured analysis with clear sections and actionable insights.`,
      { temperature: 0.1 }
    );

    // Parse the response into sections
    const analysis = {
      style: extractSection(msg.content[0].text, 'Style & Tone'),
      structure: extractSection(msg.content[0].text, 'Structure'),
      clarity: extractSection(msg.content[0].text, 'Clarity'),
      suggestions: extractSection(msg.content[0].text, 'Suggestions')
    };

    res.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze text',
      details: error.message 
    });
  }
});

// Helper function to extract sections from AI response
function extractSection(text, sectionName) {
  const sections = text.split(/\d\.\s+/);
  const section = sections.find(s => s.toLowerCase().includes(sectionName.toLowerCase()));
  return section ? section.replace(sectionName + ':', '').trim() : '';
}

module.exports = router;