 
export const isEmpty = (errors: Record<string, any>) => {
  return Object.keys(errors).length === 0;
};
