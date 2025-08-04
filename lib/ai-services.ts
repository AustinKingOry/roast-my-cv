import { generateObject, streamObject } from "ai"
import { model, CVAnalysisSchema, QuickScoreSchema, CVImprovementSchema } from "./ai-config"
import {
  buildSystemPrompt,
  buildAnalysisPrompt,
  buildQuickScorePrompt,
  buildImprovementPrompt,
  type UserContext,
} from "./ai-prompts"

export interface CVAnalysisRequest {
  cvText: string
  roastTone: "light" | "heavy"
  focusAreas: string[]
  showEmojis: boolean
  userContext?: UserContext
}

export async function analyzeCVWithAI(request: CVAnalysisRequest) {
  const { cvText, roastTone, focusAreas, showEmojis, userContext } = request

  const systemPrompt = buildSystemPrompt(roastTone, focusAreas, showEmojis, userContext)
  const userPrompt = buildAnalysisPrompt(cvText)

  return await generateObject({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    schema: CVAnalysisSchema,
    temperature: roastTone === "heavy" ? 0.8 : 0.6,
    maxOutputTokens: 2048,
  })
}

export async function streamCVAnalysis(request: CVAnalysisRequest) {
  const { cvText, roastTone, focusAreas, showEmojis, userContext } = request

  const systemPrompt = buildSystemPrompt(roastTone, focusAreas, showEmojis, userContext)
  const userPrompt = buildAnalysisPrompt(cvText)

  return streamObject({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    schema: CVAnalysisSchema,
    temperature: roastTone === "heavy" ? 0.8 : 0.6,
    maxOutputTokens: 2048,
  })
}

export async function getQuickCVScore(cvText: string) {
  const prompt = buildQuickScorePrompt(cvText)

  return await generateObject({
    model,
    prompt,
    schema: QuickScoreSchema,
    temperature: 0.3,
  })
}

export async function generateCVImprovements(cvText: string, targetRole: string, industry: string) {
  const prompt = buildImprovementPrompt(cvText, targetRole, industry)

  return await generateObject({
    model,
    prompt,
    schema: CVImprovementSchema,
    temperature: 0.5,
  })
}
