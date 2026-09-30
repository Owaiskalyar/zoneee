import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK according to system skill instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: AI-Powered Official ACR / PER Evaluation Generator
app.post('/api/evaluate-acr', async (req, res) => {
  try {
    const { officer, recentActivities, pendingTasks } = req.body;

    if (!officer) {
      return res.status(400).json({ error: 'Officer profile data is required' });
    }

    const prompt = `You are the Senior Evaluation Officer in the Performance Evaluation Wing of the Federal Investigation Agency (FIA), Islamabad Zone.
Generate an official Annual Confidential Report (ACR) / Performance Evaluation Report (PER) analysis for this officer based on their real performance metrics, sheet indicators, conduct score, and record.

OFFICER PROFILE:
Name: ${officer.name}
Cadre: ${officer.cadre} (${officer.rank})
Belt/Badge No: ${officer.badgeNo}
Wing/Circle: ${officer.circle}
Posting Duration: ${officer.postingDuration || '1 Year in Islamabad Zone'}

PERFORMANCE METRICS & CONDUCT INDICATORS:
${JSON.stringify(officer.metrics, null, 2)}
(Note: Pay special attention to Weighted Score, Conduct & Recognition Index, Appreciations vs Showcauses, Disposal Rate, and Conviction Rate)

RECENT LOGGED ACTIVITIES:
${JSON.stringify(recentActivities || [], null, 2)}

ACTIVE TASKS STATUS:
${JSON.stringify(pendingTasks || [], null, 2)}

Provide your assessment in the following strict JSON format:
{
  "acrScore": <number between 50 and 99 aligning with their weighted score and real output>,
  "grading": "<Outstanding | Very Good | Good | Satisfactory | Below Average>",
  "integrityAssessment": "<Impeccable | Beyond Reproach | Satisfactory | Requires Scrutiny>",
  "operationalEfficiencySummary": "<2-3 sentences evaluating specific metrics like convictions, enquiries closed, verification speed, or court presence>",
  "conductIndexAssessment": "<1-2 sentences analyzing their disciplinary record: appreciations, good work, and whether any showcauses or explanations were called>",
  "keyStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasForImprovement": ["<deficiency or advisory 1>", "<deficiency or advisory 2>"],
  "promotionSuitability": "<Recommended Accelerated | Recommended in Normal Course | Fitness under observation | Not Recommended>",
  "officialDossierSummary": "<Official administrative paragraph suitable for signing by the Zonal Director and transmitting to Headquarters CMS>",
  "hqRecommendation": "<Actionable next step for Headquarters posting or specialized training>"
}
Return ONLY valid JSON. No markdown backticks, no wrapping text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // Fallback in case response had surrounding formatting
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('ACR evaluation error:', error);
    return res.status(500).json({
      error: 'Failed to generate AI ACR evaluation',
      details: error?.message || 'Server error',
    });
  }
});

// Endpoint: AI Zonal Strategic Intelligence Brief
app.post('/api/zone-analytics-brief', async (req, res) => {
  try {
    const { officersSummary } = req.body;

    const prompt = `You are the Director of the Performance Evaluation Wing, FIA Islamabad Zone.
Review this aggregate statistical summary of all officers across Investigation Branch, ASI Verification, Constabulary, Naib Court, and Law Branch:

${JSON.stringify(officersSummary, null, 2)}

Generate a high-level executive briefing for the Zonal Director and Headquarters in strict JSON format:
{
  "zoneReadinessRating": "<string, e.g. 88.5% Operational Velocity>",
  "executiveSummary": "<concise strategic overview of Islamabad Zone performance>",
  "investigationPace": "<analysis of enquiries clearance vs FIR registration vs Challans>",
  "courtAndProsecutionAnalysis": "<analysis of conviction rate and court hours>",
  "constabularyAndRaidsHealth": "<analysis of raid execution, discipline, and task completion>",
  "priorityBottlenecks": ["<critical bottleneck 1>", "<critical bottleneck 2>"],
  "commandDirectives": ["<actionable directive 1>", "<actionable directive 2>", "<actionable directive 3>"]
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Zone analytics brief error:', error);
    return res.status(500).json({
      error: 'Failed to generate zone briefing',
      details: error?.message || 'Server error',
    });
  }
});

// Endpoint: AI SOP Task Directive Generator
app.post('/api/generate-task-directive', async (req, res) => {
  try {
    const { officerName, rank, cadre, objective, circle } = req.body;

    const prompt = `You are the Circle Incharge in FIA Islamabad Zone (${circle}).
Draft an official operational task assignment directive for:
Officer: ${officerName} (${rank}, ${cadre})
Target Objective: ${objective}

Output in strict JSON format:
{
  "taskTitle": "<Formal task title with reference format FIA/IZ/${circle.replace(/\\s+/g, '')}/TASK/2026>",
  "category": "<Investigation | Raid & Apprehension | Verification | Court Summons | Legal Opinion | Escort & Protocol>",
  "priority": "<CRITICAL | HIGH | MEDIUM>",
  "allocatedTimeline": "<e.g. 48 Hours | 7 Days | 14 Days>",
  "standardOperatingProcedures": ["<Step 1>", "<Step 2>", "<Step 3>"],
  "deliverables": ["<Key Deliverable 1>", "<Key Deliverable 2>"],
  "legalMandate": "<Relevant FIA Act 1974 or CrPC section reference>"
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Task directive error:', error);
    return res.status(500).json({
      error: 'Failed to generate task directive',
      details: error?.message || 'Server error',
    });
  }
});

// Headquarters CMS Sync simulation
app.post('/api/hq-sync', (req, res) => {
  const { batchData, syncType } = req.body;
  const syncId = `HQ-SYNC-FIA-ISB-${Date.now()}`;
  const timestamp = new Date().toISOString();
  
  return res.json({
    status: 'SUCCESS',
    syncId,
    timestamp,
    syncedRecordsCount: Array.isArray(batchData) ? batchData.length : 1,
    checksum: `SHA256:${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
    destination: 'FIA Headquarters CMS - Central PER Repository (G-9/4 Islamabad)',
    message: 'Official ACR and Daily Roster records successfully transmitted and cryptographically acknowledged.',
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FIA Islamabad Zone CMS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
