export const isSentryEnabled = () => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const logErrorToSentry = (error: unknown, ..._args: unknown[]) => {
  console.error(error);
};
