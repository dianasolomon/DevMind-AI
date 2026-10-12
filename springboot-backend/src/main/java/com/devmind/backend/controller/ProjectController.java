package com.devmind.backend.controller;

import com.devmind.backend.dto.FileEntryDTO;
import com.devmind.backend.dto.ProjectDTO;
import com.devmind.backend.service.ProjectService;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * REST controller for project management.
 *
 * Base path: /api/projects
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private static final Logger log = LoggerFactory.getLogger(ProjectController.class);

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // ------------------------------------------------------------------
    // POST /api/projects/upload
    // ------------------------------------------------------------------

    /**
     * Accepts a ZIP file upload from the frontend.
     * Multipart form field name: "file"
     * Response: 201 Created with ProjectDTO
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadProject(@RequestParam("file") MultipartFile file) {
        log.info("Received upload: filename={}, size={} bytes",
                file.getOriginalFilename(), file.getSize());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Uploaded file is empty"));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".zip")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only ZIP files are accepted"));
        }

        try {
            ProjectDTO created = projectService.uploadAndIndex(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IOException e) {
            log.error("Failed to process upload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process ZIP: " + e.getMessage()));
        }
    }

    // ------------------------------------------------------------------
    // GET /api/projects
    // ------------------------------------------------------------------

    /** Returns all projects sorted by creation time (newest first). */
    @GetMapping
    public ResponseEntity<List<ProjectDTO>> listProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    // ------------------------------------------------------------------
    // GET /api/projects/{projectId}
    // ------------------------------------------------------------------

    /** Returns details for a single project including its current status. */
    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProject(@PathVariable String projectId) {
        try {
            return ResponseEntity.ok(projectService.getProjectByProjectId(projectId));
        } catch (ProjectService.ProjectNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ------------------------------------------------------------------
    // DELETE /api/projects/{projectId}
    // ------------------------------------------------------------------

    /** Deletes a project and removes its extracted files from disk. */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable String projectId) {
        try {
            projectService.deleteProject(projectId);
            return ResponseEntity.ok(Map.of("message", "Project deleted successfully", "projectId", projectId));
        } catch (ProjectService.ProjectNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ------------------------------------------------------------------
    // GET /api/projects/{projectId}/files
    // ------------------------------------------------------------------

    /**
     * Returns a flat list of all files/directories in the project's extraction folder.
     * The frontend can use this to build a file tree explorer.
     */
    @GetMapping("/{projectId}/files")
    public ResponseEntity<?> listFiles(@PathVariable String projectId) {
        try {
            List<FileEntryDTO> files = projectService.listProjectFiles(projectId);
            return ResponseEntity.ok(Map.of(
                    "projectId", projectId,
                    "totalEntries", files.size(),
                    "files", files
            ));
        } catch (ProjectService.ProjectNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
