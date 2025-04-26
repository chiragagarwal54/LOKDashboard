package com.lokdashboard.dashboard.repository;

import com.lokdashboard.dashboard.models.BadLand;
import com.lokdashboard.dashboard.models.BatchJobStatus;
import lombok.AllArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Repository
@AllArgsConstructor
public class BatchJobRepository {

    private final JdbcTemplate jdbcTemplate;

    public void saveBatchJobStatus(BatchJobStatus status) {
        jdbcTemplate.update(
            "INSERT INTO batch_job_status (job_date, execution_time, status, message) VALUES (?, ?, ?, ?)",
            status.getDate(), status.getExecutionTime(), status.getStatus(), status.getMessage()
        );
    }

    public BatchJobStatus getLatestBatchJobStatusForDate(LocalDate date) {
        List<BatchJobStatus> results = jdbcTemplate.query(
            "SELECT job_date, execution_time, status, message FROM batch_job_status " +
            "WHERE job_date = ? ORDER BY execution_time DESC LIMIT 1",
            (rs, rowNum) -> new BatchJobStatus(
                rs.getDate("job_date").toLocalDate(),
                rs.getTimestamp("execution_time").toLocalDateTime(),
                rs.getString("status"),
                rs.getString("message")
            ),
            date
        );
        
        return results.isEmpty() ? null : results.get(0);
    }

    public void saveBadLand(BadLand badLand) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM bad_land WHERE land_id = ?", 
            Integer.class, 
            badLand.getLandId()
        );
        
        if (count == 0) {
            jdbcTemplate.update(
                "INSERT INTO bad_land (land_id, discovered_at) VALUES (?, ?)",
                badLand.getLandId(), badLand.getDiscoveredAt()
            );
        }
    }

    public List<String> getAllBadLandIds() {
        return jdbcTemplate.queryForList("SELECT land_id FROM bad_land", String.class);
    }

    public boolean isBadLand(String landId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM bad_land WHERE land_id = ?", 
            Integer.class, 
            landId
        );
        return count > 0;
    }
} 