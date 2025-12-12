package com.we.hirehub.controller.ai;

import com.we.hirehub.dto.aiMapper.AiNewsDigestRequest;
import com.we.hirehub.dto.aiMapper.AiNewsDigestResponse;
import com.we.hirehub.dto.support.BoardDto;
import com.we.hirehub.entity.Board;
import com.we.hirehub.service.support.BoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/board/ai")
@RequiredArgsConstructor
public class BoardAiController {

    private final BoardService boardService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.server-url:http://localhost:8000}")
    private String aiServerUrl;

    /** 🔥 AI 뉴스 요약 프리뷰 */
    @PostMapping("/news/preview")
    public ResponseEntity<AiNewsDigestResponse> preview(@RequestBody AiNewsDigestRequest req) {

        String url = aiServerUrl + "/news/digest";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AiNewsDigestRequest> entity = new HttpEntity<>(req, headers);

        ResponseEntity<AiNewsDigestResponse> resp =
                restTemplate.exchange(url, HttpMethod.POST, entity, AiNewsDigestResponse.class);

        return ResponseEntity.ok(resp.getBody());
    }

    /** 🔥 실제 게시글 발행 */
    @PostMapping("/news/publish")
    public ResponseEntity<?> publish(@RequestBody AiNewsDigestRequest req) {
        try {
            String url = aiServerUrl + "/news/digest";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AiNewsDigestRequest> entity = new HttpEntity<>(req, headers);

            ResponseEntity<AiNewsDigestResponse> resp =
                    restTemplate.exchange(url, HttpMethod.POST, entity, AiNewsDigestResponse.class);

            AiNewsDigestResponse body = resp.getBody();
            if (body == null) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("AI 서버 응답이 비었습니다.");
            }

            String sourcesMd = buildSourcesMd(body.getSources());
            Board saved = boardService.createAiPost(
                    body.getTitle(),
                    body.getContent() + "\n\n---\n### 출처\n" + sourcesMd,
                    body.getTags(),
                    req.getBotUserId()
            );

            return ResponseEntity.ok(boardService.getBoard(saved.getId()));

        } catch (DuplicateKeyException e) {
            log.warn("⚠️ 중복 뉴스 감지: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 등록된 뉴스입니다.");
        } catch (Exception e) {
            log.error("❌ AI 게시글 생성 실패", e);
            return ResponseEntity.internalServerError().body("AI 게시글 생성 실패: " + e.getMessage());
        }
    }

    /** 🔥 AI 생성 게시글 목록 조회 API */
    @GetMapping("/list")
    public ResponseEntity<List<BoardDto>> getAiPosts() {
        List<BoardDto> list = boardService.getBoardsByRole("BOT"); // ⭐ 새 메서드 필요
        return ResponseEntity.ok(list);
    }

    private String buildSourcesMd(List<AiNewsDigestResponse.NewsItem> list) {
        if (list == null || list.isEmpty()) return "- (없음)";

        StringBuilder sb = new StringBuilder();
        for (AiNewsDigestResponse.NewsItem s : list) {
            sb.append("- [")
                    .append(s.getTitle() != null ? s.getTitle() : s.getLink())
                    .append("](")
                    .append(s.getLink())
                    .append(")\n");
        }
        return sb.toString();
    }

    @PostMapping("/news/auto-publish")
    public ResponseEntity<?> autoPublish() {
        // 🔥 매번 다른 기사를 가져오기 위한 다양한 검색 쿼리
        String[] queries = {
            "채용 OR 구인 OR 일자리",
            "취업 OR 신입 OR 경력직",
            "산업 OR 기업 OR 스타트업",
            "노동시장 OR 고용동향 OR 인력",
            "IT채용 OR 개발자 OR 프로그래머",
            "공채 OR 채용공고 OR 입사",
            "직무 OR 직업 OR 커리어"
        };

        // 🔥 시간 범위도 다양하게 (1-5일)
        int[] daysOptions = {1, 2, 3, 4, 5};

        // 🔥 현재 시간 기반으로 쿼리와 날짜 선택 (랜덤처럼 보이지만 재현 가능)
        int queryIndex = (int) (System.currentTimeMillis() / 1000 / 3600) % queries.length;
        int daysIndex = (int) (System.currentTimeMillis() / 1000 / 3600 / 24) % daysOptions.length;

        AiNewsDigestRequest req = new AiNewsDigestRequest();
        req.setQuery(queries[queryIndex]);
        req.setDays(daysOptions[daysIndex]);
        req.setLimit(10);
        req.setStyle("bullet");
        req.setBotUserId(102L);  // 시스템봇 ID

        log.info("🔍 AI 뉴스 자동 발행 - Query: {}, Days: {}", queries[queryIndex], daysOptions[daysIndex]);

        return publish(req);
    }
}
