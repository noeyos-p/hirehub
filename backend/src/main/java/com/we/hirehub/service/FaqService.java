package com.we.hirehub.service;

import com.we.hirehub.dto.FaqCategoryDto;
import com.we.hirehub.dto.FaqItemDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FaqService {
    /**
     * 더미 데이터 - 계층형 FAQ 목록 반환
     */
    public List<FaqCategoryDto> getFaqCategories() {
        log.info("=== FAQ 카테고리 목록 조회 ===");

        List<FaqCategoryDto> categories = new ArrayList<>();

        // 1. 지원관리
        List<FaqItemDto> applicationItems = Arrays.asList(
                FaqItemDto.builder()
                        .id(1L)
                        .question("지원한 내용은 어디서 확인할 수 있나요?")
                        .answer("마이페이지 > 지원 관리 메뉴에서 확인하실 수 있습니다. 지원한 공고의 현재 진행 상태(서류 검토 중, 면접 대기 등)를 실시간으로 확인할 수 있습니다.")
                        .category("지원관리")
                        .build(),
                FaqItemDto.builder()
                        .id(2L)
                        .question("지원 취소할 수 있나요?")
                        .answer("서류 검토 전까지는 지원 관리에서 취소 가능합니다. 단, 서류 검토가 시작된 이후에는 취소가 불가능하니 신중하게 지원해주세요.")
                        .category("지원관리")
                        .build(),
                FaqItemDto.builder()
                        .id(3L)
                        .question("제출한 이력서 수정할 수 있나요?")
                        .answer("지원서 제출 후에는 수정이 불가능합니다. 제출 전 반드시 내용을 확인해주세요. 수정이 필요한 경우 지원을 취소하고 다시 지원하셔야 합니다.")
                        .category("지원관리")
                        .build()
        );

        // 2. 계정 및 로그인
        List<FaqItemDto> accountItems = Arrays.asList(
                FaqItemDto.builder()
                        .id(4L)
                        .question("비밀번호를 잊어버렸어요.")
                        .answer("로그인 페이지에서 '비밀번호 찾기'를 클릭하세요. 가입 시 등록한 이메일로 비밀번호 재설정 링크가 발송됩니다.")
                        .category("계정 및 로그인")
                        .build(),
                FaqItemDto.builder()
                        .id(5L)
                        .question("이메일 인증이 되지 않아요.")
                        .answer("스팸 메일함을 확인해주세요. 메일이 오지 않았다면 회원가입 페이지에서 '인증 메일 재발송' 버튼을 눌러주세요. 그래도 안 되면 고객센터로 문의해주세요.")
                        .category("계정 및 로그인")
                        .build(),
                FaqItemDto.builder()
                        .id(6L)
                        .question("탈퇴하면 지원 정보도 삭제되나요?")
                        .answer("네, 회원 탈퇴 시 모든 지원 정보와 개인정보가 삭제됩니다. 진행 중인 채용 전형이 있다면 탈퇴 전에 확인하시기 바랍니다.")
                        .category("계정 및 로그인")
                        .build()
        );

        // 3. 채용 공고
        List<FaqItemDto> jobPostingItems = Arrays.asList(
                FaqItemDto.builder()
                        .id(7L)
                        .question("공고 연락처가 안 보여요.")
                        .answer("기업 정보 보호를 위해 일부 연락처는 비공개로 운영됩니다. 지원 후 기업에서 직접 연락을 드립니다.")
                        .category("채용 공고")
                        .build(),
                FaqItemDto.builder()
                        .id(8L)
                        .question("알림이 너무 많이 와요.")
                        .answer("마이페이지 > 알림 설정에서 원하는 알림만 선택할 수 있습니다. 이메일 및 푸시 알림을 각각 설정 가능합니다.")
                        .category("채용 공고")
                        .build(),
                FaqItemDto.builder()
                        .id(9L)
                        .question("공고가 사라졌어요.")
                        .answer("채용 공고는 마감 시간이 지나거나 조기 마감될 수 있습니다. 관심 공고는 '북마크' 기능으로 저장해두시면 상태 변경 시 알림을 받을 수 있습니다.")
                        .category("채용 공고")
                        .build()
        );

        // 카테고리 생성
        categories.add(FaqCategoryDto.builder()
                .id(1L)
                .category("지원관리")
                .description("지원한 채용 공고 관리 및 진행 상태 확인")
                .items(applicationItems)
                .build());

        categories.add(FaqCategoryDto.builder()
                .id(2L)
                .category("계정 및 로그인")
                .description("회원 가입, 로그인 및 계정 관리")
                .items(accountItems)
                .build());

        categories.add(FaqCategoryDto.builder()
                .id(3L)
                .category("채용 공고")
                .description("채용 공고 검색 및 알림 설정")
                .items(jobPostingItems)
                .build());

        log.info("총 {} 개 카테고리 조회 완료", categories.size());
        return categories;
    }

    /**
     * 특정 카테고리의 FAQ 항목만 조회
     */
    public FaqCategoryDto getFaqByCategory(String categoryName) {
        log.info("=== 카테고리별 FAQ 조회: {} ===", categoryName);

        return getFaqCategories().stream()
                .filter(cat -> cat.getCategory().equals(categoryName))
                .findFirst()
                .orElse(null);
    }

    /**
     * 특정 FAQ 항목 상세 조회
     */
    public FaqItemDto getFaqById(Long id) {
        log.info("=== FAQ 상세 조회: {} ===", id);

        return getFaqCategories().stream()
                .flatMap(cat -> cat.getItems().stream())
                .filter(item -> item.getId().equals(id))
                .findFirst()
                .orElse(null);
    }
}
