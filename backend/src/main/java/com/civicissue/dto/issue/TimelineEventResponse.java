package com.civicissue.dto.issue;

import com.civicissue.enums.IssueStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimelineEventResponse {

    private Long id;
    private String action;
    private IssueStatus status;
    private String message;
    private String performedByName;
    private LocalDateTime timestamp;
}