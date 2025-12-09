package com.we.hirehub.dto.aiMapper;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSessionDto {
    private String question;
    private String category;
    private String answer;
    private String feedback;
}
