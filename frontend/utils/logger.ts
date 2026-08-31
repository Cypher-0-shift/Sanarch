const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => { if (isDev) console.log(...args); },
  info: (...args: any[]) => { if (isDev) console.log(...args); },
  error: (msg: string, err?: any) => {
    if (isDev) {
      console.error(msg, err);
    } else {
      // In production: only log the message, not the full error
      // (prevents leaking stack traces / internal paths)
      console.error(msg);
    }
  },
  warn: (...args: any[]) => { if (isDev) console.warn(...args); },
};
