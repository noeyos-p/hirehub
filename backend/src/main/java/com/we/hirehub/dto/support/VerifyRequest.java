package com.we.hirehub.dto.support;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyRequest {
    private String impUid;      // PortOne 제공 결제 ID
    private Long packageId;     // 결제할 토큰 패키지 ID
}
