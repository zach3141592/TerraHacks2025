import initSqlJs from 'sql.js';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Load existing database from localStorage or create new one
      const savedDb = localStorage.getItem('dailyscan_db');
      if (savedDb) {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uint8Array);
      } else {
        this.db = new SQL.Database();
        this.createTables();
      }

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  createTables() {
    const createScansTable = `
      CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        condition_type TEXT NOT NULL,
        photo_data TEXT NOT NULL,
        observations TEXT,
        timeline TEXT,
        recommendations TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_timestamp ON scans(timestamp);
      CREATE INDEX IF NOT EXISTS idx_condition_type ON scans(condition_type);
    `;

    this.db.exec(createScansTable);
    this.db.exec(createIndexes);
    this.saveToLocalStorage();
  }

  async saveScan(scanData) {
    if (!this.isInitialized) await this.initialize();

    const {
      conditionType,
      photoData,
      analysisResult
    } = scanData;

    const timestamp = Date.now();
    const observations = analysisResult?.abnormalities || '';
    const timeline = analysisResult?.timeline || '';
    const recommendations = analysisResult?.tips || '';

    const stmt = this.db.prepare(`
      INSERT INTO scans (timestamp, condition_type, photo_data, observations, timeline, recommendations)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run([
        timestamp,
        conditionType,
        photoData,
        observations,
        timeline,
        recommendations
      ]);
      stmt.free();
      this.saveToLocalStorage();
      
      return { success: true, id: this.db.exec("SELECT last_insert_rowid()")[0].values[0][0] };
    } catch (error) {
      stmt.free();
      console.error('Failed to save scan:', error);
      return { success: false, error };
    }
  }

  async getRecentScans(limit = 10) {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        SELECT id, timestamp, condition_type, observations, timeline, recommendations, created_at
        FROM scans 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      
      const result = stmt.get([limit]);
      stmt.free();

      const scans = [];
      if (result) {
        const rows = this.db.exec(`
          SELECT id, timestamp, condition_type, observations, timeline, recommendations, created_at
          FROM scans 
          ORDER BY timestamp DESC 
          LIMIT ${limit}
        `);

        if (rows.length > 0) {
          const columns = rows[0].columns;
          const values = rows[0].values;
          
          scans.push(...values.map(row => {
            const scan = {};
            columns.forEach((col, index) => {
              scan[col] = row[index];
            });
            return {
              ...scan,
              date: new Date(scan.timestamp),
              conditionLabel: this.getConditionLabel(scan.condition_type)
            };
          }));
        }
      }

      return scans;
    } catch (error) {
      console.error('Failed to get recent scans:', error);
      return [];
    }
  }

  async getScanById(id) {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM scans WHERE id = ?
      `);
      
      const result = stmt.get([id]);
      stmt.free();

      if (result) {
        const rows = this.db.exec(`SELECT * FROM scans WHERE id = ${id}`);
        if (rows.length > 0 && rows[0].values.length > 0) {
          const columns = rows[0].columns;
          const row = rows[0].values[0];
          const scan = {};
          columns.forEach((col, index) => {
            scan[col] = row[index];
          });
          return {
            ...scan,
            date: new Date(scan.timestamp),
            conditionLabel: this.getConditionLabel(scan.condition_type)
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get scan by ID:', error);
      return null;
    }
  }

  async deleteScan(id) {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`DELETE FROM scans WHERE id = ?`);
      stmt.run([id]);
      stmt.free();
      this.saveToLocalStorage();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete scan:', error);
      return { success: false, error };
    }
  }

  async getScansCount() {
    if (!this.isInitialized) await this.initialize();

    try {
      const result = this.db.exec("SELECT COUNT(*) as count FROM scans");
      return result.length > 0 ? result[0].values[0][0] : 0;
    } catch (error) {
      console.error('Failed to get scans count:', error);
      return 0;
    }
  }

  getConditionLabel(conditionType) {
    const conditions = {
      'cut': 'Cut/Wound',
      'bruise': 'Bruise',
      'mole': 'Mole',
      'hives': 'Hives',
      'phlegm': 'Phlegm'
    };
    return conditions[conditionType] || conditionType;
  }

  saveToLocalStorage() {
    if (this.db) {
      try {
        const data = this.db.export();
        localStorage.setItem('dailyscan_db', JSON.stringify(Array.from(data)));
      } catch (error) {
        console.error('Failed to save database to localStorage:', error);
      }
    }
  }

  async clearAllData() {
    if (!this.isInitialized) await this.initialize();

    try {
      this.db.exec("DELETE FROM scans");
      this.saveToLocalStorage();
      return { success: true };
    } catch (error) {
      console.error('Failed to clear data:', error);
      return { success: false, error };
    }
  }
}

// Create and export a singleton instance
const databaseService = new DatabaseService();
export default databaseService;