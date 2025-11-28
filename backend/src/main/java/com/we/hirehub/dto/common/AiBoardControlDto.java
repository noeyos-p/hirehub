package com.we.hirehub.dto.common;

import com.we.hirehub.entity.AiBoardControl;
import com.we.hirehub.entity.Board;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiBoardControlDto {

    private Long id;
    private Long boardId;
    private String reason;
    private String boardTitle;

    /** Entity -> Dto **/
    public static AiBoardControlDto toDto(AiBoardControl aiBoardControl) {
        return AiBoardControlDto.builder()
                .id(aiBoardControl.getId())
                .boardId(aiBoardControl.getBoard().getId())
                .reason(aiBoardControl.getReason())
                .boardTitle(aiBoardControl.getBoard().getTitle())
                .build();
    }

    /** Dto -> Entity **/
    public AiBoardControl toEntity(Board board) {
        return AiBoardControl.builder()
                .id(this.id)
                .board(board)
                .reason(this.reason)
                .build();
    }

    /** 기존 Entity 업데이트 **/
    public void updateEntity(AiBoardControl aiBoardControl) {
        if (this.reason != null) {
            aiBoardControl.setReason(this.reason);
        }
    }
}
