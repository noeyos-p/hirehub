package com.we.hirehub.ws;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SupportQueue {

    public static class RoomState {
        public volatile boolean handoffRequested = false;
        public volatile boolean handoffAccepted = false;
        public volatile String userName = "";
    }

    private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();

    public RoomState state(String roomId){
        return rooms.computeIfAbsent(roomId, k -> new RoomState());
    }

    public Map<String, RoomState> all() { return rooms; }
}
