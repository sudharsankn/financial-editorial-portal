import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  Code,
  RotateCcw,
  Eye,
} from 'lucide-react';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  helperText?: string;
  simple?: boolean; // If true, only basic formatting for short description
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder,
  minHeight = '140px',
  helperText,
  simple = false,
}) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // Sync external value to contentEditable when not focused
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isHtmlMode]);

  const handleInput = () => {
    if (isComposingRef.current) return;
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const handleAddLink = () => {
    const url = prompt('Enter URL (e.g. https://example.com):', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleFormatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-[#1E2229] uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {helperText && (
            <span className="text-[11px] text-[#8A92A0] hidden sm:inline">
              {helperText}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
              isHtmlMode
                ? 'bg-[#6A1B9A] text-white border-[#6A1B9A]'
                : 'bg-white text-[#58606E] border-[#E2E4E8] hover:text-[#1E2229]'
            }`}
          >
            {isHtmlMode ? 'WYSIWYG View' : 'HTML Code'}
          </button>
        </div>
      </div>

      <div className="border border-[#E2E4E8] rounded bg-white overflow-hidden focus-within:border-[#6A1B9A] focus-within:ring-1 focus-within:ring-[#6A1B9A] transition-colors">
        {/* Formatting Toolbar */}
        {!isHtmlMode && (
          <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-[#F4F4F6] border-b border-[#E2E4E8] text-[#58606E]">
            {!simple && (
              <>
                <button
                  type="button"
                  title="Heading 2"
                  onClick={() => handleFormatBlock('<h2>')}
                  className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors text-xs font-bold px-1.5"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Heading 3"
                  onClick={() => handleFormatBlock('<h3>')}
                  className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors text-xs font-bold px-1.5"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-[#C8CBD0] mx-1" />
              </>
            )}

            <button
              type="button"
              title="Bold"
              onClick={() => executeCommand('bold')}
              className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italic"
              onClick={() => executeCommand('italic')}
              className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Underline"
              onClick={() => executeCommand('underline')}
              className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-[#C8CBD0] mx-1" />

            <button
              type="button"
              title="Bullet List"
              onClick={() => executeCommand('insertUnorderedList')}
              className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Numbered List"
              onClick={() => executeCommand('insertOrderedList')}
              className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {!simple && (
              <button
                type="button"
                title="Blockquote"
                onClick={() => handleFormatBlock('<blockquote>')}
                className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              title="Add Link"
              onClick={handleAddLink}
              className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Remove Formatting"
              onClick={() => executeCommand('removeFormat')}
              className="p-1 rounded hover:bg-white hover:text-[#1E2229] transition-colors ml-auto text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Editor Body */}
        {isHtmlMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight }}
            placeholder="<p>Enter raw HTML content here...</p>"
            className="w-full p-3 font-mono text-xs text-[#1E2229] focus:outline-none resize-y"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
              handleInput();
            }}
            style={{ minHeight }}
            data-placeholder={placeholder || 'Start typing in any language...'}
            className="p-3 text-sm text-[#1E2229] outline-none overflow-y-auto multilingual-lead prose prose-sm max-w-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#8A92A0] empty:before:pointer-events-none"
          />
        )}
      </div>
    </div>
  );
};
