import type { NextRequest } from "next/server"
import { parseCV } from "@/lib/cv-parser"
import { streamCVAnalysis } from "@/lib/ai-services"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const roastTone = formData.get("roastTone") as "light" | "heavy"
    const focusAreas = JSON.parse(formData.get("focusAreas") as string)
    const showEmojis = formData.get("showEmojis") === "true"

    // Optional user context
    const targetRole = formData.get("targetRole") as string | null
    const experience = formData.get("experience") as "entry" | "mid" | "senior" | null
    const industry = formData.get("industry") as string | null

    if (!file) {
      return new Response("No file provided", { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return new Response("Invalid file type", { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return new Response("File too large", { status: 400 })
    }

    // Parse the CV
    const parsedCV = await parseCV(file)

    // Prepare user context
    const userContext =
      targetRole || experience || industry
        ? {
            targetRole: targetRole || undefined,
            experience: experience || undefined,
            industry: industry || undefined,
          }
        : undefined

    // Stream analysis with AI SDK
    const result = await streamCVAnalysis({
      cvText: parsedCV.text,
      roastTone,
      focusAreas,
      showEmojis,
      userContext,
    })

    // Return the stream with metadata
    return result.toTextStreamResponse({
      headers: {
        "X-CV-Metadata": JSON.stringify(parsedCV.metadata),
      },
    })
  } catch (error) {
    console.error("Error in analyze-cv-stream API:", error)
    return new Response("Analysis failed", { status: 500 })
  }
}
