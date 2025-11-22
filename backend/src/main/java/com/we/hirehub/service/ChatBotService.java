package com.we.hirehub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.chat.ChatBotDto;
import com.we.hirehub.dto.support.FaqCategoryDto;
import com.we.hirehub.dto.support.FaqItemDto;
import com.we.hirehub.entity.ChatBot;
import com.we.hirehub.repository.ChatBotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatBotService {
    private final ChatBotRepository chatBotRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 자주 묻는 질문 대표 4개 조회
     */
    @Transactional(readOnly = true)
    public List<ChatBotDto> getFaqList() {
        log.debug("FAQ 목록 조회 시작");

        String sql = """
            SELECT * FROM chat_bot 
            WHERE onoff = 1 
            AND JSON_EXTRACT(meta, '$.type') = 'item'
            ORDER BY JSON_EXTRACT(meta, '$.order'), id ASC 
            LIMIT 4
            """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        return rows.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * 계층형 FAQ 전체 조회
     */
    @Transactional(readOnly = true)
    public List<FaqCategoryDto> getFaqCategoriesFromDb() {
        log.debug("FAQ 계층형 카테고리 조회 시작");

        String sql = "SELECT id, content, bot_answer, meta FROM chat_bot WHERE onoff = 1 ORDER BY id ASC";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        if (rows.isEmpty()) {
            log.warn("DB에 FAQ 데이터가 없습니다");
            return Collections.emptyList();
        }

        return buildFaqCategories(rows);
    }

    /**
     * 특정 카테고리의 모든 QnA 조회
     */
    @Transactional(readOnly = true)
    public List<ChatBotDto> getFaqByCategory(String category) {
        log.debug("카테고리별 FAQ 조회: {}", category);

        String sql = """
            SELECT * FROM chat_bot 
            WHERE onoff = 1 
            AND JSON_EXTRACT(meta, '$.category') = ?
            AND JSON_EXTRACT(meta, '$.type') = 'item'
            ORDER BY JSON_EXTRACT(meta, '$.order'), id ASC
            """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, category);

        return rows.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ========== Private Helper Methods ==========

    /**
     * DB Row -> ChatBotDto 변환
     */
    private ChatBotDto mapToDto(Map<String, Object> row) {
        Long id = ((Number) row.get("id")).longValue();
        String content = (String) row.get("content");
        String botAnswer = (String) row.get("bot_answer");
        String category = extractCategory((String) row.get("meta"));

        return ChatBotDto.builder()
                .id(id)
                .content(content)
                .botAnswer(botAnswer)
                .category(category)
                .build();
    }

    /**
     * Meta JSON에서 카테고리 추출
     */
    private String extractCategory(String metaJson) {
        if (metaJson == null || metaJson.isEmpty()) return "";

        try {
            Map<String, Object> meta = objectMapper.readValue(
                    metaJson,
                    new TypeReference<Map<String, Object>>() {}
            );
            return (String) meta.getOrDefault("category", "");
        } catch (Exception e) {
            log.warn("Meta 파싱 실패: {}", metaJson);
            return "";
        }
    }

    /**
     * FAQ 카테고리 구조 생성
     */
    private List<FaqCategoryDto> buildFaqCategories(List<Map<String, Object>> rows) {
        Map<String, List<Map<String, Object>>> categoryItems = new LinkedHashMap<>();
        Map<String, String> categoryDescriptions = new LinkedHashMap<>();
        Map<String, Integer> categoryOrders = new LinkedHashMap<>();

        // 데이터 분류
        for (Map<String, Object> row : rows) {
            String metaJson = (String) row.get("meta");
            if (metaJson == null) continue;

            try {
                Map<String, Object> meta = objectMapper.readValue(
                        metaJson,
                        new TypeReference<Map<String, Object>>() {}
                );

                String type = (String) meta.get("type");
                String category = (String) meta.get("category");
                if (category == null) continue;

                Integer order = meta.get("order") instanceof Number
                        ? ((Number) meta.get("order")).intValue()
                        : 999;

                if ("header".equals(type)) {
                    categoryDescriptions.put(category, (String) row.get("bot_answer"));
                    categoryOrders.put(category, order);
                } else if ("item".equals(type)) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", ((Number) row.get("id")).longValue());
                    item.put("content", row.get("content"));
                    item.put("botAnswer", row.get("bot_answer"));
                    item.put("category", category);
                    item.put("order", order);

                    categoryItems.computeIfAbsent(category, k -> new ArrayList<>()).add(item);
                }
            } catch (Exception e) {
                log.warn("Meta 파싱 실패: {}", metaJson);
            }
        }

        // 카테고리 정렬 및 DTO 변환
        return categoryDescriptions.keySet().stream()
                .sorted(Comparator.comparingInt(cat -> categoryOrders.getOrDefault(cat, 999)))
                .map(categoryName -> buildCategoryDto(
                        categoryName,
                        categoryDescriptions.get(categoryName),
                        categoryItems.get(categoryName)
                ))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * 카테고리 DTO 생성
     */
    private FaqCategoryDto buildCategoryDto(
            String categoryName,
            String description,
            List<Map<String, Object>> items
    ) {
        if (items == null || items.isEmpty()) {
            log.warn("카테고리 {}에 항목이 없습니다", categoryName);
            return null;
        }

        // 항목 정렬
        items.sort(Comparator.comparingInt(item ->
                item.get("order") instanceof Number
                        ? ((Number) item.get("order")).intValue()
                        : 999
        ));

        List<FaqItemDto> faqItems = items.stream()
                .map(item -> FaqItemDto.builder()
                        .id(((Number) item.get("id")).longValue())
                        .question((String) item.get("content"))
                        .answer((String) item.get("botAnswer"))
                        .category(categoryName)
                        .build())
                .collect(Collectors.toList());

        return FaqCategoryDto.builder()
                .id((long) categoryName.hashCode())
                .category(categoryName)
                .description(description != null ? description : categoryName)
                .items(faqItems)
                .build();
    }
}
