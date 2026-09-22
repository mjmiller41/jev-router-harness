import { useState, useEffect } from 'react';

export interface TerminalDimensions {
  columns: number;
  rows: number;
}

export function useTerminalResize(): TerminalDimensions {
  const [dimensions, setDimensions] = useState<TerminalDimensions>({
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        columns: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
      });
    };

    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  return dimensions;
}
