package com.devmind.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body sent by the frontend when asking a question about a project.
 */
public class ChatRequest {

    @NotBlank(message = "Question must not be blank")
    private String question;

    public ChatRequest() {}

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
}
