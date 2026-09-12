package com.civicissue.service;

import com.civicissue.dto.user.PageResponse;
import com.civicissue.dto.user.UserResponse;
import com.civicissue.dto.user.UserUpdateRoleRequest;
import com.civicissue.enums.Role;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface UserService {

    PageResponse<UserResponse> getAllUsers(int page, int size, String sortBy, String sortDir);

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse updateUserRole(Long id, UserUpdateRoleRequest request);

    UserResponse updateUserRole(Long id, Role role);

    UserResponse getCurrentUser(Authentication authentication);

    UserResponse getCurrentUser(String email);
}
