import { ai } from "./genkit-config"
import { z } from "zod"

// Define the schema for CV analysis request
const CVAnalysisRequestSchema = z.object({
  cvText: z.string().min(50, "CV text must be at least 50 characters"),
  roastTone: z.enum(["light", "heavy"]),
  focusAreas: z.array(z.string()),
  showEmojis: z.boolean(),
  userContext: z
    .object({
      targetRole: z.string().optional(),
      experience: z.enum(["entry", "mid", "senior"]).optional(),
      industry: z.string().optional(),
    })
    .optional(),
})

// Define the schema for feedback points
const FeedbackPointSchema = z.object({
  title: z.string().describe("Creative, attention-grabbing title using local analogies"),
  content: z.string().describe("Detailed explanation with Kenyan context and personality"),
  category: z.enum([
    "Content & Writing",
    "Format & Design",
    "Skills & Experience",
    "Contact Info",
    "NGO/UN Applications",
    "Government Jobs",
    "Career Progression",
    "Industry Specific",
  ]),
  severity: z.enum(["low", "medium", "high"]),
  tip: z.string().describe("Quick, actionable fix relevant to Kenyan job market"),
  kenyanContext: z.string().describe("Specific advice for Kenyan job market").optional(),
})

// Define the schema for the complete analysis response
const CVAnalysisResponseSchema = z.object({
  overall: z.string().describe("2-3 sentence overall assessment with personality"),
  feedback: z.array(FeedbackPointSchema).min(4).max(8),
  marketReadiness: z.object({
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()).max(3),
    priorities: z.array(z.string()).max(3),
  }),
  kenyanJobMarketTips: z.array(z.string()).max(3),
})

export type CVAnalysisRequest = z.infer<typeof CVAnalysisRequestSchema>
export type CVAnalysisResponse = z.infer<typeof CVAnalysisResponseSchema>
export type FeedbackPoint = z.infer<typeof FeedbackPointSchema>

// Create the CV analysis flow
export const analyzeCVFlow = ai.defineFlow(
  {
    name: "analyzeCVFlow",
    inputSchema: CVAnalysisRequestSchema,
    outputSchema: CVAnalysisResponseSchema,
  },
  async (input) => {
    const { cvText, roastTone, focusAreas, showEmojis, userContext } = input

    // Build the system prompt with Kenyan context
    const systemPrompt = `
You are an AI career mentor specifically designed for Kenyan and East African job seekers. You understand:

KENYAN JOB MARKET CONTEXT:
- NGO and UN applications (formal, impact-focused)
- Government positions (structured, qualification-heavy)
- Banking & telecommunications (professional, tech-savvy)
- Startup ecosystem (agile, skill-focused)
- Local professional challenges (device compatibility, formatting, etc.)

PERSONALITY:
You're like a knowledgeable big sibling - direct, caring, and culturally aware. Use local expressions naturally:
- "Bro/Bana" for friendly address
- Local analogies: "matatu routes", "Gikomba market", "Kamiti Road traffic"
- Kenyan workplace references: "M-Pesa", "Safaricom", "KCB", "Equity Bank"

TONE INSTRUCTIONS:
${
  roastTone === "light"
    ? `
LIGHT ROAST ☕:
- Encouraging and supportive like advice from a caring big sister
- Gentle humor with constructive framing
- "Your CV has potential, let's polish it!"
- Focus on growth opportunities
`
    : `
HEAVY ROAST 🔥:
- Brutally honest but still helpful
- Direct language with strong local analogies
- "Your CV is like a matatu from the 90s - functional but not pretty!"
- Call out obvious mistakes without sugar-coating
`
}

FOCUS AREAS: ${focusAreas.length > 0 ? focusAreas.join(", ") : "General analysis"}

EMOJI USAGE: ${showEmojis ? "Include relevant emojis throughout" : "No emojis in response"}

${
  userContext
    ? `
USER CONTEXT:
- Target Role: ${userContext.targetRole || "Not specified"}
- Experience Level: ${userContext.experience || "Not specified"}  
- Industry: ${userContext.industry || "Not specified"}
`
    : ""
}

ANALYSIS REQUIREMENTS:
1. Provide 4-6 specific, actionable feedback points
2. Each point must include a creative title with local analogies
3. Include practical tips relevant to Kenyan job market
4. Assess market readiness with a score (0-100)
5. Highlight top 3 strengths and top 3 priorities
6. Provide 3 Kenya-specific job market tips

Remember: Be authentic, helpful, and culturally relevant while maintaining professional value.
`

    const userPrompt = `
Analyze this CV and provide structured feedback:

CV CONTENT:
${cvText}

Provide your analysis in the exact JSON structure specified in the output schema.
`

    const response = await ai.generate({
      model: "googleai/gemini-1.5-flash",
      system: systemPrompt,
      prompt: userPrompt,
      output: {
        schema: CVAnalysisResponseSchema,
      },
      config: {
        temperature: roastTone === "heavy" ? 0.8 : 0.6,
        maxOutputTokens: 2048,
      },
    })

    return response.output
  },
)

// Helper flow for quick CV scoring
export const quickCVScoreFlow = ai.defineFlow(
  {
    name: "quickCVScoreFlow",
    inputSchema: z.object({
      cvText: z.string(),
    }),
    outputSchema: z.object({
      score: z.number().min(0).max(100),
      quickTips: z.array(z.string()).max(3),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: "googleai/gemini-1.5-flash",
      prompt: `
Quickly score this CV out of 100 for the Kenyan job market and provide 3 quick improvement tips:

CV: ${input.cvText}

Consider: formatting, content quality, relevance to Kenyan employers, and completeness.
`,
      output: {
        schema: z.object({
          score: z.number().min(0).max(100),
          quickTips: z.array(z.string()).max(3),
        }),
      },
    })

    return response.output
  },
)

// Flow for generating CV improvement suggestions
export const generateCVImprovementsFlow = ai.defineFlow(
  {
    name: "generateCVImprovementsFlow",
    inputSchema: z.object({
      cvText: z.string(),
      targetRole: z.string(),
      industry: z.string(),
    }),
    outputSchema: z.object({
      improvements: z.array(
        z.object({
          section: z.string(),
          current: z.string(),
          improved: z.string(),
          reasoning: z.string(),
        }),
      ),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: "googleai/gemini-1.5-flash",
      prompt: `
Analyze this CV and suggest specific improvements for a ${input.targetRole} role in ${input.industry} in Kenya:

CV: ${input.cvText}

Provide before/after examples for key sections that need improvement.
`,
      output: {
        schema: z.object({
          improvements: z.array(
            z.object({
              section: z.string(),
              current: z.string(),
              improved: z.string(),
              reasoning: z.string(),
            }),
          ),
        }),
      },
    })

    return response.output
  },
)
