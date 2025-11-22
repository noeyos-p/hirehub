package com.we.hirehub.dto.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.we.hirehub.entity.Users;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
/** 출력용 **/
public class UsersDto {

    private Long id;
    private String email;
    private String name;
    private String nickname;
    private String phone;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dob; // 생년월일
    private String gender;
    private String address;
    private String location;
    private String position;
    private String careerLevel;
    private String education;
    private String password;
    private Integer age;

    /** 내 정보 및 온보딩 **/
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Profile {

        private Long id;
        private String email;
        private String name;
        private String phone;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate dob;
        private String gender;
        private String address;
        private String location;
        private String position;
        private String careerLevel;
        private String education;
        private String nickname;
        private Integer age;
    }

    /** 이력서 화면 요약 정보 **/
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Long id;
        private String nickname;
        private String name;
        private String phone;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate dob;
        private String gender;
        private String address;
        private String email;
    }

    public static UsersDto toDto(Users user) {
        if (user == null) return null;

        System.out.println("=== toProfile 디버깅 ===");
        System.out.println("user.getLocation(): " + user.getLocation());
        System.out.println("user.getEducation(): " + user.getEducation());
        System.out.println("=======================");

        return new UsersDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getPhone(),
                user.getDob() != null ? LocalDate.parse(user.getDob()) : null,
                user.getGender(),
                user.getAddress(),
                user.getLocation(),
                user.getPosition(),
                user.getCareerLevel(),
                user.getEducation(),
                user.getPassword(),
                null
        ); // age는 dob로 계산 → 이후 계산 가능
    }

    public static Profile toProfile(Users user) {
        if (user == null) return null;

        Profile profile = new Profile();
        profile.setId(user.getId());
        profile.setEmail(user.getEmail());
        profile.setName(user.getName());
        profile.setPhone(user.getPhone());
        profile.setDob(user.getDob() != null ? LocalDate.parse(user.getDob()) : null);
        profile.setGender(user.getGender());
        profile.setAddress(user.getAddress());
        profile.setLocation(user.getLocation());      // ← 명시적으로!
        profile.setPosition(user.getPosition());
        profile.setCareerLevel(user.getCareerLevel());
        profile.setEducation(user.getEducation());    // ← 명시적으로!
        profile.setNickname(user.getNickname());
        profile.setAge(null);

        return profile;
    }

    public static Summary toSummary(Users user) {
        if (user == null) return null;

        return new Summary(
                user.getId(),
                user.getNickname(),
                user.getName(),
                user.getPhone(),
                user.getDob() != null ? LocalDate.parse(user.getDob()) : null,
                user.getGender(),
                user.getAddress(),
                user.getEmail()
        );
    }

    public Users toEntity() {
        return Users.builder()
                .id(this.id)
                .email(this.email)
                .name(this.name)
                .nickname(this.nickname)
                .phone(this.phone)
                .dob(this.dob != null ? this.dob.toString() : null)
                .gender(this.gender)
                .address(this.address)
                .position(this.position)
                .careerLevel(this.careerLevel)
                .education(this.education)
                .location(this.location)
                .password(this.password)
                .build();
    }
}
