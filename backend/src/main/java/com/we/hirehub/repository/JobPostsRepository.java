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

    // 페이징
    Page<JobPosts> findAll(Pageable pageable);

    // 기존 검색 메서드
    List<JobPosts> findByLocationContaining(String location);
    List<JobPosts> findByCareerLevelContaining(String careerLevel);
    List<JobPosts> findByTitleContaining(String keyword);



    // ★ 추가: 회사명으로 공고 수 카운트 (상태 필드 없이 전체 공고 수)
    long countByCompany_Id(Long companyId);

    /*
     * 만약 상태 필드가 생기면 아래처럼 바꾸는 것을 추천:
     *
     * long countByCompanyNameAndStatusIn(String companyName, Collection<JobPostStatus> statuses);
     *
     * // 사용 예: jobPostsRepository.countByCompanyNameAndStatusIn(name, List.of(OPEN, ACTIVE));
     */

    // 월(또는 임의 범위) 달력 렌더링용
    List<JobPosts> findByEndAtBetween(LocalDate from, LocalDate to);

    // 특정 날짜 클릭 시 오른쪽 리스트용 (페이징)
    Page<JobPosts> findByEndAt(LocalDate date, Pageable pageable);

    // 달력 칩/도트 개수만 빠르게 그리고 싶으면 (선택)
    @Query("select j.endAt as date, count(j) as cnt " +
            "from JobPosts j " +
            "where j.endAt between :from and :to " +
            "group by j.endAt")
    List<Object[]> countByEndAtBetween(LocalDate from, LocalDate to);
}
