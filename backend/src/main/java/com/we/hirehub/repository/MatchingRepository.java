package com.we.hirehub.repository;

import com.we.hirehub.entity.Matching;
import com.we.hirehub.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchingRepository extends JpaRepository<Matching, Long> {
  List<Matching> findByResume(Resume resume);

  List<Matching> findByResumeOrderByIdDesc(Resume resume);

  void deleteByJobPosts_Id(Long jobPostId);
}
