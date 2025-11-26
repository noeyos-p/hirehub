import React, { useState, useEffect, useRef } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import type { CommentResponse } from '../../types/interface';
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
  onEdit?: (commentId: number, content: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth,
  currentUserId,
  currentUserRole,
  isAuthenticated,
  onReply,
  onDelete,
  onEdit
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId === comment.usersId;
  const isAdmin = currentUserRole === 'ROLE_ADMIN';
  const canDelete = isAuthenticated && (isOwner || isAdmin);
  const canEdit = isAuthenticated && isOwner; // 수정은 작성자만 가능

  // ✅ 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';

    const isUTC = dateString.endsWith('Z');
    const date = new Date(isUTC ? dateString : `${dateString}Z`);

    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day}. ${hours}:${minutes}`;
  };

  const renderProfileImage = () => {
    const displayName = comment.nickname || '익명';
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-300 flex-shrink-0">
        <span className="text-xs text-gray-600 font-medium">
          {displayName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  const handleReplySubmit = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyInput(false);
  };

  const handleDelete = () => {
    setShowDropdown(false);
    onDelete(comment.id);
  };

  const handleEdit = () => {
    setShowDropdown(false);
    setIsEditing(true);
  };

  const handleEditSubmit = async (content: string) => {
    if (onEdit) {
      await onEdit(comment.id, content);
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const isReply = depth > 0;

  return (
    <>
      <div className={`${isReply ? 'mt-4' : 'mt-6'}`}>
        <div className="flex items-start space-x-3">
          {renderProfileImage()}

          <div className="flex-1 min-w-0">
            {/* ✅ 이름과 드롭다운 메뉴 */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-gray-700">
                {comment.nickname || '익명'}
              </p>

              {(canEdit || canDelete) && !isEditing && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-1 cursor-pointer transition hover:bg-gray-100 rounded"
                  >
                    <EllipsisHorizontalIcon className="w-4 h-4 text-gray-500" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-1 w-24 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      {canEdit && (
                        <button
                          onClick={handleEdit}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition"
                        >
                          수정
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-100 transition"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ✅ 수정 모드: CommentInput 컴포넌트 사용 */}
            {isEditing ? (
              <div className="mt-2">
                <CommentInput
                  onSubmit={handleEditSubmit}
                  placeholder="댓글을 수정하세요"
                  defaultValue={comment.content}
                  autoFocus
                  onCancel={handleEditCancel}
                  submitButtonText="수정"
                />
              </div>
            ) : (
              <>
                {/* ✅ 댓글 내용 */}
                <p className="text-sm text-gray-800 break-words whitespace-pre-line mb-2">
                  {comment.content}
                </p>

                {/* ✅ 시간과 답글 버튼 */}
                <div className="flex items-center space-x-3">
                  <p className="text-xs text-gray-400">
                    {formatDateTime(comment.createAt)}
                  </p>
                  
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowReplyInput(!showReplyInput)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      답글
                    </button>
                  )}
                </div>
              </>
            )}

            {showReplyInput && !isEditing && (
              <div className="mt-3">
                <CommentInput
                  onSubmit={handleReplySubmit}
                  placeholder={`@${comment.nickname || '익명'}에게 답글 작성`}
                  autoFocus
                  onCancel={() => setShowReplyInput(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 자식 댓글들을 평평하게 렌더링 */}
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
              onEdit={onEdit}
            />
          ))}
        </>
      )}
    </>
  );
};

export default CommentItem;