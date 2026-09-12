package com.civicissue.dto.dashboard;

import com.civicissue.dto.issue.IssueResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private long totalIssues;
    private long openIssues;
    private long underReviewIssues;
    private long assignedIssues;
    private long inProgressIssues;
    private long resolvedIssues;
    private long closedIssues;
    private long rejectedIssues;
    private long criticalIssues;
    private List<CategoryCount> categoryCounts;
    private List<TrendData> sevenDayTrend;
    private List<IssueResponse> recentIssues;
}
