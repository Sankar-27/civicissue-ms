package com.civicissue.dto.issue;

import com.civicissue.dto.user.UserResponse;
import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueResponse {

    private Long id;
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private Category category;
    private String imageUrl;
    private IssueStatus status;
    private Priority priority;
    private UserResponse reportedBy;
    private Long duplicateOfId;
    private Long departmentId;
    private String departmentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<TimelineEventResponse> timeline = new ArrayList<>();
}
