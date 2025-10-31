import React from 'react';
import type { CommentResponse } from '../../api/boardApi';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

type CommentWithChildren = CommentResponse & { 
  children: CommentWithChildren[] 
};

interface CommentSectionProps {
  comments: CommentResponse[];
  isAuthenticated: boolean;
  currentUserId?: number;
  currentUserRole?: string;
  onCommentSubmit: (content: string) => Promise<void>;
  onReplySubmit: (parentId: number, content: string) => Promise<void>;
  onCommentDelete: (commentId: number) => Promise<void>;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  isAuthenticated,
  currentUserId,
  currentUserRole,
  onCommentSubmit,
  onReplySubmit,
  onCommentDelete
}) => {
  const buildCommentTree = (comments: CommentResponse[]): CommentWithChildren[] => {
    const commentMap = new Map<number, CommentWithChildren>();
    const rootComments: CommentWithChildren[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    comments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.children.push(commentWithChildren);
        }
      } else {
        rootComments.push(commentWithChildren);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="mt-8">
      <h3 className="text-md font-semibold text-gray-800 mb-4">
        댓글 {comments.length}
      </h3>

      {isAuthenticated ? (
        <div className="mb-6">
          <CommentInput
            onSubmit={onCommentSubmit}
            placeholder="댓글을 남겨주세요"
          />
        </div>
      ) : (
        <div className="text-center py-4 mb-6 text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50">
          댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}

      {commentTree.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          첫 댓글을 작성해보세요!
        </div>
      ) : (
        <div className="space-y-2">
          {commentTree.map((comment) => (
            <div key={comment.id}>
              {/* 최상위 댓글 */}
              <CommentItem 
                comment={comment} 
                depth={0}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isAuthenticated={isAuthenticated}
                onReply={onReplySubmit}
                onDelete={onCommentDelete}
              />
              {/* 대댓글들 (들여쓰기) - children이 있을 때만 */}
              {comment.children.length > 0 && (
                <div className="ml-10 mt-2 border-l-2 border-gray-200 pl-4 space-y-2">
                  {comment.children.map((child) => (
                    <CommentItem 
                      key={child.id} 
                      comment={child} 
                      depth={1}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      isAuthenticated={isAuthenticated}
                      onReply={onReplySubmit}
                      onDelete={onCommentDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;