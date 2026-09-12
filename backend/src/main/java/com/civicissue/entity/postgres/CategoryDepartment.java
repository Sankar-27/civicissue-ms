package com.civicissue.entity.postgres;

import com.civicissue.enums.Category;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "category_departments", uniqueConstraints = {
        @UniqueConstraint(columnNames = "category")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDepartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;
}
