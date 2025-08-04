import { startFlowsServer } from "genkit"
import { analyzeCVFlow, quickCVScoreFlow, generateCVImprovementsFlow } from "./cv-analysis-flow"

// Start the Genkit flows server
export function startGenkitServer() {
  startFlowsServer({
    flows: [analyzeCVFlow, quickCVScoreFlow, generateCVImprovementsFlow],
    port: 3001,
  })
}

// For development - start the server if this file is run directly
if (require.main === module) {
  startGenkitServer()
  console.log("🔥 Genkit flows server started on port 3001")
}
