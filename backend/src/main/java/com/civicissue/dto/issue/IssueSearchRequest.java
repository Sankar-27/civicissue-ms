package com.civicissue.dto.issue;

import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueSearchRequest {

    private String search;
    private IssueStatus status;
    private Priority priority;
    private Category category;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;

    @Builder.Default
    private String sortBy = "createdAt";

    @Builder.Default
    private String sortDir = "desc";
}
