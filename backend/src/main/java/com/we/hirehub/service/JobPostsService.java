package com.we.hirehub.service;

import com.we.hirehub.dto.JobPostsDto;
import com.we.hirehub.entity.JobPosts;

import java.util.List;

public interface JobPostsService {
    List<JobPostsDto> getAllJobPosts();
    JobPostsDto getJobPostById(Long id);
    List<JobPostsDto> searchJobPosts(String keyword);
    JobPostsDto createJobPost(JobPostsDto dto);
    JobPostsDto incrementViews(Long id);
}
