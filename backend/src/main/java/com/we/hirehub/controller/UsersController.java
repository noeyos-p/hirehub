package com.we.hirehub.controller;

import com.we.hirehub.dto.UsersDto;
import com.we.hirehub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserService usersService;

    @PostMapping("/register")
    public String register(@ModelAttribute("users") UsersDto dto, Model model) {
        usersService.register(dto);
        model.addAttribute("ok", true);
        return "users/success";
    }
}
