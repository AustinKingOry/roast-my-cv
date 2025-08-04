"use client"

import { useState, useCallback } from "react"
import type { CVAnalysisResponse } from "@/lib/cv-analysis-flow"

export interface GenkitCVAnalysisResult extends CVAnalysisResponse {
  processingTime: number
  metadata: {
    fileName: string
    fileSize: number
    fileType: string
    pageCount?: number
    wordCount: number
  }
}

export interface CVAnalysisError {
  message: string
  code?: string
}

export interface UserContext {
  targetRole?: string
  experience?: "entry" | "mid" | "senior"
  industry?: string
}

export function useGenkitCVAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<GenkitCVAnalysisResult | null>(null)
  const [error, setError] = useState<CVAnalysisError | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const analyzeCV = useCallback(
    async (
      file: File,
      options: {
        roastTone: "light" | "heavy"
        focusAreas: string[]
        showEmojis: boolean
        userContext?: UserContext
      },
    ) => {
      setIsAnalyzing(true)
      setError(null)
      setResult(null)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("roastTone", options.roastTone)
        formData.append("focusAreas", JSON.stringify(options.focusAreas))
        formData.append("showEmojis", options.showEmojis.toString())

        // Add user context if provided
        if (options.userContext?.targetRole) {
          formData.append("targetRole", options.userContext.targetRole)
        }
        if (options.userContext?.experience) {
          formData.append("experience", options.userContext.experience)
        }
        if (options.userContext?.industry) {
          formData.append("industry", options.userContext.industry)
        }

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + Math.random() * 10
          })
        }, 200)

        const response = await fetch("/api/analyze-cv-genkit", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to analyze CV")
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || "Analysis failed")
        }

        setResult(data.data)
      } catch (err) {
        const error = err as Error
        setError({
          message: error.message,
          code: "ANALYSIS_FAILED",
        })
      } finally {
        setIsAnalyzing(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsAnalyzing(false)
    setUploadProgress(0)
  }, [])

  return {
    analyzeCV,
    isAnalyzing,
    result,
    error,
    uploadProgress,
    reset,
  }
}
