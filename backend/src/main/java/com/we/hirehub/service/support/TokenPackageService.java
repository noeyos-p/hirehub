package com.we.hirehub.service.support;

import com.we.hirehub.entity.TokenPackage;
import com.we.hirehub.repository.TokenPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TokenPackageService {

    private final TokenPackageRepository repo;

    public List<TokenPackage> getActivePackages() {
        return repo.findAllByActiveTrue();
    }
}
