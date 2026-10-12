package com.devmind.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA entity representing an uploaded codebase project.
 * Status lifecycle: UPLOADED → INDEXING → READY | FAILED
 */
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable name (derived from the ZIP filename). */
    @Column(nullable = false)
    private String name;

    /** UUID string — used as the project identifier across all services. */
    @Column(nullable = false, unique = true)
    private String projectId;

    /** Absolute path to the directory where the ZIP was extracted. */
    @Column(nullable = false)
    private String uploadPath;

    /**
     * Current processing status:
     * UPLOADED  – ZIP saved, extraction pending
     * INDEXING  – FastAPI is building the vector index
     * READY     – Indexed and available for chat queries
     * FAILED    – An error occurred during indexing
     */
    @Column(nullable = false)
    private String status;

    /** Optional error message populated when status == FAILED. */
    @Column(length = 1024)
    private String errorMessage;

    /** Total number of files extracted from the ZIP. */
    private int fileCount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // -----------------------------------------------------------------------
    // Constructors
    // -----------------------------------------------------------------------

    public Project() {}

    private Project(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.projectId = builder.projectId;
        this.uploadPath = builder.uploadPath;
        this.status = builder.status;
        this.errorMessage = builder.errorMessage;
        this.fileCount = builder.fileCount;
    }

    // -----------------------------------------------------------------------
    // Builder
    // -----------------------------------------------------------------------

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String projectId;
        private String uploadPath;
        private String status;
        private String errorMessage;
        private int fileCount;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder projectId(String projectId) { this.projectId = projectId; return this; }
        public Builder uploadPath(String uploadPath) { this.uploadPath = uploadPath; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder errorMessage(String errorMessage) { this.errorMessage = errorMessage; return this; }
        public Builder fileCount(int fileCount) { this.fileCount = fileCount; return this; }
        public Project build() { return new Project(this); }
    }

    // -----------------------------------------------------------------------
    // Getters & Setters
    // -----------------------------------------------------------------------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getUploadPath() { return uploadPath; }
    public void setUploadPath(String uploadPath) { this.uploadPath = uploadPath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public int getFileCount() { return fileCount; }
    public void setFileCount(int fileCount) { this.fileCount = fileCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
