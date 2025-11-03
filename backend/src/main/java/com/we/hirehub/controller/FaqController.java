package com.we.hirehub.controller;

import com.we.hirehub.dto.FaqCategoryDto;
import com.we.hirehub.dto.FaqItemDto;
import com.we.hirehub.service.FaqService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/faq")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FaqController {
    private final FaqService faqService;

    /**
     * 전체 FAQ 카테고리 목록 조회 (계층형)
     * GET /api/faq
     */
    @GetMapping
    public ResponseEntity<List<FaqCategoryDto>> getAllFaqCategories() {
        log.info("=== FAQ 전체 카테고리 조회 요청 ===");

        try {
            List<FaqCategoryDto> categories = faqService.getFaqCategories();
            log.info("FAQ 카테고리 조회 성공: {} 개", categories.size());
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("FAQ 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 카테고리의 FAQ 조회
     * GET /api/faq/category/{categoryName}
     */
    @GetMapping("/category/{categoryName}")
    public ResponseEntity<FaqCategoryDto> getFaqByCategory(@PathVariable String categoryName) {
        log.info("=== FAQ 카테고리별 조회 요청: {} ===", categoryName);

        try {
            FaqCategoryDto category = faqService.getFaqByCategory(categoryName);

            if (category == null) {
                log.warn("카테고리를 찾을 수 없음: {}", categoryName);
                return ResponseEntity.notFound().build();
            }

            log.info("카테고리 {} 조회 성공: {} 개 항목", categoryName, category.getItems().size());
            return ResponseEntity.ok(category);
        } catch (Exception e) {
            log.error("카테고리별 FAQ 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 FAQ 항목 상세 조회
     * GET /api/faq/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<FaqItemDto> getFaqById(@PathVariable Long id) {
        log.info("=== FAQ 상세 조회 요청: {} ===", id);

        try {
            FaqItemDto faqItem = faqService.getFaqById(id);

            if (faqItem == null) {
                log.warn("FAQ 항목을 찾을 수 없음: {}", id);
                return ResponseEntity.notFound().build();
            }

            log.info("FAQ 항목 조회 성공: {}", faqItem.getQuestion());
            return ResponseEntity.ok(faqItem);
        } catch (Exception e) {
            log.error("FAQ 상세 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
