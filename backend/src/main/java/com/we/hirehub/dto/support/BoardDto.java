package com.we.hirehub.dto.support;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.we.hirehub.entity.Board;
import com.we.hirehub.entity.Comments;
import com.we.hirehub.entity.Users;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardDto {
    private Long id;
    private String title;
    private String content;
    private Long usersId;
    private String nickname;
    private Long views;
    private List<CommentDto> comments;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updateAt;

    /** Entity -> DTO **/
    public static BoardDto toDto(Board board, List<Comments> comments) {
        // null 안전성 처리
        Long userId = null;
        String userNickname = "탈퇴한 사용자";

        if (board.getUsers() != null) {
            userId = board.getUsers().getId();
            userNickname = board.getUsers().getNickname() != null
                    ? board.getUsers().getNickname()
                    : "알 수 없는 사용자";
        }

        // 댓글 변환
        List<CommentDto> commentDtos = new ArrayList<>();
        if (comments != null && !comments.isEmpty()) {
            commentDtos = comments.stream()
                    .map(CommentDto::fromEntity)
                    .collect(Collectors.toList());
        }

        return BoardDto.builder()
                .id(board.getId())
                .title(board.getTitle())
                .content(board.getContent())
                .usersId(userId)
                .nickname(userNickname)
                .createAt(board.getCreateAt())
                .updateAt(board.getUpdateAt())
                .views(board.getViews() != null ? board.getViews() : 0L)
                .comments(commentDtos)
                .build();
    }

    /** DTO -> Entity (생성) **/
    public Board toEntity(Users user) {
        return Board.builder()
                .title(this.title)
                .content(this.content)
                .users(user)
                .createAt(LocalDateTime.now())
                .updateAt(null)  // 생성시에는 수정일 없음
                .views(0L)
                .build();
    }

    /** DTO -> Entity (수정) **/
    public void updateEntity(Board board) {
        if (this.title != null) {
            board.setTitle(this.title);
        }
        if (this.content != null) {
            board.setContent(this.content);
        }
        board.setUpdateAt(LocalDateTime.now());
        // views는 수정시 변경하지 않음 (조회시에만 증가)
        // users는 작성자 변경 불가
    }
}