import React from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * Space toggles, Enter confirms. `value` is array of selected option values.
 */
export default function CheckboxMultiSelect({
  label,
  options,
  value,
  onChange,
  onSubmit,
  disabled = false,
}) {
  const [cursor, setCursor] = React.useState(0);

  useInput(
    (input, key) => {
      if (disabled) return;
      if (key.upArrow) {
        setCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (key.downArrow) {
        setCursor((c) => Math.min(options.length - 1, c + 1));
        return;
      }
      if (input === ' ') {
        const opt = options[cursor];
        if (!opt) return;
        const on = value.includes(opt.value);
        if (on) {
          onChange(value.filter((v) => v !== opt.value));
        } else {
          onChange([...value, opt.value]);
        }
        return;
      }
      if (key.return) {
        if (value.length === 0) return;
        onSubmit();
      }
    },
    { isActive: !disabled }
  );

  return (
    <Box flexDirection="column">
      {label ? (
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {label}
          </Text>
        </Box>
      ) : null}
      {options.map((opt, i) => {
        const checked = value.includes(opt.value);
        const active = i === cursor;
        const mark = checked ? '[x]' : '[ ]';
        return (
          <Box key={opt.value}>
            <Text inverse={active}>
              {mark} {opt.label}
            </Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text dimColor>
          ↑↓ move · Space toggle · Enter confirm (pick at least one)
        </Text>
      </Box>
    </Box>
  );
}
