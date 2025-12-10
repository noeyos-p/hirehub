package com.we.hirehub.service.admin;

import com.we.hirehub.dto.admin.AiBoardControlDto;
import com.we.hirehub.entity.AiBoardControl;
import com.we.hirehub.entity.Board;
import com.we.hirehub.repository.AiBoardControlRepository;
import com.we.hirehub.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiBoardControlService {

  private final AiBoardControlRepository aiBoardControlRepository;
  private final BoardRepository boardRepository;

  // 모든 AI 제어 기록 가져오기
  @Transactional(readOnly = true)
  public List<AiBoardControlDto> getAllAiBoardControls() {
    return aiBoardControlRepository.findAllByOrderByIdDesc().stream()
        .map(AiBoardControlDto::from)
        .collect(Collectors.toList());
  }

  // 게시글 복구 (봇 차단 해제)
  @Transactional
  public void restoreBoard(Long id) {
    AiBoardControl aiBoardControl = aiBoardControlRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("해당 AI 제어 기록을 찾을 수 없습니다. id=" + id));

    Board board = aiBoardControl.getBoard();

    // 게시글 숨김 해제
    board.setHidden(false);
    board.setAdminApproved(true); // 관리자 승인 - AI가 재차단 못함

    // AI 제어 기록의 역할을 ADMIN으로 변경 (관리자가 개입함)
    aiBoardControl.setRole("ADMIN");

    boardRepository.save(board);
    aiBoardControlRepository.save(aiBoardControl);
  }
}
