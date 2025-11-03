package com.we.hirehub.ws;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SupportQueue {

    public static class RoomState {
        public boolean handoffRequested = false;
        public boolean handoffAccepted = false;
        public String userName = "user";
        public String userNickname = "user"; // ✅ 닉네임 필드 추가
    }

    private final ConcurrentHashMap<String, RoomState> rooms = new ConcurrentHashMap<>();

    public RoomState state(String roomId) {
        return rooms.computeIfAbsent(roomId, k -> new RoomState());
    }

    public void remove(String roomId) {
        rooms.remove(roomId);
    }
}
