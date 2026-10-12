package com.devmind.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Handles saving an uploaded ZIP file to disk and extracting its contents
 * into a dedicated project directory.
 */
@Service
public class ZipExtractorService {

    private static final Logger log = LoggerFactory.getLogger(ZipExtractorService.class);

    @Value("${upload.dir:./uploads}")
    private String uploadBaseDir;

    /** Maximum allowed uncompressed size (200 MB) to guard against zip-bombs. */
    private static final long MAX_UNCOMPRESSED_SIZE = 200L * 1024 * 1024;

    /** Maximum number of entries in a ZIP (basic zip-bomb guard). */
    private static final int MAX_ENTRIES = 10_000;

    /**
     * Saves and extracts the uploaded ZIP file into
     * {@code <uploadBaseDir>/<projectId>/}.
     *
     * @param file      the uploaded multipart ZIP file
     * @param projectId the UUID string for this project
     * @return the absolute path of the extraction directory
     * @throws IOException if extraction fails or security limits are exceeded
     */
    public String extractZip(MultipartFile file, String projectId) throws IOException {
        Path targetDir = Paths.get(uploadBaseDir, projectId).toAbsolutePath().normalize();
        Files.createDirectories(targetDir);
        log.info("Extracting ZIP for project {} into {}", projectId, targetDir);

        long totalSize = 0;
        int entryCount = 0;

        try (InputStream is = file.getInputStream();
             ZipInputStream zis = new ZipInputStream(is)) {

            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entryCount++;
                if (entryCount > MAX_ENTRIES) {
                    throw new IOException("ZIP contains too many entries (> " + MAX_ENTRIES + ")");
                }

                Path entryPath = resolveEntryPath(targetDir, entry.getName());

                if (entry.isDirectory()) {
                    Files.createDirectories(entryPath);
                } else {
                    Files.createDirectories(entryPath.getParent());
                    totalSize += Files.copy(zis, entryPath, StandardCopyOption.REPLACE_EXISTING);

                    if (totalSize > MAX_UNCOMPRESSED_SIZE) {
                        throw new IOException("Uncompressed ZIP size exceeds 200 MB limit");
                    }
                }
                zis.closeEntry();
            }
        }

        log.info("Extracted {} entries ({} bytes) for project {}", entryCount, totalSize, projectId);
        return targetDir.toString();
    }

    /**
     * Counts the number of regular files in the extraction directory.
     */
    public int countFiles(String extractedPath) {
        try {
            return (int) Files.walk(Paths.get(extractedPath))
                    .filter(Files::isRegularFile)
                    .count();
        } catch (IOException e) {
            log.warn("Could not count files in {}: {}", extractedPath, e.getMessage());
            return 0;
        }
    }

    /**
     * Deletes the extraction directory for a project (on project deletion).
     */
    public void deleteProjectDirectory(String extractedPath) {
        try {
            Path dir = Paths.get(extractedPath);
            if (Files.exists(dir)) {
                deleteRecursively(dir.toFile());
                log.info("Deleted project directory: {}", extractedPath);
            }
        } catch (Exception e) {
            log.warn("Could not delete project directory {}: {}", extractedPath, e.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Resolves a ZIP entry name to a real path, guarding against path traversal
     * (zip-slip vulnerability).
     */
    private Path resolveEntryPath(Path targetDir, String entryName) throws IOException {
        Path resolved = targetDir.resolve(entryName).normalize();
        if (!resolved.startsWith(targetDir)) {
            throw new IOException("ZIP path traversal attempt detected: " + entryName);
        }
        return resolved;
    }

    private void deleteRecursively(File file) {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursively(child);
                }
            }
        }
        file.delete();
    }
}
