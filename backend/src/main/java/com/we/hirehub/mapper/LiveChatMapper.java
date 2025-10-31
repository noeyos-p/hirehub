
package com.we.hirehub.mapper;

import com.we.hirehub.entity.LiveChat;
import com.we.hirehub.dto.LiveChatDto;

public class LiveChatMapper {
    public static LiveChatDto toDto(LiveChat e){
        if(e==null) return null;
        return LiveChatDto.builder()
                .id(e.getId())
                .content(e.getContent())
                .createAt(e.getCreateAt())
                .sessionId(e.getSession()!=null ? e.getSession().getId() : null)
                .build();
    }
}
