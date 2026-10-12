package com.devmind.backend.dto;

import java.util.List;

/**
 * Response body returned to the frontend after an AI chat query.
 */
public class ChatResponse {
    private String projectId;
    private String question;
    private String answer;
    private List<String> sources;

    public ChatResponse() {}

    private ChatResponse(Builder builder) {
        this.projectId = builder.projectId;
        this.question = builder.question;
        this.answer = builder.answer;
        this.sources = builder.sources;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String projectId;
        private String question;
        private String answer;
        private List<String> sources;

        public Builder projectId(String projectId) { this.projectId = projectId; return this; }
        public Builder question(String question) { this.question = question; return this; }
        public Builder answer(String answer) { this.answer = answer; return this; }
        public Builder sources(List<String> sources) { this.sources = sources; return this; }
        public ChatResponse build() { return new ChatResponse(this); }
    }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public List<String> getSources() { return sources; }
    public void setSources(List<String> sources) { this.sources = sources; }
}
