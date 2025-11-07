package com.we.hirehub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.*;
import com.we.hirehub.entity.*;
import com.we.hirehub.exception.ForbiddenEditException;
import com.we.hirehub.exception.ResourceNotFoundException;
import com.we.hirehub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageService {

    // ===== Repositories =====
    private final ResumeRepository resumeRepository;
    private final UsersRepository userRepository;
    private final ApplyRepository applyRepository;
    private final FavoriteCompanyRepository favoriteCompanyRepository;
    private final JobPostsRepository jobPostsRepository;
    private final CompanyRepository companyRepository;

    private final EducationRepository educationRepo;
    private final CareerLevelRepository careerRepo;
    private final CertificateRepository certRepo;
    private final SkillRepository skillRepo;
    private final LanguageRepository languageRepo;
    private final UsersRepository usersRepository; // ✅ 이거 추가
    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;


    private final ObjectMapper om = new ObjectMapper();

    /* ==========================================================
     *                   [1] 이력서 CRUD
     * ========================================================== */

    /**
     * 이력서 목록
     */
    public PagedResponse<ResumeDto> list(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updateAt"));
        Page<Resume> p = resumeRepository.findByUsers_Id(userId, pageable);

        return new PagedResponse<>(
                p.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()
        );
    }

    /**
     * 이력서 단건
     */
    public ResumeDto get(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findByIdAndUsers_Id(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("이력서를 찾을 수 없습니다."));
        return toDto(resume);
    }

    /**
     * 생성: htmlContent 또는 *_Json → 섹션 엔티티까지 저장
     */
    @Transactional
    public ResumeDto create(Long userId, ResumeUpsertRequest req) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("회원 정보를 찾을 수 없습니다."));

        Resume resume = Resume.builder()
                .title(req.title())
                .idPhoto(req.idPhoto())
                .essayTittle(req.essayTitle())
                .essayContent(req.essayContent())
                .htmlContent(req.htmlContent())  // 원본 JSON 보관
                .createAt(LocalDate.now())
                .updateAt(LocalDate.now())
                .locked(false)
                .users(user)
                .build();

        Resume saved = resumeRepository.save(resume);

        // 섹션 저장 (htmlContent만 있어도 파싱해서 저장)
        upsertSections(saved, req);

        return toDto(saved);
    }

    /**
     * 수정: 잠금 검사 + 섹션 전부 재저장
     */
    @Transactional
    public ResumeDto update(Long userId, Long resumeId, ResumeUpsertRequest req) {
        Resume resume = resumeRepository.findByIdAndUsers_Id(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("이력서를 찾을 수 없습니다."));

        if (resume.isLocked() || resumeRepository.existsByIdAndUsers_IdAndLockedTrue(resumeId, userId)) {
            throw new ForbiddenEditException("이미 제출된 이력서는 수정할 수 없습니다.");
        }

        resume.setTitle(req.title());
        resume.setIdPhoto(req.idPhoto());
        resume.setEssayTittle(req.essayTitle());
        resume.setEssayContent(req.essayContent());
        resume.setHtmlContent(req.htmlContent());
        resume.setUpdateAt(LocalDate.now());
        resumeRepository.save(resume);

        // 섹션 전부 갈아끼우기
        upsertSections(resume, req);

        return toDto(resume);
    }

    /**
     * 삭제
     */
    @Transactional
    public void delete(Long userId, Long resumeId) {
        Resume resume = resumeRepository.findByIdAndUsers_Id(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("이력서를 찾을 수 없습니다."));

        if (resume.isLocked() || resumeRepository.existsByIdAndUsers_IdAndLockedTrue(resumeId, userId)) {
            throw new ForbiddenEditException("이미 제출된 이력서는 삭제할 수 없습니다.");
        }

        Long rid = resume.getId();
        // FK 제약 예방: 섹션부터 삭제
        educationRepo.deleteByResumeId(rid);
        careerRepo.deleteByResumeId(rid);
        certRepo.deleteByResumeId(rid);
        skillRepo.deleteByResumeId(rid);
        languageRepo.deleteByResumeId(rid);

        resumeRepository.delete(resume);
    }

    /**
     * Resume → DTO (profile 포함)
     */
    private ResumeDto toDto(Resume r) {
        Users u = r.getUsers();
        UserProfileMiniDto profile = null;
        if (u != null) {
            profile = new UserProfileMiniDto(
                    u.getId(),
                    u.getNickname(),
                    u.getName(),
                    u.getPhone(),
                    u.getGender(),
                    (u.getDob() != null ? LocalDate.parse(u.getDob()) : null),
                    u.getAddress(),
                    u.getEmail()
            );
        }

        Long rid = r.getId();

        // ★★ 1) 여기: 리포지토리 메서드 이름을 프로젝트에 맞춰 "findByResumeId" 로 통일 ★★
        //    (이미 deleteByResumeId(...)를 쓰고 있었다면, find도 같은 규칙으로 만드세요)
        //    repository 인터페이스에 아래 시그니처 추가 필요:
        //    List<Education> findByResumeId(Long resumeId);  (등등 동일)

        List<Map<String, Object>> eduList =
                educationRepo.findByResumeId(rid).stream().map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", e.getName());
                    m.put("major", e.getMajor());
                    m.put("status", e.getStatus());
                    m.put("type", e.getType());
                    m.put("startAt", e.getStartAt());
                    m.put("endAt", e.getEndAt());
                    return m;
                }).toList();

        List<Map<String, Object>> careerList =
                careerRepo.findByResumeId(rid).stream().map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("companyName", c.getCompanyName());
                    m.put("type", c.getType());
                    m.put("position", c.getPosition());
                    m.put("startAt", c.getStartAt());
                    m.put("endAt", c.getEndAt());
                    m.put("content", c.getContent());
                    return m;
                }).toList();

        List<Map<String, Object>> certList =
                certRepo.findByResumeId(rid).stream().map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", c.getName());
                    return m;
                }).toList();

        List<Map<String, Object>> skillList =
                skillRepo.findByResumeId(rid).stream().map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", s.getName());
                    return m;
                }).toList();

        // ★★ 2) 여기: 언어 리스트는 String만 들어가서 컴파일러가 List<Map<String,String>>로 추론함.
        //          값을 Object로 명시해서 List<Map<String,Object>>가 되도록 만든다.
        List<Map<String, Object>> langList =
                languageRepo.findByResumeId(rid).stream().map(l -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", (Object) l.getName()); // ← Object로 명시
                    return m;
                }).toList();

        return new ResumeDto(
                r.getId(),
                r.getTitle(),
                r.getIdPhoto(),
                r.getEssayTittle(),
                r.getEssayContent(),
                r.getHtmlContent(),
                r.isLocked(),
                r.getCreateAt(),
                r.getUpdateAt(),
                profile,
                null,            // users (관리자용이 아니니 null)
                eduList,
                careerList,
                certList,
                skillList,
                langList
        );
    }



    /* ==========================================================
     *                 [1-1] 섹션 업서트 로직
     * ========================================================== */

    @Transactional
    protected void upsertSections(Resume resume, ResumeUpsertRequest req) {
        final Long rid = resume.getId();

        // 1) 전부 삭제(덮어쓰기 전략)
        educationRepo.deleteByResumeId(rid);
        careerRepo.deleteByResumeId(rid);
        certRepo.deleteByResumeId(rid);
        skillRepo.deleteByResumeId(rid);
        languageRepo.deleteByResumeId(rid);

        // 2) 입력 소스 만들기 (우선순위: *_Json → htmlContent)
        List<Map<String, Object>> educations = parseList(req.educationJson());
        List<Map<String, Object>> careers = parseList(req.careerJson());
        List<Map<String, Object>> certs = parseList(req.certJson());
        List<Map<String, Object>> skills = parseList(req.skillJson());
        List<Map<String, Object>> languages = parseList(req.langJson());

// ★ 폴백 복구: *_Json이 전부 비어 있고, htmlContent가 JSON이면 거기서 추출
        if (allEmpty(educations, careers, certs, skills, languages) && looksJson(resume.getHtmlContent())) {
            try {
                JsonNode root = om.readTree(resume.getHtmlContent());
                educations = extractList(root, "education");
                careers = extractList(root, "career");
                certs = extractList(root, "certificate");
                skills = extractList(root, "skill");
                languages = extractList(root, "language");
            } catch (Exception e) {
                log.warn("htmlContent 파싱 실패: {}", e.getMessage());
            }
        }


        log.debug("섹션 파싱 결과 - edu:{} career:{} cert:{} skill:{} lang:{}",
                sizeOf(educations), sizeOf(careers), sizeOf(certs), sizeOf(skills), sizeOf(languages));

        // 3) 저장: Education
        if (!educations.isEmpty()) {
            List<Education> toSave = new ArrayList<>();
            for (Map<String, Object> m : educations) {
                Education e = new Education();
                e.setName(asString(m.get("name")));     // 학교명
                e.setMajor(asString(m.get("major")));
                e.setStatus(asString(m.get("status")));
                e.setType(asString(m.get("type")));
                e.setStartAt(parseLocalDate(m.get("startAt")));
                e.setEndAt(parseLocalDate(m.get("endAt")));
                e.setResume(resume);
                toSave.add(e);
            }
            educationRepo.saveAll(toSave);
        }

        // 4) 저장: CareerLevel
        if (!careers.isEmpty()) {
            List<CareerLevel> toSave = new ArrayList<>();
            for (Map<String, Object> m : careers) {
                CareerLevel c = new CareerLevel();
                c.setCompanyName(asString(m.get("companyName"))); // 키 주의
                c.setType(asString(m.get("type")));
                c.setPosition(asString(m.get("position")));
                c.setStartAt(parseLocalDate(m.get("startAt")));
                c.setEndAt(parseLocalDate(m.get("endAt")));
                c.setContent(asString(m.get("content")));
                c.setResume(resume);
                toSave.add(c);
            }
            careerRepo.saveAll(toSave);
        }

        // 5) 저장: Certificate
        if (!certs.isEmpty()) {
            List<Certificate> toSave = new ArrayList<>();
            for (Map<String, Object> m : certs) {
                Certificate c = new Certificate();
                c.setName(asString(m.get("name")));
                c.setResume(resume);
                toSave.add(c);
            }
            certRepo.saveAll(toSave);
        }

        // 6) 저장: Skill
        if (!skills.isEmpty()) {
            List<Skill> toSave = new ArrayList<>();
            for (Map<String, Object> m : skills) {
                Skill s = new Skill();
                s.setName(asString(m.get("name")));
                s.setResume(resume);
                toSave.add(s);
            }
            skillRepo.saveAll(toSave);
        }

        // 7) 저장: Language
        if (!languages.isEmpty()) {
            List<Language> toSave = new ArrayList<>();
            for (Map<String, Object> m : languages) {
                Language l = new Language();
                l.setName(asString(m.get("name")));
                l.setResume(resume);
                toSave.add(l);
            }
            languageRepo.saveAll(toSave);
        }
    }

    /* ------- 유틸: JSON 파싱 & 변환 ------- */

    private boolean looksJson(String s) {
        if (s == null) return false;
        String t = s.trim();
        return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
    }

    /**
     * "[]" 또는 배열/리스트 객체 모두 수용
     */
    private List<Map<String, Object>> parseList(Object jsonOrString) {
        try {
            if (jsonOrString == null) return Collections.emptyList();
            if (jsonOrString instanceof List) {
                // 이미 List<Map> 형태(프론트가 배열로 보낸 경우)
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> casted = (List<Map<String, Object>>) jsonOrString;
                return casted;
            }
            String s = String.valueOf(jsonOrString);
            if (s.isBlank() || !looksJson(s)) return Collections.emptyList();
            return om.readValue(s, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {
            });
        } catch (Exception e) {
            // @Slf4j 있는지 확인
            log.warn("parseList 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * htmlContent의 특정 배열 필드 안전 추출
     */
    private List<Map<String, Object>> extractList(JsonNode root, String field) {
        if (root == null || !root.has(field) || !root.get(field).isArray()) {
            return Collections.emptyList();
        }
        try {
            return om.convertValue(root.get(field), new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (Exception e) {
            log.warn("extractList 실패({}): {}", field, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * null/공백/빈배열 체크
     */
    @SafeVarargs
    private boolean allEmpty(List<Map<String, Object>>... lists) {
        for (List<Map<String, Object>> l : lists) {
            if (l != null && !l.isEmpty()) return false;
        }
        return true;
    }

    private boolean nonEmpty(String s) {
        return s != null && !s.isBlank();
    }

    private int sizeOf(List<Map<String, Object>> l) {
        return (l == null) ? 0 : l.size();
    }

    private String asString(Object v) {
        return (v == null) ? null : String.valueOf(v).trim();
    }

    private LocalDate parseLocalDate(Object v) {
        if (v == null) return null;
        try {
            return LocalDate.parse(String.valueOf(v));
        } catch (Exception ignore) {
            return null;
        }
    }

    /* ==========================================================
     *                [2] 내 프로필 (온보딩)
     * ========================================================== */

    public MyProfileDto getProfile(Long userId) {
        Users u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("회원 정보를 찾을 수 없습니다."));

        MyProfileDto dto = new MyProfileDto();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setNickname(u.getNickname());
        dto.setName(u.getName());
        dto.setPhone(u.getPhone());
        dto.setGender(u.getGender());
        dto.setAddress(u.getAddress());
        dto.setPosition(u.getPosition());
        dto.setEducation(u.getEducation());

        LocalDate birth = (u.getDob() != null ? LocalDate.parse(u.getDob()) : null);
        dto.setBirth(birth);
        if (birth != null) {
            int age = LocalDate.now().getYear() - birth.getYear();
            if (LocalDate.now().getDayOfYear() < birth.getDayOfYear()) age--;
            dto.setAge(Math.max(age, 0));
        }
        dto.setRegion(u.getLocation());
        dto.setCareer(u.getCareerLevel());
        return dto;
    }

    @Transactional
    public MyProfileDto updateProfile(Long userId, MyProfileUpdateRequest req) {
        Users u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("회원 정보를 찾을 수 없습니다."));
        // 닉네임 중복 체크
        if (req.getNickname() != null && !req.getNickname().equals(u.getNickname())) {
            boolean exists = userRepository.existsByNickname(req.getNickname());
            if (exists) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
            u.setNickname(req.getNickname());
        }
        if (req.getName() != null) u.setName(req.getName());
        if (req.getPhone() != null) u.setPhone(req.getPhone());
        if (req.getGender() != null) u.setGender(req.getGender());
        if (req.getAddress() != null) u.setAddress(req.getAddress());
        if (req.getPosition() != null) u.setPosition(req.getPosition());
        if (req.getEducation() != null) u.setEducation(req.getEducation());
        if (req.getBirth() != null) u.setDob(req.getBirth().toString());
        if (req.getRegion() != null) u.setLocation(req.getRegion());
        if (req.getCareer() != null) u.setCareerLevel(req.getCareer());
        userRepository.save(u);
        return getProfile(u.getId());
    }

    /* ==========================================================
     *                [3] 지원/즐겨찾기
     * ========================================================== */

    public List<ApplyResponse> getMyApplyList(Long userId) {
        List<Apply> applies = applyRepository.findByResume_Users_Id(userId);
        return applies.stream()
                .map(a -> new ApplyResponse(
                        a.getId(),
                        a.getResume() != null ? a.getResume().getId() : null,
                        a.getJobPosts().getCompany().getName(),
                        a.getResume().getTitle(),
                        a.getApplyAt()
                ))
                .collect(Collectors.toList());
    }

    // --- 즐겨찾기 기업: 컨트롤러 시그니처 그대로 ---
    @Transactional
    public FavoriteCompanySummaryDto addFavoriteCompany(Long userId, Long companyId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("회원 정보를 찾을 수 없습니다."));
        var company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("회사를 찾을 수 없습니다. id=" + companyId));

        var existed = favoriteCompanyRepository.findByUsers_IdAndCompany_Id(userId, companyId).orElse(null);
        if (existed != null) return toSummary(existed);

        var fav = new FavoriteCompany();
        fav.setUsers(user);
        fav.setCompany(company);
        var saved = favoriteCompanyRepository.save(fav);
        return toSummary(saved);
    }

    public PagedResponse<FavoriteCompanySummaryDto> listFavoriteCompanies(Long userId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        var p = favoriteCompanyRepository.findByUsers_Id(userId, pageable);
        var items = p.getContent().stream().map(this::toSummary).toList();
        return new PagedResponse<>(items, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    @Transactional
    public void removeFavoriteCompany(Long userId, Long companyId) {
        favoriteCompanyRepository.deleteByUsers_IdAndCompany_Id(userId, companyId);
    }

    private FavoriteCompanySummaryDto toSummary(FavoriteCompany fc) {
        var company = fc.getCompany();
        long openCount = (company != null && company.getId() != null)
                ? jobPostsRepository.countByCompany_Id(company.getId())
                : 0L;

        return new FavoriteCompanySummaryDto(
                fc.getId(),
                company != null ? company.getId() : null,
                company != null ? company.getName() : null,
                openCount
        );
    }

    @Transactional
    public ApplyResponse applyToJob(Long userId, Long jobPostId, Long resumeId) {
        Resume resume = resumeRepository.findByIdAndUsers_Id(resumeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("이력서를 찾을 수 없습니다."));
        JobPosts jobPost = jobPostsRepository.findById(jobPostId)
                .orElseThrow(() -> new ResourceNotFoundException("공고를 찾을 수 없습니다."));

        resume.setLocked(true);
        resumeRepository.save(resume);

        Apply apply = Apply.builder()
                .resume(resume)
                .jobPosts(jobPost)
                .applyAt(LocalDate.now())
                .build();

        Apply saved = applyRepository.save(apply);
        return new ApplyResponse(
                saved.getId(),
                jobPost.getCompany().getName(),
                resume.getTitle(),
                saved.getApplyAt()
        );
    }

    /** ✅ 소프트 삭제(논리 탈퇴): 실제 삭제 대신 식별자 변경 */
    @Transactional
    public boolean softWithdrawUser(String email) {
        Optional<Users> optUser = usersRepository.findByEmail(email);

        if (optUser.isEmpty()) {
            log.warn("⚠️ 탈퇴 시도 실패 - 이메일 없음: {}", email);
            return false;
        }

        Users user = optUser.get();

        // 이미 탈퇴 처리된 사용자 방지
        if ("(탈퇴한 회원)".equals(user.getNickname()) || user.getEmail().contains("_deleted_")) {
            log.info("⚠️ 이미 탈퇴된 회원: {}", email);
            return false;
        }

        // ✅ 탈퇴 마킹 처리
        String newEmail = user.getEmail() + "_deleted_" + System.currentTimeMillis();
        user.setEmail(newEmail);
        user.setNickname("(탈퇴한 회원)");

        // 개인 식별 정보 초기화 (선택적)
        user.setPhone(null);
        user.setAddress(null);
        user.setGender(null);
        user.setPosition(null);
        user.setCareerLevel(null);
        user.setEducation(null);
        user.setLocation(null);

        usersRepository.save(user);
        log.info("✅ 회원 소프트삭제 완료: {} → {}", email, newEmail);
        return true;
    }

    @Transactional
    public void deleteMyApplies(Long userId, List<Long> applyIds) {
        applyRepository.deleteAllByUserIdAndApplyIds(userId, applyIds);
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