package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Coach;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Resume;
import com.we.hirehub.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachDto {

    private Long id;
    private Long userId;
    private Long resumeId;
    private Long jobPostsId;
    private Long companyId;
    private String content;
    private String role;
    private String userName;
    private String resumeTitle;
    private String jobPostTitle;
    private String companyName;

    /** Entity -> Dto **/
    public static CoachDto toDto(Coach coach) {
        return CoachDto.builder()
                .id(coach.getId())
                .userId(coach.getUser().getId())
                .resumeId(coach.getResume().getId())
                .jobPostsId(coach.getJobPosts().getId())
                .companyId(coach.getCompany().getId())
                .content(coach.getContent())
                .role(coach.getRole())
                .userName(coach.getUser().getName())
                .resumeTitle(coach.getResume().getTitle())
                .jobPostTitle(coach.getJobPosts().getTitle())
                .companyName(coach.getCompany().getName())
                .build();
    }

    /** Dto -> Entity **/
    public Coach toEntity(Users user, Resume resume, JobPosts jobPosts, Company company) {
        return Coach.builder()
                .id(this.id)
                .user(user)
                .resume(resume)
                .jobPosts(jobPosts)
                .company(company)
                .content(this.content)
                .role(this.role)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(Coach coach) {
        if (this.content != null) {
            coach.setContent(this.content);
        }
        if (this.role != null) {
            coach.setRole(this.role);
        }
    }
}
