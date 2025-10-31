package com.we.hirehub.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MyProfileUpdateRequest {

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
    private String region;

    @Size(max = 50)
    private String position;

    @Size(max = 50)
    private String career;

    @Size(max = 50)
    private String education;

    @Size(max = 50)
    private String nickname;

    // ⚠ email 필드는 아예 두지 않는다(불변).
}
