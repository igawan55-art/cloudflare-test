CREATE DATABASE IF NOT EXISTS realestate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE realestate_db;

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    \`Year\` VARCHAR(4) COMMENT '取得した対象年',
    Type VARCHAR(255),
    Region VARCHAR(255),
    MunicipalityCode VARCHAR(50),
    Prefecture VARCHAR(100),
    Municipality VARCHAR(100),
    DistrictName VARCHAR(255),
    Station VARCHAR(255) COMMENT '最寄駅（アプリのフィルタリングに必須なため独自追加）',
    TradePrice VARCHAR(255),
    PricePerUnit VARCHAR(255),
    FloorPlan VARCHAR(100),
    Area VARCHAR(100),
    UnitPrice VARCHAR(255),
    LandShape VARCHAR(100),
    Frontage VARCHAR(100),
    TotalFloorArea VARCHAR(100),
    BuildingYear VARCHAR(100),
    Structure VARCHAR(255),
    `Use` VARCHAR(255),
    Purpose VARCHAR(255),
    Direction VARCHAR(100),
    Classification VARCHAR(100),
    Breadth VARCHAR(50),
    CityPlanning VARCHAR(255),
    CoverageRatio VARCHAR(50),
    FloorAreaRatio VARCHAR(50),
    Period VARCHAR(100),
    Renovation VARCHAR(100),
    Remarks TEXT,
    PriceCategory VARCHAR(100),
    DistrictCode VARCHAR(50),
    
    -- 高速検索用のインデックス
    INDEX idx_municipality (MunicipalityCode),
    INDEX idx_station (Station),
    INDEX idx_type (Type),
    INDEX idx_period (Period)
);
