package com.we.hirehub.repository;

import com.we.hirehub.entity.Users;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Long> {
    // 페이징으로 모든 사용자 조회
    Page<Users> findAll(Pageable pageable);
    // 닉네임으로 사용자 찾기
    Optional<Users> findByNickname(String nickname);
    boolean existsByEmail(String email);
    Optional<Users> findByEmail(String email);
    boolean existsByNicknameAndEmailNot(String nickname, String email);
    boolean existsByPhoneAndEmailNot(String phone, String email);
    @Query("SELECT u FROM Users u WHERE u.email = :email AND u.nickname <> '(탈퇴한 회원)'")
    Optional<Users> findActiveByEmail(@Param("email") String email);
    boolean existsByNickname(String nickname);

}
