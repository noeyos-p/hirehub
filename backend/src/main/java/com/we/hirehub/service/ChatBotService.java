package com.we.hirehub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.ChatBotDto;
import com.we.hirehub.dto.FaqCategoryDto;
import com.we.hirehub.dto.FaqItemDto;
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
    private final JdbcTemplate jdbcTemplate;  // ✅ JDBC 직접 사용
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 자주 묻는 질문 대표 4개 조회 (다른 컴포넌트용)
     */
    @Transactional(readOnly = true)
    public List<ChatBotDto> getFaqList() {
        log.info("=== FAQ 목록 조회 시작 ===");

        try {
            // ✅ Native Query로 직접 조회
            String sql = """
            SELECT * FROM chat_bot 
            WHERE onoff = 1 
            AND JSON_EXTRACT(meta, '$.type') = 'item'
            ORDER BY JSON_EXTRACT(meta, '$.order'), id ASC 
            LIMIT 4
            """;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            log.info("조회된 FAQ 개수: {}", rows.size());

            return rows.stream()
                    .map(row -> {
                        Long id = ((Number) row.get("id")).longValue();
                        String content = (String) row.get("content");
                        String botAnswer = (String) row.get("bot_answer");

                        // meta에서 category 추출
                        String category = "";
                        String metaJson = (String) row.get("meta");
                        if (metaJson != null) {
                            try {
                                Map<String, Object> meta = objectMapper.readValue(
                                        metaJson,
                                        new TypeReference<Map<String, Object>>() {}
                                );
                                category = (String) meta.getOrDefault("category", "");
                            } catch (Exception e) {
                                log.warn("meta 파싱 실패: id={}", id);
                            }
                        }

                        return ChatBotDto.builder()
                                .id(id)
                                .content(content)
                                .botAnswer(botAnswer)
                                .category(category)
                                .build();
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("FAQ 조회 중 오류", e);
            return Collections.emptyList();
        }
    }

    /**
     * ✨ 계층형 FAQ 전체 조회 (JDBC Template 사용)
     */
    @Transactional(readOnly = true)
    public List<FaqCategoryDto> getFaqCategoriesFromDb() {
        log.info("=== FAQ 계층형 카테고리 조회 시작 (JDBC) ===");

        try {
            // ✅ JDBC Template으로 직접 조회 (엔티티 조인 회피)
            String sql = "SELECT id, content, bot_answer, onoff, meta FROM chat_bot WHERE onoff = 1 ORDER BY id ASC";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            log.info("DB에서 조회된 전체 FAQ 개수: {}", rows.size());

            if (rows.isEmpty()) {
                log.warn("⚠️ DB에 FAQ 데이터가 없습니다. 더미 데이터를 반환합니다.");
                return getDummyFaqCategories();
            }

            // 카테고리별로 그룹화
            Map<String, List<Map<String, Object>>> categoryMap = new LinkedHashMap<>();
            Map<String, String> categoryDescriptions = new LinkedHashMap<>();
            Map<String, Integer> categoryOrders = new LinkedHashMap<>();

            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                String content = (String) row.get("content");
                String botAnswer = (String) row.get("bot_answer");
                String metaJson = (String) row.get("meta");

                log.debug("처리 중인 FAQ: id={}, content={}", id, content);

                if (metaJson == null || metaJson.isEmpty()) {
                    log.debug("meta가 비어있는 FAQ 스킵: id={}", id);
                    continue;
                }

                // JSON 파싱
                Map<String, Object> meta;
                try {
                    meta = objectMapper.readValue(metaJson, new TypeReference<Map<String, Object>>() {});
                } catch (Exception e) {
                    log.warn("meta JSON 파싱 실패: id={}, meta={}", id, metaJson, e);
                    continue;
                }

                String type = (String) meta.get("type");
                String category = (String) meta.get("category");
                Object orderObj = meta.get("order");
                Integer order = orderObj instanceof Number ? ((Number) orderObj).intValue() : 999;

                log.debug("FAQ meta 정보: type={}, category={}, order={}", type, category, order);

                if (category == null) {
                    log.debug("category가 null인 FAQ 스킵: id={}", id);
                    continue;
                }

                if ("header".equals(type)) {
                    categoryDescriptions.put(category, botAnswer);
                    categoryOrders.put(category, order);
                    log.info("✅ 카테고리 헤더 발견: {}, order={}", category, order);
                } else if ("item".equals(type)) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", id);
                    item.put("content", content);
                    item.put("botAnswer", botAnswer);
                    item.put("category", category);
                    item.put("order", order);

                    categoryMap.computeIfAbsent(category, k -> new ArrayList<>()).add(item);
                    log.info("✅ FAQ 항목 추가: 카테고리={}, 질문={}", category, content);
                }
            }

            log.info("그룹화 완료: {} 개 카테고리", categoryDescriptions.size());

            if (categoryDescriptions.isEmpty()) {
                log.warn("⚠️ 유효한 카테고리가 없습니다. 더미 데이터를 반환합니다.");
                return getDummyFaqCategories();
            }

            // 카테고리 정렬
            List<String> sortedCategories = new ArrayList<>(categoryDescriptions.keySet());
            sortedCategories.sort(Comparator.comparingInt(cat -> categoryOrders.getOrDefault(cat, 999)));

            // DTO 변환
            List<FaqCategoryDto> categories = new ArrayList<>();
            long categoryId = 1L;

            for (String categoryName : sortedCategories) {
                List<Map<String, Object>> items = categoryMap.get(categoryName);
                if (items == null || items.isEmpty()) {
                    log.warn("카테고리 {}에 항목이 없습니다.", categoryName);
                    continue;
                }

                // items 정렬
                items.sort(Comparator.comparingInt(item ->
                        item.get("order") instanceof Number ? ((Number) item.get("order")).intValue() : 999
                ));

                List<FaqItemDto> faqItems = items.stream()
                        .map(item -> FaqItemDto.builder()
                                .id(((Number) item.get("id")).longValue())
                                .question((String) item.get("content"))
                                .answer((String) item.get("botAnswer"))
                                .category(categoryName)
                                .build())
                        .collect(Collectors.toList());

                categories.add(FaqCategoryDto.builder()
                        .id(categoryId++)
                        .category(categoryName)
                        .description(categoryDescriptions.getOrDefault(categoryName, categoryName))
                        .items(faqItems)
                        .build());

                log.info("카테고리 생성 완료: {}, 항목 수={}", categoryName, faqItems.size());
            }

            log.info("✅ 총 {} 개 카테고리 조회 완료", categories.size());
            return categories;

        } catch (Exception e) {
            log.error("❌ FAQ 조회 중 오류 발생. 더미 데이터를 반환합니다.", e);
            return getDummyFaqCategories();
        }
    }

    /**
     * 더미 데이터 생성 (폴백용)
     */
    private List<FaqCategoryDto> getDummyFaqCategories() {
        log.info("=== 더미 FAQ 데이터 생성 ===");

        List<FaqCategoryDto> categories = new ArrayList<>();

        // 1. 지원관리
        categories.add(FaqCategoryDto.builder()
                .id(1L)
                .category("지원관리")
                .description("지원한 채용 공고 관리 및 진행 상태 확인")
                .items(Arrays.asList(
                        FaqItemDto.builder()
                                .id(1L)
                                .question("지원한 내용은 어디서 확인할 수 있나요?")
                                .answer("마이페이지 > 지원 관리 메뉴에서 확인하실 수 있습니다.")
                                .category("지원관리")
                                .build(),
                        FaqItemDto.builder()
                                .id(2L)
                                .question("지원 취소할 수 있나요?")
                                .answer("서류 검토 전까지는 지원 관리에서 취소 가능합니다.")
                                .category("지원관리")
                                .build(),
                        FaqItemDto.builder()
                                .id(3L)
                                .question("제출한 이력서 수정할 수 있나요?")
                                .answer("지원서 제출 후에는 수정이 불가능합니다.")
                                .category("지원관리")
                                .build()
                ))
                .build());

        // 2. 계정 및 로그인
        categories.add(FaqCategoryDto.builder()
                .id(2L)
                .category("계정 및 로그인")
                .description("회원 가입, 로그인 및 계정 관리")
                .items(Arrays.asList(
                        FaqItemDto.builder()
                                .id(4L)
                                .question("비밀번호를 잊어버렸어요.")
                                .answer("로그인 페이지에서 '비밀번호 찾기'를 클릭하세요.")
                                .category("계정 및 로그인")
                                .build(),
                        FaqItemDto.builder()
                                .id(5L)
                                .question("이메일 인증이 되지 않아요.")
                                .answer("스팸 메일함을 확인해주세요.")
                                .category("계정 및 로그인")
                                .build()
                ))
                .build());

        // 3. 채용 공고
        categories.add(FaqCategoryDto.builder()
                .id(3L)
                .category("채용 공고")
                .description("채용 공고 검색 및 알림 설정")
                .items(Arrays.asList(
                        FaqItemDto.builder()
                                .id(6L)
                                .question("공고 연락처가 안 보여요.")
                                .answer("기업 정보 보호를 위해 일부 연락처는 비공개로 운영됩니다.")
                                .category("채용 공고")
                                .build(),
                        FaqItemDto.builder()
                                .id(7L)
                                .question("알림이 너무 많이 와요.")
                                .answer("마이페이지 > 알림 설정에서 원하는 알림만 선택할 수 있습니다.")
                                .category("채용 공고")
                                .build()
                ))
                .build());

        log.info("더미 데이터 생성 완료: {} 개 카테고리", categories.size());
        return categories;
    }

    /**
     * 특정 카테고리의 모든 QnA 조회
     */
    @Transactional(readOnly = true)
    public List<ChatBotDto> getFaqByCategory(String category) {
        log.info("=== 카테고리별 FAQ 조회: {} ===", category);

        List<ChatBot> allBots = chatBotRepository.findAllByOrderByIdAsc();

        return allBots.stream()
                .filter(bot -> bot.isOnoff())
                .filter(bot -> {
                    if (bot.getMeta() != null && bot.getMeta().containsKey("category")) {
                        return category.equals(bot.getMeta().get("category"));
                    }
                    return false;
                })
                .map(this::toChatBotDto)
                .collect(Collectors.toList());
    }

    /**
     * ChatBot 엔티티를 DTO로 변환
     */
    private ChatBotDto toChatBotDto(ChatBot bot) {
        String category = "";
        if (bot.getMeta() != null && bot.getMeta().containsKey("category")) {
            category = (String) bot.getMeta().get("category");
        }

        return ChatBotDto.builder()
                .id(bot.getId())
                .content(bot.getContent())
                .botAnswer(bot.getBotAnswer())
                .category(category)
                .sessionId(bot.getSession() != null ? bot.getSession().getId() : null)
                .userId(bot.getUsers() != null ? bot.getUsers().getId() : null)
                .createAt(bot.getCreateAt())
                .build();
    }

    /**
     * 디버깅용: onoff=true인 모든 데이터 확인
     */
    @Transactional(readOnly = true)
    public List<ChatBotDto> getFaqListDebug() {
        log.info("=== FAQ 전체 조회 (디버깅) ===");

        PageRequest pageRequest = PageRequest.of(0, 20);
        List<ChatBot> allFaqs = chatBotRepository.findByOnoffTrueOrderByIdAsc(pageRequest);

        log.info("조회된 전체 FAQ 개수: {}", allFaqs.size());

        allFaqs.forEach(bot -> {
            String type = bot.getMeta() != null && bot.getMeta().containsKey("type")
                    ? (String) bot.getMeta().get("type")
                    : "null";
            log.info("ID: {}, Type: {}, Content: {}, OnOff: {}",
                    bot.getId(), type, bot.getContent(), bot.isOnoff());
        });

        return allFaqs.stream()
                .map(this::toChatBotDto)
                .collect(Collectors.toList());
    }
}
