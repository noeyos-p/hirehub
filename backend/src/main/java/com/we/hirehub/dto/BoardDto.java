package com.we.hirehub.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardDto {
    private Long id;               // 게시글 ID
    private String title;          // 게시글 제목
    private String content;        // 게시글 내용

    private Long usersId;          // 작성자 ID
    private String nickname;      // 작성자 이름

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createAt; // 작성일

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updateAt; // 수정일

    private Long views;            // 조회수

    private List<CommentDto> comments; // 댓글 리스트
}
