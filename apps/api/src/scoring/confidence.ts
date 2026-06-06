/**
 * Dynamically calculates the true confidence score of a scan.
 * Confidence = Coverage Ratio (Success Agents / Total Agents) * Evidence Quality Fraction (0.0 to 1.0)
 * Returns a value between 0 and 100.
 */
export function calculateConfidence(
  agentResults: any,
  evidenceQuality: number // Value between 0.0 and 1.0 (or 0 and 100, handled gracefully)
): number {
  const resultsArray = Array.isArray(agentResults) 
    ? agentResults 
    : Object.values(agentResults || {});
  
  // Filter out DebateModeratorAgent if present, as it is the aggregator and not one of the core analysis agents
  const coreResults = resultsArray.filter((a: any) => a && a.agentType !== 'DebateModeratorAgent' && a.key !== 'DebateModeratorAgent');
  
  const totalAgents = coreResults.length || 5; // Default to 5 core agents if empty
  
  // A successful agent is one that completed successfully and has status !== 'FAILED' / 'TIMEOUT' / 'RATE_LIMITED'
  const successAgents = coreResults.filter((a: any) => 
    a && 
    a.status !== 'FAILED' && 
    a.status !== 'TIMEOUT' && 
    a.status !== 'RATE_LIMITED' && 
    a.status !== 'INSUFFICIENT_EVIDENCE'
  );
  
  const coverageRatio = successAgents.length / totalAgents;
  
  // If evidenceQuality is passed as 0-100, convert it to 0.0-1.0
  const normalizedQuality = evidenceQuality > 1 ? evidenceQuality / 100 : evidenceQuality;
  
  const confidence = coverageRatio * normalizedQuality;
  return Math.round(confidence * 100); // Returns 0-100
}
