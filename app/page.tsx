"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { UploadZone } from "@/components/roast/upload-zone"
import { RoastSettings } from "@/components/roast/roast-settings"
import { UserContextForm, type UserContext } from "@/components/roast/user-context-form"
import { StreamingAnalysisDisplay } from "@/components/roast/streaming-analysis-display"
import { FeedbackCard } from "@/components/roast/feedback-card"
import { MarketReadinessScore } from "@/components/roast/market-readiness-score"
import { useCVAnalysis } from "@/hooks/use-cv-analysis"
import { useStreamingCVAnalysis } from "@/hooks/use-streaming-cv-analysis"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Download, Share2, AlertCircle, RotateCcw, ChevronRight, Zap, Heart, Sparkles, FileCheck, Upload } from "lucide-react"
import { string } from "zod/v4"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { UpgradeModal } from "@/components/modals/upgrade-modal"
import { usageTracker } from "@/lib/usage-tracker"
import { useRouter } from "next/navigation"

type RoastTone = "light" | "heavy"

export default function RoastMyCVPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [roastTone, setRoastTone] = useState<RoastTone>("light")
  const [showEmojis, setShowEmojis] = useState(true)
  const [focusAreas, setFocusAreas] = useState<string[]>(["Content & Writing", "Format & Design"])
  const [userContext, setUserContext] = useState<UserContext>({})
  const [useStreaming, setUseStreaming] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [usage, setUsage] = useState({ count: 0, limit: 1, plan: "free" })

  // Use either streaming or regular analysis based on user preference
  const regularAnalysis = useCVAnalysis()
  const streamingAnalysis = useStreamingCVAnalysis()

  const analysis = useStreaming ? streamingAnalysis : regularAnalysis
  const { analyzeCV, isAnalyzing, result, error, uploadProgress, reset } = analysis

  useEffect(() => {
    const updateUsage = () => {
      const currentUsage = usageTracker.getCurrentUsage()
      setUsage(currentUsage)
    }

    updateUsage()
    const interval = setInterval(updateUsage, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const handleFileUpload = async (file: File) => {
    // Check usage limit before processing
    if (!usageTracker.canMakeRequest()) {
      setShowUpgradeModal(true)
      return
    }

    // Increment usage counter
    const success = usageTracker.incrementUsage()
    if (!success) {
      setShowUpgradeModal(true)
      return
    }

    // Update local usage state
    setUsage(usageTracker.getCurrentUsage())

    await analyzeCV(file, {
      roastTone,
      focusAreas,
      showEmojis,
      userContext,
    })
  }

  const handleUpgrade = (plan: "hustler" | "pro") => {
    setShowUpgradeModal(false)
    router.push(`/payments?plan=${plan}`)
  }

  const handleDownload = () => {
    if (!result) return

    const isStreamingResult = "isComplete" in result
    const analysisData = isStreamingResult ? result : result

    const content = `CV ROAST RESULTS - ${roastTone.toUpperCase()} ROAST 🔥
File: ${analysisData.metadata?.fileName || "Unknown"}
Generated: ${new Date().toLocaleDateString()}
Roast Level: ${roastTone === "light" ? "Light Roast ☕" : "Heavy Roast 🔥"}
${!isStreamingResult ? `Processing Time: ${result.processingTime}s` : ""}
${analysisData.marketReadiness ? `Market Readiness Score: ${analysisData.marketReadiness.score}/100` : ""}
${analysisData.usage ? `AI Tokens Used: ${analysisData.usage.totalTokens}` : ""}
Word Count: ${analysisData.metadata?.wordCount || "Unknown"}
${analysisData.metadata?.pageCount ? `Pages: ${analysisData.metadata.pageCount}` : ""}

OVERALL FEEDBACK:
${analysisData.overall || "Not available"}

${
  analysisData.marketReadiness
    ? `
MARKET READINESS ANALYSIS:
Score: ${analysisData.marketReadiness.score}/100

Strengths:
${analysisData.marketReadiness.strengths?.map((s, i) => `${i + 1}. ${s}`).join("\n") || "Not available"}

Top Priorities:
${analysisData.marketReadiness.priorities?.map((p, i) => `${i + 1}. ${p}`).join("\n") || "Not available"}
`
    : ""
}

${
  analysisData.kenyanJobMarketTips
    ? `
Kenya Job Market Tips:
${analysisData.kenyanJobMarketTips.map((tip, i) => `${i + 1}. ${tip}`).join("\n")}
`
    : ""
}

DETAILED FEEDBACK:
${
  analysisData.feedback
    ?.map(
      (item, i) => `
${i + 1}. ${item.title} (${item.category})
${item.content}
💡 Quick Fix: ${item.tip}
${item.kenyanContext ? `🇰🇪 Kenya Context: ${item.kenyanContext}` : ""}
`,
    )
    .join("") || "Not available"
}

Generated by Kazikit CV Roaster with Vercel AI SDK v5 🇰🇪
Made with ❤️ for African job seekers
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cv-roast-ai-sdk-v5-${roastTone}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const isStreamingResult = result ? "isComplete" in result : false
    const score = isStreamingResult ? result?.marketReadiness?.score : result?.marketReadiness?.score
    const tokens = isStreamingResult ? result?.usage?.totalTokens : result?.usage?.totalTokens

    const shareData = {
      title: "My CV just got roasted by AI! 🔥",
      text: `I just got my resume analyzed by Kazikit's AI CV Roaster with Vercel AI SDK v5${score ? ` - scored ${score}/100 for Kenya job market readiness!` : ""}${tokens ? ` Used ${tokens} AI tokens.` : ""} Made in Kenya for African job seekers 🇰🇪`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
    }
  }

  const isStreamingResult = result && "isComplete" in result
  const hasResults = result && (isStreamingResult ? result.overall : true)

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50/50 to-blue-50/30 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        // style={{
        //   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981' fillOpacity='0.1'%3E%3Cpath d='M50 50c0-27.614-22.386-50-50-50v50h50zM0 50v50h50c0-27.614-22.386-50-50-50z'/%3E%3C/g%3E%3C/svg%3E")`,
        // }}
      />

      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Dashboard</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-emerald-600 font-medium">CV Roaster</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Roast My CV
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={`${
                  usage.plan === "free"
                    ? "bg-gray-50 text-gray-700 border-gray-200"
                    : usage.plan === "hustler"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                }`}
              >
                <Zap className="w-3 h-3 mr-1" />
                {usage.plan === "free" ? "Free Plan" : usage.plan === "hustler" ? "Hustler Plan 💪" : "Pro Plan 👑"}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {usageTracker.getRemainingRequests()} roasts remaining
                </p>
                <p className="text-xs text-emerald-600">Resets in {usageTracker.getResetTime()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {!hasResults && !isAnalyzing && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your CV</h2>
                    <p className="text-gray-600">
                      Get AI-powered feedback with real-time streaming analysis! 🇰🇪
                    </p>
                  </div>

                  <UploadZone
                    onFileUpload={handleFileUpload}
                    isUploading={isAnalyzing}
                    uploadProgress={uploadProgress}
                    error={error && (typeof(error) == "string" ? error : error.message)}
                    disabled={isAnalyzing}
                  />

                  {/* Streaming Toggle */}
                  {/* <div className="mt-6 p-4 bg-white/60 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="streaming-toggle" className="text-sm font-medium text-gray-900">
                          Real-time Streaming Analysis
                        </Label>
                        <p className="text-xs text-gray-600">
                          See results as they're generated with AI SDK v5 streaming (recommended)
                        </p>
                      </div>
                      <Switch id="streaming-toggle" checked={useStreaming} onCheckedChange={setUseStreaming} />
                    </div>
                  </div> */}

                  {/* AI SDK v5 Features */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                    <h3 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Powered by AI SDK v5
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-emerald-700">Structured outputs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-700">Real-time streaming</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-700">Token usage tracking</span>
                      </div>
                    </div>
                  </div>

                  {/* Local context tips */}
                  <div className="mt-6 grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/60 rounded-lg border border-emerald-100">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-emerald-600 text-xl">🏢</span>
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">NGO & UN Ready</h3>
                      <p className="text-xs text-gray-600">Optimized for international org applications</p>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-lg border border-blue-100">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 text-xl">🚀</span>
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">Startup Friendly</h3>
                      <p className="text-xs text-gray-600">Perfect for tech & startup applications</p>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-lg border border-yellow-100">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-yellow-600 text-xl">🏛️</span>
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">Government Jobs</h3>
                      <p className="text-xs text-gray-600">Formatted for government positions</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <RoastSettings
                    roastTone={roastTone}
                    onToneChange={setRoastTone}
                    showEmojis={showEmojis}
                    onEmojiToggle={setShowEmojis}
                    focusAreas={focusAreas}
                    onFocusAreasChange={setFocusAreas}
                  />

                  <UserContextForm userContext={userContext} onUserContextChange={setUserContext} />
                </div>
              </div>
            )}

            {error && !isAnalyzing && (
              <div className="max-w-2xl mx-auto">
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    {typeof error === "string" ? error : error.message}
                  </AlertDescription>
                </Alert>
                <div className="mt-4 text-center">
                  <Button onClick={reset} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {isAnalyzing && (
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
                        // style={{
                        //   backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fillOpacity='0.5'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                        // }}
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
            )}

            {hasResults && (
              <div className="space-y-6">
                {/* Use streaming display for streaming results, regular display for non-streaming */}
                {isStreamingResult ? (
                  <StreamingAnalysisDisplay result={result} showEmojis={showEmojis} roastTone={roastTone} />
                ) : (
                  <div className="space-y-6">
                    {/* Regular analysis display */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          Your CV Roast is Ready! 🔥
                          <Badge variant={roastTone === "light" ? "secondary" : "destructive"} className="text-xs">
                            {roastTone === "light" ? "Light Roast ☕" : "Heavy Roast 🔥"}
                          </Badge>
                          {result.usage && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              {result.usage.totalTokens} tokens
                            </Badge>
                          )}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <span>File: {result.metadata.fileName}</span>
                          <span>•</span>
                          <span>Processed in {result.processingTime}s</span>
                          <span>•</span>
                          <span>{result.metadata.wordCount} words</span>
                          {result.metadata.pageCount && (
                            <>
                              <span>•</span>
                              <span>{result.metadata.pageCount} pages</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <MarketReadinessScore
                      score={result.marketReadiness.score}
                      strengths={result.marketReadiness.strengths}
                      priorities={result.marketReadiness.priorities}
                      kenyanJobMarketTips={result.kenyanJobMarketTips}
                    />

                    <div className="space-y-4">
                      {result.feedback.map((feedback, index) => (
                        <FeedbackCard
                          key={index}
                          title={feedback.title}
                          content={feedback.content}
                          category={feedback.category}
                          severity={feedback.severity}
                          index={index + 1}
                          showEmojis={showEmojis}
                          tip={feedback.tip}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleDownload}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 relative overflow-hidden"
                    disabled={isStreamingResult ? !result.isComplete : false}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Feedback
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 bg-transparent"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share My Roast
                  </Button>
                  <Button onClick={reset} variant="outline" className="px-8 py-3 bg-transparent">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Roast Another CV
                  </Button>
                </div>

                {/* Local context footer */}
                <div className="text-center pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    Made with <Heart className="w-4 h-4 inline text-red-500" /> by the{" "}
                    <span className="font-semibold text-emerald-600">Kazikit</span> team for African job seekers
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    Powered by Vercel AI SDK v5 • Helping you succeed in your career journey! 🚀🇰🇪
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUsage={usage.count}
        onUpgrade={handleUpgrade}
      />
    </div>
  )
}
