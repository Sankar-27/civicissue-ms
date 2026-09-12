package com.civicissue.entity.postgres;

import com.civicissue.enums.IssueStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "issue_timeline", indexes = {
        @Index(name = "idx_issue_timeline_issue", columnList = "issue_id"),
        @Index(name = "idx_issue_timeline_issue_created", columnList = "issue_id, created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueStatus status;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(length = 1000)
    private String message;

    @Column(name = "performed_by_id")
    private Long performedById;

    @Column(name = "performed_by_name", length = 255)
    private String performedByName;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}