package com.we.hirehub.controller;

import com.we.hirehub.dto.ResumeDto;
import com.we.hirehub.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/resume-management")
@RequiredArgsConstructor
public class AdminController {


    private final ResumeService resumeService;

    @GetMapping("/admin")
    public String adminHome(){
        return "admin/index"; // templates/admin/index.html
    }

    @GetMapping("/admin/support")
    public String adminSupport(){
        return "support/agent"; // templates/support/agent.html (대기열/수락)
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getResumeById(@PathVariable Long id) {
        ResumeDto dto = resumeService.toDtoForAdmin(id);
        return ResponseEntity.ok(Map.of("success", true, "data", dto));
    }
}

