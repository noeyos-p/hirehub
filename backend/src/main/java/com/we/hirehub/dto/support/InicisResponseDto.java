package com.we.hirehub.dto.support;

import lombok.Data;

@Data
public class InicisResponseDto {

    // 공통
    private String resultCode;
    private String resultMsg;

    // READY 전용
    private String tid;
    private String payUrl;

    // APPROVE 전용
    private String applNum;
    private String applDate;
}
