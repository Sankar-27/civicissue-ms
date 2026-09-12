package com.civicissue.service.impl;

import com.civicissue.dto.department.DepartmentRequest;
import com.civicissue.dto.department.DepartmentResponse;
import com.civicissue.entity.postgres.CategoryDepartment;
import com.civicissue.entity.postgres.Department;
import com.civicissue.enums.Category;
import com.civicissue.exception.ConflictException;
import com.civicissue.exception.ResourceNotFoundException;
import com.civicissue.repository.CategoryDepartmentRepository;
import com.civicissue.repository.DepartmentRepository;
import com.civicissue.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CategoryDepartmentRepository categoryDepartmentRepository;

    @Override
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.findByName(request.getName()).isPresent()) {
            throw new ConflictException("Department already exists with name: " + request.getName());
        }

        Department department = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .email(request.getEmail())
                .active(true)
                .build();

        return toResponse(departmentRepository.save(department));
    }

    @Override
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return toResponse(department);
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setEmail(request.getEmail());

        return toResponse(departmentRepository.save(department));
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        department.setActive(false);
        departmentRepository.save(department);
    }

    @Override
    public Optional<Department> mapCategoryToDepartment(Category category) {
        return categoryDepartmentRepository.findByCategory(category)
                .map(CategoryDepartment::getDepartment);
    }

    private DepartmentResponse toResponse(Department department) {
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .email(department.getEmail())
                .active(department.isActive())
                .createdAt(department.getCreatedAt())
                .build();
    }
}
