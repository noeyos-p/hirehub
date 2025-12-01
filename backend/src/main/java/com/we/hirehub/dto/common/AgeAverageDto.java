package com.we.hirehub.dto.common;

import com.we.hirehub.entity.AgeAverage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgeAverageDto {

    private Long id;
    private Long age;

    /** Entity -> Dto **/
    public static AgeAverageDto toDto(AgeAverage ageAverage) {
        return AgeAverageDto.builder()
                .id(ageAverage.getId())
                .age(ageAverage.getAge())
                .build();
    }

    /** Dto -> Entity **/
    public AgeAverage toEntity() {
        return AgeAverage.builder()
                .id(this.id)
                .age(this.age)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(AgeAverage ageAverage) {
        if (this.age != null) {
            ageAverage.setAge(this.age);
        }
    }
}
