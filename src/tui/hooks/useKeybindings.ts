import { useInput, useApp } from 'ink';

export interface KeybindingHandlers {
  onAbort?: () => void;
  onClearScreen?: () => void;
  onExit?: () => void;
  isGenerating: boolean;
}

export function useKeybindings(handlers: KeybindingHandlers): void {
  const { exit } = useApp();

  useInput((input, key) => {
    // Ctrl+C handling
    if (key.ctrl && input === 'c') {
      if (handlers.isGenerating && handlers.onAbort) {
        handlers.onAbort();
      } else if (handlers.onExit) {
        handlers.onExit();
      } else {
        exit();
      }
      return;
    }

    // Ctrl+L handling (clear screen)
    if (key.ctrl && input === 'l') {
      if (handlers.onClearScreen) {
        handlers.onClearScreen();
      }
      return;
    }
  });
}
