package com.we.hirehub.dto.common;

import com.we.hirehub.entity.MonthSalary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthSalaryDto {

    private Long id;
    private String month;
    private String salary;

    /** Entity -> Dto **/
    public static MonthSalaryDto toDto(MonthSalary monthSalary) {
        return MonthSalaryDto.builder()
                .id(monthSalary.getId())
                .month(monthSalary.getMonth())
                .salary(monthSalary.getSalary())
                .build();
    }

    /** Dto -> Entity **/
    public MonthSalary toEntity() {
        return MonthSalary.builder()
                .id(this.id)
                .month(this.month)
                .salary(this.salary)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(MonthSalary monthSalary) {
        if (this.month != null) {
            monthSalary.setMonth(this.month);
        }
        if (this.salary != null) {
            monthSalary.setSalary(this.salary);
        }
    }
}
