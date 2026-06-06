import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(eventName: string, payload: any) {
    this.logger.debug(`[EventBus] Emitting ${eventName}`, payload);
    this.eventEmitter.emit(eventName, payload);
  }
}
