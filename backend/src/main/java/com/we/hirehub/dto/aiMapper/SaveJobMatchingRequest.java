package com.we.hirehub.dto.aiMapper;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveJobMatchingRequest {
  private Long resumeId;
  private String resumeTitle;
  private List<MatchResultDto> matchResults;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class MatchResultDto {
    private Long jobId;
    private Long companyId;
    private String jobTitle;
    private String companyName;
    private Integer score;
    private String grade;
    private List<String> reasons;
  }
}
