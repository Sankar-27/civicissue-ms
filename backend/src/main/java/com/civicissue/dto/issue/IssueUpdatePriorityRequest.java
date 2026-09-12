package com.civicissue.dto.issue;

import com.civicissue.enums.Priority;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueUpdatePriorityRequest {

    @NotNull(message = "Priority is required")
    private Priority priority;
}
