import 'react-native-get-random-values';

import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import AIEventsDS from '@api/domain/ds/ai-events-ds';
import {
  AI_EVENTS_COLLECTION,
  BUDGETS_COLLECTION,
} from '@constants/datasource';
import { handleError } from '@decorators/errorAPI';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import { Logger } from '@utils/log';

import UserImpl from './user-impl';

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

const firestore = getFirestore();

class AIEventsImpl extends AIEventsDS {
  private userService = UserImpl.getInstance();

  @handleError('Error getting AI detected events')
  async getAIDetectedEvents(
    params: GetAIDetectedEventsParamsType
  ): Promise<Array<AIDetectedEventType>> {
    const user = await this.userService.getUser();

    const { budgetId, status } = params;

    let firestoreQuery = query(
      collection(firestore, AI_EVENTS_COLLECTION),
      where('userId', '==', user.uid)
    );

    if (budgetId) {
      firestoreQuery = query(firestoreQuery, where('budgetId', '==', budgetId));
    }

    if (status) {
      firestoreQuery = query(firestoreQuery, where('status', '==', status));
    }

    firestoreQuery = query(firestoreQuery, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(firestoreQuery);

    return snapshot.docs.map((docSnap: { id: any; data: () => any }) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Array<AIDetectedEventType>;
  }

  @handleError('Error getting AI event')
  async getAIEvent(
    params: GetAIEventParamsType
  ): Promise<AIDetectedEventType | null> {
    const { eventId } = params;

    const docRef = doc(firestore, AI_EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as AIDetectedEventType;
  }

  async createAIEvent(
    params: CreateAIEventParamsType
  ): Promise<AIDetectedEventType> {
    try {
      const { data } = params;
      const now = moment().unix();

      const eventData = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(
        collection(firestore, AI_EVENTS_COLLECTION),
        eventData
      );

      return {
        id: docRef.id,
        ...eventData,
      } as AIDetectedEventType;
    } catch (error) {
      Logger.error('Error creating AI event:', error);
      throw error;
    }
  }

  @handleError('Error approving AI event')
  async approveAIEvent(
    params: ApproveAIEventParamsType
  ): Promise<EventBaseType> {
    const { eventId, budgetId } = params;

    // Get AI event
    const aiEvent = await this.getAIEvent({ eventId });
    if (!aiEvent) {
      throw new Error('AI event not found');
    }

    // Convert AI event to budget event
    const budgetEvent: EventBaseType = {
      id: uuidv4(),
      name: aiEvent.name,
      amount: aiEvent.amount.value,
      description: aiEvent.description || `Auto-detected from email`,
      date: aiEvent.estimatedDate,
      originalDate: aiEvent.estimatedDate,
      completedDates: [],
      type: aiEvent.type,
      repeat: {
        type: 'unique',
        times: 1,
        isAlways: false,
      },
      category: null, // TODO: Map from aiEvent category
      timeNotification: {
        enabled: false,
        hour: 9,
        minute: 0,
      },
    };

    // Update AI event status to approved
    await this.updateAIEvent({
      eventId,
      updates: {
        status: 'approved',
        budgetId,
        updatedAt: moment().unix(),
      },
    });

    // Add event to budget
    const budgetRef = doc(firestore, BUDGETS_COLLECTION, budgetId);
    const budgetDoc = await getDoc(budgetRef);

    if (!budgetDoc.exists()) {
      throw new Error('Budget not found');
    }

    const budgetData = budgetDoc.data();
    const events = budgetData?.events || [];
    events.push(budgetEvent);

    return budgetEvent;
  }

  @handleError('Error rejecting AI event')
  async rejectAIEvent(params: RejectAIEventParamsType): Promise<boolean> {
    const { eventId } = params;

    const eventRef = doc(firestore, AI_EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, {
      status: 'rejected',
      updatedAt: moment().unix(),
    });

    return true;
  }

  @handleError('Error updating AI event')
  async updateAIEvent(
    params: UpdateAIEventParamsType
  ): Promise<AIDetectedEventType> {
    const { eventId, updates } = params;

    const updateData = {
      ...updates,
      updatedAt: moment().unix(),
    };

    const eventRef = doc(firestore, AI_EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, updateData);

    const updatedEvent = await this.getAIEvent({ eventId });
    if (!updatedEvent) {
      throw new Error('AI event not found after update');
    }

    return updatedEvent;
  }
}

export default AIEventsImpl;
