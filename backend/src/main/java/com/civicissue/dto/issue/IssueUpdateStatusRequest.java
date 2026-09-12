package com.civicissue.dto.issue;

import com.civicissue.enums.IssueStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueUpdateStatusRequest {

    @NotNull(message = "Status is required")
    private IssueStatus status;
}
