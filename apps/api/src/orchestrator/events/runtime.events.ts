export class ScanCreatedEvent {
  constructor(public readonly scanId: string, public readonly projectId: string) {}
}

export class ScanStartedEvent {
  constructor(public readonly scanId: string) {}
}

export class IdeaReconstructedEvent {
  constructor(
    public readonly scanId: string,
    public readonly structuredIdea: any,
    public readonly clarityScore: number
  ) {}
}

export class EvidenceRetrievedEvent {
  constructor(
    public readonly scanId: string,
    public readonly evidencePack: any
  ) {}
}

export class AgentStartedEvent {
  constructor(public readonly scanId: string, public readonly agentType: string) {}
}

export class AgentReasoningEvent {
  constructor(
    public readonly scanId: string,
    public readonly agentType: string,
    public readonly message: string
  ) {}
}

export class AgentDebatingEvent {
  constructor(
    public readonly scanId: string,
    public readonly agentType: string,
    public readonly debateTarget: string,
    public readonly message: string
  ) {}
}

export class AgentCompletedEvent {
  constructor(
    public readonly scanId: string,
    public readonly agentType: string,
    public readonly result: any
  ) {}
}

export class ValidatorStartedEvent {
  constructor(public readonly scanId: string) {}
}

export class ValidatorCompletedEvent {
  constructor(public readonly scanId: string, public readonly result: any) {}
}

export class ScanCompletedEvent {
  constructor(public readonly scanId: string, public readonly finalDecision: any) {}
}

export class ScanFailedEvent {
  constructor(public readonly scanId: string, public readonly error: string) {}
}
