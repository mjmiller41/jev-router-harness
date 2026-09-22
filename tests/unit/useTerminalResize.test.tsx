import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { useTerminalResize } from '../../src/tui/hooks/useTerminalResize.js';

const TestComponent = () => {
  const { columns, rows } = useTerminalResize();
  return <Text>{`cols:${columns},rows:${rows}`}</Text>;
};

describe('useTerminalResize', () => {
  it('returns default terminal dimensions', () => {
    const { lastFrame, unmount } = render(<TestComponent />);
    expect(lastFrame()).toMatch(/cols:\d+,rows:\d+/);
    unmount();
  });

  it('registers and unregisters resize listener on process.stdout', async () => {
    const onSpy = vi.spyOn(process.stdout, 'on');
    const offSpy = vi.spyOn(process.stdout, 'off');

    const { unmount } = render(<TestComponent />);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(offSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    onSpy.mockRestore();
    offSpy.mockRestore();
  });
});
