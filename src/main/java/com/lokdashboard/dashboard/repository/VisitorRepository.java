package com.lokdashboard.dashboard.repository;

import com.lokdashboard.dashboard.models.ActivityLog;
import com.lokdashboard.dashboard.models.VisitorLog;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Repository
@AllArgsConstructor
@Slf4j
public class VisitorRepository {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Get visitor by IP address
     */
    public VisitorLog findByIpAddress(String ipAddress) {
        List<VisitorLog> results = jdbcTemplate.query(
            "SELECT id, ip_address, user_agent, first_visit_time, last_visit_time, visit_count " +
            "FROM visitor_log WHERE ip_address = ?",
            (rs, rowNum) -> VisitorLog.builder()
                .id(rs.getLong("id"))
                .ipAddress(rs.getString("ip_address"))
                .userAgent(rs.getString("user_agent"))
                .firstVisitTime(rs.getTimestamp("first_visit_time").toLocalDateTime())
                .lastVisitTime(rs.getTimestamp("last_visit_time").toLocalDateTime())
                .visitCount(rs.getInt("visit_count"))
                .build(),
            ipAddress
        );
        
        return results.isEmpty() ? null : results.get(0);
    }

    /**
     * Save a new visitor
     */
    public VisitorLog saveVisitor(VisitorLog visitor) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO visitor_log (ip_address, user_agent, first_visit_time, last_visit_time, visit_count) " +
                "VALUES (?, ?, ?, ?, ?)",
                new String[] {"id"}
            );
            ps.setString(1, visitor.getIpAddress());
            ps.setString(2, visitor.getUserAgent());
            ps.setTimestamp(3, Timestamp.valueOf(visitor.getFirstVisitTime()));
            ps.setTimestamp(4, Timestamp.valueOf(visitor.getLastVisitTime()));
            ps.setInt(5, visitor.getVisitCount());
            return ps;
        }, keyHolder);
        
        visitor.setId(Objects.requireNonNull(keyHolder.getKey()).longValue());
        return visitor;
    }

    /**
     * Update an existing visitor's last visit time and count
     */
    public void updateVisitor(VisitorLog visitor) {
        jdbcTemplate.update(
            "UPDATE visitor_log SET last_visit_time = ?, visit_count = ? WHERE id = ?",
            Timestamp.valueOf(visitor.getLastVisitTime()),
            visitor.getVisitCount(),
            visitor.getId()
        );
    }

    /**
     * Save activity log
     */
    public void saveActivity(ActivityLog activity) {
        jdbcTemplate.update(
            "INSERT INTO activity_log (visitor_id, endpoint, method, timestamp, status_code) VALUES (?, ?, ?, ?, ?)",
            activity.getVisitorId(),
            activity.getEndpoint(),
            activity.getMethod(),
            Timestamp.valueOf(activity.getTimestamp()),
            activity.getStatusCode()
        );
    }

    /**
     * Get total visitor count
     */
    public int getTotalVisitorCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM visitor_log", Integer.class);
    }

    /**
     * Get visitor count for today
     */
    public int getTodayVisitorCount() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM visitor_log WHERE last_visit_time >= ?", 
            Integer.class,
            Timestamp.valueOf(startOfDay)
        );
    }

    /**
     * Get total activity count
     */
    public int getTotalActivityCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM activity_log", Integer.class);
    }

    /**
     * Get activity count for today
     */
    public int getTodayActivityCount() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM activity_log WHERE timestamp >= ?", 
            Integer.class,
            Timestamp.valueOf(startOfDay)
        );
    }
    
    /**
     * Get activity count by endpoint
     */
    public List<Map<String, Object>> getActivityCountByEndpoint() {
        return jdbcTemplate.queryForList(
            "SELECT endpoint, COUNT(*) as count FROM activity_log GROUP BY endpoint ORDER BY count DESC"
        );
    }
} 