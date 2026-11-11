import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PingedEvent } from './pinged.event';

@EventsHandler(PingedEvent)
export class PingedHandler implements IEventHandler<PingedEvent> {
  private readonly logger = new Logger(PingedHandler.name);

  handle(event: PingedEvent): void {
    this.logger.log(`PingedEvent handled (at=${event.at})`);
  }
}
