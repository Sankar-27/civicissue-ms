package com.civicissue.service;

import com.civicissue.dto.issue.TimelineEventResponse;
import com.civicissue.enums.IssueStatus;

import java.util.List;

public interface IssueTimelineService {

    void recordEvent(Long issueId, IssueStatus status, String action, String message,
                     Long performedById, String performedByName);

    List<TimelineEventResponse> getTimeline(Long issueId);
}