package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DB에서 직접 조회할 때 사용하는 간단한 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaqRawDto {
    private Long id;
    private String content;
    private String botAnswer;
    private Boolean onoff;
    private String meta;  // JSON 문자열
}
