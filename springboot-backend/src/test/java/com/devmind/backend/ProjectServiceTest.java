package com.devmind.backend;

import com.devmind.backend.model.Project;
import com.devmind.backend.repository.ProjectRepository;
import com.devmind.backend.service.FastApiClient;
import com.devmind.backend.service.ProjectService;
import com.devmind.backend.service.ZipExtractorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProjectService – no Spring context, fast execution.
 */
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ZipExtractorService zipExtractorService;

    @Mock
    private FastApiClient fastApiClient;

    @InjectMocks
    private ProjectService projectService;

    private Project sampleProject;

    @BeforeEach
    void setUp() {
        sampleProject = Project.builder()
                .id(1L)
                .projectId("test-uuid-1234")
                .name("sample-project")
                .uploadPath("/uploads/test-uuid-1234")
                .status("READY")
                .fileCount(10)
                .build();
    }

    // ------------------------------------------------------------------
    // getAllProjects
    // ------------------------------------------------------------------

    @Test
    void getAllProjects_returnsEmptyList_whenNoProjects() {
        when(projectRepository.findAll()).thenReturn(List.of());
        assertThat(projectService.getAllProjects()).isEmpty();
    }

    @Test
    void getAllProjects_returnsMappedDTOs() {
        when(projectRepository.findAll()).thenReturn(List.of(sampleProject));
        var result = projectService.getAllProjects();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProjectId()).isEqualTo("test-uuid-1234");
        assertThat(result.get(0).getName()).isEqualTo("sample-project");
    }

    // ------------------------------------------------------------------
    // getProjectByProjectId
    // ------------------------------------------------------------------

    @Test
    void getProjectByProjectId_returnsDTO_whenFound() {
        when(projectRepository.findByProjectId("test-uuid-1234"))
                .thenReturn(Optional.of(sampleProject));

        var dto = projectService.getProjectByProjectId("test-uuid-1234");
        assertThat(dto.getStatus()).isEqualTo("READY");
        assertThat(dto.getFileCount()).isEqualTo(10);
    }

    @Test
    void getProjectByProjectId_throws_whenNotFound() {
        when(projectRepository.findByProjectId("missing-id"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getProjectByProjectId("missing-id"))
                .isInstanceOf(ProjectService.ProjectNotFoundException.class)
                .hasMessageContaining("missing-id");
    }

    // ------------------------------------------------------------------
    // deleteProject
    // ------------------------------------------------------------------

    @Test
    void deleteProject_deletesFromRepoAndDisk() {
        when(projectRepository.findByProjectId("test-uuid-1234"))
                .thenReturn(Optional.of(sampleProject));
        doNothing().when(zipExtractorService).deleteProjectDirectory(any());
        doNothing().when(projectRepository).delete(any());

        projectService.deleteProject("test-uuid-1234");

        verify(zipExtractorService).deleteProjectDirectory("/uploads/test-uuid-1234");
        verify(projectRepository).delete(sampleProject);
    }

    @Test
    void deleteProject_throws_whenProjectNotFound() {
        when(projectRepository.findByProjectId("ghost-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.deleteProject("ghost-id"))
                .isInstanceOf(ProjectService.ProjectNotFoundException.class);
    }
}
