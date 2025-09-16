import * as Haptics from 'expo-haptics';

export const vibration = (
  type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'light'
) => {
  let style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium;

  if (type === 'light') style = Haptics.ImpactFeedbackStyle.Light;
  else if (type === 'medium') style = Haptics.ImpactFeedbackStyle.Medium;
  else if (type === 'heavy') style = Haptics.ImpactFeedbackStyle.Heavy;
  else if (type === 'soft') style = Haptics.ImpactFeedbackStyle.Soft;
  else style = Haptics.ImpactFeedbackStyle.Rigid;

  Haptics.impactAsync(style).catch();
};
