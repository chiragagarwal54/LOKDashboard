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