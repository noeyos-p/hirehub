package com.we.hirehub.controller.common;

import com.we.hirehub.entity.TokenPackage;
import com.we.hirehub.service.support.TokenPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/token-packages")
@RequiredArgsConstructor
public class TokenPackageController {

    private final TokenPackageService service;

    @GetMapping
    public List<TokenPackage> getPackages() {
        return service.getActivePackages();
    }
}
