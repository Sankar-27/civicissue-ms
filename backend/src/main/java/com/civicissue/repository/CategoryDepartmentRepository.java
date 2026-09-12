package com.civicissue.repository;

import com.civicissue.entity.postgres.CategoryDepartment;
import com.civicissue.enums.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryDepartmentRepository extends JpaRepository<CategoryDepartment, Long> {

    Optional<CategoryDepartment> findByCategory(Category category);
}
