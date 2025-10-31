package com.we.hirehub.service;

import com.we.hirehub.dto.FavoriteJobPostSummaryDto;
import com.we.hirehub.dto.PagedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobPostScrapService {

    private final JdbcTemplate jdbc;

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

    private RowMapper<FavoriteJobPostSummaryDto> rowMapper() {
        return new RowMapper<>() {
            @Override public FavoriteJobPostSummaryDto mapRow(ResultSet rs, int rowNum) throws SQLException {
                return new FavoriteJobPostSummaryDto(
                        rs.getLong("id"),
                        rs.getLong("job_post_id"),
                        rs.getString("title"),
                        rs.getString("company_name"),
                        rs.getDate("end_at") != null ? rs.getDate("end_at").toLocalDate() : null
                );
            }
        };
    }

    @Transactional
    public FavoriteJobPostSummaryDto add(Long userId, Long jobPostId) {
        // 중복 무시
        String insertSql = "INSERT IGNORE INTO scrap_posts (users_id, " + jobPostCol + ") VALUES (?, ?)";
        jdbc.update(insertSql, userId, jobPostId);

        String selectOne =
                "SELECT s.id, s." + jobPostCol + " AS job_post_id, j.title, c.name AS company_name, j.end_at " +
                        "FROM scrap_posts s " +
                        "JOIN job_posts j ON j.id = s." + jobPostCol + " " +
                        "JOIN company c ON c.id = j.company_id " +
                        "WHERE s.users_id = ? AND s." + jobPostCol + " = ? " +
                        "LIMIT 1";

        return jdbc.queryForObject(selectOne, rowMapper(), userId, jobPostId);
    }

    public PagedResponse<FavoriteJobPostSummaryDto> list(Long userId, int page, int size) {
        int limit  = Math.max(size, 1);
        int offset = Math.max(page, 0) * limit;

        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM scrap_posts WHERE users_id = ?",
                Long.class, userId
        );
        long totalCount = total != null ? total : 0L;

        String listSql =
                "SELECT s.id, s." + jobPostCol + " AS job_post_id, j.title, c.name AS company_name, j.end_at " +
                        "FROM scrap_posts s " +
                        "JOIN job_posts j ON j.id = s." + jobPostCol + " " +
                        "JOIN company c ON c.id = j.company_id " +
                        "WHERE s.users_id = ? " +
                        "ORDER BY s.id DESC " +
                        "LIMIT ? OFFSET ?";

        List<FavoriteJobPostSummaryDto> rows = jdbc.query(listSql, rowMapper(), userId, limit, offset);

        int totalPages = (int) Math.ceil(totalCount / (double) limit);
        return new PagedResponse<>(rows, page, limit, totalCount, totalPages);
    }

    @Transactional
    public void remove(Long userId, Long jobPostId) {
        String deleteSql = "DELETE FROM scrap_posts WHERE users_id = ? AND " + jobPostCol + " = ?";
        jdbc.update(deleteSql, userId, jobPostId);
    }
}
