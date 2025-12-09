package com.we.hirehub.dto.support;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CoverLetterHistoryDto {

    private Long id;
    private Long resumeId;
    private String resumeTitle;

    private String inputMode;
    private String originalText;
    private String improvedText;

    private LocalDateTime createdAt;
}
