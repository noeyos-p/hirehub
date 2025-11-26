import React, { useState } from 'react';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  defaultValue?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  submitButtonText?: string;
  clearOnSubmit?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = "댓글을 남겨주세요",
  defaultValue = '',
  autoFocus = false,
  onCancel,
  submitButtonText = '등록',
  clearOnSubmit = true
}) => {
  const [content, setContent] = useState(defaultValue);
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isComposing || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      if (clearOnSubmit) {
        setContent('');
      }
    } catch (err) {
      console.error('댓글 작성 실패:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="w-full h-[41px] border border-gray-300 rounded-[10px] px-4 py-1.5 pr-24 text-sm focus:outline-none focus:border-[#006AFF]"
        autoFocus={autoFocus}
        disabled={isSubmitting}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            취소
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition"
        >
          {isSubmitting ? `${submitButtonText}중...` : submitButtonText}
        </button>
      </div>
    </div>
  );
};

export default CommentInput;