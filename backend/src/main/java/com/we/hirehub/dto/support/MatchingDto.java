package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Matching;
import com.we.hirehub.entity.Resume;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingDto {

    private Long id;
    private Long companyId;
    private Long jobPostsId;
    private Long resumeId;
    private String ranking;
    private String companyName;
    private String jobPostTitle;
    private String resumeTitle;

    /** Entity -> Dto **/
    public static MatchingDto toDto(Matching matching) {
        return MatchingDto.builder()
                .id(matching.getId())
                .companyId(matching.getCompany().getId())
                .jobPostsId(matching.getJobPosts().getId())
                .resumeId(matching.getResume().getId())
                .ranking(matching.getRanking())
                .companyName(matching.getCompany().getName())
                .jobPostTitle(matching.getJobPosts().getTitle())
                .resumeTitle(matching.getResume().getTitle())
                .build();
    }

    /** Dto -> Entity **/
    public Matching toEntity(Company company, JobPosts jobPosts, Resume resume) {
        return Matching.builder()
                .id(this.id)
                .company(company)
                .jobPosts(jobPosts)
                .resume(resume)
                .ranking(this.ranking)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(Matching matching) {
        if (this.ranking != null) {
            matching.setRanking(this.ranking);
        }
    }
}
