package com.we.hirehub.service.user;

import com.we.hirehub.dto.user.ApplyDto;
import com.we.hirehub.dto.user.FavoriteDto;
import com.we.hirehub.entity.Apply;
import com.we.hirehub.entity.Company;
import com.we.hirehub.entity.FavoriteCompany;
import com.we.hirehub.exception.ResourceNotFoundException;
import com.we.hirehub.repository.*;
import com.we.hirehub.dto.common.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageFavoritesService {

    private final UsersRepository usersRepository;
    private final CompanyRepository companyRepository;
    private final FavoriteCompanyRepository favoriteCompanyRepository;
    private final JobPostsRepository jobPostsRepository;
    private final ApplyRepository applyRepository;


    /* ==========================================================
     *                [3] 지원/즐겨찾기
     * ========================================================== */

    public List<ApplyDto> getMyApplyList(Long userId) {
        List<Apply> applies = applyRepository.findByResume_Users_Id(userId);
        return applies.stream()
                .map(ApplyDto::toDto)
                .collect(Collectors.toList());
    }

    // --- 즐겨찾기 기업: 컨트롤러 시그니처 그대로 ---
    @Transactional
    public FavoriteDto.FavoriteCompanyDto addFavoriteCompany(Long userId, Long companyId) {

        var user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("회원 정보를 찾을 수 없습니다."));

        var company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("회사를 찾을 수 없습니다. id=" + companyId));

        var existed = favoriteCompanyRepository
                .findByUsers_IdAndCompany_Id(userId, companyId)
                .orElse(null);

        if (existed != null) {
            var dto = FavoriteDto.FavoriteCompanyDto.toDto(existed);
            dto.setPostCount(jobPostsRepository.countByCompany_Id(dto.getCompanyId()));
            return dto;
        }

        var fav = new FavoriteCompany();
        fav.setUsers(user);
        fav.setCompany(company);

        var saved = favoriteCompanyRepository.save(fav);

        var dto = FavoriteDto.FavoriteCompanyDto.toDto(saved);
        dto.setPostCount(jobPostsRepository.countByCompany_Id(dto.getCompanyId()));

        return dto;
    }


    public PagedResponse<FavoriteDto.FavoriteCompanyDto> listFavoriteCompanies(Long userId, int page, int size) {

        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        var p = favoriteCompanyRepository.findByUsers_Id(userId, pageable);

        var items = p.getContent().stream()
                .map(entity -> {
                    var dto = FavoriteDto.FavoriteCompanyDto.toDto(entity);
                    dto.setPostCount(jobPostsRepository.countByCompany_Id(dto.getCompanyId()));
                    return dto;
                })
                .toList();

        return new PagedResponse<>(
                items,
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages()
        );
    }


    @Transactional
    public void removeFavoriteCompany(Long userId, Long companyId) {
        favoriteCompanyRepository.deleteByUsers_IdAndCompany_Id(userId, companyId);
    }
}