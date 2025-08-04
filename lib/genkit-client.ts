"use client"

import type { CVAnalysisRequest, CVAnalysisResponse } from "./cv-analysis-flow"

const GENKIT_BASE_URL = process.env.NEXT_PUBLIC_GENKIT_URL || "http://localhost:3001"

export class GenkitClient {
  private baseUrl: string

  constructor(baseUrl = GENKIT_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async analyzeCVWithGenkit(request: CVAnalysisRequest): Promise<CVAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analyzeCVFlow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: request }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.result
    } catch (error) {
      console.error("Error calling Genkit analyzeCVFlow:", error)
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to analyze CV with Genkit. Please check your connection and try again.",
      )
    }
  }

  async getQuickCVScore(cvText: string): Promise<{ score: number; quickTips: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/quickCVScoreFlow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { cvText } }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.result
    } catch (error) {
      console.error("Error getting quick CV score:", error)
      throw new Error("Failed to get CV score")
    }
  }

  async generateCVImprovements(
    cvText: string,
    targetRole: string,
    industry: string,
  ): Promise<{
    improvements: Array<{
      section: string
      current: string
      improved: string
      reasoning: string
    }>
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/generateCVImprovementsFlow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { cvText, targetRole, industry },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.result
    } catch (error) {
      console.error("Error generating CV improvements:", error)
      throw new Error("Failed to generate improvements")
    }
  }
}

export const genkitClient = new GenkitClient()
