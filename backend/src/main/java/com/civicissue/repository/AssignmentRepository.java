package com.civicissue.repository;

import com.civicissue.entity.postgres.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByIssueId(Long issueId);

    List<Assignment> findByDepartmentId(Long departmentId);
}
