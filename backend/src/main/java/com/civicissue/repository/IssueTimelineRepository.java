package com.civicissue.repository;

import com.civicissue.entity.postgres.IssueTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueTimelineRepository extends JpaRepository<IssueTimeline, Long> {

    List<IssueTimeline> findByIssueIdOrderByCreatedAtAsc(Long issueId);

    List<IssueTimeline> findByIssueIdOrderByCreatedAtDesc(Long issueId);
}