package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Agreement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgreementDto {

    private Long id;
    private String title;
    private String content;
    private String premiumTitle;
    private String premiumContent;

    /** Entity -> Dto **/
    public static AgreementDto toDto(Agreement agreement) {
        return AgreementDto.builder()
                .id(agreement.getId())
                .title(agreement.getTitle())
                .content(agreement.getContent())
                .premiumTitle(agreement.getPremiumTitle())
                .premiumContent(agreement.getPremiumContent())
                .build();
    }

    /** Dto -> Entity **/
    public Agreement toEntity() {
        return Agreement.builder()
                .id(this.id)
                .title(this.title)
                .content(this.content)
                .premiumTitle(this.premiumTitle)
                .premiumContent(this.premiumContent)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(Agreement agreement) {
        if (this.title != null) {
            agreement.setTitle(this.title);
        }
        if (this.content != null) {
            agreement.setContent(this.content);
        }
        if (this.premiumTitle != null) {
            agreement.setPremiumTitle(this.premiumTitle);
        }
        if (this.premiumContent != null) {
            agreement.setPremiumContent(this.premiumContent);
        }
    }
}
