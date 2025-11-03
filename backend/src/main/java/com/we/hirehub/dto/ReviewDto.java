package com.we.hirehub.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {
    private Long id;
    private Long score;
    private String content;
    private Long usersId;    // FK
    private String nickname;
    private Long companyId;  // FK
}
