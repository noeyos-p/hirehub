package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/** 완료 */

@Entity
@Data
@Table(name = "oauth2")

public class Oauth2 {

    @EmbeddedId // 복합키를 의미(PK가 여러개)
    // 클라이언트 ID
    @Column(length = 255,name = "client_id")
    private String clientId;
    // 사용자 식별자
    @Column(length = 255,name = "principal_name")
    private String principalName;

    @Column(length = 255,name = "token_type")
    private String tokenType;

    @Column(length = 255,name = "access_token")
    private String accessToken;

    // 발급 시각
    @Column(name = "issued_at")
    private LocalDate issuedAt;

    // 만료 시각
    @Column(name = "expires_at")
    private LocalDate expiresAt;

    // 권한 범위
    @Column(length = 255,name = "token_scope")
    private String tokenScope;

    // Refresh Token 값
    @Column(length = 255,name = "refresh_token")
    private String refreshToken;

    // Refresh Token 발급 시각
    @Column(name = "refresh_issued_at")
    private LocalDate refreshIssuedAt;

    @Column(name = "create_at")
    private LocalDate createAt;


}
