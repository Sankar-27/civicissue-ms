package com.civicissue.service;

import com.civicissue.dto.department.DepartmentRequest;
import com.civicissue.dto.department.DepartmentResponse;
import com.civicissue.entity.postgres.Department;
import com.civicissue.enums.Category;

import java.util.List;
import java.util.Optional;

public interface DepartmentService {

    DepartmentResponse createDepartment(DepartmentRequest request);

    List<DepartmentResponse> getAllDepartments();

    DepartmentResponse getDepartmentById(Long id);

    DepartmentResponse updateDepartment(Long id, DepartmentRequest request);

    void deleteDepartment(Long id);

    Optional<Department> mapCategoryToDepartment(Category category);
}
