package com.we.hirehub.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS =
            Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * ✅ 이력서 증명사진 업로드 (Resume idPhoto)
     * 경로: resume/photos/{userId}/{timestamp_uuid.ext}
     */
    public String uploadResumePhoto(MultipartFile file, Long userId) {
        validateImageFile(file);
        String fileName = generateFileName(file.getOriginalFilename());
        String key = String.format("resume/photos/%d/%s", userId, fileName);
        return uploadFile(file, key);
    }

    /**
     * ✅ 공고 관련 이미지 업로드 (JobPosts)
     * 경로: jobposts/images/{jobPostId}/{timestamp_uuid.ext}
     */
    public String uploadJobPostImage(MultipartFile file, Long jobPostId) {
        validateImageFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String folderName = (jobPostId != null && jobPostId > 0)
                ? "jobposts/images/" + jobPostId
                : "jobposts/temp/" + UUID.randomUUID();

        String uniqueFileName = String.format("%s/%s_%s%s",
                folderName,
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")),
                UUID.randomUUID().toString().substring(0, 8),
                extension
        );

        return uploadFile(file, uniqueFileName);
    }

    /**
     * ✅ 광고 이미지 업로드 (Ads photo)
     * 경로: ads/images/{timestamp_uuid.ext} (adId 없이 업로드, 나중에 DB에 저장)
     */
    public String uploadAdImage(MultipartFile file, Long adId) {
        validateImageFile(file);
        String fileName = generateFileName(file.getOriginalFilename());

        // adId가 0 또는 null이면 임시 폴더에 업로드
        String key;
        if (adId == null || adId == 0) {
            key = String.format("ads/images/temp/%s", fileName);
            log.info("📤 광고 이미지 임시 업로드: {}", key);
        } else {
            key = String.format("ads/images/%d/%s", adId, fileName);
            log.info("📤 광고 이미지 업로드 (adId={}): {}", adId, key);
        }

        return uploadFile(file, key);
    }

    /**
     * ✅ 기업 사진 업로드 (Company photo)
     * 경로: company/photos/{companyId}/{timestamp_uuid.ext}
     */
    public String uploadCompanyPhoto(MultipartFile file, Long companyId) {
        validateImageFile(file);
        String fileName = generateFileName(file.getOriginalFilename());
        String key = String.format("company/photos/%d/%s", companyId, fileName);
        return uploadFile(file, key);
    }

    /**
     * ✅ 공통 업로드 처리
     * S3에 업로드 후 접근 가능한 URL 반환
     */
    public String uploadFile(MultipartFile file, String key) {
        try {
            log.info("🔄 S3 업로드 시작 - bucket: {}, key: {}, size: {} bytes",
                    bucketName, key, file.getSize());

            // ACL 없이 업로드 (버킷 정책으로 퍼블릭 접근 제어)
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );

            String fileUrl = String.format(
                    "https://%s.s3.%s.amazonaws.com/%s",
                    bucketName,
                    s3Client.serviceClientConfiguration().region().id(),
                    key
            );

            log.info("✅ 파일 업로드 성공: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("❌ 파일 업로드 실패 (IO) - key: {}", key, e);
            throw new RuntimeException("파일 읽기 중 오류가 발생했습니다: " + e.getMessage(), e);
        } catch (S3Exception e) {
            log.error("❌ S3 업로드 실패 - bucket: {}, key: {}, error: {}",
                    bucketName, key, e.awsErrorDetails().errorMessage(), e);
            throw new RuntimeException("S3 업로드 중 오류가 발생했습니다: " + e.awsErrorDetails().errorMessage(), e);
        } catch (Exception e) {
            log.error("❌ 예상치 못한 업로드 실패 - key: {}", key, e);
            throw new RuntimeException("파일 업로드 중 예상치 못한 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * ✅ 파일 삭제
     */
    public void deleteFile(String fileUrl) {
        try {
            String key = extractKeyFromUrl(fileUrl);
            log.info("🗑️ S3 삭제 시작 - bucket: {}, key: {}", bucketName, key);

            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("✅ 파일 삭제 완료: {}", key);

        } catch (S3Exception e) {
            log.error("❌ S3 파일 삭제 실패 - url: {}, error: {}",
                    fileUrl, e.awsErrorDetails().errorMessage(), e);
            throw new RuntimeException("파일 삭제 중 오류가 발생했습니다: " + e.awsErrorDetails().errorMessage(), e);
        } catch (Exception e) {
            log.error("❌ 파일 삭제 실패 - url: {}", fileUrl, e);
            throw new RuntimeException("파일 삭제 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * ✅ URL에서 Key 추출
     * (CloudFront, Amazon S3 모두 지원)
     */
    private String extractKeyFromUrl(String fileUrl) {
        if (fileUrl.contains(".amazonaws.com/")) {
            return fileUrl.substring(fileUrl.indexOf(".amazonaws.com/") + 15);
        } else if (fileUrl.contains("cloudfront.net/")) {
            return fileUrl.substring(fileUrl.indexOf("cloudfront.net/") + 14);
        } else {
            throw new IllegalArgumentException("지원되지 않는 S3 URL 형식: " + fileUrl);
        }
    }

    /**
     * ✅ 이미지 파일 검증
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 10MB를 초과할 수 없습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("파일 이름이 없습니다.");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 가능)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }
    }

    /**
     * ✅ 파일 이름 생성 (타임스탬프 + UUID)
     */
    private String generateFileName(String originalFilename) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        String extension = getFileExtension(originalFilename);
        return String.format("%s_%s.%s", timestamp, uuid, extension);
    }

    /**
     * ✅ 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }
}
