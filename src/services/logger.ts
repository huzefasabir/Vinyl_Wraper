/**
 * VinylWrap AI Studio — Frontend Logger
 *
 * WHERE TO SEE LOGS:
 *   Browser DevTools → Console tab
 *   All messages are prefixed with a coloured [VW:<module>] tag so you can
 *   filter them by typing "VW:" in the Console filter box.
 *
 * LOG LEVELS:
 *   log.info  — general flow events (blue)
 *   log.ok    — success / done (green)
 *   log.warn  — non-fatal issues (orange)
 *   log.error — failures (red)
 *   log.hf    — HF Space specific events (purple)
 *   log.poll  — polling ticks (grey, collapsed by default)
 */

const TS = () => new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm

const styles = {
  info:  'color:#38bdf8;font-weight:600',
  ok:    'color:#4ade80;font-weight:600',
  warn:  'color:#fb923c;font-weight:600',
  error: 'color:#f87171;font-weight:600',
  hf:    'color:#c084fc;font-weight:600',
  poll:  'color:#64748b;font-weight:400',
};

function make(level: keyof typeof styles) {
  return (module: string, message: string, ...data: unknown[]) => {
    const tag = `%c[VW:${module}] ${TS()} ${message}`;
    if (data.length) {
      console.groupCollapsed(tag, styles[level]);
      data.forEach((d) => console.log(d));
      console.groupEnd();
    } else {
      console.log(tag, styles[level]);
    }
  };
}

export const log = {
  info:  make('info'),
  ok:    make('ok'),
  warn:  make('warn'),
  error: make('error'),
  hf:    make('hf'),
  poll:  make('poll'),
};
