package com.we.hirehub.dto.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.we.hirehub.entity.Users;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
/** 입력/수정용 **/
public class UsersRequestDto {

    @Size(max = 50)
    private String name;

    @Pattern(regexp = "^(01[0-9]-?[0-9]{3,4}-?[0-9]{4})$", message = "휴대폰 번호 형식이 아닙니다.")
    @Setter(AccessLevel.NONE)  // 커스텀 setter 사용
    private String phone;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dob;   // "1995-01-20" 형식

    private Integer age;

    @Size(max = 10)
    private String gender;

    @Size(max = 255)
    private String address;

    @Size(max = 50)
    private String location;

    @Size(max = 50)
    private String position;

    @Size(max = 50)
    private String careerLevel;

    @Size(max = 50)
    private String education;

    @Size(max = 50)
    private String nickname;

    /**
     * 전화번호 커스텀 setter - 국제 형식(+82)을 국내 형식(0)으로 자동 변환
     */
    public void setPhone(String phone) {
        if (phone != null && phone.startsWith("+82")) {
            // +82 제거
            String withoutCountryCode = phone.substring(3);

            // 이미 0으로 시작하면 그대로, 아니면 0 추가
            // 예1: +8201047029314 -> 01047029314
            // 예2: +821047029314 -> 01047029314
            this.phone = withoutCountryCode.startsWith("0")
                ? withoutCountryCode
                : "0" + withoutCountryCode;
        } else {
            this.phone = phone;
        }
    }

    public void toEntity(Users user) {

        if (this.name != null) user.setName(this.name);
        if (this.nickname != null) user.setNickname(this.nickname);
        if (this.phone != null) user.setPhone(this.phone);

        if (this.dob != null) user.setDob(this.dob.toString());

        if (this.gender != null) user.setGender(this.gender);
        if (this.address != null) user.setAddress(this.address);
        if (this.position != null) user.setPosition(this.position);
        if (this.education != null) user.setEducation(this.education);

        if (this.careerLevel != null) user.setCareerLevel(this.careerLevel);
        if (this.location != null) user.setLocation(this.location);
    }
}
