package com.we.hirehub.controller.ai;

import com.we.hirehub.dto.aiMapper.InterviewCoachingHistoryDto;
import com.we.hirehub.dto.aiMapper.SaveInterviewCoachingRequest;
import com.we.hirehub.service.support.InterviewCoachingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interview-coaching")
@RequiredArgsConstructor
public class InterviewCoachingController {

    private final InterviewCoachingService coachingService;

    @PostMapping("/history")
    public ResponseEntity<InterviewCoachingHistoryDto> saveHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SaveInterviewCoachingRequest request) {

        // ✅ 이메일로 변경
        String email = userDetails.getUsername();
        InterviewCoachingHistoryDto saved = coachingService.saveHistory(email, request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/history")
    public ResponseEntity<List<InterviewCoachingHistoryDto>> getHistoryList(
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();
        List<InterviewCoachingHistoryDto> histories = coachingService.getHistoryList(email);
        return ResponseEntity.ok(histories);
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<InterviewCoachingHistoryDto> getHistoryDetail(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        String email = userDetails.getUsername();
        InterviewCoachingHistoryDto history = coachingService.getHistoryDetail(email, id);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        String email = userDetails.getUsername();
        coachingService.deleteHistory(email, id);
        return ResponseEntity.ok().build();
    }
}
