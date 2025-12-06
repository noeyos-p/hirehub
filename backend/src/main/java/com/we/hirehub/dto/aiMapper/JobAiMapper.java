package com.we.hirehub.dto.aiMapper;

import com.we.hirehub.entity.JobPosts;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class JobAiMapper {

    public Map<String, Object> toAiPayload(JobPosts job) {
        Map<String, Object> map = new HashMap<>();

        // ⭐ 필수: jobId 추가
        map.put("id", job.getId());

        map.put("title", job.getTitle());
        map.put("content", job.getContent());
        map.put("location", job.getLocation());
        map.put("careerLevel", job.getCareerLevel());
        map.put("education", job.getEducation());
        map.put("position", job.getPosition());
        map.put("type", job.getType());

        return map;
    }
}