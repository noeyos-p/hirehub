// src/main/java/com/example/hirehub/admin/AdminChatController.java
package com.we.hirehub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/templates/admin/session")
public class AdminChatController {

    // 관리자가 특정 roomId로 들어가는 페이지
    @GetMapping("/{roomId}")
    public String session(@PathVariable String roomId, Model model) {
        model.addAttribute("roomId", roomId);
        return "templates/admin/session"; // templates/admin/session.html
    }
}
