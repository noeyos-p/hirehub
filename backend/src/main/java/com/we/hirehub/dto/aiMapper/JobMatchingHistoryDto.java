package com.we.hirehub.dto.aiMapper;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobMatchingHistoryDto {
  private Long id;
  private Long resumeId;
  private String resumeTitle;
  private List<SaveJobMatchingRequest.MatchResultDto> matchResults;
  private LocalDateTime createdAt;
}
