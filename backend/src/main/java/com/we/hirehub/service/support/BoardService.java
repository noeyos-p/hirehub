package com.we.hirehub.service.support;

import com.we.hirehub.dto.support.BoardDto;
import com.we.hirehub.entity.AiBoardControl;
import com.we.hirehub.entity.Board;
import com.we.hirehub.entity.Comments;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.AiBoardControlRepository;
import com.we.hirehub.repository.BoardRepository;
import com.we.hirehub.repository.CommentRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final UsersRepository usersRepository;
    private final CommentRepository commentRepository;
    private final AiBoardControlRepository aiBoardControlRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.server-url:http://localhost:8000}")
    private String aiServerUrl;


    /** 게시글 생성 (AI 검열 포함) */
    @Transactional
    public BoardDto createBoard(Long userId, BoardDto dto) {

        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 1️⃣ FastAPI 검열 요청
        boolean approved = true;
        String reason = null;

        try {
            String url = aiServerUrl + "/ai/moderate"; // FastAPI 검열 API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> payload = Map.of("content", dto.getContent());
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map body = response.getBody();

            approved = (boolean) body.get("approve");
            reason = (String) body.get("reason");

        } catch (Exception e) {
            log.warn("⚠️ AI 검열 서버 오류, 임시 승인 처리: {}", e.getMessage());
            approved = true; // FastAPI 장애 시 글을 막지는 않음
        }

        // 2️⃣ 게시글 저장
        Board board = dto.toEntity(user);
        board.setHidden(!approved); // AI가 비허용 → 숨김
        Board saved = boardRepository.save(board);

        // 3️⃣ 숨김 처리라면 AiBoardControl 기록 저장
        if (!approved) {
            AiBoardControl control = AiBoardControl.builder()
                    .board(saved)
                    .reason(reason)
                    .build();

            aiBoardControlRepository.save(control);
        }

        List<Comments> comments = new ArrayList<>();
        return BoardDto.toDto(saved, comments);
    }


    /** 게시글 수정 */
    @Transactional
    public BoardDto updateBoard(Long boardId, BoardDto dto) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        dto.updateEntity(board);
        Board saved = boardRepository.save(board);

        List<Comments> comments = commentRepository.findByBoardId(saved.getId());
        return BoardDto.toDto(saved, comments);
    }


    /** 게시글 삭제 */
    @Transactional
    public void deleteBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        boardRepository.delete(board);
    }


    /** 단일 조회(+조회수 증가) */
    @Transactional
    public BoardDto getBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        board.setViews(board.getViews() + 1L);
        boardRepository.save(board);

        List<Comments> comments = commentRepository.findByBoardId(board.getId());
        return BoardDto.toDto(board, comments);
    }


    /** 전체 최신순 */
    @Transactional(readOnly = true)
    public List<BoardDto> getAllBoards() {
        return boardRepository.findAllByOrderByCreateAtDesc()
                .stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }


    /** 인기 Top6 */
    @Transactional(readOnly = true)
    public List<BoardDto> getPopularBoards() {
        return boardRepository.findTop6ByOrderByViewsDesc()
                .stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }


    /** 조회수만 증가 */
    @Transactional
    public BoardDto incrementView(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        board.setViews(board.getViews() + 1L);
        Board saved = boardRepository.save(board);

        List<Comments> comments = commentRepository.findByBoardId(saved.getId());
        return BoardDto.toDto(saved, comments);
    }


    /** ✅ 내 게시글 목록(최신순) */
    @Transactional(readOnly = true)
    public List<BoardDto> getBoardsByUser(Long userId) {
        return boardRepository.findByUsers_IdOrderByCreateAtDesc(userId)
                .stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }


    /** 엔티티 조회(권한 확인용) */
    @Transactional(readOnly = true)
    public Board getBoardEntity(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
    }


    /** 검색 */
    public List<BoardDto> searchBoards(String keyword) {
        List<Board> boards = boardRepository.findByTitleContainingOrContentContaining(keyword, keyword);
        return boards.stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .collect(Collectors.toList());
    }


    /** ✅ AI 자동 게시글 생성 */
    @Transactional
    public Board createAiPost(String title, String content, List<String> tags, Long writerIdOrNull) {
        try {
            // 1️⃣ AI 작성자 세팅 (기본값 2L)
            Long writerId = (writerIdOrNull != null ? writerIdOrNull : 2L);
            Users writer = usersRepository.findById(writerId)
                    .orElseThrow(() -> new RuntimeException("AI 작성자 계정이 존재하지 않습니다. id=" + writerId));

            // 2️⃣ 중복 체크용 Hash 생성 (제목 + 본문 앞부분)
            String key = title + ":" + content + ":" + LocalDateTime.now().toString();
            String hash = DigestUtils.md5DigestAsHex(key.getBytes(StandardCharsets.UTF_8));

            // 3️⃣ 이미 동일 Hash 있는지 확인 (DB 중복 방지)
            if (boardRepository.existsByAiHash(hash)) {
                throw new DuplicateKeyException("중복 AI 게시글(뉴스) 감지됨 → 저장 안 함");
            }

            // 4️⃣ 태그 CSV 변환
            String tagsCsv = (tags != null && !tags.isEmpty())
                    ? String.join(",", tags)
                    : null;

            // 5️⃣ 엔티티 생성
            Board board = new Board();
            board.setTitle(title);
            board.setContent(content);
            board.setTagsCsv(tagsCsv);
            board.setRole("BOT");               // AI 게시글
            board.setAiHash(hash);              // 중복 방지용 해시
            board.setHidden(false);
            board.setViews(0L);
            board.setCreateAt(LocalDateTime.now());
            board.setUpdateAt(LocalDateTime.now());
            board.setUsers(writer);

            // 6️⃣ 저장
            Board saved = boardRepository.save(board);
            log.info("🤖 AI 게시글 생성 완료: {}", title);
            return saved;

        } catch (DuplicateKeyException e) {
            log.warn("⚠️ 중복 게시글 감지됨: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ AI 게시글 생성 중 오류 발생", e);
            throw new RuntimeException("AI 게시글 생성 실패: " + e.getMessage());
        }
    }


    /** ✅ 역할별 게시글 조회 (BOT 전용 등) */
    @Transactional(readOnly = true)
    public List<BoardDto> getBoardsByRole(String role) {
        return boardRepository.findByRoleOrderByCreateAtDesc(role)
                .stream()
                .map(board -> {
                    List<Comments> comments = commentRepository.findByBoardId(board.getId());
                    return BoardDto.toDto(board, comments);
                })
                .toList();
    }
}