package com.we.hirehub.mapper;

import com.we.hirehub.dto.UsersDto;
import com.we.hirehub.entity.Users;
import org.springframework.stereotype.Component;

@Component
public class UsersMapper {

    public UsersDto toDto(Users e){
        if (e == null) return null;
        return UsersDto.builder()
                .id(e.getId())
                .email(e.getEmail())
                .name(e.getName())
                // password는 보안상 DTO에 싣지 않음 (원하면 주석 해제)
                //.password(e.getPassword())
                .nickname(e.getNickname())
                .phone(e.getPhone())
                .dob(e.getDob())               // ★ String 그대로 매핑
                .gender(e.getGender())
                .education(e.getEducation())
                .careerLevel(e.getCareerLevel())
                .position(e.getPosition())
                .address(e.getAddress())
                .location(e.getLocation())
                .role(e.getRole())
                .build();
    }

    /** 부분 업데이트용 (null이 아닌 값만 반영) */
    public void updateEntity(UsersDto d, Users e){
        if (d == null || e == null) return;

        if (d.getEmail() != null) e.setEmail(d.getEmail());
        if (d.getName() != null) e.setName(d.getName());
        if (d.getPassword() != null) e.setPassword(d.getPassword());

        if (d.getNickname() != null) e.setNickname(d.getNickname());
        if (d.getPhone() != null) e.setPhone(d.getPhone());
        if (d.getDob() != null) e.setDob(d.getDob());                 // ★ String 그대로 반영
        if (d.getGender() != null) e.setGender(d.getGender());
        if (d.getEducation() != null) e.setEducation(d.getEducation());
        if (d.getCareerLevel() != null) e.setCareerLevel(d.getCareerLevel());
        if (d.getPosition() != null) e.setPosition(d.getPosition());
        if (d.getAddress() != null) e.setAddress(d.getAddress());
        if (d.getLocation() != null) e.setLocation(d.getLocation());
        if (d.getRole() != null) e.setRole(d.getRole());
    }

    /** 신규 생성용 */
    public Users toEntity(UsersDto d){
        if (d == null) return null;
        Users e = new Users();
        e.setId(d.getId());
        e.setEmail(d.getEmail());
        e.setName(d.getName());
        e.setPassword(d.getPassword());
        e.setNickname(d.getNickname());
        e.setPhone(d.getPhone());
        e.setDob(d.getDob());                                       // ★ String 그대로 세팅
        e.setGender(d.getGender());
        e.setEducation(d.getEducation());
        e.setCareerLevel(d.getCareerLevel());
        e.setPosition(d.getPosition());
        e.setAddress(d.getAddress());
        e.setLocation(d.getLocation());
        e.setRole(d.getRole());
        return e;
    }
}
