package com.we.hirehub.dto.job;

import com.we.hirehub.entity.Apply;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Resume;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyDto {

    private Long id;
    private Long resumeId;
    private Long jobPostsId;
    private String companyName;
    private String resumeTitle;
    private LocalDate appliedAt;

    /** Entity -> Dto **/
    public static ApplyDto toDto(Apply apply) {
        return ApplyDto.builder()
                .id(apply.getId())
                .resumeId(apply.getResume().getId())
                .jobPostsId(apply.getJobPosts().getId())
                .companyName(apply.getJobPosts().getCompany().getName())
                .resumeTitle(apply.getResume().getTitle())
                .appliedAt(apply.getApplyAt())
                .build();
    }

    /** Dto -> Entity
    * Resume와 JobPosts 객체가 필요하므로 매개변수로 받음 **/
    public Apply toEntity(Resume resume, JobPosts jobPosts) {
        return Apply.builder()
                .id(this.id)
                .resume(resume)
                .jobPosts(jobPosts)
                .applyAt(this.appliedAt != null ? this.appliedAt : LocalDate.now())
                .build();
    }

    /** 기존 Entity 업데이트 (수정용) **/
    public void updateEntity(Apply apply) {
        // 지원 내역은 보통 수정하지 않지만, 필요시 추가
        if (this.appliedAt != null) {
            apply.setApplyAt(this.appliedAt);
        }
        // 이력서나 공고 변경이 필요한 경우 추가 로직 구현
    }
}