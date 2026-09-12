-- Issue timeline / history entries for auditing lifecycle changes.

CREATE TABLE issue_timeline (
    id                BIGSERIAL    PRIMARY KEY,
    issue_id          BIGINT       NOT NULL,
    status            VARCHAR(255) NOT NULL,
    action            VARCHAR(100) NOT NULL,
    message           VARCHAR(1000),
    performed_by_id   BIGINT,
    performed_by_name VARCHAR(255),
    created_at        TIMESTAMP    NOT NULL
);

CREATE INDEX idx_issue_timeline_issue ON issue_timeline (issue_id);
CREATE INDEX idx_issue_timeline_issue_created ON issue_timeline (issue_id, created_at);
ALTER TABLE issue_timeline
    ADD CONSTRAINT fk_issue_timeline_issue
    FOREIGN KEY (issue_id) REFERENCES issues (id);