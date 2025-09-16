export const getColorDebt = (pendingPayments: number) => {
  pendingPayments = Math.floor(pendingPayments);
  if (pendingPayments < 1) {
    return 'cd-text-green-500 dark:cd-text-green-400';
  } else if (pendingPayments < 3) {
    return 'cd-text-yellow-500 dark:cd-text-yellow-400';
  } else {
    return 'cd-text-red-500 dark:cd-text-red-400';
  }
};

export const getMimeType = (uri: string) => {
  // https://firebasestorage.googleapis.com/v0/b/budgetfy-56b88.appspot.com/o/payments/0e5802a6-7f50-4506-bdfd-b5b89af8e51f.jpeg?alt=media&token=c5cb68fd-847b-4537-9fde-6c8cdd3b53b4

  const extension = uri.split('.').at(-1) || 'jpeg';

  switch (extension) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
};
