package com.devmind.backend.repository;

import com.devmind.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Project} entities.
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * Find a project by its UUID string identifier.
     *
     * @param projectId the UUID string (e.g. "550e8400-e29b-41d4-a716-446655440000")
     * @return an Optional containing the project if found
     */
    Optional<Project> findByProjectId(String projectId);

    /**
     * Check if a project with the given UUID exists.
     */
    boolean existsByProjectId(String projectId);
}
