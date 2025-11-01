// src/main/java/com/we/hirehub/naverauth/dto/NaverAuthResult.java
package com.we.hirehub.dto;

public record NaverAuthResult(String jwt, String email, boolean isNewUser) {}
