// src/main/java/com/we/hirehub/kakaoauth/KakaoAuthResult.java
package com.we.hirehub.dto;

public record KakaoAuthResult(String jwt, String email, boolean isNewUser) {}
