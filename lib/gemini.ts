import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export interface CVAnalysisRequest {
  cvText: string
  roastTone: "light" | "heavy"
  focusAreas: string[]
  showEmojis: boolean
}

export interface CVFeedbackPoint {
  title: string
  content: string
  category: string
  severity: "low" | "medium" | "high"
  tip?: string
}

export interface CVAnalysisResponse {
  overall: string
  feedback: CVFeedbackPoint[]
  processingTime: number
}

export async function analyzeCVWithGemini({
  cvText,
  roastTone,
  focusAreas,
  showEmojis,
}: CVAnalysisRequest): Promise<CVAnalysisResponse> {
  const startTime = Date.now()

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const kenyanContext = `
You are an AI career mentor specifically designed for Kenyan and East African job seekers. You understand the local job market, including:
- NGO and UN applications
- Government positions
- Startup ecosystem
- Banking and telecommunications sectors
- Local professional challenges (device compatibility, formatting issues, etc.)

Your personality is like a knowledgeable big sibling - direct, caring, and culturally aware. Use local expressions naturally but keep the advice professional and actionable.
`

  const toneInstructions = {
    light: `
Tone: Light Roast ☕
- Be encouraging and supportive
- Use gentle humor and friendly advice
- Sound like advice from a caring big sister/brother
- Include local expressions naturally (bro, bana, etc.)
- Focus on constructive feedback with positive framing
`,
    heavy: `
Tone: Heavy Roast 🔥
- Be brutally honest but still helpful
- Use more direct language and stronger analogies
- Include local comparisons (matatu routes, Gikomba market, etc.)
- Don't hold back on calling out obvious mistakes
- Still provide actionable solutions despite the harsh tone
`,
  }

  const focusAreasText = focusAreas.length > 0 ? `Focus especially on: ${focusAreas.join(", ")}` : ""

  const emojiInstruction = showEmojis
    ? "Include relevant emojis throughout your response to make it engaging."
    : "Do not use emojis in your response."

  const prompt = `
${kenyanContext}

${toneInstructions[roastTone]}

${emojiInstruction}

${focusAreasText}

Analyze this CV and provide feedback in the following JSON format:
{
  "overall": "A 2-3 sentence overall assessment of the CV",
  "feedback": [
    {
      "title": "Creative, attention-grabbing title for the issue",
      "content": "Detailed explanation of the problem with local context and personality",
      "category": "One of: Content & Writing, Format & Design, Skills & Experience, Contact Info, NGO/UN Applications, Government Jobs",
      "severity": "low, medium, or high",
      "tip": "Quick, actionable fix for the issue"
    }
  ]
}

Provide 4-6 feedback points. Make sure each point includes:
1. A creative title that uses local analogies or expressions
2. Content that explains the issue with personality and local context
3. A practical tip that's relevant to the Kenyan job market

CV Content to analyze:
${cvText}
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Could not parse JSON response from Gemini")
    }

    const analysisData = JSON.parse(jsonMatch[0])
    const processingTime = (Date.now() - startTime) / 1000

    return {
      overall: analysisData.overall,
      feedback: analysisData.feedback,
      processingTime,
    }
  } catch (error) {
    console.error("Error analyzing CV with Gemini:", error)
    throw new Error("Failed to analyze CV. Please try again.")
  }
}
