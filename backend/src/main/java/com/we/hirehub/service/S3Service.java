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

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * 이력서 증명사진 업로드 (Resume idPhoto)
     * 경로: resume/photos/{userId}/{timestamp}_{uuid}.{ext}
     */
    public String uploadResumePhoto(MultipartFile file, Long userId) {
        validateImageFile(file);
        String fileName = generateFileName(file.getOriginalFilename());
        String key = String.format("resume/photos/%d/%s", userId, fileName);
        return uploadFile(file, key);
    }

    /**
     * 공고 관련 이미지 업로드 (JobPosts)
     * 경로: jobposts/images/{companyId}/{timestamp}_{uuid}.{ext}
     */
    public String uploadJobPostImage(MultipartFile file, Long companyId) {
        validateImageFile(file);
        String fileName = generateFileName(file.getOriginalFilename());
        String key = String.format("jobposts/images/%d/%s", companyId, fileName);
        return uploadFile(file, key);
    }

    /**
     * 광고 이미지 업로드 (Ads photo)
     * 경로: ads/images/{adId}/{timestamp}_{uuid}.{ext}
     */
    public String uploadAdImage(MultipartFile file, Long adId) {
        validateImageFile(file);
        String fileName = generateFileName(file.getOriginalFilename());
        String key = String.format("ads/images/%d/%s", adId, fileName);
        return uploadFile(file, key);
    }

    /**
     * 기업 사진 업로드 (Company photo)
     * 경로: company/photos/{companyId}/{timestamp}_{uuid}.{ext}
     */
    public String uploadCompanyPhoto(MultipartFile file, Long companyId) {
        validateImageFile(file);
        String fileName = generateFileName(file.getOriginalFilename());
        String key = String.format("company/photos/%d/%s", companyId, fileName);
        return uploadFile(file, key);
    }

    /**
     * 파일 업로드 (이미지) - ACL 제거됨
     */
    private String uploadFile(MultipartFile file, String key) {
        try {
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

            String fileUrl = String.format("https://%s.s3.%s.amazonaws.com/%s",
                    bucketName, s3Client.serviceClientConfiguration().region(), key);

            log.info("File uploaded successfully: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("Failed to upload file: {}", key, e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
        } catch (S3Exception e) {
            log.error("S3 error while uploading file: {}", key, e);
            throw new RuntimeException("S3 업로드 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 파일 삭제
     */
    public void deleteFile(String fileUrl) {
        try {
            String key = extractKeyFromUrl(fileUrl);

            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("File deleted successfully: {}", key);

        } catch (S3Exception e) {
            log.error("S3 error while deleting file: {}", fileUrl, e);
            throw new RuntimeException("파일 삭제 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 여러 파일 삭제
     */
    public void deleteFiles(List<String> fileUrls) {
        fileUrls.forEach(this::deleteFile);
    }

    /**
     * URL에서 S3 Key 추출
     */
    private String extractKeyFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            throw new IllegalArgumentException("파일 URL이 비어있습니다.");
        }

        // https://bucket.s3.region.amazonaws.com/key 형식에서 key 추출
        String[] parts = fileUrl.split(".amazonaws.com/");
        if (parts.length != 2) {
            throw new IllegalArgumentException("올바르지 않은 S3 URL 형식입니다.");
        }

        return parts[1];
    }

    /**
     * 이미지 파일 검증
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
     * 파일 이름 생성 (이미지용)
     */
    private String generateFileName(String originalFilename) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        String extension = getFileExtension(originalFilename);
        return String.format("%s_%s.%s", timestamp, uuid, extension);
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }
}