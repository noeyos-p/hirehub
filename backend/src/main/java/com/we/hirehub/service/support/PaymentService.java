package com.we.hirehub.service.support;

import com.we.hirehub.config.InicisClient;
import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.dto.support.InicisResponseDto;
import com.we.hirehub.dto.support.PaymentRequestDto;
import com.we.hirehub.entity.TokenPackage;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.TokenPackageRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final InicisClient inicisClient;
    private final TokenPackageRepository tokenPackageRepository;
    private final UsersRepository usersRepository;

    /** 결제 준비 */
    public InicisResponseDto ready(PaymentRequestDto req) {

        // 🔥 핵심: 여기서 userId 추출
        JwtUserPrincipal principal =
                (JwtUserPrincipal) SecurityContextHolder.getContext()
                        .getAuthentication()
                        .getPrincipal();

        Long userId = principal.getUserId();

        log.info("🔥 [결제 준비 시작] userId={}, 패키지={}", userId, req.getTokenPackageId());

        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        TokenPackage pkg = tokenPackageRepository.findById(req.getTokenPackageId())
                .orElseThrow(() -> new RuntimeException("토큰 패키지 없음"));

        String oid = "ORDER_" + System.currentTimeMillis();

        return inicisClient.requestReady(pkg.getPrice(), pkg.getName(), oid);
    }

    /** 결제 승인 */
    public InicisResponseDto approve(PaymentRequestDto req) {

        log.info("🔥 [결제 승인 요청] tid={}, authToken={}, oid={}",
                req.getTid(), req.getAuthToken(), req.getOrderNumber());

        return inicisClient.requestApprove(
                req.getTid(),
                req.getAuthToken(),
                req.getOrderNumber()
        );
    }

    /** 결제 취소 */
    public InicisResponseDto cancel(PaymentRequestDto req) {

        log.info("🔥 [결제 취소 요청] tid={}, amount={}, reason={}",
                req.getTid(), req.getAmount(), req.getCancelReason());

        return inicisClient.requestCancel(
                req.getTid(),
                req.getAmount(),
                req.getCancelReason()
        );
    }
}
