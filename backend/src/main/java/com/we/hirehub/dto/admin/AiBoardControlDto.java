package com.we.hirehub.dto.admin;

import com.we.hirehub.entity.AiBoardControl;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiBoardControlDto {
  private Long id;
  private BoardSummaryDto board;
  private String role;
  private String reason;

  public static AiBoardControlDto from(AiBoardControl entity) {
    return AiBoardControlDto.builder()
        .id(entity.getId())
        .board(entity.getBoard() != null ? BoardSummaryDto.builder()
            .id(entity.getBoard().getId())
            .title(entity.getBoard().getTitle())
            .hidden(entity.getBoard().getHidden())
            .build() : null)
        .role(entity.getRole())
        .reason(entity.getReason())
        .build();
  }

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class BoardSummaryDto {
    private Long id;
    private String title;
    private Boolean hidden;
  }
}
