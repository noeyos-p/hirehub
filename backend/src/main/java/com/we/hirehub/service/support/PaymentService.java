package com.we.hirehub.service.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.we.hirehub.config.JwtUserPrincipal;
import com.we.hirehub.config.PortOneClient;
import com.we.hirehub.dto.support.PaymentDto;
import com.we.hirehub.dto.support.VerifyRequest;
import com.we.hirehub.entity.Payment;
import com.we.hirehub.entity.TokenPackage;
import com.we.hirehub.entity.Users;
import com.we.hirehub.repository.PaymentRepository;
import com.we.hirehub.repository.TokenPackageRepository;
import com.we.hirehub.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PortOneClient portOneClient;
    private final UsersRepository usersRepository;
    private final PaymentRepository paymentRepository;
    private final TokenPackageRepository tokenPackageRepository;

    private final TokenService tokenService; // 🔥 추가 (토큰 적립 + 히스토리)

    /**
     * ✔ PortOne 결제 검증 + DB 저장 + 토큰 지급
     */
    public PaymentDto verify(VerifyRequest req) {

        // 🔐 현재 로그인 유저 정보 가져오기
        JwtUserPrincipal principal =
                (JwtUserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = principal.getUserId();

        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("유저 없음"));

        // 🔐 결제한 토큰 패키지 불러오기
        TokenPackage pkg = tokenPackageRepository.findById(req.getPackageId())
                .orElseThrow(() -> new RuntimeException("토큰 패키지 없음"));

        // 🔥 PortOne 결제 정보 조회
        JsonNode info = portOneClient.getPayment(req.getImpUid());

        String status = info.get("status").asText().toUpperCase();   // PAID
        Integer amount = info.get("amount").asInt();
        String merchantUid = info.get("merchantUid").asText();
        String payMethod =
                info.has("payMethod") ? info.get("payMethod").asText().toUpperCase() : "KAKAOPAY";

        // 🔒 결제 성공 여부 체크
        if (!"PAID".equals(status)) {
            throw new RuntimeException("결제 실패 상태: " + status);
        }

        // 🔒 금액 위변조 방지
        if (!amount.equals(pkg.getPrice())) {
            throw new RuntimeException("금액 위변조 감지");
        }

        // 🧾 결제 정보 DB 저장
        Payment payment = paymentRepository.save(
                Payment.builder()
                        .orderNumber(merchantUid)
                        .tid(req.getImpUid())
                        .goodName(pkg.getName())
                        .totalPrice(amount)
                        .user(user)
                        .tokenPackage(pkg)
                        .status("PAID")       // PortOne 실제 결제 상태
                        .role("COMPLETED")    // 내부 처리 상태
                        .payMethod(payMethod)
                        .createAt(LocalDateTime.now())
                        .updateAt(LocalDateTime.now())
                        .build()
        );


        /**
         * 🎉 수정된 부분 (핵심)
         * - TokenService 를 이용하여 토큰 적립 + 토큰 내역 저장
         */
        tokenService.addTokens(
                user.getId(),
                pkg.getTokenAmount(),
                "PAYMENT",
                "토큰 패키지 구매"
        );

        log.info("🎉 토큰 충전 완료: user={}, 충전량={}, 현재 토큰={}",
                user.getEmail(), pkg.getTokenAmount(), user.getTokenBalance());
        log.info("🔥 VERIFY 호출됨: impUid={}, packageId={}", req.getImpUid(), req.getPackageId());

        return PaymentDto.from(payment);
    }


    // =============================
    // ✔ 유저 결제 내역 조회
    // =============================
    public List<PaymentDto> getMyPayments() {

        JwtUserPrincipal principal =
                (JwtUserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = principal.getUserId();

        return paymentRepository.findAllByUserIdOrderByCreateAtDesc(userId)
                .stream()
                .map(PaymentDto::from)
                .toList();
    }

    // =============================
    // ✔ 관리자 전체 결제 리스트
    // =============================
    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAllByOrderByCreateAtDesc()
                .stream()
                .map(PaymentDto::from)
                .toList();
    }


    // =============================
// ✔ 관리자 검색
// =============================
    public List<PaymentDto> searchPayments(String email, String status, LocalDate from, LocalDate to) {

        LocalDateTime dtFrom = (from != null) ? from.atStartOfDay() : null;
        LocalDateTime dtTo = (to != null) ? to.plusDays(1).atStartOfDay() : null;

        boolean hasEmail = email != null && !email.isBlank();
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasDate = dtFrom != null && dtTo != null;

        List<Payment> list;

        // ------------------------------------
        // 🔍 3조건 검색
        // ------------------------------------
        if (hasEmail && hasStatus && hasDate) {
            list = paymentRepository
                    .findAllByUserEmailContainingAndRoleAndCreateAtBetween(
                            email, status, dtFrom, dtTo);
        }
        // ------------------------------------
        // 🔍 2조건 검색
        // ------------------------------------
        else if (hasEmail && hasStatus) {
            list = paymentRepository
                    .findAllByUserEmailContainingAndRole(email, status);
        } else if (hasEmail && hasDate) {
            list = paymentRepository
                    .findAllByUserEmailContainingAndCreateAtBetween(email, dtFrom, dtTo);
        } else if (hasStatus && hasDate) {
            list = paymentRepository
                    .findAllByRoleAndCreateAtBetween(status, dtFrom, dtTo);
        }
        // ------------------------------------
        // 🔍 단일 조건 검색
        // ------------------------------------
        else if (hasEmail) {
            list = paymentRepository.findAllByUserEmailContaining(email);
        } else if (hasStatus) {
            list = paymentRepository.findAllByRole(status);
        } else if (hasDate) {
            list = paymentRepository.findAllByCreateAtBetween(dtFrom, dtTo);
        }
        // ------------------------------------
        // 🔍 전체 조회
        // ------------------------------------
        else {
            list = paymentRepository.findAllByOrderByCreateAtDesc();
        }

        return list.stream()
                .map(PaymentDto::from)
                .toList();
    }
}
