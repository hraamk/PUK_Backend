// routes/ai.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const User = require('../models/user');
const Document = require('../models/document');
const Project = require('../models/project');
const Board = require('../models/Kanban/kanbanboard');
const Card = require('../models/Kanban/kanbancard');


const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Apply middleware
router.all('*', auth);


const VALID_PATHS = {
  dashboard: '/',
  ai: '/ai',
  project: '/project', // Will need ID appended
  scribe: '/scribe',
  flow: '/flow',
  flowBoard: '/flow/board', // Will need ID appended
  grid: '/grid',
  board: '/board',
  calendar: '/calendar',
  focus: '/focus',
  crm: '/crm',
  support: '/support',
  knowledge: '/knowledge'
};

// Helper function to validate and construct paths
function getValidPath(type, id = '') {
  const basePath = VALID_PATHS[type];
  if (!basePath) return '/';
  
  // Handle paths that need IDs
  if (type === 'project' && id) {
    return `${basePath}/${id}`;
  }
  if (type === 'flowBoard' && id) {
    return `${basePath}/${id}`;
  }
  
  return basePath;
}

// Helper function to get user context
async function getUserContext(userId) {
  try {
    const user = await User.findById(userId).select('username role -_id');
    const projects = await Project.find({ userId })
      .select('name spaces status -_id')
      .limit(5);
    const documents = await Document.find({ owner: userId })
      .select('title status plainText lastModified -_id')
      .sort({ lastModified: -1 })
      .limit(3);
    const boards = await Board.find({ userId, isArchived: false })
      .select('title columns -_id')
      .limit(2);
    const cards = await Card.find({ userId, isArchived: false })
      .select('title priority dueDate columnId -_id')
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      user,
      recentActivity: {
        projects,
        documents,
        boards,
        cards
      }
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

// Helper Functions - Define these BEFORE the routes
async function processAICommand(prompt, context, userId) {
  try {
    console.log('Starting AI command processing for prompt:', prompt);

    const userContext = await getUserContext(userId);
    console.log('User context loaded:', userContext);

    const aiResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a friendly and helpful AI assistant for a productivity app. Be warm and engaging, like a supportive colleague. Use "I" and speak directly to the user in a natural, conversational way. The user's context is:
              
              User Info:
              ${JSON.stringify(userContext.user, null, 2)}
              
              Recent Projects:
              ${JSON.stringify(userContext.recentActivity.projects, null, 2)}
              
              Recent Documents:
              ${JSON.stringify(userContext.recentActivity.documents, null, 2)}
              
              Active Boards:
              ${JSON.stringify(userContext.recentActivity.boards, null, 2)}
              
              Recent Tasks:
              ${JSON.stringify(userContext.recentActivity.cards, null, 2)}
              
              The user says: "${prompt}"
              
              You're a friendly productivity assistant who wants to help! You can suggest actions using these paths:
              - Dashboard: / (Your central command center)
              - AI Assistant: /ai (That's me! I'm here to help)
              - Project View: /project/{projectId} (For detailed project work)
              - Document Editor: /scribe (Where ideas come to life)
              - Flow/Kanban: /flow or /flow/board/{boardId} (Visualize your workflow)
              - Grid View: /grid (Organize data your way)
              - Board View: /board (The big picture view)
              - Calendar: /calendar (Stay on schedule)
              - Focus Mode: /focus (Deep work, no distractions)
              - CRM: /crm (Manage relationships)
              - Knowledge Base: /knowledge (Your team's wisdom)

              Be enthusiastic and personal! Instead of "Opening the calendar," say something like "I'll help you schedule that!" or "Let's get that on your calendar!" Remember to:
              - Use friendly, conversational language
              - Reference the user's context naturally
              - Show enthusiasm for helping
              - Make suggestions feel personal and relevant
              - Address the user directly
              - Keep responses brief and engaging
              - do not say your are from anthropic or any other AI service just say if asked you are a cool startup ai
              
              Respond in this JSON format:
              {
                "primaryIntent": "navigation|task|conversation",
                "suggestions": [
                  {
                    "id": "unique-id",
                    "title": "Action Title (make it friendly!)",
                    "description": "Brief, engaging description",
                    "type": "dashboard|ai|project|scribe|flow|flowBoard|grid|board|calendar|focus|crm|knowledge",
                    "entityId": "optional-id-for-project-or-board"
                  }
                ],
                "conversationalResponse": "An engaging, friendly response that makes helping feel natural and personal, do not need to make it long always"
              }`
            }
          ]
        }
      ]
    });

    console.log('Raw AI Response:', {
      id: aiResponse.id,
      content: aiResponse.content[0].text
    });

    let parsedResponse;
    try {
      const responseText = aiResponse.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return getDefaultSuggestions(prompt, userId);
    }

    const suggestions = parsedResponse.suggestions.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      message: suggestion.message || suggestion.title,  // Use the friendly title directly
      path: getValidPath(suggestion.type, suggestion.entityId),
      data: {
        type: suggestion.type,
        title: prompt,
        userId,
        conversationalResponse: parsedResponse.conversationalResponse
      }
    }));

    if (parsedResponse.primaryIntent === 'conversation') {
      suggestions.unshift({
        id: 'ai-response',
        title: 'Let me help with that!',  // More friendly title
        description: parsedResponse.conversationalResponse,
        message: 'I found some helpful information',  // More personal message
        path: '/ai',
        data: {
          type: 'conversation',
          response: parsedResponse.conversationalResponse,
          userId,
          context: userContext
        }
      });
    }

    return suggestions;

  } catch (error) {
    console.error('AI processing error:', error);
    return getDefaultSuggestions(prompt, userId);
  }
}

function getDefaultSuggestions(prompt, userId) {
  return [
    {
      id: 'default-help',
      title: 'Help & Support',
      description: 'Get help with using the application',
      message: 'Opening help center',
      path: '/',
      data: {
        type: 'main',
        query: prompt,
        userId
      }
    },
    {
      id: 'default-search',
      title: 'Search',
      description: `Search for: "${prompt}"`,
      message: 'Searching...',
      path: '/ai',
      data: {
        type: 'ai',
        query: prompt,
        userId
      }
    }
  ];
}

const createAIMessage = async (prompt, options = {}) => {
  const maxRetries = 3;
  const timeout = 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

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
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Routes - Define these AFTER the helper functions
router.post('/commands', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const userId = req.user._id;

    console.log('AI Command Request:', {
      userId,
      prompt,
      context,
      timestamp: new Date().toISOString()
    });

    // Add a test log here
    console.log('About to process AI command...');

    const suggestions = await processAICommand(prompt, context, userId);
    
    console.log('AI Command Response:', {
      userId,
      suggestionsCount: suggestions.length,
      suggestions: suggestions, // Log the actual suggestions
      timestamp: new Date().toISOString()
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('AI command error:', error);
    res.status(500).json({
      error: 'Failed to process command',
      details: error.message
    });
  }
});

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