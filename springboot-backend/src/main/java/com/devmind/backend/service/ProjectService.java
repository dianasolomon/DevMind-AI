package com.devmind.backend.service;

import com.devmind.backend.dto.FileEntryDTO;
import com.devmind.backend.dto.ProjectDTO;
import com.devmind.backend.model.Project;
import com.devmind.backend.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Core business logic for project management.
 *
 * Upload flow:
 *   1. Assign UUID project ID
 *   2. Extract ZIP → uploadPath
 *   3. Persist Project record (status=UPLOADED)
 *   4. Async: call FastAPI /index → update status to INDEXING, then READY/FAILED
 */
@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private final ZipExtractorService zipExtractorService;
    private final FastApiClient fastApiClient;

    public ProjectService(ProjectRepository projectRepository,
                          ZipExtractorService zipExtractorService,
                          FastApiClient fastApiClient) {
        this.projectRepository = projectRepository;
        this.zipExtractorService = zipExtractorService;
        this.fastApiClient = fastApiClient;
    }

    // -----------------------------------------------------------------------
    // Upload & Indexing
    // -----------------------------------------------------------------------

    /**
     * Saves an uploaded ZIP, extracts it, persists the project, and triggers
     * async indexing via FastAPI.
     */
    @Transactional
    public ProjectDTO uploadAndIndex(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String projectName = (originalName != null)
                ? originalName.replaceAll("\\.zip$", "")
                : "unnamed-project";

        String projectId = UUID.randomUUID().toString();
        log.info("Starting upload for project '{}' with ID {}", projectName, projectId);

        // Step 1: Extract ZIP
        String extractedPath = zipExtractorService.extractZip(file, projectId);
        int fileCount = zipExtractorService.countFiles(extractedPath);

        // Step 2: Persist with UPLOADED status
        Project project = Project.builder()
                .name(projectName)
                .projectId(projectId)
                .uploadPath(extractedPath)
                .status("UPLOADED")
                .fileCount(fileCount)
                .build();

        project = projectRepository.save(project);
        log.info("Project {} saved with {} files", projectId, fileCount);

        // Step 3: Trigger async indexing
        triggerIndexingAsync(project.getId(), projectId, extractedPath);

        return toDTO(project);
    }

    /**
     * Triggers FastAPI indexing in a virtual thread so upload returns immediately.
     */
    private void triggerIndexingAsync(Long dbId, String projectId, String extractedPath) {
        Thread.ofVirtual().name("indexing-" + projectId).start(() -> {
            try {
                updateStatus(dbId, "INDEXING", null);
                fastApiClient.triggerIndexing(projectId, extractedPath);
                updateStatus(dbId, "READY", null);
                log.info("Project {} successfully indexed", projectId);
            } catch (FastApiClient.FastApiException e) {
                log.error("Indexing failed for project {}: {}", projectId, e.getMessage());
                updateStatus(dbId, "FAILED", e.getMessage());
            }
        });
    }

    // -----------------------------------------------------------------------
    // CRUD
    // -----------------------------------------------------------------------

    /** Returns all projects, newest first. */
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(
                        p -> p.getCreatedAt() != null ? p.getCreatedAt() : java.time.LocalDateTime.MIN,
                        Comparator.reverseOrder()))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /** Returns a single project by its UUID string. */
    public ProjectDTO getProjectByProjectId(String projectId) {
        Project project = findOrThrow(projectId);
        return toDTO(project);
    }

    /** Deletes a project record and its extracted files from disk. */
    @Transactional
    public void deleteProject(String projectId) {
        Project project = findOrThrow(projectId);
        zipExtractorService.deleteProjectDirectory(project.getUploadPath());
        projectRepository.delete(project);
        log.info("Deleted project {}", projectId);
    }

    // -----------------------------------------------------------------------
    // File Listing
    // -----------------------------------------------------------------------

    /**
     * Returns a flat list of all file entries under the project's extraction directory.
     */
    public List<FileEntryDTO> listProjectFiles(String projectId) {
        Project project = findOrThrow(projectId);
        Path root = Paths.get(project.getUploadPath());

        if (!Files.exists(root)) {
            return List.of();
        }

        try (Stream<Path> stream = Files.walk(root)) {
            return stream
                    .filter(p -> !p.equals(root))
                    .map(p -> {
                        String relativePath = root.relativize(p).toString().replace("\\", "/");
                        boolean isDir = Files.isDirectory(p);
                        long size = 0;
                        if (!isDir) {
                            try { size = Files.size(p); } catch (IOException ignored) { }
                        }
                        String fname = p.getFileName().toString();
                        String ext = isDir ? "" : getExtension(fname);
                        return FileEntryDTO.builder()
                                .path(relativePath)
                                .name(fname)
                                .extension(ext)
                                .sizeBytes(size)
                                .isDirectory(isDir)
                                .build();
                    })
                    .sorted(Comparator.comparing(FileEntryDTO::getPath))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Error listing files for project {}: {}", projectId, e.getMessage());
            return List.of();
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private Project findOrThrow(String projectId) {
        return projectRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + projectId));
    }

    @Transactional
    protected void updateStatus(Long dbId, String status, String errorMessage) {
        projectRepository.findById(dbId).ifPresent(p -> {
            p.setStatus(status);
            p.setErrorMessage(errorMessage);
            projectRepository.save(p);
        });
    }

    private ProjectDTO toDTO(Project p) {
        return ProjectDTO.builder()
                .id(p.getId())
                .projectId(p.getProjectId())
                .name(p.getName())
                .status(p.getStatus())
                .errorMessage(p.getErrorMessage())
                .fileCount(p.getFileCount())
                .uploadPath(p.getUploadPath())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1) : "";
    }

    // -----------------------------------------------------------------------
    // Exceptions
    // -----------------------------------------------------------------------

    public static class ProjectNotFoundException extends RuntimeException {
        public ProjectNotFoundException(String message) {
            super(message);
        }
    }
}
