package com.we.hirehub.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardRequestDto {
    private String title;
    private String content;
    private Long usersId;
    private String usersName;
}
