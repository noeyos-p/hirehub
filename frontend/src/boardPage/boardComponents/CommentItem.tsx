import React, { useState } from 'react';
import type { CommentResponse } from '../../api/boardApi';
import CommentInput from './CommentInput';

type CommentWithChildren = CommentResponse & { 
  children: CommentWithChildren[] 
};

interface CommentItemProps {
  comment: CommentWithChildren;
  depth: number;
  currentUserId?: number;
  currentUserRole?: string;
  isAuthenticated: boolean;
  onReply: (parentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth,
  currentUserId,
  currentUserRole,
  isAuthenticated,
  onReply,
  onDelete
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);

  const isOwner = currentUserId === comment.usersId;
  const isAdmin = currentUserRole === 'ROLE_ADMIN';
  const canDelete = isAuthenticated && (isOwner || isAdmin);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\. /g, '.');
  };

  const renderProfileImage = () => {
    const displayName = comment.nickname || comment.usersName || '익명';
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-300 flex-shrink-0">
        {comment.usersProfileImage ? (
          <img 
            src={comment.usersProfileImage} 
            alt={`${displayName}'s profile`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-600 font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    );
  };

  const handleReplySubmit = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyInput(false);
  };

  const isReply = depth > 0;

  return (
    <>
      <div className={`${isReply ? 'mt-4' : 'mt-6'}`}>
        <div className="flex items-start space-x-3">
          {renderProfileImage()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-700">
                  {comment.nickname || comment.usersName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDateTime(comment.createAt)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {isAuthenticated && (
                  <button
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    답글
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-800 break-words whitespace-pre-line">
              {comment.content}
            </p>

            {showReplyInput && (
              <div className="mt-3">
                <CommentInput
                  onSubmit={handleReplySubmit}
                  placeholder={`@${comment.nickname || comment.usersName}에게 답글 작성`}
                  autoFocus
                  onCancel={() => setShowReplyInput(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 자식 댓글들을 평평하게 렌더링 (depth > 0일 때만, 들여쓰기 없이) */}
      {depth > 0 && comment.children.length > 0 && (
        <>
          {comment.children.map(child => (
            <CommentItem 
              key={child.id} 
              comment={child} 
              depth={1}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isAuthenticated={isAuthenticated}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </>
  );
};

export default CommentItem;