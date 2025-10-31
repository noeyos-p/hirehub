package com.we.hirehub.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentRequestDto {
    private Long usersId;  // nullable - 컨트롤러에서 설정
    private Long boardId;
    private Long parentCommentId;
    private String content;

}
