export const parseDuration = (durationMs: number): string => {
  const duration = Math.floor(durationMs / 1000);

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  const hoursStr = hours > 0 ? `${hours}:` : '';

  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${hoursStr}${minutesStr}:${secondsStr}`;
};
