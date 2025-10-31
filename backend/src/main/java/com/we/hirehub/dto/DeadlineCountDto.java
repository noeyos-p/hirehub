package com.we.hirehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class DeadlineCountDto {
    private LocalDate date;
    private long count;
}