package com.we.hirehub.service.support;


import com.we.hirehub.dto.support.SaveCoverLetterRequest;
import com.we.hirehub.entity.CoverLetterHistory;
import com.we.hirehub.repository.CoverLetterHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoverLetterHistoryService {

    private final CoverLetterHistoryRepository repo;

    /** 저장 */
    public CoverLetterHistory save(Long userId, SaveCoverLetterRequest req) {

        CoverLetterHistory h = CoverLetterHistory.builder()
                .userId(userId)
                .resumeId(req.getResumeId())
                .resumeTitle(req.getResumeTitle())
                .inputMode(req.getInputMode())
                .originalText(req.getOriginalText())
                .improvedText(req.getImprovedText())
                .createdAt(LocalDateTime.now())
                .build();

        return repo.save(h);
    }

    /** 리스트 */
    public List<CoverLetterHistory> getList(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /** 상세 */
    public CoverLetterHistory getDetail(Long id, Long userId) {
        return repo.findById(id)
                .filter(h -> h.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("조회 권한 없음"));
    }

    /** 삭제 */
    public void delete(Long id, Long userId) {
        CoverLetterHistory h = getDetail(id, userId);
        repo.delete(h);
    }
}
