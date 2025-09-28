const LEVELS = ['debug', 'info', 'warn', 'error'];

function format(level, messages) {
  const ts = new Date().toISOString();
  return [`[deposits:${level}]`, ts, ...messages];
}

const logger = LEVELS.reduce((acc, level) => {
  acc[level] = (...messages) => {
    const formatted = format(level, messages);
    if (level === 'error') {
      console.error(...formatted);
    } else if (level === 'warn') {
      console.warn(...formatted);
    } else if (level === 'info') {
      console.info(...formatted);
    } else {
      console.debug(...formatted);
    }
  };
  return acc;
}, {});

export default logger;
