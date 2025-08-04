"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, Zap, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface UploadZoneProps {
  onFileUpload: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number
  error?: string | null
  disabled?: boolean
}

export function UploadZone({
  onFileUpload,
  isUploading = false,
  uploadProgress = 0,
  error,
  disabled,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return "Bro, we need a PDF or Word document (.pdf, .doc, .docx). Other formats won't work well with most Kenyan systems!"
    }

    if (file.size > maxSize) {
      return "Eish! Your file is too big - needs to be under 10MB. Compress it a bit or save as PDF."
    }

    if (file.size < 1024) {
      return "This file seems too small to be a proper CV. Make sure you're uploading the right document!"
    }

    return null
  }

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      setValidationError(null)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      const file = files[0]

      if (file) {
        const error = validateFile(file)
        if (error) {
          setValidationError(error)
          return
        }
        onFileUpload(file)
      }
    },
    [onFileUpload, disabled],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && !disabled) {
      setValidationError(null)
      const error = validateFile(file)
      if (error) {
        setValidationError(error)
        return
      }
      onFileUpload(file)
    }
  }

  if (isUploading) {
    return (
      <Card className="border-2 border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              {uploadProgress < 100 ? (
                <Upload className="w-8 h-8 text-white animate-pulse relative z-10" />
              ) : (
                <FileCheck className="w-8 h-8 text-white relative z-10" />
              )}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fillOpacity='0.5'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {uploadProgress < 100 ? "Uploading your CV... 📤" : "Processing your CV... 🔥"}
            </h3>
            <p className="text-gray-600 mb-4">
              {uploadProgress < 100
                ? "Hold tight, we're getting your file ready"
                : "Our AI is reading your CV and preparing some real talk"}
            </p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto mb-2" />
            <p className="text-sm text-emerald-600 font-medium">{uploadProgress}% complete</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {(error || validationError) && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error || validationError}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-all duration-200 relative overflow-hidden">
        {/* Subtle pattern background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%2310b981' fillOpacity='0.1'%3E%3Cpath d='M30 30c0-16.569-13.431-30-30-30v30h30zM0 30v30h30c0-16.569-13.431-30-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <CardContent className="p-8 relative z-10">
          <div
            className={`rounded-xl p-12 text-center transition-all duration-200 ${
              isDragOver
                ? "bg-emerald-50 border-2 border-emerald-500"
                : disabled
                  ? "bg-gray-50 opacity-50"
                  : "hover:bg-emerald-50/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              <Upload className="w-8 h-8 text-white relative z-10" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fillOpacity='0.3'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop your CV here to get roasted! 🎯</h3>
            <p className="text-gray-600 mb-6">
              Get real feedback that'll help you land that job faster - no sugar-coating! 💪
            </p>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={disabled}
            />
            <label htmlFor="file-upload">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold relative overflow-hidden"
                disabled={disabled}
              >
                <FileText className="w-5 h-5 mr-2" />
                Choose File
                <Zap className="w-4 h-4 ml-2 opacity-70" />
              </Button>
            </label>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>PDF, DOC, DOCX (max 10MB) - works on any device!</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-medium">
                <span>🔒</span>
                <span>Your CV is processed securely and never stored - promise!</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
