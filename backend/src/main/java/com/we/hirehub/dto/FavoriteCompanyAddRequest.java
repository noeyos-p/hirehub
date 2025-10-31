package com.we.hirehub.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FavoriteCompanyAddRequest {
    /** 즐겨찾기할 회사 ID */
    @NotNull
    private Long companyId;
}
