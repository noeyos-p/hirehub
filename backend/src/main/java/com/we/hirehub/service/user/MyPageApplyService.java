package com.we.hirehub.service.user;

import com.we.hirehub.dto.user.ApplyDto;
import com.we.hirehub.entity.Apply;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.entity.Resume;
import com.we.hirehub.exception.ResourceNotFoundException;
import com.we.hirehub.repository.ApplyRepository;
import com.we.hirehub.repository.JobPostsRepository;
import com.we.hirehub.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageApplyService {

    private final ApplyRepository applyRepository;
    private final ResumeRepository resumeRepository;
    private final JobPostsRepository jobPostsRepository;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;



    /* ==========================================================
     *                     [지원 내역 조회]
     * ========================================================== */
    public List<ApplyDto> getMyApplyList(Long userId) {
        List<Apply> applies = applyRepository.findByResume_Users_Id(userId);

        return applies.stream()
                .map(ApplyDto::toDto)
                .collect(Collectors.toList());
    }

    /* ==========================================================
     *                      [지원하기]
     * ========================================================== */
    @Transactional
    public ApplyDto applyToJob(Long userId, Long jobPostId, Long resumeId) {

        Resume resume = resumeRepository.findByIdAndUsers_Id(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("이력서를 찾을 수 없습니다."));

        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new ResourceNotFoundException("공고를 찾을 수 없습니다."));

        // 제출된 이력서는 수정/삭제 불가
        resume.setLocked(true);
        resumeRepository.save(resume);

        Apply apply = Apply.builder()
                .resume(resume)
                .jobPosts(jobPost)
                .applyAt(LocalDate.now())
                .build();

        Apply saved = applyRepository.save(apply);

        return ApplyDto.toDto(saved);
    }

    /* ==========================================================
     *                      [지원 내역 삭제]
     * ========================================================== */
    @Transactional
    public void deleteMyApplies(Long userId, List<Long> applyIds) {

        // 쿼리 메서드 그대로 유지
        applyRepository.deleteAllByUserIdAndApplyIds(userId, applyIds);

        log.info("🗑️ 지원 내역 삭제 완료: userId={}, ids={}", userId, applyIds);
    }

    @Transactional
    public String uploadResumePhotoToS3(Long resumeId, MultipartFile file) throws IOException {
        log.info("📸 S3 업로드 시도 - resumeId={}, file={}", resumeId, file.getOriginalFilename());

        Resume r = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("이력서를 찾을 수 없습니다."));

        String key = "photos/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        String photoUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);

        try {
            log.info("➡️ bucket={}, region={}, key={}", bucketName, region, key);
            log.info("➡️ file size={} bytes, contentType={}", file.getSize(), file.getContentType());

            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    software.amazon.awssdk.core.sync.RequestBody.fromInputStream(
                            file.getInputStream(), file.getSize()
                    )
            );

            r.setIdPhoto(photoUrl);
            r.setUpdateAt(LocalDate.now());
            resumeRepository.save(r);

            log.info("✅ 업로드 성공: {}", photoUrl);
            return photoUrl;

        } catch (Exception e) {
            log.error("🚨 업로드 실패: {}", e.getMessage(), e);

            // ✅ 로그 못 볼 때, 원인을 직접 응답으로 반환
            throw new RuntimeException(
                    "UPLOAD_ERROR: " + e.getClass().getSimpleName() + " - " + e.getMessage()
            );
        }
    }

}
