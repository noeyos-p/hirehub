package com.we.hirehub.dto.common;

import com.we.hirehub.entity.AvgSalary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvgSalaryDto {

    private Long id;
    private String year;
    private String salary;

    /** Entity -> Dto **/
    public static AvgSalaryDto toDto(AvgSalary avgSalary) {
        return AvgSalaryDto.builder()
                .id(avgSalary.getId())
                .year(avgSalary.getYear())
                .salary(avgSalary.getSalary())
                .build();
    }

    /** Dto -> Entity **/
    public AvgSalary toEntity() {
        return AvgSalary.builder()
                .id(this.id)
                .year(this.year)
                .salary(this.salary)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(AvgSalary avgSalary) {
        if (this.year != null) {
            avgSalary.setYear(this.year);
        }
        if (this.salary != null) {
            avgSalary.setSalary(this.salary);
        }
    }
}
