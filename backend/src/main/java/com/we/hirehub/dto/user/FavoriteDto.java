package com.we.hirehub.dto.user;

import com.we.hirehub.entity.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

public class FavoriteDto {

    /** 스크랩 공고 DTO */
    @Data
    @Builder
    public static class ScrapPostsDto {
        private Long id;
        private Long userId;
        private Long jobPostId;
        private String title;
        private String companyName;
        private LocalDate endAt;

        /** Entity → DTO */
        public static ScrapPostsDto toDto(ScrapPosts e) {
            if (e == null) return null;

            JobPosts jp = e.getJobPosts();

            return ScrapPostsDto.builder()
                    .id(e.getId())
                    .userId(e.getUsers().getId())
                    .jobPostId(jp.getId())
                    .title(jp.getTitle())
                    .companyName(jp.getCompany().getName())
                    .endAt(jp.getEndAt())
                    .build();
        }

        /** DTO → Entity */
        public ScrapPosts toEntity() {
            ScrapPosts entity = new ScrapPosts();
            entity.setId(this.id);

            Users user = new Users();
            user.setId(this.userId);
            entity.setUsers(user);

            JobPosts jobPost = new JobPosts();
            jobPost.setId(this.jobPostId);
            entity.setJobPosts(jobPost);

            return entity;
        }
    }

    /** 관심 기업 DTO */
    @Data
    @Builder
    public static class FavoriteCompanyDto {
        private Long id;
        private Long userId;
        private Long companyId;
        private String companyName;
        private Long postCount;
        private String companyPhoto;
        private String industry;

        /** Entity → DTO */
        public static FavoriteCompanyDto toDto(FavoriteCompany e) {
            if (e == null) return null;

            return FavoriteCompanyDto.builder()
                    .id(e.getId())
                    .userId(e.getUsers().getId())
                    .companyId(e.getCompany().getId())
                    .companyName(e.getCompany().getName())
                    .companyPhoto(e.getCompany().getPhoto())
                    .industry(e.getCompany().getIndustry())
                    .build();
        }

        /** DTO → Entity */
        public FavoriteCompany toEntity() {
            FavoriteCompany entity = new FavoriteCompany();
            entity.setId(this.id);

            Users user = new Users();
            user.setId(this.userId);
            entity.setUsers(user);

            Company company = new Company();
            company.setId(this.companyId);
            entity.setCompany(company);

            return entity;
        }
    }
}
