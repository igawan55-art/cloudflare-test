import { getDb } from '../src/lib/db.js';

async function createDistrictTable() {
    const db = getDb();
    const sql = `
        CREATE TABLE IF NOT EXISTS \`estat_census_district\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`MunicipalityCode\` VARCHAR(5) NOT NULL COMMENT '市区町村コード (13224)',
          \`DistrictCode\` VARCHAR(9) NOT NULL COMMENT '町字コード (132240210)',
          \`Prefecture\` VARCHAR(20) NOT NULL COMMENT '都道府県 (東京都)',
          \`Municipality\` VARCHAR(50) NOT NULL COMMENT '市区町村 (多摩市)',
          \`DistrictName\` VARCHAR(100) NOT NULL COMMENT '町字名 (連光寺)',
          \`EstatAreaCode\` VARCHAR(15) NOT NULL COMMENT 'e-Stat小地域コード (132240022)',
          \`TotalPopulation\` INT DEFAULT 0 COMMENT '総人口',
          \`MalePopulation\` INT DEFAULT 0 COMMENT '男性人口',
          \`FemalePopulation\` INT DEFAULT 0 COMMENT '女性人口',
          \`TotalHouseholds\` INT DEFAULT 0 COMMENT '総世帯数',
          \`AvgHouseholdSize\` DECIMAL(4,2) DEFAULT NULL COMMENT '1世帯当たり人員',
          \`PopulationUnder15\` INT DEFAULT 0 COMMENT '15歳未満人口(年少人口)',
          \`Population15To64\` INT DEFAULT 0 COMMENT '15〜64歳人口(生産年齢人口)',
          \`PopulationOver65\` INT DEFAULT 0 COMMENT '65歳以上人口(老年人口)',
          \`ChildRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '年少人口比率(%)',
          \`WorkingRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '生産年齢人口比率(%)',
          \`AgingRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '高齢化率(%)',
          \`OwnedHouseholds\` INT DEFAULT 0 COMMENT '持ち家世帯数',
          \`RentedHouseholds\` INT DEFAULT 0 COMMENT '借家世帯数(民営借家等)',
          \`OwnedRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '持家率(%)',
          \`DetachedHouseholds\` INT DEFAULT 0 COMMENT '一戸建て世帯数',
          \`ApartmentHouseholds\` INT DEFAULT 0 COMMENT '共同住宅(マンション・アパート)世帯数',
          \`DetachedRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '一戸建て比率(%)',
          \`UpdatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`uk_muni_dist\` (\`MunicipalityCode\`, \`DistrictCode\`),
          KEY \`idx_muni_name\` (\`MunicipalityCode\`, \`DistrictName\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国勢調査 町字（地区）別統計データ';
    `;
    await db.query(sql);
    console.log('Table estat_census_district created successfully.');
    process.exit(0);
}

createDistrictTable().catch(err => {
    console.error('Failed to create table:', err);
    process.exit(1);
});
