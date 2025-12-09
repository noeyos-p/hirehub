package com.we.hirehub.dto.support;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SaveCoverLetterRequest {

    private Long resumeId;
    private String resumeTitle;

    // text | essay | resume
    private String inputMode;

    private String originalText;
    private String improvedText;
}
