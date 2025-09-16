import type {
  AIDetectedEventType,
  ApproveAIEventParamsType,
  CreateAIEventParamsType,
  GetAIDetectedEventsParamsType,
  GetAIEventParamsType,
  RejectAIEventParamsType,
  UpdateAIEventParamsType,
} from '@customTypes/ai-event-detected';
import type { EventBaseType } from '@customTypes/budget';

abstract class AIEventsDS {
  abstract getAIDetectedEvents(
    params: GetAIDetectedEventsParamsType
  ): Promise<Array<AIDetectedEventType>>;

  abstract getAIEvent(
    params: GetAIEventParamsType
  ): Promise<AIDetectedEventType | null>;

  abstract createAIEvent(
    params: CreateAIEventParamsType
  ): Promise<AIDetectedEventType>;

  abstract approveAIEvent(
    params: ApproveAIEventParamsType
  ): Promise<EventBaseType>;

  abstract rejectAIEvent(params: RejectAIEventParamsType): Promise<boolean>;

  abstract updateAIEvent(
    params: UpdateAIEventParamsType
  ): Promise<AIDetectedEventType>;
}

export default AIEventsDS;
