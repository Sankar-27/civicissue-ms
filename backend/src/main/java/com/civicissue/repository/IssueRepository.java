package com.civicissue.repository;

import com.civicissue.entity.postgres.Issue;
import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long>, JpaSpecificationExecutor<Issue> {

    List<Issue> findByReportedByIdOrderByCreatedAtDesc(Long userId);

    List<Issue> findByStatus(IssueStatus status);

    List<Issue> findByPriority(Priority priority);

    List<Issue> findByCategory(Category category);

    List<Issue> findByDuplicateOfId(Long duplicateOfId);

    long countByStatus(IssueStatus status);

    long countByCategory(Category category);

    long countByPriority(Priority priority);

    long countByReportedById(Long userId);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query(value = """
            SELECT i.*, (
                6371000 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(i.latitude))
                    * COS(RADIANS(i.longitude) - RADIANS(:lon))
                    + SIN(RADIANS(:lat)) * SIN(RADIANS(i.latitude))
                )
            ) AS distance
            FROM issues i
            WHERE i.latitude IS NOT NULL AND i.longitude IS NOT NULL
            AND i.category = :category
            HAVING distance <= :radiusMeters
            ORDER BY distance ASC
            """, nativeQuery = true)
    List<Issue> findNearbyIssues(
            @Param("category") String category,
            @Param("lat") double latitude,
            @Param("lon") double longitude,
            @Param("radiusMeters") double radiusMeters
    );

    @Query(value = """
            SELECT i.*, (
                6371000 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(i.latitude))
                    * COS(RADIANS(i.longitude) - RADIANS(:lon))
                    + SIN(RADIANS(i.latitude)) * SIN(RADIANS(:lat))
                )
            ) AS distance
            FROM issues i
            WHERE i.latitude IS NOT NULL AND i.longitude IS NOT NULL
            AND i.category = :category
            AND i.status IN ('OPEN', 'IN_PROGRESS')
            HAVING distance <= :radiusMeters
            ORDER BY distance ASC
            """, nativeQuery = true)
    List<Issue> findNearbyIssuesForDuplicate(
            @Param("category") String category,
            @Param("lat") double latitude,
            @Param("lon") double longitude,
            @Param("radiusMeters") double radiusMeters
    );

    @Query(value = """
            SELECT i.*, (
                6371000 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(i.latitude))
                    * COS(RADIANS(i.longitude) - RADIANS(:lon))
                    + SIN(RADIANS(i.latitude)) * SIN(RADIANS(:lat))
                )
            ) AS distance
            FROM issues i
            WHERE i.latitude IS NOT NULL AND i.longitude IS NOT NULL
            HAVING distance <= :radiusMeters
            ORDER BY distance ASC
            """, nativeQuery = true)
    List<Issue> findNearbyIssuesAll(
            @Param("lat") double latitude,
            @Param("lon") double longitude,
            @Param("radiusMeters") double radiusMeters
    );

    @Query(value = """
            SELECT DATE(created_at) AS day, COUNT(*) AS count
            FROM issues
            WHERE created_at >= :since
            GROUP BY DATE(created_at)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> findIssueTrendSince(@Param("since") LocalDateTime since);
}
