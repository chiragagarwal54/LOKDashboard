CREATE TABLE IF NOT EXISTS land (
    land_id IDENTITY PRIMARY KEY,
    owner VARCHAR(255),
    last_updated DATE
);

CREATE TABLE IF NOT EXISTS contribution (
    kingdom_id VARCHAR(255),
    total_points DOUBLE,
    contribution_date DATE,
    continent INT,
    kingdom_name VARCHAR(255),
    land_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS batch_job_status (
    id IDENTITY PRIMARY KEY, 
    job_date DATE NOT NULL,
    execution_time TIMESTAMP NOT NULL, 
    status VARCHAR(20) NOT NULL, 
    message VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS bad_land (
    land_id VARCHAR(255) PRIMARY KEY,
    discovered_at TIMESTAMP NOT NULL
);

-- Table to track unique visitors
CREATE TABLE IF NOT EXISTS visitor_log (
    id IDENTITY PRIMARY KEY,
    ip_address VARCHAR(50) NOT NULL,
    user_agent VARCHAR(500),
    first_visit_time TIMESTAMP NOT NULL,
    last_visit_time TIMESTAMP NOT NULL,
    visit_count INT DEFAULT 1
);

-- Table to track user activities
CREATE TABLE IF NOT EXISTS activity_log (
    id IDENTITY PRIMARY KEY,
    visitor_id BIGINT,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    status_code INT,
    FOREIGN KEY (visitor_id) REFERENCES visitor_log(id)
);