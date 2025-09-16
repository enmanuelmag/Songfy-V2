import moment from 'moment';

import type { AIDetectedEventType } from '@customTypes/ai-event-detected';
import type { EventBaseType } from '@customTypes/budget';
import type { DurationInputArg2 } from 'moment';

export function getEventPeriod(event: EventBaseType) {
  const { isAlways, times, type, currentTimes } = event.repeat;
  if (type === 'unique') {
    return '(unique)';
  }

  if (!isAlways) {
    if (
      currentTimes !== null &&
      currentTimes !== undefined &&
      currentTimes >= 0
    ) {
      return `(${currentTimes}/${times} ${type}s)`;
    }
    return `(${times}x ${type}s)`;
  }

  return `(${type}ly)`;
}

export function getTimeEvent(event: EventBaseType) {
  const { repeat, date, originalDate } = event;
  const { isAlways, times, type: rType } = repeat;

  const eDate = originalDate ?? date;

  if (rType === 'unique') {
    return moment.unix(eDate).format('DD/MM/YYYY');
  } else {
    const starting = moment.unix(eDate).format('DD/MM/YYYY');
    if (isAlways) {
      return `Starting ${starting}`;
    } else {
      const ending = moment
        .unix(eDate)
        .add(times - 1, rType as DurationInputArg2)
        .format('DD/MM/YYYY');
      return `${starting} - ${ending}`;
    }
  }
}

export function getColorWind(type: string, completed?: boolean | null) {
  if (completed) {
    return 'cd-text-gray-500';
  }
  return type === 'expense' ? 'cd-text-red-500' : 'cd-text-green-600';
}

export function getColorIcon(
  type: string,
  completed?: boolean | null,
  completedByDates?: boolean
) {
  if (completedByDates) {
    return type === 'expense' ? '$red6Light' : '$green6Light';
  }
  if (completed) {
    return '$gray5';
  }
  return type === 'expense' ? '$red9' : '$green8';
}

export function isArchivedEvent(event: EventBaseType) {
  if (event.repeat.isAlways) {
    return false;
  }

  let lastDate = moment.unix(event.date);
  if (event.repeat.type !== 'unique') {
    lastDate = lastDate.add(
      event.repeat.times - 1,
      event.repeat.type as DurationInputArg2
    );
  }

  const diffMonths = moment().diff(lastDate, 'months');

  if (diffMonths >= 1) {
    return true;
  }

  return false;
}

export function isCompletedByDates(
  eventDate: number,
  completedDates: Array<number>
) {
  eventDate = moment.unix(eventDate).startOf('day').unix();

  if (completedDates.length === 0) return false;

  return completedDates.includes(eventDate);
}

type TimeNotification = {
  hour: number;
  minute: number;
};

export function getTimeFormat(time: TimeNotification) {
  const { hour, minute } = time;
  return `${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}`;
}

export const parseAIEventToBase = (eventAI: AIDetectedEventType) => {
  return {
    id: eventAI.id,
    name: eventAI.name,
    description: eventAI.description,
    date: eventAI.estimatedDate,
    amount: eventAI.amount.value,
    completedDates: [],
    type: eventAI.type,
    repeat: {
      type: 'unique',
      times: 1,
      isAlways: null,
    },
    timeNotification: {
      enabled: false,
      hour: 8,
      minute: 0,
    },
  } satisfies EventBaseType;
};
