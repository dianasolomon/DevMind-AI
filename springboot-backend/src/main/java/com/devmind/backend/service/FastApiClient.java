package com.devmind.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * HTTP client that communicates with the FastAPI AI/RAG service (localhost:8000).
 *
 * FastAPI endpoints called:
 *   POST /index  – triggers code parsing + vector indexing
 *   POST /query  – sends a question, gets an AI answer back
 */
@Service
public class FastApiClient {

    private static final Logger log = LoggerFactory.getLogger(FastApiClient.class);

    private final RestTemplate restTemplate;

    @Value("${fastapi.base-url:http://localhost:8000}")
    private String fastApiBaseUrl;

    public FastApiClient() {
        this.restTemplate = new RestTemplate();
    }

    // -----------------------------------------------------------------------
    // Indexing
    // -----------------------------------------------------------------------

    /**
     * Tells FastAPI to index the code files in the given project directory.
     *
     * @param projectId     UUID of the project
     * @param projectPath   absolute path to the extracted project files
     * @throws FastApiException if FastAPI returns an error or is unreachable
     */
    public void triggerIndexing(String projectId, String projectPath) {
        String url = fastApiBaseUrl + "/index";
        Map<String, String> body = Map.of(
                "project_id", projectId,
                "project_path", projectPath
        );

        log.info("Calling FastAPI /index for project {}", projectId);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, buildJsonRequest(body), Map.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new FastApiException("FastAPI /index returned status: " + response.getStatusCode());
            }
            log.info("FastAPI indexing started for project {}", projectId);
        } catch (ResourceAccessException e) {
            throw new FastApiException("FastAPI service is unreachable at " + fastApiBaseUrl + ". " +
                    "Ensure Member 3's FastAPI server is running.", e);
        }
    }

    // -----------------------------------------------------------------------
    // Chat / Query
    // -----------------------------------------------------------------------

    /**
     * Sends a natural-language question to FastAPI and returns the AI's answer.
     *
     * @param projectId UUID of the project
     * @param question  the developer's question
     * @return the AI-generated answer string
     * @throws FastApiException if FastAPI returns an error or is unreachable
     */
    public String askQuestion(String projectId, String question) {
        String url = fastApiBaseUrl + "/query";
        Map<String, String> body = Map.of(
                "project_id", projectId,
                "question", question
        );

        log.info("Calling FastAPI /query for project {} with question: {}", projectId, question);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, buildJsonRequest(body), Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new FastApiException("FastAPI /query returned status: " + response.getStatusCode());
            }

            Object answer = response.getBody().get("answer");
            return answer != null ? answer.toString() : "No answer returned from AI service.";

        } catch (ResourceAccessException e) {
            throw new FastApiException("FastAPI service is unreachable at " + fastApiBaseUrl + ". " +
                    "Ensure Member 3's FastAPI server is running.", e);
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private <T> HttpEntity<T> buildJsonRequest(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    // -----------------------------------------------------------------------
    // Custom exception
    // -----------------------------------------------------------------------

    public static class FastApiException extends RuntimeException {
        public FastApiException(String message) {
            super(message);
        }
        public FastApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
