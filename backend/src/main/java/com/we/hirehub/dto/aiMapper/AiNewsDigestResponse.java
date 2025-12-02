package com.we.hirehub.dto.aiMapper;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class AiNewsDigestResponse {
    private String title;
    private String content;
    private List<String> tags;

    private List<NewsItem> sources;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NewsItem {
        private String title;
        private String link;
        private String description;
        private String pubDate;
        private String press;
    }
}
