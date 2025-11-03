package com.we.hirehub.controller;

import com.we.hirehub.dto.ChatBotDto;
import com.we.hirehub.dto.FaqCategoryDto;
import com.we.hirehub.service.ChatBotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // 구체적인 주소로 변경
public class ChatBotController {
    private final ChatBotService chatBotService;

    /**
     * 기존: 자주 묻는 질문 목록 조회 (대표 4개)
     * 다른 컴포넌트에서 사용
     */
    @GetMapping("/faq")
    public ResponseEntity<List<ChatBotDto>> getFaqList() {
        log.info("=== FAQ 목록 조회 요청 ===");

        try {
            List<ChatBotDto> faqs = chatBotService.getFaqList();
            log.info("FAQ 조회 성공: {} 개", faqs.size());
            return ResponseEntity.ok(faqs);
        } catch (Exception e) {
            log.error("FAQ 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * ✨ 신규: 계층형 FAQ 전체 조회 (ChatBot.tsx 전용)
     */
    @GetMapping("/faq/categories")
    public ResponseEntity<List<FaqCategoryDto>> getFaqCategories() {
        log.info("=== 계층형 FAQ 조회 요청 ===");

        try {
            List<FaqCategoryDto> categories = chatBotService.getFaqCategoriesFromDb();
            log.info("계층형 FAQ 조회 성공: {} 개 카테고리", categories.size());
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("계층형 FAQ 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 기존: 특정 카테고리의 상세 QnA 조회
     */
    @GetMapping("/faq/{category}")
    public ResponseEntity<List<ChatBotDto>> getFaqByCategory(@PathVariable String category) {
        log.info("=== 카테고리별 FAQ 조회 요청: {} ===", category);

        try {
            List<ChatBotDto> qnas = chatBotService.getFaqByCategory(category);
            log.info("카테고리 {} FAQ 조회 성공: {} 개", category, qnas.size());
            return ResponseEntity.ok(qnas);
        } catch (Exception e) {
            log.error("카테고리별 FAQ 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
