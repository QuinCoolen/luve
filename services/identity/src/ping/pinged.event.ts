/** Emitted by {@link PingHandler} once a ping has been handled. */
export class PingedEvent {
  constructor(public readonly at: string) {}
}
