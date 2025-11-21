package com.we.hirehub.dto.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.we.hirehub.entity.Users;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
/** 입력/수정용 **/
public class UsersRequestDto {

    @Size(max = 50)
    private String name;

    @Pattern(regexp = "^(01[0-9]-?[0-9]{3,4}-?[0-9]{4})$", message = "휴대폰 번호 형식이 아닙니다.")
    private String phone;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birth;   // "1995-01-20" 형식

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
    private String career;

    @Size(max = 50)
    private String education;

    @Size(max = 50)
    private String nickname;

    public void toEntity(Users user) {

        if (this.name != null) user.setName(this.name);
        if (this.nickname != null) user.setNickname(this.nickname);
        if (this.phone != null) user.setPhone(this.phone);

        if (this.birth != null) user.setDob(this.birth.toString());

        if (this.gender != null) user.setGender(this.gender);
        if (this.address != null) user.setAddress(this.address);
        if (this.position != null) user.setPosition(this.position);
        if (this.education != null) user.setEducation(this.education);

        if (this.career != null) user.setCareerLevel(this.career);
        if (this.location != null) user.setLocation(this.location);
    }
}
