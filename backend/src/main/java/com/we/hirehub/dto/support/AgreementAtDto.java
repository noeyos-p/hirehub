package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Agreement;
import com.we.hirehub.entity.AgreementAt;
import com.we.hirehub.entity.Premium;
import com.we.hirehub.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgreementAtDto {

    private Long id;
    private Long usersId;
    private Long premiumId;
    private Long agreementId;
    private LocalDateTime createAt;
    private String userName;
    private String agreementTitle;

    /** Entity -> Dto **/
    public static AgreementAtDto toDto(AgreementAt agreementAt) {
        return AgreementAtDto.builder()
                .id(agreementAt.getId())
                .usersId(agreementAt.getUsers().getId())
                .premiumId(agreementAt.getPremium() != null ? agreementAt.getPremium().getId() : null)
                .agreementId(agreementAt.getAgreement().getId())
                .createAt(agreementAt.getCreateAt())
                .userName(agreementAt.getUsers().getName())
                .agreementTitle(agreementAt.getAgreement().getTitle())
                .build();
    }

    /** Dto -> Entity **/
    public AgreementAt toEntity(Users users, Premium premium, Agreement agreement) {
        return AgreementAt.builder()
                .id(this.id)
                .users(users)
                .premium(premium)
                .agreement(agreement)
                .createAt(this.createAt != null ? this.createAt : LocalDateTime.now())
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(AgreementAt agreementAt) {
        // 동의 내역은 일반적으로 수정하지 않음
        // 필요시 추가 로직 구현
    }
}
