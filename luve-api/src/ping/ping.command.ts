/**
 * Throwaway command proving the CQRS wiring end-to-end. Delete with the rest of
 * the ping scaffolding when auth starts (Phase 2, tasks O1/O2).
 */
export class PingCommand {
  constructor(public readonly at: string) {}
}
