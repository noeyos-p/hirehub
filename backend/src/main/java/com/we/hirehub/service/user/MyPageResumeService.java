package com.we.hirehub.service.user;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.common.PagedResponse;
import com.we.hirehub.dto.user.ResumeDto;
import com.we.hirehub.dto.user.ResumeUpsertRequest;
import com.we.hirehub.dto.user.UsersDto;
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
public class MyPageResumeService {

    private final ResumeRepository resumeRepository;
    private final UsersRepository userRepository;
    private final EducationRepository educationRepo;
    private final CareerLevelRepository careerRepo;
    private final CertificateRepository certRepo;
    private final SkillRepository skillRepo;
    private final LanguageRepository languageRepo;
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
                .title(req.getTitle())
                .idPhoto(req.getIdPhoto())
                .essayTittle(req.getEssayTitle())
                .essayContent(req.getEssayContent())
                .htmlContent(req.getHtmlContent())
                .createAt(LocalDate.now())
                .updateAt(LocalDate.now())
                .locked(false)
                .users(user)
                .build();

        Resume saved = resumeRepository.save(resume);

        // JSON → 섹션 저장
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

        if (resume.isLocked()) {
            throw new ForbiddenEditException("이미 제출된 이력서는 수정할 수 없습니다.");
        }

        resume.setTitle(req.getTitle());
        resume.setIdPhoto(req.getIdPhoto());
        resume.setEssayTittle(req.getEssayTitle());
        resume.setEssayContent(req.getEssayContent());
        resume.setHtmlContent(req.getHtmlContent());
        resume.setUpdateAt(LocalDate.now());

        resumeRepository.save(resume);

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
    private ResumeDto toDto(Resume resume) {
        Users user = resume.getUsers();
        UsersDto.Profile profile = null;
        if (user != null) {
            profile = UsersDto.toProfile(user);
        }

        Long rid = resume.getId();

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
                resume.getId(),
                resume.getTitle(),
                resume.getIdPhoto(),
                resume.getEssayTittle(),
                resume.getEssayContent(),
                resume.getHtmlContent(),
                resume.isLocked(),
                resume.getCreateAt(),
                resume.getUpdateAt(),
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

        Long rid = resume.getId();

        // 기존 데이터 삭제
        educationRepo.deleteByResumeId(rid);
        careerRepo.deleteByResumeId(rid);
        certRepo.deleteByResumeId(rid);
        skillRepo.deleteByResumeId(rid);
        languageRepo.deleteByResumeId(rid);

        // JSON 읽기
        List<Map<String, Object>> educations = parseList(req.getEducationJson());
        List<Map<String, Object>> careers = parseList(req.getCareerJson());
        List<Map<String, Object>> certs = parseList(req.getCertJson());
        List<Map<String, Object>> skills = parseList(req.getSkillJson());
        List<Map<String, Object>> languages = parseList(req.getLangJson());

        // htmlContent fallback
        if (allEmpty(educations, careers, certs, skills, languages) && looksJson(resume.getHtmlContent())) {
            try {
                JsonNode root = om.readTree(resume.getHtmlContent());
                educations = extractList(root, "education");
                careers = extractList(root, "career");
                certs = extractList(root, "certificate");
                skills = extractList(root, "skill");
                languages = extractList(root, "language");
            } catch (Exception ignore) {
            }
        }

        // Education 저장
        if (!educations.isEmpty()) {
            List<Education> list = new ArrayList<>();
            for (Map<String, Object> m : educations) {
                Education e = new Education();
                e.setName(asString(m.get("name")));
                e.setMajor(asString(m.get("major")));
                e.setStatus(asString(m.get("status")));
                e.setType(asString(m.get("type")));
                e.setStartAt(parseLocalDate(m.get("startAt")));
                e.setEndAt(parseLocalDate(m.get("endAt")));
                e.setResume(resume);
                list.add(e);
            }
            educationRepo.saveAll(list);
        }

        // Career 저장
        if (!careers.isEmpty()) {
            List<CareerLevel> list = new ArrayList<>();
            for (Map<String, Object> m : careers) {
                CareerLevel c = new CareerLevel();
                c.setCompanyName(asString(m.get("companyName")));
                c.setType(asString(m.get("type")));
                c.setPosition(asString(m.get("position")));
                c.setStartAt(parseLocalDate(m.get("startAt")));
                c.setEndAt(parseLocalDate(m.get("endAt")));
                c.setContent(asString(m.get("content")));
                c.setResume(resume);
                list.add(c);
            }
            careerRepo.saveAll(list);
        }

        // Certificate 저장
        if (!certs.isEmpty()) {
            List<Certificate> list = new ArrayList<>();

            for (Map<String, Object> m : certs) {
                Certificate c = Certificate.builder()
                        .name(asString(m.get("name")))
                        .resume(resume)
                        .build();
                list.add(c);
            }

            certRepo.saveAll(list);
        }

        // Skill
        if (!skills.isEmpty()) {
            List<Skill> list = new ArrayList<>();

            for (Map<String, Object> m : skills) {
                Skill s = Skill.builder()
                        .name(asString(m.get("name")))
                        .resume(resume)
                        .build();

                list.add(s);
            }

            skillRepo.saveAll(list);
        }

        // Language
        if (!languages.isEmpty()) {
            List<Language> list = new ArrayList<>();
            for (Map<String, Object> m : languages) {
                Language l = Language.builder()
                        .name(asString(m.get("name")))
                        .resume(resume)
                        .build();

                list.add(l);
            }
            languageRepo.saveAll(list);
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
}