/**
 * ============================================================
 * db.js — Public MySQL Connection Simulation
 * Firearm Registry System v1.0.4
 * ============================================================
 * This class simulates a MySQL database using localStorage
 * as the persistence layer (mirrors a public MySQL class pattern).
 * In a real deployment, replace fetch/localStorage logic with
 * actual MySQL queries via a PHP/Node.js backend.
 * ============================================================
 */

class MySQLConnection {
  /**
   * Public static instance (Singleton pattern)
   */
  static instance = null;

  /**
   * Database name (equivalent to MySQL database name)
   */
  static DATABASE_NAME = "firearm_registry_db";

  /**
   * Tables (equivalent to MySQL tables stored in localStorage)
   */
  static TABLES = {
    USERS: "tbl_users",
    INVENTORY: "tbl_inventory",
    SALES: "tbl_sales",
    BORROWING: "tbl_borrowing",
    INVENTORY_COUNT: "tbl_inventory_count",
    RECOVERY_TOKENS: "tbl_recovery_tokens",
  };

  /**
   * Public constructor — initializes the connection
   */
  constructor() {
    this.dbName = MySQLConnection.DATABASE_NAME;
    this.connected = false;
    this._connect();
  }

  /**
   * Public static method to get singleton instance
   * (mirrors: public static MySQLConnection getInstance())
   */
  static getInstance() {
    if (!MySQLConnection.instance) {
      MySQLConnection.instance = new MySQLConnection();
    }
    return MySQLConnection.instance;
  }

  /**
   * Private connection method — initializes tables if not exist
   */
  _connect() {
    const tables = Object.values(MySQLConnection.TABLES);
    tables.forEach((table) => {
      if (!localStorage.getItem(`${this.dbName}_${table}`)) {
        localStorage.setItem(`${this.dbName}_${table}`, JSON.stringify([]));
      }
    });
    this.connected = true;
    console.log(`[MySQLConnection] Connected to database: ${this.dbName}`);
  }

  /**
   * Public method: SELECT * FROM table (with optional WHERE)
   * @param {string} table
   * @param {object} where — key/value pairs to filter
   * @returns {Array}
   */
  select(table, where = null) {
    const key = `${this.dbName}_${table}`;
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    if (!where) return rows;
    return rows.filter((row) =>
      Object.keys(where).every((k) => row[k] === where[k])
    );
  }

  /**
   * Public method: INSERT INTO table VALUES(data)
   * @param {string} table
   * @param {object} data
   * @returns {object} inserted row with auto-increment id
   */
  insert(table, data) {
    const key = `${this.dbName}_${table}`;
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    const newId =
      rows.length > 0 ? Math.max(...rows.map((r) => r.id || 0)) + 1 : 1;
    const newRow = { id: newId, ...data };
    rows.push(newRow);
    localStorage.setItem(key, JSON.stringify(rows));
    console.log(`[MySQLConnection] INSERT INTO ${table}`, newRow);
    return newRow;
  }

  /**
   * Public method: UPDATE table SET data WHERE where
   * @param {string} table
   * @param {object} data — fields to update
   * @param {object} where — condition
   * @returns {boolean}
   */
  update(table, data, where) {
    const key = `${this.dbName}_${table}`;
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    let updated = false;
    const newRows = rows.map((row) => {
      const match = Object.keys(where).every((k) => row[k] === where[k]);
      if (match) {
        updated = true;
        return { ...row, ...data };
      }
      return row;
    });
    localStorage.setItem(key, JSON.stringify(newRows));
    console.log(`[MySQLConnection] UPDATE ${table} SET`, data, "WHERE", where);
    return updated;
  }

  /**
   * Public method: DELETE FROM table WHERE where
   * @param {string} table
   * @param {object} where
   * @returns {boolean}
   */
  delete(table, where) {
    const key = `${this.dbName}_${table}`;
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    const filtered = rows.filter(
      (row) => !Object.keys(where).every((k) => row[k] === where[k])
    );
    localStorage.setItem(key, JSON.stringify(filtered));
    console.log(`[MySQLConnection] DELETE FROM ${table} WHERE`, where);
    return filtered.length !== rows.length;
  }

  /**
   * Public method: Seed initial data from users.json
   * Call once on first load to populate tbl_users
   */
  async seedFromJSON(jsonPath) {
    try {
      const res = await fetch(jsonPath);
      const users = await res.json();
      const existing = this.select(MySQLConnection.TABLES.USERS);
      if (existing.length === 0) {
        const key = `${this.dbName}_${MySQLConnection.TABLES.USERS}`;
        localStorage.setItem(key, JSON.stringify(users));
        console.log(`[MySQLConnection] Seeded ${users.length} users from JSON`);
      }
    } catch (e) {
      console.warn("[MySQLConnection] Could not seed from JSON:", e);
      // Fallback seed
      const existing = this.select(MySQLConnection.TABLES.USERS);
      if (existing.length === 0) {
        const defaultUsers = [
          {
            id: 1,
            username: "admin",
            password: "admin123",
            email: "admin@firearmsregistry.gov",
            fullName: "System Administrator",
            role: "Admin",
            status: "Active",
            createdAt: "2025-01-01",
            avatar: "SA",
          },
          {
            id: 2,
            username: "jdoe",
            password: "pass1234",
            email: "jdoe@firearmsregistry.gov",
            fullName: "John Doe",
            role: "Officer",
            status: "Active",
            createdAt: "2025-03-15",
            avatar: "JD",
          },
          {
            id: 3,
            username: "mcruz",
            password: "maria456",
            email: "mcruz@firearmsregistry.gov",
            fullName: "Maria Cruz",
            role: "Staff",
            status: "Inactive",
            createdAt: "2025-04-10",
            avatar: "MC",
          },
        ];
        const key = `${this.dbName}_${MySQLConnection.TABLES.USERS}`;
        localStorage.setItem(key, JSON.stringify(defaultUsers));
        console.log(`[MySQLConnection] Seeded default users`);
      }
    }
  }

  /**
   * Public method: Seed demo inventory and transaction records
   * (Sales, Borrowing, Inventory Count — integrated with Activity 5 users)
   */
  seedDemoData() {
    const T = MySQLConnection.TABLES;

    if (this.select(T.INVENTORY).length === 0) {
      const inventory = [
        { serial: "GLK-1001", model: "G17 Gen5", caliber: "9mm", status: "Sold", price: 550.0 },
        { serial: "SW-2002", model: "M&P9 Shield", caliber: "9mm", status: "Reserved", price: 450.0 },
        { serial: "SIG-3003", model: "P320 Compact", caliber: "9mm", status: "Available", price: 680.0 },
        { serial: "REM-4004", model: "870 Express", caliber: "12ga", status: "Available", price: 390.0 },
        { serial: "AR-5005", model: "M4A1 Carbine", caliber: "5.56mm", status: "Available", price: 1200.0 },
      ];
      const key = `${this.dbName}_${T.INVENTORY}`;
      localStorage.setItem(key, JSON.stringify(inventory));
      console.log(`[MySQLConnection] Seeded ${inventory.length} inventory items`);
    }

    if (this.select(T.SALES).length === 0) {
      [
        {
          saleNo: "SAL-00001",
          saleDate: "2025-11-02",
          serial: "GLK-1001",
          model: "G17 Gen5",
          buyerName: "R. Martinez",
          buyerLicense: "LIC-8821",
          amount: 550,
          processedBy: "System Administrator",
        },
        {
          saleNo: "SAL-00002",
          saleDate: "2025-12-10",
          serial: "SIG-3003",
          model: "P320 Compact",
          buyerName: "A. Reyes",
          buyerLicense: "LIC-4410",
          amount: 680,
          processedBy: "John Doe",
        },
      ].forEach((row) => this.insert(T.SALES, row));
      this.update(T.INVENTORY, { status: "Sold" }, { serial: "SIG-3003" });
    }

    if (this.select(T.BORROWING).length === 0) {
      this.insert(T.BORROWING, {
        borrowNo: "BRW-00001",
        serial: "SW-2002",
        model: "M&P9 Shield",
        borrowerName: "Officer John Doe",
        borrowerId: "EMP-002",
        borrowDate: "2025-10-01",
        dueDate: "2025-10-15",
        returnDate: "",
        status: "Out",
        issuedBy: "System Administrator",
      });
    }

    if (this.select(T.INVENTORY_COUNT).length === 0) {
      [
        {
          countNo: "CNT-00001",
          countDate: "2025-11-20",
          serial: "GLK-1001",
          model: "G17 Gen5",
          systemQty: 1,
          physicalQty: 1,
          variance: 0,
          notes: "Matched",
          countedBy: "Maria Cruz",
        },
        {
          countNo: "CNT-00002",
          countDate: "2025-11-20",
          serial: "SW-2002",
          model: "M&P9 Shield",
          systemQty: 1,
          physicalQty: 1,
          variance: 0,
          notes: "On loan — verified",
          countedBy: "John Doe",
        },
        {
          countNo: "CNT-00003",
          countDate: "2025-11-21",
          serial: "REM-4004",
          model: "870 Express",
          systemQty: 1,
          physicalQty: 0,
          variance: -1,
          notes: "Missing from rack B-2",
          countedBy: "System Administrator",
        },
      ].forEach((row) => this.insert(T.INVENTORY_COUNT, row));
    }
  }

  /**
   * Public method: Get connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Public method: Get database name
   */
  getDatabaseName() {
    return this.dbName;
  }
}

// ── Export singleton instance (public class access) ──────────────
const DB = MySQLConnection.getInstance();
