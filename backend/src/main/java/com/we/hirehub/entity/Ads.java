package com.we.hirehub.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "Ads")
public class Ads {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String photo;

    // 생성용 정적 팩토리
    public static Ads create(String photo) {
        Ads ads = new Ads();
        ads.photo = photo;
        return ads;
    }

    // 수정용 메서드
    public void updatePhoto(String photo) {
        this.photo = photo;
    }
}
