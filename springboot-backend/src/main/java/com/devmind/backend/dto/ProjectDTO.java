package com.devmind.backend.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object returned to the frontend for project information.
 */
public class ProjectDTO {
    private Long id;
    private String projectId;
    private String name;
    private String status;
    private String errorMessage;
    private int fileCount;
    private String uploadPath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProjectDTO() {}

    private ProjectDTO(Builder builder) {
        this.id = builder.id;
        this.projectId = builder.projectId;
        this.name = builder.name;
        this.status = builder.status;
        this.errorMessage = builder.errorMessage;
        this.fileCount = builder.fileCount;
        this.uploadPath = builder.uploadPath;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String projectId;
        private String name;
        private String status;
        private String errorMessage;
        private int fileCount;
        private String uploadPath;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder projectId(String projectId) { this.projectId = projectId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder errorMessage(String errorMessage) { this.errorMessage = errorMessage; return this; }
        public Builder fileCount(int fileCount) { this.fileCount = fileCount; return this; }
        public Builder uploadPath(String uploadPath) { this.uploadPath = uploadPath; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public ProjectDTO build() { return new ProjectDTO(this); }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public int getFileCount() { return fileCount; }
    public void setFileCount(int fileCount) { this.fileCount = fileCount; }
    public String getUploadPath() { return uploadPath; }
    public void setUploadPath(String uploadPath) { this.uploadPath = uploadPath; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
