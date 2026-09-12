package com.civicissue.dto.user;

import com.civicissue.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRoleRequest {

    @NotNull(message = "Role is required")
    private Role role;
}
