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
import org.springframework.data.domain.PageRequest;
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
  private final AiBoardControlRepository controlRepo;
  private final QueuedModerationService queuedModerationService;  // ✅ 큐 기반으로 변경
  private final AsyncModerationService asyncModerationService;

  // ========== 검열 반영 & 기록 ==========
  private void applyModeration(Board board, QueuedModerationService.ModerationResult mres) {  // ✅ 타입 변경
    boolean before = Boolean.TRUE.equals(board.getHidden());
    boolean approved = mres.approved();

    // 🔥 관리자가 승인한 게시글이면 AI가 다시 숨기지 않음
    if (Boolean.TRUE.equals(board.getAdminApproved())) {
      log.info("🛡️ [AI_SKIP] 관리자 승인 게시글입니다. AI 차단을 건너뜁니다. boardId={}", board.getId());
      return;
    }

    board.setHidden(!approved);

    log.info("🧩 [MODERATION] boardId={}, before={}, after={}, approved={}, reason={}",
        board.getId(), before, board.getHidden(), approved, mres.reason());

    if (!approved) {
      try {
        AiBoardControl control = AiBoardControl.builder()
            .board(board)
            .reason(mres.reason())
            .role("BOT")
            .build();
        controlRepo.save(control);
        log.info("📝 [AI_CONTROL] 저장완료 - boardId={}, reason={}", board.getId(), mres.reason());
      } catch (Exception e) {
        log.error("⚠️ [AI_CONTROL] 저장 실패 - boardId={}", board.getId(), e);
      }
    }
  }

  // ========== ⚡ 생성 (즉시 등록, AI 검열 안 기다림) ==========
  @Transactional
  public BoardDto createBoard(Long userId, BoardDto dto) {
    Users user = usersRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("사용자 없음"));

    Board board = dto.toEntity(user);
    board.setHidden(false); // 초기값 공개

    Board saved = boardRepository.save(board);
    log.info("✅ [CREATE] boardId={} 즉시 저장완료", saved.getId());

    // 🔥 비동기 검열 예약 (5초 후, 트랜잭션과 완전 독립)
    asyncModerationService.moderateBoardAsync(saved.getId(), 5);

    return BoardDto.toDto(saved, List.of());
  }

  // ========== 수정 (즉시 반영, 비동기 재검열) ==========
  @Transactional
  public BoardDto updateBoard(Long boardId, BoardDto dto) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new RuntimeException("게시글 없음"));

    dto.updateEntity(board);
    boardRepository.save(board);

    log.info("✅ [UPDATE] boardId={} 수정완료", boardId);

    // 🔥 비동기 재검열 (5초 후)
    asyncModerationService.moderateBoardAsync(boardId, 5);

    List<Comments> comments = commentRepository.findByBoardId(boardId);
    return BoardDto.toDto(board, comments);
  }

  // ========== 단건 재검열 (즉시 실행 - 관리자 기능) ==========
  @Transactional
  public BoardDto recheckOne(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new RuntimeException("게시글 없음"));

    log.info("🔄 [RECHECK] boardId={} 재검열 시작", boardId);

    // ✅ 큐를 통해 처리 (속도 제한 적용)
    var mres = queuedModerationService.moderate(board.getTitle(), board.getContent());
    applyModeration(board, mres);
    boardRepository.save(board);

    List<Comments> comments = commentRepository.findByBoardId(boardId);
    return BoardDto.toDto(board, comments);
  }

  // ========== 목록 ==========
  @Transactional(readOnly = true)
  public List<BoardDto> getAllBoards() {
    return boardRepository.findByHiddenFalseOrderByCreateAtDesc()
        .stream()
        .filter(b -> !"BOT".equals(b.getRole())) // 🔥 AI(BOT) 게시글 제외 - JobInfoList에서만 표시
        .map(b -> BoardDto.toDto(b, commentRepository.findByBoardId(b.getId())))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<BoardDto> getPopularBoards() {
    return boardRepository.findTop6ByHiddenFalseOrderByViewsDesc()
        .stream()
        .map(b -> BoardDto.toDto(b, commentRepository.findByBoardId(b.getId())))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<BoardDto> getBoardsByUser(Long userId) {
    return boardRepository.findByUsers_IdAndHiddenFalseOrderByCreateAtDesc(userId)
        .stream()
        .map(b -> BoardDto.toDto(b, commentRepository.findByBoardId(b.getId())))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<BoardDto> getBoardsByRole(String role) {
    return boardRepository.findByRoleOrderByCreateAtDesc(role)
        .stream()
        .filter(b -> !Boolean.TRUE.equals(b.getHidden()))
        .map(b -> BoardDto.toDto(b, commentRepository.findByBoardId(b.getId())))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<BoardDto> searchBoards(String keyword) {
    return boardRepository.searchVisibleBoards(keyword)
        .stream()
        .map(b -> BoardDto.toDto(b, commentRepository.findByBoardId(b.getId())))
        .toList();
  }

  // ========== 조회/증가 ==========
  @Transactional
  public BoardDto getBoard(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
    if (Boolean.TRUE.equals(board.getHidden())) {
      throw new RuntimeException("숨김 처리된 게시글입니다.");
    }
    board.setViews(board.getViews() == null ? 1 : board.getViews() + 1);
    boardRepository.save(board);

    List<Comments> comments = commentRepository.findByBoardId(boardId);
    return BoardDto.toDto(board, comments);
  }

  @Transactional
  public BoardDto incrementView(Long boardId) {
    Board board = boardRepository.findById(boardId)
        .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
    if (Boolean.TRUE.equals(board.getHidden())) {
      throw new RuntimeException("숨김 처리된 게시글입니다.");
    }
    board.setViews(board.getViews() == null ? 1 : board.getViews() + 1);
    boardRepository.save(board);

    List<Comments> comments = commentRepository.findByBoardId(boardId);
    return BoardDto.toDto(board, comments);
  }

  // ========== 엔티티 조회 ==========
  @Transactional(readOnly = true)
  public Board getBoardEntity(Long boardId) {
    return boardRepository.findById(boardId)
        .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
  }

  // ========== 댓글 조회 ==========
  @Transactional(readOnly = true)
  public List<Comments> getCommentsByBoardId(Long boardId) {
    return commentRepository.findByBoardId(boardId);
  }

  // ========== 배치 재검열 (관리자 기능) ==========
  @Transactional
  public int recheckBatchRecent(int days, int page, int size) {
    LocalDateTime after = LocalDateTime.now().minusDays(days);
    var list = boardRepository.findByHiddenFalseAndCreateAtAfter(after, PageRequest.of(page, size));
    int cnt = 0;
    for (Board b : list) {
      var mres = queuedModerationService.moderate(b.getTitle(), b.getContent());  // ✅ 큐 사용
      applyModeration(b, mres);
      boardRepository.save(b);
      cnt++;
    }
    log.info("🔄 [BATCH_RECENT] days={}, processed={}", days, cnt);
    return cnt;
  }

  @Transactional
  public int recheckBatchAll(int page, int size) {
    var list = boardRepository.findByHiddenFalse(PageRequest.of(page, size));
    int cnt = 0;
    for (Board b : list) {
      var mres = queuedModerationService.moderate(b.getTitle(), b.getContent());  // ✅ 큐 사용
      applyModeration(b, mres);
      boardRepository.save(b);
      cnt++;
    }
    log.info("🔄 [BATCH_ALL] processed={}", cnt);
    return cnt;
  }

  // ========== 삭제 ==========
  @Transactional
  public void deleteBoard(Long boardId) {
    controlRepo.deleteByBoardId(boardId);
    boardRepository.deleteById(boardId);
    log.info("🗑️ 게시글 삭제 완료 id={}", boardId);
  }

  // ========== AI 자동 게시글 ==========
  @Transactional
  public Board createAiPost(String title, String content, List<String> tags, Long writerIdOrNull) {
    Long writerId = (writerIdOrNull != null ? writerIdOrNull : 102L); // 🔥 BOT 계정 ID
    Users writer = usersRepository.findById(writerId)
        .orElseThrow(() -> new RuntimeException("AI 작성자 계정이 존재하지 않습니다. id=" + writerId));

    String key = title + ":" + content + ":" + LocalDateTime.now();
    String hash = DigestUtils.md5DigestAsHex(key.getBytes(StandardCharsets.UTF_8));

    if (boardRepository.existsByAiHash(hash)) {
      throw new DuplicateKeyException("중복 AI 게시글 감지");
    }

    Board b = new Board();
    b.setTitle(title);
    b.setContent(content);
    b.setTagsCsv((tags != null && !tags.isEmpty()) ? String.join(",", tags) : null);
    b.setRole("BOT");
    b.setAiHash(hash);
    b.setHidden(false);
    b.setViews(0L);
    b.setCreateAt(LocalDateTime.now());
    b.setUpdateAt(LocalDateTime.now());
    b.setUsers(writer);
    b.setAdminApproved(true); // 🔥 AI 검열 건너뛰기 - 뉴스 게시글은 자동 승인

    Board saved = boardRepository.save(b);
    log.info("🤖 AI 게시글 생성 완료: {}", title);

    return saved;
  }
}