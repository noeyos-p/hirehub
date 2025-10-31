package com.we.hirehub.dto;

import com.we.hirehub.entity.Comments;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDto {
    private Long id;
    private String content;
    private Long usersId;
    private String nickname;             // 작성자 닉네임
    private Long boardId;
    private String boardTitle;           // 게시글 제목
    private Long parentCommentId;        // 상위 댓글 ID
    private String parentCommentContent; // 상위 댓글 내용 (답글인 경우)
    private LocalDateTime createAt;
    private LocalDateTime updateAt;

    /** 🔹 엔티티 → DTO 변환 */
    public static CommentDto fromEntity(Comments comment) {
        if (comment == null) return null;

        String userNickname = null;
        if (comment.getUsers() != null) {
            // nickname 필드를 먼저 시도하고, 없으면 name 필드 사용
            try {
                userNickname = comment.getUsers().getNickname();
            } catch (Exception e) {
                // nickname 필드가 없는 경우 name 필드 시도
                try {
                    userNickname = comment.getUsers().getName();
                } catch (Exception ex) {
                    // 둘 다 없으면 email 사용
                    userNickname = comment.getUsers().getEmail();
                }
            }
        }

        return CommentDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .usersId(comment.getUsers() != null ? comment.getUsers().getId() : null)
                .nickname(userNickname)
                .boardId(comment.getBoard() != null ? comment.getBoard().getId() : null)
                .boardTitle(comment.getBoard() != null ? comment.getBoard().getTitle() : null)
                .parentCommentId(comment.getParentComments() != null ? comment.getParentComments().getId() : null)
                .parentCommentContent(comment.getParentComments() != null ? comment.getParentComments().getContent() : null)
                .createAt(comment.getCreateAt())
                .updateAt(comment.getUpdateAt())
                .build();
    }

    /** 🔹 DTO → 엔티티 변환 (필요 시) */
    public Comments toEntity() {
        Comments comment = new Comments();
        comment.setId(this.id);
        comment.setContent(this.content);
        comment.setCreateAt(this.createAt != null ? this.createAt : LocalDateTime.now());
        comment.setUpdateAt(this.updateAt);
        // Users, Board, ParentComments는 서비스 레이어에서 set 해주는 것을 권장
        return comment;
    }
}