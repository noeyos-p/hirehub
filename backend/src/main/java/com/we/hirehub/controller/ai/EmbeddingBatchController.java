package com.we.hirehub.controller.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.we.hirehub.config.AiEmbeddingClient;
import com.we.hirehub.entity.JobPosts;
import com.we.hirehub.repository.JobPostsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/embed")
@RequiredArgsConstructor
public class EmbeddingBatchController {

    private final JobPostsRepository jobPostsRepository;
    private final AiEmbeddingClient aiEmbeddingClient;

    @PostMapping("/job-posts")
    public Map<String, Object> embedAll() {

        List<JobPosts> posts = jobPostsRepository.findAll();
        int success = 0;

        for (JobPosts p : posts) {
            try {
                String summary = p.getSummary();
                if (summary == null || summary.isBlank()) continue;

                List<Double> embedding = aiEmbeddingClient.embed(summary);
                if (embedding == null || embedding.isEmpty()) continue;

                String json = new ObjectMapper().writeValueAsString(embedding);
                p.setEmbedding(json);

                jobPostsRepository.save(p);
                success++;

                Thread.sleep(200);

            } catch (Exception ignore) {}
        }

        return Map.of(
                "total", posts.size(),
                "embedded", success
        );
    }

}
