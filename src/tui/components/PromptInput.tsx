import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isDisabled?: boolean;
  history?: string[];
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isDisabled = false,
  history = [],
}) => {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useInput((input, key) => {
    if (isDisabled) return;

    if (key.return) {
      if (value.trim().length > 0) {
        const submitted = value;
        setValue('');
        setHistoryIndex(-1);
        onSubmit(submitted);
      }
      return;
    }

    if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1));
      return;
    }

    if (key.upArrow) {
      if (history.length > 0) {
        const nextIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setValue(history[history.length - 1 - nextIndex] || '');
      }
      return;
    }

    if (key.downArrow) {
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setValue(history[history.length - 1 - nextIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setValue('');
      }
      return;
    }

    // Standard character input
    if (input && !key.ctrl && !key.meta) {
      setValue((prev) => prev + input);
    }
  });

  return (
    <Box
      borderStyle="round"
      borderColor={isDisabled ? 'gray' : 'cyan'}
      paddingX={1}
      flexDirection="row"
    >
      <Text color={isDisabled ? 'gray' : 'cyan'} bold>
        {'>'}{' '}
      </Text>
      <Text>{value}</Text>
      {!isDisabled && (
        <Text color="gray" dimColor>
          █
        </Text>
      )}
    </Box>
  );
};
