package com.we.hirehub.dto.aiMapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.entity.Resume;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ResumeAiMapper {

    private final ObjectMapper mapper = new ObjectMapper();

    public Map<String, Object> toAiPayload(Resume resume) {

        Map<String, Object> parsed = parseHtml(resume.getHtmlContent());

        return Map.of(
                "title", resume.getTitle(),
                "essayTitle", resume.getEssayTittle(),
                "essayContent", resume.getEssayContent(),

                // htmlContent 안에서 추출된 값
                "educations", parsed.getOrDefault("education", List.of()),
                "careers", parsed.getOrDefault("career", List.of()),
                "certs", parsed.getOrDefault("certificate", List.of()),
                "skills", parsed.getOrDefault("skill", List.of()),
                "langs", parsed.getOrDefault("language", List.of())
        );
    }

    private Map<String, Object> parseHtml(String htmlJson) {
        if (htmlJson == null || htmlJson.isBlank()) return Map.of();
        try {
            return mapper.readValue(htmlJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}