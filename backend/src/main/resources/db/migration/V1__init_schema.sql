-- Initial schema for the CivicIssue Management Platform
-- Matches the JPA entity definitions (validated by Hibernate at startup).

-- =============================================================
-- users
-- =============================================================
CREATE TABLE users (
    id         BIGSERIAL     PRIMARY KEY,
    name       VARCHAR(255)  NOT NULL,
    email      VARCHAR(255)  NOT NULL,
    password   VARCHAR(255)  NOT NULL,
    role       VARCHAR(255)  NOT NULL,
    enabled    BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP     NOT NULL,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX uk_users_email ON users (email);
CREATE INDEX idx_user_email ON users (email);

-- =============================================================
-- roles (RBAC reference table)
-- =============================================================
CREATE TABLE roles (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE UNIQUE INDEX uk_roles_name ON roles (name);

-- =============================================================
-- departments
-- =============================================================
CREATE TABLE departments (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    email       VARCHAR(255),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP
);

CREATE UNIQUE INDEX uk_departments_name ON departments (name);

-- =============================================================
-- category_departments
-- =============================================================
CREATE TABLE category_departments (
    id            BIGSERIAL PRIMARY KEY,
    category      VARCHAR(255) NOT NULL,
    department_id BIGINT       NOT NULL
);

CREATE UNIQUE INDEX uk_category_departments_category ON category_departments (category);
ALTER TABLE category_departments
    ADD CONSTRAINT fk_category_departments_department
    FOREIGN KEY (department_id) REFERENCES departments (id);

-- =============================================================
-- issues
-- =============================================================
CREATE TABLE issues (
    id             BIGSERIAL    PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    description    VARCHAR(2000) NOT NULL,
    latitude       DOUBLE PRECISION,
    longitude      DOUBLE PRECISION,
    category       VARCHAR(255) NOT NULL,
    image_url      VARCHAR(500),
    status         VARCHAR(255) NOT NULL,
    priority       VARCHAR(255) NOT NULL,
    reported_by    BIGINT,
    reporter_phone VARCHAR(30),
    duplicate_of   BIGINT,
    department_id  BIGINT,
    created_at     TIMESTAMP    NOT NULL,
    updated_at     TIMESTAMP
);

CREATE INDEX idx_issue_status ON issues (status);
CREATE INDEX idx_issue_category ON issues (category);
CREATE INDEX idx_issue_priority ON issues (priority);
CREATE INDEX idx_issue_reported_by ON issues (reported_by);
CREATE INDEX idx_issue_reporter_phone ON issues (reporter_phone);
CREATE INDEX idx_issue_created_at ON issues (created_at);

ALTER TABLE issues
    ADD CONSTRAINT fk_issues_reported_by
    FOREIGN KEY (reported_by) REFERENCES users (id);
ALTER TABLE issues
    ADD CONSTRAINT fk_issues_duplicate_of
    FOREIGN KEY (duplicate_of) REFERENCES issues (id);
ALTER TABLE issues
    ADD CONSTRAINT fk_issues_department
    FOREIGN KEY (department_id) REFERENCES departments (id);

-- =============================================================
-- comments
-- =============================================================
CREATE TABLE comments (
    id         BIGSERIAL    PRIMARY KEY,
    content    VARCHAR(2000) NOT NULL,
    author_id  BIGINT       NOT NULL,
    issue_id   BIGINT       NOT NULL,
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP
);

CREATE INDEX idx_comments_issue ON comments (issue_id);
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_author
    FOREIGN KEY (author_id) REFERENCES users (id);
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_issue
    FOREIGN KEY (issue_id) REFERENCES issues (id);

-- =============================================================
-- assignments
-- =============================================================
CREATE TABLE assignments (
    id              BIGSERIAL    PRIMARY KEY,
    issue_id        BIGINT       NOT NULL,
    department_id   BIGINT       NOT NULL,
    assigned_by_id  BIGINT       NOT NULL,
    assigned_at     TIMESTAMP    NOT NULL,
    notes           VARCHAR(500)
);

CREATE INDEX idx_assignments_issue ON assignments (issue_id);
CREATE INDEX idx_assignments_department ON assignments (department_id);
ALTER TABLE assignments
    ADD CONSTRAINT fk_assignments_issue
    FOREIGN KEY (issue_id) REFERENCES issues (id);
ALTER TABLE assignments
    ADD CONSTRAINT fk_assignments_department
    FOREIGN KEY (department_id) REFERENCES departments (id);
ALTER TABLE assignments
    ADD CONSTRAINT fk_assignments_assigned_by
    FOREIGN KEY (assigned_by_id) REFERENCES users (id);

-- =============================================================
-- notifications
-- =============================================================
CREATE TABLE notifications (
    id                BIGSERIAL    PRIMARY KEY,
    user_id           BIGINT       NOT NULL,
    title             VARCHAR(255) NOT NULL,
    message           VARCHAR(1000) NOT NULL,
    type              VARCHAR(255) NOT NULL,
    read              BOOLEAN      NOT NULL DEFAULT FALSE,
    related_issue_id  BIGINT,
    created_at        TIMESTAMP    NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read);
ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id);
