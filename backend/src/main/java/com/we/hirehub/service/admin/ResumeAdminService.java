package com.we.hirehub.service.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.ResumeDto;
import com.we.hirehub.entity.*;
import com.we.hirehub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 관리자용 이력서 서비스
 * - 컨트롤러/DTO 경로 변경 없이, 자식 테이블 upsert + 조회를 추가
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResumeAdminService {

    private final ResumeRepository resumeRepository;
    private final EducationRepository educationRepository;
    private final CareerLevelRepository careerLevelRepository;
    private final CertificateRepository certificateRepository;
    private final SkillRepository skillRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /* ========= 조회 ========= */

    public Page<Resume> getAllResumes(Pageable pageable) {
        log.debug("모든 이력서 조회");
        return resumeRepository.findAll(pageable);
    }

    public Resume getResumeById(Long resumeId) {
        log.debug("이력서 조회: {}", resumeId);
        return resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("이력서를 찾을 수 없습니다: " + resumeId));
    }

    /* ========= 생성 ========= */

    @Transactional
    public Resume createResume(Resume resume) {
        log.info("이력서 생성: {}", resume.getTitle());
        if (resume.getCreateAt() == null) resume.setCreateAt(LocalDate.now());
        if (resume.getUpdateAt() == null) resume.setUpdateAt(LocalDate.now());
        return resumeRepository.save(resume);
    }

    /* ========= 수정(업데이트 + 자식 upsert) ========= */

    @Transactional
    public Resume updateResume(Long resumeId, Map<String, Object> updateData) {
        log.info("이력서 수정: {}", resumeId);
        Resume resume = getResumeById(resumeId);

        if (updateData.containsKey("title"))        resume.setTitle((String) updateData.get("title"));
        if (updateData.containsKey("idPhoto"))      resume.setIdPhoto((String) updateData.get("idPhoto"));
        if (updateData.containsKey("essayTittle"))  resume.setEssayTittle((String) updateData.get("essayTittle")); // entity 오타 필드명 유지
        if (updateData.containsKey("essayTitle"))   resume.setEssayTittle((String) updateData.get("essayTitle"));  // 호환용
        if (updateData.containsKey("essayContent")) resume.setEssayContent((String) updateData.get("essayContent"));
        if (updateData.containsKey("htmlContent"))  resume.setHtmlContent((String) updateData.get("htmlContent"));
        if (updateData.containsKey("locked"))       resume.setLocked(Boolean.TRUE.equals(updateData.get("locked")));

        // 1) 자식들 upsert (educations/careers/certifications/skills/languages의 배열 또는 JSON 문자열 모두 수용)
        upsertChildrenFromUpdateMap(resume.getId(), updateData);

        // 2) htmlContent도 유지(기존 화면/호환)
        try {
            Map<String, Object> htmlData = new HashMap<>();
            // 배열 그대로 들어온 경우도 저장
            if (updateData.containsKey("educations"))      htmlData.put("education", updateData.get("educations"));
            if (updateData.containsKey("careers"))         htmlData.put("career", updateData.get("careers"));
            if (updateData.containsKey("certifications"))  htmlData.put("certificate", updateData.get("certifications"));
            if (updateData.containsKey("skills"))          htmlData.put("skill", updateData.get("skills"));
            if (updateData.containsKey("languages"))       htmlData.put("language", updateData.get("languages"));

            // JSON 문자열로 들어오는 키도 지원(프론트 호환)
            putJsonIfPresent(updateData, htmlData, "educationJson",    "education");
            putJsonIfPresent(updateData, htmlData, "careerJson",       "career");
            putJsonIfPresent(updateData, htmlData, "certJson",         "certificate");
            putJsonIfPresent(updateData, htmlData, "skillJson",        "skill");
            putJsonIfPresent(updateData, htmlData, "langJson",         "language");

            // 기존 htmlContent와 병합
            if (!htmlData.isEmpty()) {
                Map<String, Object> merged = new HashMap<>();
                if (resume.getHtmlContent() != null && !resume.getHtmlContent().isBlank()) {
                    JsonNode existing = objectMapper.readTree(resume.getHtmlContent());
                    merged.putAll(objectMapper.convertValue(existing, Map.class));
                }
                merged.putAll(htmlData);
                resume.setHtmlContent(objectMapper.writeValueAsString(merged));
            }
        } catch (Exception e) {
            log.error("htmlContent 생성 실패: {}", e.getMessage());
            throw new RuntimeException("이력서 데이터 저장 실패", e);
        }

        resume.setUpdateAt(LocalDate.now());
        return resumeRepository.save(resume);
    }

    /* ========= 삭제 ========= */

    @Transactional
    public void deleteResume(Long resumeId) {
        log.info("이력서 삭제: {}", resumeId);
        if (!resumeRepository.existsById(resumeId)) {
            throw new IllegalArgumentException("존재하지 않는 이력서입니다");
        }
        // 자식 선삭제
        educationRepository.deleteByResumeId(resumeId);
        careerLevelRepository.deleteByResumeId(resumeId);
        certificateRepository.deleteByResumeId(resumeId);
        skillRepository.deleteByResumeId(resumeId);

        resumeRepository.deleteById(resumeId);
    }

    /* ========= 상태 ========= */

    @Transactional
    public Resume lockResume(Long resumeId) {
        Resume r = getResumeById(resumeId);
        r.setLocked(true);
        r.setUpdateAt(LocalDate.now());
        return resumeRepository.save(r);
    }

    @Transactional
    public Resume unlockResume(Long resumeId) {
        Resume r = getResumeById(resumeId);
        r.setLocked(false);
        r.setUpdateAt(LocalDate.now());
        return resumeRepository.save(r);
    }

    public Long getTotalResumesCount() {
        return resumeRepository.count();
    }

    /* ========= DTO 변환(관리자용): 자식 테이블 -> DTO, 빈 경우 htmlContent fallback ========= */

    @Transactional(readOnly = true)
    public ResumeDto toDto(Resume r) {
        // 1) 자식 테이블에서 우선 조회
        var edus   = educationRepository.findByResumeId(r.getId());
        var cars   = careerLevelRepository.findByResumeId(r.getId());
        var certs  = certificateRepository.findByResumeId(r.getId());
        var skills = skillRepository.findByResumeId(r.getId());

        List<Map<String, Object>> education = edus.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", e.getName());
            m.put("major", e.getMajor()); // null 허용
            m.put("status", e.getStatus());
            m.put("type", e.getType());
            m.put("startAt", e.getStartAt());
            m.put("endAt", e.getEndAt());
            return m;
        }).collect(Collectors.toList());

// career
        List<Map<String, Object>> career = cars.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("companyName", c.getCompanyName());
            m.put("type", c.getType());
            m.put("position", c.getPosition());
            m.put("startAt", c.getStartAt());
            m.put("endAt", c.getEndAt());
            m.put("content", c.getContent());
            return m;
        }).collect(Collectors.toList());

// certificate
        List<Map<String, Object>> certificate = certs.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", c.getName());
            return m;
        }).collect(Collectors.toList());

// skill
        List<Map<String, Object>> skill = skills.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", s.getName());
            return m;
        }).collect(Collectors.toList());

        // 언어는 별도 엔티티가 없으므로 htmlContent에서만 추출
        List<Map<String, Object>> language = Collections.emptyList();

        // 2) 전부 비어있으면 htmlContent fallback 사용(기존 데이터 호환)
        if (education.isEmpty() && career.isEmpty() && certificate.isEmpty() && skill.isEmpty()) {
            try {
                if (r.getHtmlContent() != null && !r.getHtmlContent().isBlank()) {
                    JsonNode root = objectMapper.readTree(r.getHtmlContent());
                    education   = extractList(root, "education");
                    career      = extractList(root, "career");
                    certificate = extractList(root, "certificate");
                    skill       = extractList(root, "skill");
                    language    = extractList(root, "language");
                }
            } catch (Exception e) {
                log.warn("htmlContent 파싱 실패: {}", e.getMessage());
            }
        } else {
            // 자식 테이블에 값이 있으면 언어만 htmlContent에서 추가로 시도
            try {
                if (r.getHtmlContent() != null && !r.getHtmlContent().isBlank()) {
                    JsonNode root = objectMapper.readTree(r.getHtmlContent());
                    language = extractList(root, "language");
                }
            } catch (Exception e) {
                log.warn("language 파싱 실패: {}", e.getMessage());
            }
        }

        // 사용자 정보(관리자용)
        ResumeDto.UserInfo userInfo = null;
        if (r.getUsers() != null) {
            userInfo = new ResumeDto.UserInfo(
                    r.getUsers().getId(),
                    r.getUsers().getNickname(),
                    r.getUsers().getEmail()
            );
        }

        return new ResumeDto(
                r.getId(),
                r.getTitle(),
                r.getIdPhoto(),
                r.getEssayTittle(), // entity 필드명 유지
                r.getEssayContent(),
                r.getHtmlContent(),
                r.isLocked(),
                r.getCreateAt(),
                r.getUpdateAt(),
                null,         // profile(온보딩) - 관리자 화면에선 보통 불필요
                userInfo,
                education,
                career,
                certificate,
                skill,
                language
        );
    }

    /* ========= 내부 유틸 ========= */

    private void putJsonIfPresent(Map<String, Object> src, Map<String, Object> dest, String srcKey, String destKey) {
        Object v = src.get(srcKey);
        if (v instanceof String s && !s.isBlank()) {
            try {
                dest.put(destKey, objectMapper.readValue(s, List.class));
            } catch (Exception ignored) {}
        }
    }

    @SuppressWarnings("unchecked")
    private void upsertChildrenFromUpdateMap(Long resumeId, Map<String, Object> updateData) {
        // 배열로 들어온 경우와 문자열(JSON) 모두 처리
        List<Map<String, Object>> educations     = extractArray(updateData, "educations", "educationJson");
        List<Map<String, Object>> careers        = extractArray(updateData, "careers", "careerJson");
        List<Map<String, Object>> certifications = extractArray(updateData, "certifications", "certJson");
        List<Map<String, Object>> skills         = extractArray(updateData, "skills", "skillJson");
        // 언어는 엔티티가 없으므로 저장 스킵

        // 전체 갈아끼우기
        educationRepository.deleteByResumeId(resumeId);
        careerLevelRepository.deleteByResumeId(resumeId);
        certificateRepository.deleteByResumeId(resumeId);
        skillRepository.deleteByResumeId(resumeId);

        Resume ref = Resume.builder().id(resumeId).build();

        // 교육
        for (Map<String, Object> m : educations) {
            Education e = new Education();
            e.setName(str(m.get("name")));
            e.setMajor(str(m.get("major")));
            e.setStatus(str(m.get("status")));
            e.setType(str(m.get("type")));
            e.setStartAt(toLocalDate(m.get("startAt")));
            e.setEndAt(toLocalDate(m.get("endAt")));
            e.setResume(ref);
            educationRepository.save(e);
        }

        // 경력
        for (Map<String, Object> m : careers) {
            CareerLevel c = new CareerLevel();
            c.setCompanyName(str(m.get("companyName")));
            c.setType(str(m.get("type")));
            c.setPosition(str(m.get("position")));
            c.setStartAt(toLocalDate(m.get("startAt")));
            c.setEndAt(toLocalDate(m.get("endAt")));
            c.setContent(str(m.get("content")));
            c.setResume(ref);
            careerLevelRepository.save(c);
        }

        // 자격증
        for (Map<String, Object> m : certifications) {
            Certificate c = new Certificate();
            c.setName(str(m.get("name")));
            c.setResume(ref);
            certificateRepository.save(c);
        }

        // 스킬
        for (Map<String, Object> m : skills) {
            Skill s = new Skill();
            s.setName(str(m.get("name")));
            s.setResume(ref);
            skillRepository.save(s);
        }
    }

    private List<Map<String, Object>> extractArray(Map<String, Object> map, String arrayKey, String jsonKey) {
        // 1) 배열 형태로 왔는지
        Object arr = map.get(arrayKey);
        if (arr instanceof List<?> list) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> casted = (List<Map<String, Object>>) list;
            return casted;
        }
        // 2) 문자열 JSON으로 왔는지
        Object json = map.get(jsonKey);
        if (json instanceof String s && !s.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parsed = objectMapper.readValue(s, List.class);
                return parsed;
            } catch (Exception ignored) {}
        }
        return Collections.emptyList();
    }

    private List<Map<String, Object>> extractList(JsonNode root, String field) {
        if (!root.has(field) || !root.get(field).isArray()) return Collections.emptyList();
        try {
            List<Map<String, Object>> result = new ArrayList<>();
            for (JsonNode node : root.get(field)) {
                result.add(objectMapper.convertValue(node, Map.class));
            }
            return result;
        } catch (Exception e) {
            log.warn("필드 변환 실패 ({}): {}", field, e.getMessage());
            return Collections.emptyList();
        }
    }

    private String str(Object o) { return o == null ? null : String.valueOf(o); }

    private LocalDate toLocalDate(Object o) {
        if (o == null) return null;
        try { return LocalDate.parse(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    private Object nullSafe(Object v) { return v == null ? "" : v; }
}
