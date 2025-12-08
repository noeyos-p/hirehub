package com.we.hirehub.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiEmbeddingClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Double> embed(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonBody = "{\"text\": " + objectMapper.writeValueAsString(text) + "}";

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            Map res = restTemplate.postForObject(
                    "http://localhost:8000/ai/embed",
                    entity,
                    Map.class
            );

            if (res == null) return List.of();

            return (List<Double>) res.get("vector");

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

}
