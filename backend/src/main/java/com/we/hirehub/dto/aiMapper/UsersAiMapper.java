package com.we.hirehub.dto.aiMapper;

import com.we.hirehub.entity.Users;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class UsersAiMapper {
    public Map<String, Object> toAiPayload(Users u) {
        return Map.of(
                "name", u.getName(),
                "nickname", u.getNickname(),
                "gender", u.getGender(),
                "dob", u.getDob(),
                "education", u.getEducation(),
                "careerLevel", u.getCareerLevel(),
                "position", u.getPosition(),
                "address", u.getAddress(),
                "location", u.getLocation()
        );
    }
}
