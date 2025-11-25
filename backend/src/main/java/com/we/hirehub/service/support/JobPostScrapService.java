package com.we.hirehub.service.support;

import com.we.hirehub.dto.common.PagedResponse;
import com.we.hirehub.dto.user.FavoriteDto;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.ScrapPosts;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.ScrapPostsRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobPostScrapService {

    private final JdbcTemplate jdbc;
    private final ScrapPostsRepository scrapPostsRepository;
    private final JobPostsRepository jobPostsRepository;
    private final UsersRepository usersRepository;

    /** 실제 컬럼명 (실제 테이블에 있는 쪽으로 자동 설정됨) */
    private String jobPostCol = "job_post_id";

    @PostConstruct
    void detectColumn() {
        try {
            Integer n = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                            "WHERE table_name='scrap_posts' AND column_name='job_post_id'", Integer.class);
            if (n != null && n > 0) {
                jobPostCol = "job_post_id";
                return;
            }
        } catch (Exception ignore) {}
        try {
            Integer n = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                            "WHERE table_name='scrap_posts' AND column_name='job_posts_id'", Integer.class);
            if (n != null && n > 0) {
                jobPostCol = "job_posts_id";
                return;
            }
        } catch (Exception ignore) {}

        // 최종 못 찾으면 기본값 유지
    }

    @Transactional
    public FavoriteDto.ScrapPostsDto add(Long userId, Long jobPostId) {

        boolean exists = scrapPostsRepository.existsByUsersIdAndJobPostsId(userId, jobPostId);

        if (exists) {
            ScrapPosts entity = scrapPostsRepository
                    .findByUsersIdAndJobPostsId(userId, jobPostId)
                    .orElseThrow();
            return FavoriteDto.ScrapPostsDto.toDto(entity);
        }

        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 사용자입니다."));

        JobPosts jobPosts = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 공고입니다."));

        ScrapPosts newScrap = new ScrapPosts();
        newScrap.setUsers(user);
        newScrap.setJobPosts(jobPosts);

        ScrapPosts saved = scrapPostsRepository.save(newScrap);
        return FavoriteDto.ScrapPostsDto.toDto(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<FavoriteDto.ScrapPostsDto> list(Long userId, int page, int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<ScrapPosts> pageResult = scrapPostsRepository.findByUsersId(userId, pageable);

        List<FavoriteDto.ScrapPostsDto> content = pageResult.getContent()
                .stream()
                .map(FavoriteDto.ScrapPostsDto::toDto)
                .toList();

        return new PagedResponse<>(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }
    @Transactional
    public void remove(Long userId, Long jobPostId) {
        ScrapPosts entity = scrapPostsRepository
                .findByUsersIdAndJobPostsId(userId, jobPostId)
                .orElseThrow(() -> new IllegalArgumentException("스크랩이 존재하지 않습니다."));

        scrapPostsRepository.delete(entity);
    }
}
