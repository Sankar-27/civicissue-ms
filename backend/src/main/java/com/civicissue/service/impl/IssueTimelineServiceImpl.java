package com.civicissue.service.impl;

import com.civicissue.dto.issue.TimelineEventResponse;
import com.civicissue.entity.postgres.Issue;
import com.civicissue.entity.postgres.IssueTimeline;
import com.civicissue.enums.IssueStatus;
import com.civicissue.exception.ResourceNotFoundException;
import com.civicissue.repository.IssueRepository;
import com.civicissue.repository.IssueTimelineRepository;
import com.civicissue.service.IssueTimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueTimelineServiceImpl implements IssueTimelineService {

    private final IssueTimelineRepository timelineRepository;
    private final IssueRepository issueRepository;

    @Override
    @Transactional
    public void recordEvent(Long issueId, IssueStatus status, String action, String message,
                            Long performedById, String performedByName) {
        Issue issue = issueRepository.getReferenceById(issueId);

        IssueTimeline entry = IssueTimeline.builder()
                .issue(issue)
                .status(status)
                .action(action)
                .message(message)
                .performedById(performedById)
                .performedByName(performedByName)
                .build();

        timelineRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimelineEventResponse> getTimeline(Long issueId) {
        if (!issueRepository.existsById(issueId)) {
            throw new ResourceNotFoundException("Issue not found with id: " + issueId);
        }
        return timelineRepository.findByIssueIdOrderByCreatedAtAsc(issueId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TimelineEventResponse toResponse(IssueTimeline entry) {
        return TimelineEventResponse.builder()
                .id(entry.getId())
                .action(entry.getAction())
                .status(entry.getStatus())
                .message(entry.getMessage())
                .performedByName(entry.getPerformedByName())
                .timestamp(entry.getCreatedAt())
                .build();
    }
}