package com.we.hirehub.dto;

import lombok.Data;
import java.util.List;

@Data
public class OnboardingForm {
    // 기본 정보
    private String displayName;  // name으로 저장
    private String nickname;
    private String phone;
    private String dob;          // 생년월일
    private String gender;       // 성별

    // 추가 정보
    private String education;    // 학력
    private String careerLevel;  // 경력
    private String position;     // 직무
    private String address;      // 주소
    private String location;     // 선호 지역

    // 향후 확장용 (현재는 사용 안 함)
    private List<EducationDto> educations;
    private List<CareerDto> careers;
    private String resumeUrl;
    private String resumeText;

    @Data
    public static class EducationDto {
        private String school;
        private String major;
        private String degree;
        private String period;
    }

    @Data
    public static class CareerDto {
        private String company;
        private String title;
        private String period;
        private String summary;
    }
}