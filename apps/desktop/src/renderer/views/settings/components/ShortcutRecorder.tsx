/**
 * ShortcutRecorder Component
 *
 * 快捷键录制组件
 * Story-012: Desktop Native Features
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';

interface ShortcutRecorderProps {
  value: string;
  onChange: (accelerator: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// 修饰键映射
const modifierKeys: Record<string, string> = {
  Control: 'Ctrl',
  Meta: 'Cmd',
  Alt: 'Alt',
  Shift: 'Shift',
};

// 特殊键映射
const specialKeys: Record<string, string> = {
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ' ': 'Space',
  Escape: 'Esc',
  Delete: 'Delete',
  Backspace: 'Backspace',
  Enter: 'Enter',
  Tab: 'Tab',
};

export const ShortcutRecorder = memo(function ShortcutRecorder({
  value,
  onChange,
  disabled = false,
  placeholder = '点击录制快捷键',
}: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 格式化显示的快捷键
  const formatDisplay = useCallback((accelerator: string) => {
    if (!accelerator) return '';

    // 转换 CommandOrControl 等
    return accelerator
      .replace(/CommandOrControl/g, process.platform === 'darwin' ? 'Cmd' : 'Ctrl')
      .replace(/\+/g, ' + ');
  }, []);

  // 处理键盘按下
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording || disabled) return;

      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];

      // 添加修饰键
      if (e.ctrlKey || e.metaKey) {
        keys.push(process.platform === 'darwin' && e.metaKey ? 'Cmd' : 'Ctrl');
      }
      if (e.altKey) {
        keys.push('Alt');
      }
      if (e.shiftKey) {
        keys.push('Shift');
      }

      // 添加主键
      const key = e.key;
      if (!['Control', 'Meta', 'Alt', 'Shift'].includes(key)) {
        const mappedKey = specialKeys[key] || key.toUpperCase();
        keys.push(mappedKey);

        // 完成录制
        if (keys.length >= 2) {
          // 转换为 Electron accelerator 格式
          const accelerator = keys
            .map((k) => (k === 'Ctrl' ? 'CommandOrControl' : k))
            .join('+');

          onChange(accelerator);
          setIsRecording(false);
          setCurrentKeys([]);
          inputRef.current?.blur();
        }
      }

      setCurrentKeys(keys);
    },
    [isRecording, disabled, onChange]
  );

  // 处理键盘释放
  const handleKeyUp = useCallback(() => {
    if (!isRecording) return;
    setCurrentKeys([]);
  }, [isRecording]);

  // 开始录制
  const startRecording = useCallback(() => {
    if (disabled) return;
    setIsRecording(true);
    setCurrentKeys([]);
  }, [disabled]);

  // 停止录制
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setCurrentKeys([]);
  }, []);

  // 清除快捷键
  const clearShortcut = useCallback(() => {
    onChange('');
  }, [onChange]);

  // 添加全局键盘事件监听
  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
    return undefined;
  }, [isRecording, handleKeyDown, handleKeyUp]);

  const displayValue = isRecording
    ? currentKeys.length > 0
      ? currentKeys.join(' + ')
      : '按下快捷键...'
    : formatDisplay(value);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`relative flex-1 ${disabled ? 'opacity-50' : ''}`}
        onClick={startRecording}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onFocus={startRecording}
          onBlur={stopRecording}
          className={`w-full px-3 py-2 border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isRecording
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {isRecording && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {value && !disabled && (
        <button
          type="button"
          onClick={clearShortcut}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="清除快捷键"
        >
          ✕
        </button>
      )}
    </div>
  );
});

export default ShortcutRecorder;
