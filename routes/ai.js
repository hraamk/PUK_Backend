// routes/ai.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/aiRateLimiter');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Apply middleware
router.use(auth);
router.use(aiRateLimiter);

const validateText = (req, res, next) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'No text provided' });
  }

  // Limit text length to prevent abuse
  if (text.length > 5000) {
    return res.status(400).json({ message: 'Text exceeds maximum length of 5000 characters' });
  }

  next();
};

// Helper function to create AI messages
const createAIMessage = async (prompt, options = {}) => {
  const maxRetries = 3;
  const timeout = 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Remove the signal from the options passed to Anthropic
      const { signal, ...anthropicOptions } = options;

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        temperature: 0,
        ...anthropicOptions,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }]
          }
        ]
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (error.name === 'AbortError') throw new Error('Request timed out');
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Writing Enhancement Endpoint
router.post('/enhance', validateText, async (req, res) => {
  try {
    const { text, style = 'professional', focus = 'clarity' } = req.body;
    
    const stylePrompts = {
      professional: 'formal and business-appropriate',
      casual: 'conversational and approachable',
      academic: 'scholarly and precise'
    };

    const focusPrompts = {
      clarity: 'clarity and conciseness',
      engagement: 'engagement and persuasion',
      technical: 'technical accuracy and detail'
    };

    const msg = await createAIMessage(
      `Enhance this text to be more ${stylePrompts[style]} while focusing on ${focusPrompts[focus]}.
      Maintain the original meaning but improve:
      - Writing quality and impact
      - Flow and structure
      - Word choice and tone
      
      Original text:
      ${text}
      
      Provide the enhanced text only, without explanations.`,
      { temperature: 0.3 }
    );

    res.json({ 
      enhanced: msg.content[0].text,
      metadata: {
        style,
        focus,
        originalLength: text.length,
        enhancedLength: msg.content[0].text.length
      }
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(error.status || 500).json({ 
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

router.post('/suggest', validateText, async (req, res) => {
  try {
    const { text, context } = req.body;

    const msg = await createAIMessage(
      `Based on this context, suggest 3 ways to continue writing. Make each suggestion brief (1-2 sentences).
      
      Current text:
      ${context}
      
      Active writing:
      ${text}
      
      Provide exactly 3 suggestions, one per line, starting with "-".`,
      { temperature: 0.7 }
    );

    const suggestions = msg.content[0].text
      .split('\n')
      .filter(line => line.startsWith('-'))
      .map(line => line.slice(1).trim());

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(error.status || 500).json({ 
      message: 'Failed to generate suggestions',
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