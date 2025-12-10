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
        AiNewsDigestRequest req = new AiNewsDigestRequest();
        req.setQuery("채용 OR 산업 OR 노동시장");
        req.setDays(2);
        req.setLimit(10);
        req.setStyle("bullet");
        req.setBotUserId(102L);  // 시스템봇 ID

        return publish(req);
    }
}
