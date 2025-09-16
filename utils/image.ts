export const getBase64String = (base64: string, mimeType: string = 'image/jpeg') =>
  `data:${mimeType};base64,${base64}`;
