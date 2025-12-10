package com.we.hirehub.repository;

import com.we.hirehub.entity.AiBoardControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AiBoardControlRepository extends JpaRepository<AiBoardControl, Long> {
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("delete from AiBoardControl c where c.board.id = :boardId")
  void deleteByBoardId(Long boardId);

  List<AiBoardControl> findAll();

  // 최신순 정렬해서 가져오기
  List<AiBoardControl> findAllByOrderByIdDesc();
}
