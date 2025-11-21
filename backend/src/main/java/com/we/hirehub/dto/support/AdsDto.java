package com.we.hirehub.dto.support;

import com.we.hirehub.entity.Ads;
import com.we.hirehub.entity.Resume;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdsDto {
    private Long id;
    private String photo;

    public static AdsDto toDto(Ads entity) {
        return AdsDto.builder()
                .id(entity.getId())
                .photo(entity.getPhoto())
                .build();
    }

    public static Ads toEntity(AdsDto dto) {
        Ads ads = new Ads();
        ads.setId(dto.getId());
        ads.setPhoto(dto.getPhoto());
        return ads;
    }
}
