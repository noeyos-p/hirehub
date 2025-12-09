package com.we.hirehub.controller.ai;

import com.we.hirehub.dto.aiMapper.JobMatchingHistoryDto;
import com.we.hirehub.dto.aiMapper.SaveJobMatchingRequest;
import com.we.hirehub.service.ai.JobMatchingHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-matching/history")
@RequiredArgsConstructor
public class JobMatchingHistoryController {

  private final JobMatchingHistoryService jobMatchingHistoryService;

  @PostMapping
  public ResponseEntity<JobMatchingHistoryDto> saveHistory(
      Authentication auth,
      @RequestBody SaveJobMatchingRequest request) {
    return ResponseEntity.ok(jobMatchingHistoryService.saveHistory(auth.getName(), request));
  }

  @GetMapping
  public ResponseEntity<List<JobMatchingHistoryDto>> getHistoryList(Authentication auth) {
    return ResponseEntity.ok(jobMatchingHistoryService.getHistoryList(auth.getName()));
  }

  @GetMapping("/{id}")
  public ResponseEntity<JobMatchingHistoryDto> getHistoryDetail(
      Authentication auth,
      @PathVariable Long id) {
    return ResponseEntity.ok(jobMatchingHistoryService.getHistoryDetail(auth.getName(), id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteHistory(
      Authentication auth,
      @PathVariable Long id) {
    jobMatchingHistoryService.deleteHistory(auth.getName(), id);
    return ResponseEntity.ok().build();
  }
}
