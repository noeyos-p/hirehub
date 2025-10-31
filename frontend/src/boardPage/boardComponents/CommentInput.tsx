import React, { useState } from 'react';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ 
  onSubmit, 
  placeholder = "댓글을 남겨주세요",
  autoFocus = false,
  onCancel
}) => {
  const [content, setContent] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isComposing || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
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
    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 text-sm outline-none bg-transparent"
        autoFocus={autoFocus}
        disabled={isSubmitting}
      />
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="text-sm text-blue-600 hover:text-blue-800 ml-2 font-medium disabled:opacity-50"
      >
        {isSubmitting ? '등록중...' : '등록'}
      </button>
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 ml-2"
        >
          취소
        </button>
      )}
    </div>
  );
};

export default CommentInput;