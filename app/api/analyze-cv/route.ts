import { type NextRequest, NextResponse } from "next/server"
import { parseCV } from "@/lib/cv-parser"
import { analyzeCVWithGemini } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const roastTone = formData.get("roastTone") as "light" | "heavy"
    const focusAreas = JSON.parse(formData.get("focusAreas") as string)
    const showEmojis = formData.get("showEmojis") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Bro, we need a PDF or Word document (.pdf, .doc, .docx). Other formats won't work well!" },
        { status: 400 },
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Eish! Your file is too big - needs to be under 10MB. Compress it a bit or save as PDF." },
        { status: 400 },
      )
    }

    // Parse the CV
    const parsedCV = await parseCV(file)

    // Analyze with Gemini
    const analysis = await analyzeCVWithGemini({
      cvText: parsedCV.text,
      roastTone,
      focusAreas,
      showEmojis,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        metadata: parsedCV.metadata,
      },
    })
  } catch (error) {
    console.error("Error in analyze-cv API:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Something went wrong processing your CV. Let's try that again, bana!"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
