import React, { useEffect, useRef, memo } from 'react';

/**
 * LogViewer component responsible for rendering the game logs.
 * Wrapped in React.memo to prevent unnecessary re-renders when parent state changes
 * (e.g., during visual effects like 'shake' or 'damage flash') but logs remain the same.
 */
const LogViewer = memo(({ logs }) => {
  const logsEndRef = useRef(null);

  // Auto-scroll logs whenever logs change
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <main className="flex-1 w-full bg-[#000] p-4 overflow-y-auto space-y-2 z-10 scrollbar-hide">
      {logs.map((log, i) => (
        <div
          key={i}
          className={`text-sm leading-relaxed border-l-2 pl-2 animate-fade-in ${
            log.type === 'danger' || (typeof log === 'string' && log.includes('GAMEOVER')) ? 'border-red-600 text-red-500 font-bold' :
            log.type === 'success' || (typeof log === 'string' && log.includes('success')) ? 'border-green-500 text-green-400' :
            log.type === 'warn' ? 'border-yellow-500 text-yellow-300' :
            'border-gray-700 text-gray-300'
          }`}
        >
          {log.text || log}
        </div>
      ))}
      <div ref={logsEndRef} />
    </main>
  );
});

LogViewer.displayName = 'LogViewer';

export default LogViewer;
