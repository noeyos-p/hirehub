package com.we.hirehub.controller;

import com.we.hirehub.dto.CompanyDto;
import com.we.hirehub.dto.CompanySummaryDto;
import com.we.hirehub.dto.FavoriteCompanySummaryDto;
import com.we.hirehub.dto.PagedResponse;
import com.we.hirehub.entity.Company;
import com.we.hirehub.repository.CompanyRepository;
import com.we.hirehub.service.CompanyService;
import com.we.hirehub.service.MyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompanyRestController {

    // ✅ 누락됐던 서비스 주입
    private final MyPageService myPageService;
    private final CompanyRepository companyRepository;
    private final CompanyService companyService;


    // ... (기존 회사 상세/목록 등의 엔드포인트들)

    /**
     * 기업상세 페이지에서 즐겨찾기 추가(C)
     */
    @PostMapping("/{companyId}/favorite")
    public ResponseEntity<FavoriteCompanySummaryDto> addFavorite(Authentication auth,
                                                                 @PathVariable Long companyId) {
        Long uid = userId(auth);
        FavoriteCompanySummaryDto body = myPageService.addFavoriteCompany(uid, companyId);
        return ResponseEntity.ok(body);
    }

    // ===== 공통: 로그인 사용자 id 추출 (MyPageRestController와 동일 패턴)
    private Long userId(Authentication auth) {
        if (auth == null) {
            auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) throw new IllegalStateException("인증 정보가 없습니다.");
        }
        Object p = auth.getPrincipal();
        if (p instanceof Long l) return l;
        if (p instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignore) {
            }
        }
        try {
            var m = p.getClass().getMethod("getId");
            Object v = m.invoke(p);
            if (v instanceof Long l) return l;
            if (v instanceof String s) return Long.parseLong(s);
        } catch (Exception ignore) {
        }
        throw new IllegalStateException("현재 사용자 ID를 확인할 수 없습니다.");
    }

    @GetMapping
    public ResponseEntity<PagedResponse<CompanySummaryDto>> listCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Company> p = companyRepository.findAll(pageable);  // ✅ 인스턴스 호출
        List<CompanySummaryDto> items = p.getContent().stream()
                .map(c -> new CompanySummaryDto(
                        c.getId(),
                        c.getName(),
                        c.getIndustry(),
                        c.getAddress(),
                        c.getPhoto()
                ))
                .toList();

        return ResponseEntity.ok(
                new PagedResponse<>(items, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages())
        );
    }

    // ✅ 회사 이름으로 상세 조회
    @GetMapping("/{companyId}")
    public ResponseEntity<CompanyDto> getCompanyById(@PathVariable Long companyId) {
        try {
            Company company = companyService.getCompanyById(companyId); // 리스트 첫 번째 반환
            CompanyDto dto = companyService.convertToDto(company); // DTO 변환
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build(); // 없으면 404
        }
    }

    // 엔티티 → DTO 변환 메서드
    private CompanyDto convertToDto(Company company) {
        return CompanyDto.builder()
                .id(company.getId())
                .name(company.getName())
                .content(company.getContent())
                .address(company.getAddress())
                .since(company.getSince())
                .benefits(company.getBenefits())
                .website(company.getWebsite())
                .industry(company.getIndustry())
                .ceo(company.getCeo())
                .photo(company.getPhoto())
                .build();
    }
}
