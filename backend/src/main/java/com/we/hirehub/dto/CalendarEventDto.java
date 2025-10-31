package com.we.hirehub.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CalendarEventDto {
    private String id;
    private String title;
    private String start; // ISO datetime
    private String end;   // ISO datetime
    private String type;  // e.g., "deadline", "interview"
}
