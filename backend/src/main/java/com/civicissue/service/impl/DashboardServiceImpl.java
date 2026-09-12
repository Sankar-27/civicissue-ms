package com.civicissue.service.impl;

import com.civicissue.dto.dashboard.CategoryCount;
import com.civicissue.dto.dashboard.DashboardStatsResponse;
import com.civicissue.dto.dashboard.TrendData;
import com.civicissue.dto.issue.IssueResponse;
import com.civicissue.dto.user.UserResponse;
import com.civicissue.entity.postgres.Issue;
import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.repository.IssueRepository;
import com.civicissue.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final IssueRepository issueRepository;

    @Override
    public DashboardStatsResponse getDashboardStats() {
        long totalIssues = issueRepository.count();
        long openIssues = issueRepository.countByStatus(IssueStatus.OPEN);
        long underReviewIssues = issueRepository.countByStatus(IssueStatus.UNDER_REVIEW);
        long assignedIssues = issueRepository.countByStatus(IssueStatus.ASSIGNED);
        long inProgressIssues = issueRepository.countByStatus(IssueStatus.IN_PROGRESS);
        long resolvedIssues = issueRepository.countByStatus(IssueStatus.RESOLVED);
        long closedIssues = issueRepository.countByStatus(IssueStatus.CLOSED);
        long rejectedIssues = issueRepository.countByStatus(IssueStatus.REJECTED);
        long criticalIssues = issueRepository.countByPriority(com.civicissue.enums.Priority.CRITICAL);

        List<CategoryCount> categoryCounts = new ArrayList<>();
        for (Category category : Category.values()) {
            long count = issueRepository.countByCategory(category);
            if (count > 0) {
                categoryCounts.add(CategoryCount.builder()
                        .category(category)
                        .count(count)
                        .build());
            }
        }

        List<TrendData> sevenDayTrend = buildTrendData();

        List<IssueResponse> recentIssues = issueRepository
                .findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return DashboardStatsResponse.builder()
                .totalIssues(totalIssues)
                .openIssues(openIssues)
                .underReviewIssues(underReviewIssues)
                .assignedIssues(assignedIssues)
                .inProgressIssues(inProgressIssues)
                .resolvedIssues(resolvedIssues)
                .closedIssues(closedIssues)
                .rejectedIssues(rejectedIssues)
                .criticalIssues(criticalIssues)
                .categoryCounts(categoryCounts)
                .sevenDayTrend(sevenDayTrend)
                .recentIssues(recentIssues)
                .build();
    }

    private List<TrendData> buildTrendData() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);

        List<Object[]> trendRows = issueRepository.findIssueTrendSince(sevenDaysAgo.atStartOfDay());

        Map<LocalDate, Long> countsByDate = new java.util.HashMap<>();
        for (Object[] row : trendRows) {
            Object dayObj = row[0];
            LocalDate date;
            if (dayObj instanceof java.sql.Date d) {
                date = d.toLocalDate();
            } else if (dayObj instanceof java.sql.Timestamp t) {
                date = t.toLocalDateTime().toLocalDate();
            } else {
                date = LocalDate.parse(String.valueOf(dayObj));
            }
            countsByDate.put(date, ((Number) row[1]).longValue());
        }

        List<TrendData> trendData = new ArrayList<>();
        for (LocalDate date = sevenDaysAgo; !date.isAfter(today); date = date.plusDays(1)) {
            trendData.add(TrendData.builder()
                    .date(date)
                    .count(countsByDate.getOrDefault(date, 0L))
                    .build());
        }

        return trendData;
    }

    private IssueResponse toResponse(Issue issue) {
        UserResponse reporter = null;
        if (issue.getReportedBy() != null) {
            reporter = UserResponse.builder()
                    .id(issue.getReportedBy().getId())
                    .name(issue.getReportedBy().getName())
                    .email(issue.getReportedBy().getEmail())
                    .role(issue.getReportedBy().getRole())
                    .enabled(issue.getReportedBy().isEnabled())
                    .createdAt(issue.getReportedBy().getCreatedAt())
                    .build();
        }

        Long departmentId = issue.getDepartment() != null ? issue.getDepartment().getId() : null;
        String departmentName = issue.getDepartment() != null ? issue.getDepartment().getName() : null;
        Long duplicateOfId = issue.getDuplicateOf() != null ? issue.getDuplicateOf().getId() : null;

        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .latitude(issue.getLatitude())
                .longitude(issue.getLongitude())
                .category(issue.getCategory())
                .imageUrl(issue.getImageUrl())
                .status(issue.getStatus())
                .priority(issue.getPriority())
                .reportedBy(reporter)
                .duplicateOfId(duplicateOfId)
                .departmentId(departmentId)
                .departmentName(departmentName)
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .build();
    }
}
