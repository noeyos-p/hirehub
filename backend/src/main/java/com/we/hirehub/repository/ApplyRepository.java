package com.we.hirehub.repository;

import com.we.hirehub.entity.Apply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApplyRepository extends JpaRepository<Apply, Long> {

    /** ✅ 내 지원 내역 조회 */
    List<Apply> findByResume_Users_Id(Long userId);

    /** ✅ 같은 공고 중복지원 방지 */
    Optional<Apply> findByJobPosts_IdAndResume_Users_Id(Long jobPostId, Long userId);

    /** ✅ 내가 쓴 지원 내역 중 특정 ID들 삭제 */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Apply a WHERE a.id IN :applyIds AND a.resume.users.id = :userId")
    void deleteAllByUserIdAndApplyIds(@Param("userId") Long userId, @Param("applyIds") List<Long> applyIds);
}
