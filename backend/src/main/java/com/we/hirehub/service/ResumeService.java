package com.we.hirehub.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.dto.ResumeDto;
import com.we.hirehub.entity.*;
import com.we.hirehub.exception.ForbiddenEditException;
import com.we.hirehub.exception.ResourceNotFoundException;
import com.we.hirehub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final EducationRepository educationRepository;
    private final CareerLevelRepository careerLevelRepository;
    private final CertificateRepository certificateRepository;
    private final SkillRepository skillRepository;

    private final ObjectMapper om = new ObjectMapper(); // JSON 파싱

    /** 생성 */
    @Transactional
    public ResumeDto create(ResumeDto req, Users writer) {
        Resume r = new Resume();
        r.setTitle(req.title());
        r.setIdPhoto(req.idPhoto());
        r.setEssayTittle(req.essayTitle());
        r.setEssayContent(req.essayContent());
        r.setHtmlContent(req.htmlContent());
        r.setLocked(false);
        r.setUsers(writer);
        r.setCreateAt(LocalDate.now());
        r.setUpdateAt(LocalDate.now());

        Resume saved = resumeRepository.save(r);

        // ★ JSON → 하위 엔티티 동기화
        syncChildrenFromJson(saved);

        return toDtoForAdmin(saved.getId());
    }

    /** 수정 */
    @Transactional
    public ResumeDto update(Long resumeId, ResumeDto req) {
        Resume r = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("이력서를 찾을 수 없습니다."));
        if (r.isLocked()) throw new IllegalStateException("제출(잠김)된 이력서는 수정할 수 없습니다.");

        r.setTitle(req.title());
        r.setIdPhoto(req.idPhoto());
        r.setEssayTittle(req.essayTitle());
        r.setEssayContent(req.essayContent());
        r.setHtmlContent(req.htmlContent());
        r.setUpdateAt(LocalDate.now());

        // ★ JSON → 하위 엔티티 재동기화(기존 것 삭제 후 재삽입)
        syncChildrenFromJson(r);

        return toDtoForAdmin(resumeId);
    }

    /** JSON 파싱해서 education/career/certificate/skill 동기화 */
    private void syncChildrenFromJson(Resume resume) {
        Map<String, Object> root;
        try {
            root = Optional.ofNullable(resume.getHtmlContent())
                    .map(s -> {
                        try { return om.readValue(s, new TypeReference<Map<String,Object>>(){}); }
                        catch (Exception e) { return Map.<String,Object>of(); }
                    })
                    .orElse(Map.of());
        } catch (Exception e) {
            root = Map.of();
        }

        // 안전 추출 헬퍼
        List<Map<String, Object>> educations = listOfMap(root.get("educations"));
        List<Map<String, Object>> careers    = listOfMap(root.get("careers"));
        List<String> certs                   = listOfString(root.get("certs"));
        List<String> skills                  = listOfString(root.get("skills"));
        // 언어는 별도 엔티티 없으니(현재 스키마 기준) 필요 시 그대로 JSON 유지

        // 모두 갈아끼우기
        Long rid = resume.getId();
        educationRepository.deleteByResumeId(rid);
        careerLevelRepository.deleteByResumeId(rid);
        certificateRepository.deleteByResumeId(rid);
        skillRepository.deleteByResumeId(rid);

        // 학력 매핑: period "2000.01 - 2003.01" → start/end 파싱
        List<Education> eduEntities = educations.stream().map(m -> {
            String school = str(m.get("school"));
            String period = str(m.get("period")); // "YYYY.MM - YYYY.MM" or "YYYY-MM ~ YYYY-MM"
            String status = str(m.get("status"));
            String major  = str(m.get("major"));
            LocalDate[] se = parsePeriodToDates(period);
            Education e = new Education();
            e.setName(school);
            e.setMajor(major);
            e.setStatus(status != null && !status.isBlank()? status : "재학/졸업");
            e.setType("학력"); // 스키마상 필수라 기본값
            e.setStartAt(se[0]);
            e.setEndAt(se[1]);
            e.setResume(resume);
            return e;
        }).toList();

        // 경력 매핑: role→position, job/desc→content 병합, type 기본값
        List<CareerLevel> careerEntities = careers.stream().map(m -> {
            String company = str(m.get("company"));
            String period  = str(m.get("period"));
            String role    = str(m.get("role"));
            String job     = str(m.get("job"));
            String desc    = str(m.get("desc"));
            LocalDate[] se = parsePeriodToDates(period);
            CareerLevel c = new CareerLevel();
            c.setCompanyName(company);
            c.setType("경력"); // 기본
            c.setPosition(role);
            String content = List.of(job, desc).stream().filter(s -> s != null && !s.isBlank()).reduce("", (a,b)-> a.isBlank()? b : a + "\n" + b);
            c.setContent(content.isBlank()? "상세 없음" : content);
            c.setStartAt(se[0]);
            c.setEndAt(se[1]);
            c.setResume(resume);
            return c;
        }).toList();

        List<Certificate> certEntities = certs.stream().filter(s->!s.isBlank()).map(name -> {
            Certificate c = new Certificate();
            c.setName(name);
            c.setResume(resume);
            return c;
        }).toList();

        List<Skill> skillEntities = skills.stream().filter(s->!s.isBlank()).map(name -> {
            Skill s = new Skill();
            s.setName(name);
            s.setResume(resume);
            return s;
        }).toList();

        educationRepository.saveAll(eduEntities);
        careerLevelRepository.saveAll(careerEntities);
        certificateRepository.saveAll(certEntities);
        skillRepository.saveAll(skillEntities);
    }

    private static List<Map<String, Object>> listOfMap(Object o) {
        if (o instanceof List<?> l) {
            return l.stream().filter(m -> m instanceof Map).map(m -> (Map<String,Object>) m).toList();
        }
        return List.of();
    }
    private static List<String> listOfString(Object o) {
        if (o instanceof List<?> l) {
            return l.stream().map(String::valueOf).toList();
        }
        return List.of();
    }
    private static String str(Object o){ return o==null? null : String.valueOf(o); }

    /** "YYYY.MM - YYYY.MM" 등 문자열 → LocalDate[ start, end ] */
    private static LocalDate[] parsePeriodToDates(String period) {
        LocalDate start = null, end = null;
        if (period != null) {
            String p = period.replace("~","-").replace("—","-");
            String[] se = p.split("-");
            if (se.length >= 1) start = parseYearMonth(se[0].trim());
            if (se.length >= 2) end   = parseYearMonth(se[1].trim());
        }
        return new LocalDate[]{ start != null ? start : LocalDate.of(1900,1,1),
                end   != null ? end   : null };
    }
    private static LocalDate parseYearMonth(String ym) {
        // 허용: "2000.01", "2000-01", "2000/01", "2000.01.01"
        String t = ym.replace("/", ".").replace("-", "."); // 2000.01 or 2000.01.01
        String[] parts = t.split("\\.");
        try {
            int y = Integer.parseInt(parts[0]);
            int m = parts.length > 1 ? Integer.parseInt(parts[1]) : 1;
            int d = parts.length > 2 ? Integer.parseInt(parts[2]) : 1;
            return LocalDate.of(y, m, d);
        } catch (Exception e) {
            return null;
        }
    }

    /** 어드민 상세 DTO 구성: 하위 엔티티를 채워서 반환 */
    @Transactional(readOnly = true)
    public ResumeDto toDtoForAdmin(Long resumeId) {
        Resume r = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("이력서를 찾을 수 없습니다."));

        // educations
        List<Map<String,Object>> eduList = educationRepository.findByResumeId(resumeId).stream().map(e ->
                Map.<String,Object>of(
                        "school", e.getName(),
                        "period", fmtPeriod(e.getStartAt(), e.getEndAt()),
                        "status", e.getStatus(),
                        "major",  e.getMajor()
                )
        ).toList();

// careers
        List<Map<String,Object>> careerList = careerLevelRepository.findByResumeId(resumeId).stream().map(c ->
                Map.<String,Object>of(
                        "company", c.getCompanyName(),
                        "period",  fmtPeriod(c.getStartAt(), c.getEndAt()),
                        "role",    c.getPosition(),
                        "job",     c.getContent()
                )
        ).toList();

// certificates
        List<Map<String,Object>> certList = certificateRepository.findByResumeId(resumeId).stream()
                .map(c -> Map.<String,Object>of("name", c.getName()))
                .toList();

// skills
        List<Map<String,Object>> skillList = skillRepository.findByResumeId(resumeId).stream()
                .map(s -> Map.<String,Object>of("name", s.getName()))
                .toList();

        ResumeDto.UserInfo users = new ResumeDto.UserInfo(
                r.getUsers().getId(),
                r.getUsers().getNickname(),
                r.getUsers().getEmail()
        );

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
                null, // profile은 별도 서비스에서 합쳐 쓰는 경우 사용
                users,
                eduList,
                careerList,
                certList,
                skillList,
                List.of() // 언어: 현재 별도 엔티티 없으니 빈 리스트
        );
    }

    private static String fmtPeriod(LocalDate s, LocalDate e) {
        String ss = s!=null? String.format("%04d.%02d", s.getYear(), s.getMonthValue()) : "";
        String ee = e!=null? String.format("%04d.%02d", e.getYear(), e.getMonthValue()) : "";
        return (ss + " - " + ee).trim();
    }
}
