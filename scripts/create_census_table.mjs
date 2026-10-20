import { getDb } from '../src/lib/db.js';

async function createTable() {
    const db = getDb();
    const sql = `
        CREATE TABLE IF NOT EXISTS \`estat_census\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`MunicipalityCode\` VARCHAR(5) NOT NULL,
          \`Prefecture\` VARCHAR(20) NOT NULL,
          \`Municipality\` VARCHAR(50) NOT NULL,
          \`TotalPopulation\` INT DEFAULT 0 COMMENT '総人口',
          \`MalePopulation\` INT DEFAULT 0 COMMENT '男性人口',
          \`FemalePopulation\` INT DEFAULT 0 COMMENT '女性人口',
          \`PopulationUnder15\` INT DEFAULT 0 COMMENT '15歳未満人口(年少人口)',
          \`Population15To64\` INT DEFAULT 0 COMMENT '15〜64歳人口(生産年齢人口)',
          \`PopulationOver65\` INT DEFAULT 0 COMMENT '65歳以上人口(老年人口)',
          \`ChildRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '年少人口比率(%)',
          \`WorkingRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '生産年齢人口比率(%)',
          \`AgingRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '高齢化率(%)',
          \`TotalHouseholds\` INT DEFAULT 0 COMMENT '一般世帯数',
          \`HouseholdMembers\` INT DEFAULT 0 COMMENT '一般世帯人員',
          \`AvgHouseholdSize\` DECIMAL(4,2) DEFAULT NULL COMMENT '1世帯当たり人員',
          \`OwnedHouseholds\` INT DEFAULT 0 COMMENT '持ち家世帯数',
          \`RentedHouseholds\` INT DEFAULT 0 COMMENT '借家世帯数(公社・民間等)',
          \`PublicRentedHouseholds\` INT DEFAULT 0 COMMENT '公営・UR等借家世帯数',
          \`PrivateRentedHouseholds\` INT DEFAULT 0 COMMENT '民営借家世帯数',
          \`OwnedRate\` DECIMAL(5,2) DEFAULT NULL COMMENT '持家率(%)',
          \`UpdatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`uk_muni\` (\`MunicipalityCode\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国勢調査 自治体別統計データ';
    `;
    await db.query(sql);
    console.log('Table estat_census created successfully.');
    process.exit(0);
}

createTable().catch(err => {
    console.error('Failed to create table:', err);
    process.exit(1);
});
