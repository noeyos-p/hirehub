package com.we.hirehub.dto.common;

import com.we.hirehub.entity.NewSalary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewSalaryDto {

    private Long id;
    private String year;
    private String salary;

    /** Entity -> Dto **/
    public static NewSalaryDto toDto(NewSalary newSalary) {
        return NewSalaryDto.builder()
                .id(newSalary.getId())
                .year(newSalary.getYear())
                .salary(newSalary.getSalary())
                .build();
    }

    /** Dto -> Entity **/
    public NewSalary toEntity() {
        return NewSalary.builder()
                .id(this.id)
                .year(this.year)
                .salary(this.salary)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(NewSalary newSalary) {
        if (this.year != null) {
            newSalary.setYear(this.year);
        }
        if (this.salary != null) {
            newSalary.setSalary(this.salary);
        }
    }
}
