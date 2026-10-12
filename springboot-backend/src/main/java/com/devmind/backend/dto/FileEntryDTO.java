package com.devmind.backend.dto;

/**
 * Represents a single file entry in a project's file tree.
 */
public class FileEntryDTO {
    private String path;
    private String name;
    private String extension;
    private long sizeBytes;
    private boolean directory;

    public FileEntryDTO() {}

    private FileEntryDTO(Builder builder) {
        this.path = builder.path;
        this.name = builder.name;
        this.extension = builder.extension;
        this.sizeBytes = builder.sizeBytes;
        this.directory = builder.directory;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String path;
        private String name;
        private String extension;
        private long sizeBytes;
        private boolean directory;

        public Builder path(String path) { this.path = path; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder extension(String extension) { this.extension = extension; return this; }
        public Builder sizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; return this; }
        public Builder isDirectory(boolean directory) { this.directory = directory; return this; }
        public FileEntryDTO build() { return new FileEntryDTO(this); }
    }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }
    public boolean isDirectory() { return directory; }
    public void setDirectory(boolean directory) { this.directory = directory; }
}
