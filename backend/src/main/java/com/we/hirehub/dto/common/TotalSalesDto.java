package com.we.hirehub.dto.common;

import com.we.hirehub.entity.TotalSales;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TotalSalesDto {

    private Long id;
    private String year;
    private String sales;

    /** Entity -> Dto **/
    public static TotalSalesDto toDto(TotalSales totalSales) {
        return TotalSalesDto.builder()
                .id(totalSales.getId())
                .year(totalSales.getYear())
                .sales(totalSales.getSales())
                .build();
    }

    /** Dto -> Entity **/
    public TotalSales toEntity() {
        return TotalSales.builder()
                .id(this.id)
                .year(this.year)
                .sales(this.sales)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(TotalSales totalSales) {
        if (this.year != null) {
            totalSales.setYear(this.year);
        }
        if (this.sales != null) {
            totalSales.setSales(this.sales);
        }
    }
}
