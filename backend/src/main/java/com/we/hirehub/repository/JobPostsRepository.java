package com.we.hirehub.repository;

import com.we.hirehub.entity.JobPosts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JobPostsRepository extends JpaRepository<JobPosts, Long> {

    // ✅ 기존 기본 메서드
    Page<JobPosts> findAll(Pageable pageable);

    // ✅ 기존 검색 메서드
    List<JobPosts> findByLocationContaining(String location);
    List<JobPosts> findByCareerLevelContaining(String careerLevel);
    List<JobPosts> findByTitleContaining(String keyword);

    // ✅ 기존 통계용 메서드
    long countByCompany_Id(Long companyId);

    /*
     * 만약 상태 필드가 생기면 아래처럼 바꾸는 것을 추천:
     *
     * long countByCompanyNameAndStatusIn(String companyName, Collection<JobPostStatus> statuses);
     *
     * // 사용 예: jobPostsRepository.countByCompanyNameAndStatusIn(name, List.of(OPEN, ACTIVE));
     */

    // ✅ 기존: 월별(또는 임의 범위) 달력 렌더링용
    List<JobPosts> findByEndAtBetween(LocalDate from, LocalDate to);

    // ✅ 기존: 특정 날짜 클릭 시 오른쪽 리스트용 (페이징)
    Page<JobPosts> findByEndAt(LocalDate date, Pageable pageable);

    // ✅ 기존: 달력 칩/도트 개수용
    @Query("select j.endAt as date, count(j) as cnt " +
            "from JobPosts j " +
            "where j.endAt between :from and :to " +
            "group by j.endAt")
    List<Object[]> countByEndAtBetween(LocalDate from, LocalDate to);

    // ✅ [추가] 검색 기능용 통합 쿼리
    //  제목(title), 회사명(company.name), 직무(position) 3가지 기준으로 검색
    Page<JobPosts> findByTitleContainingIgnoreCaseOrCompany_NameContainingIgnoreCaseOrPositionContainingIgnoreCase(
            String titleKeyword,
            String companyKeyword,
            String positionKeyword,
            Pageable pageable
    );
}
