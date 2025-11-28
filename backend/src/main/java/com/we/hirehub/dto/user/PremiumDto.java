package com.we.hirehub.dto.user;

import com.we.hirehub.entity.Premium;
import com.we.hirehub.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PremiumDto {

    private Long id;
    private Long userId;
    private LocalDate startAt;
    private LocalDate endAt;
    private String role;
    private String userName;
    private String userEmail;

    /** Entity -> Dto **/
    public static PremiumDto toDto(Premium premium) {
        return PremiumDto.builder()
                .id(premium.getId())
                .userId(premium.getUser().getId())
                .startAt(premium.getStartAt())
                .endAt(premium.getEndAt())
                .role(premium.getRole())
                .userName(premium.getUser().getName())
                .userEmail(premium.getUser().getEmail())
                .build();
    }

    /** Dto -> Entity **/
    public Premium toEntity(Users user) {
        return Premium.builder()
                .id(this.id)
                .user(user)
                .startAt(this.startAt)
                .endAt(this.endAt)
                .role(this.role)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(Premium premium) {
        if (this.startAt != null) {
            premium.setStartAt(this.startAt);
        }
        if (this.endAt != null) {
            premium.setEndAt(this.endAt);
        }
        if (this.role != null) {
            premium.setRole(this.role);
        }
    }
}
