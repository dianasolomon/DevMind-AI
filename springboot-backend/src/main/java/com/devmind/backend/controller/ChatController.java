package com.devmind.backend.controller;

import com.devmind.backend.dto.ChatRequest;
import com.devmind.backend.dto.ChatResponse;
import com.devmind.backend.model.Project;
import com.devmind.backend.repository.ProjectRepository;
import com.devmind.backend.service.FastApiClient;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for AI chat functionality.
 *
 * POST /api/projects/{projectId}/chat
 *
 * Proxies questions from the frontend to FastAPI and returns the AI answer.
 */
@RestController
@RequestMapping("/api/projects")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ProjectRepository projectRepository;
    private final FastApiClient fastApiClient;

    public ChatController(ProjectRepository projectRepository, FastApiClient fastApiClient) {
        this.projectRepository = projectRepository;
        this.fastApiClient = fastApiClient;
    }

    // ------------------------------------------------------------------
    // POST /api/projects/{projectId}/chat
    // ------------------------------------------------------------------

    /**
     * Sends a developer's question to the FastAPI RAG pipeline and returns the answer.
     *
     * Request body: { "question": "What does the AuthService do?" }
     */
    @PostMapping("/{projectId}/chat")
    public ResponseEntity<?> chat(
            @PathVariable String projectId,
            @Valid @RequestBody ChatRequest request) {

        log.info("Chat request for project {} — question: {}", projectId, request.getQuestion());

        // Look up the project
        Project project = projectRepository.findByProjectId(projectId).orElse(null);
        if (project == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Project not found: " + projectId));
        }

        // Guard: only allow chat if the project is fully indexed
        if (!"READY".equals(project.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error", "Project is not ready for queries",
                            "currentStatus", project.getStatus(),
                            "hint", "Wait for status=READY before asking questions"
                    ));
        }

        try {
            String answer = fastApiClient.askQuestion(projectId, request.getQuestion());

            ChatResponse response = ChatResponse.builder()
                    .projectId(projectId)
                    .question(request.getQuestion())
                    .answer(answer)
                    .sources(List.of())
                    .build();

            return ResponseEntity.ok(response);

        } catch (FastApiClient.FastApiException e) {
            log.error("FastAPI error for project {}: {}", projectId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "AI service unavailable",
                            "detail", e.getMessage()
                    ));
        }
    }
}
