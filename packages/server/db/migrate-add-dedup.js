#!/usr/bin/env node
/**
 * Token Visualizer - Deduplication Migration Script
 *
 * This script handles the migration to add deduplication support to usage_records.
 *
 * Features:
 * - Backups existing data
 * - Fills NULL device fields with 'legacy'
 * - Adds device_key computed column
 * - Creates unique index for deduplication
 * - Removes duplicate records (keeps earliest)
 * - Supports --dry-run for preview
 *
 * Usage:
 *   node migrate-add-dedup.js          # Run migration
 *   node migrate-add-dedup.js --dry-run # Preview changes
 */

import { getDb } from './index.js';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.blue}${colors.dim}Step ${step}:${colors.reset} ${message}`);
}

async function checkColumnExists(db, tableName, columnName) {
  try {
    await db.execute(`SELECT ${columnName} FROM ${tableName} LIMIT 1`);
    return true;
  } catch (e) {
    return false;
  }
}

async function checkIndexExists(db, indexName) {
  try {
    // For SQLite/LibSQL, we check by attempting to create or querying schema
    const result = await db.execute(`
      SELECT name FROM sqlite_master
      WHERE type = 'index' AND name = ?
    `, [indexName]);
    return result.rows.length > 0;
  } catch (e) {
    return false;
  }
}

async function getRowCount(db, table) {
  const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
  return result.rows[0].count;
}

async function getNullDeviceCount(db) {
  try {
    const result = await db.execute(`
      SELECT COUNT(*) as count FROM usage_records WHERE device IS NULL
    `);
    return result.rows[0].count;
  } catch (e) {
    return 0;
  }
}

async function getDuplicateCount(db) {
  try {
    const result = await db.execute(`
      SELECT COUNT(*) - COUNT(DISTINCT
        user_id || '|' || source || '|' || model || '|' ||
        COALESCE(project, 'null') || '|' || bucket_start || '|' ||
        COALESCE(device, 'unknown')
      ) as dup_count
      FROM usage_records
    `);
    return result.rows[0].dup_count;
  } catch (e) {
    return 0;
  }
}

async function migrate(options = {}) {
  const db = await getDb();
  const { dryRun = false } = options;

  log('\n=== Token Visualizer Migration ===', 'blue');
  log('Adding deduplication support\n', 'blue');

  if (dryRun) {
    log('🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  }

  const startTime = Date.now();
  const results = {
    backupCreated: false,
    nullDevicesFilled: 0,
    deviceKeyAdded: false,
    indexCreated: false,
    duplicatesRemoved: 0,
    totalRows: 0,
  };

  try {
    // ========================================================================
    // Step 1: Check current state
    // ========================================================================
    logStep(1, 'Checking current database state...');

    results.totalRows = await getRowCount(db, 'usage_records');
    log(`  Total records in usage_records: ${results.totalRows}`);

    const deviceColumnExists = await checkColumnExists(db, 'usage_records', 'device');
    log(`  Device column exists: ${deviceColumnExists ? 'Yes' : 'No'}`);

    const deviceKeyExists = await checkColumnExists(db, 'usage_records', 'device_key');
    log(`  Device_key column exists: ${deviceKeyExists ? 'Yes' : 'No'}`);

    const uniqueIndexExists = await checkIndexExists(db, 'idx_usage_unique');
    log(`  Unique index exists: ${uniqueIndexExists ? 'Yes' : 'No'}`);

    const nullDeviceCount = await getNullDeviceCount(db);
    if (nullDeviceCount > 0) {
      log(`  Records with NULL device: ${nullDeviceCount}`, 'yellow');
    }

    const duplicateCount = await getDuplicateCount(db);
    if (duplicateCount > 0) {
      log(`  Duplicate records detected: ${duplicateCount}`, 'yellow');
    }

    // Check if migration is already complete
    if (deviceKeyExists && uniqueIndexExists && nullDeviceCount === 0 && duplicateCount === 0) {
      log('\n✓ Migration already completed! Nothing to do.', 'green');
      return results;
    }

    // ========================================================================
    // Step 2: Create backup
    // ========================================================================
    logStep(2, 'Creating backup...');

    if (!dryRun) {
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS usage_records_backup_20260306 AS
          SELECT * FROM usage_records
        `);
        results.backupCreated = true;
        log('  ✓ Backup table created: usage_records_backup_20260306', 'green');

        const backupCount = await getRowCount(db, 'usage_records_backup_20260306');
        log(`  ✓ Backup contains ${backupCount} records`, 'green');
      } catch (e) {
        if (e.message.includes('already exists')) {
          log('  ⚠ Backup table already exists, skipping...', 'yellow');
          results.backupCreated = true;
        } else {
          throw e;
        }
      }
    } else {
      log('  [DRY RUN] Would create backup table: usage_records_backup_20260306');
    }

    // ========================================================================
    // Step 3: Add device column if not exists
    // ========================================================================
    if (!deviceColumnExists) {
      logStep(3, 'Adding device column...');

      if (!dryRun) {
        await db.execute(`ALTER TABLE usage_records ADD COLUMN device TEXT DEFAULT 'unknown'`);
        log('  ✓ Device column added', 'green');
      } else {
        log('  [DRY RUN] Would add device column');
      }
    }

    // ========================================================================
    // Step 4: Fill NULL device values
    // ========================================================================
    if (nullDeviceCount > 0) {
      logStep(4, 'Filling NULL device values with "legacy"...');

      if (!dryRun) {
        const result = await db.execute(`
          UPDATE usage_records
          SET device = 'legacy'
          WHERE device IS NULL
        `);
        results.nullDevicesFilled = result.rowsAffected || 0;
        log(`  ✓ Updated ${results.nullDevicesFilled} records`, 'green');
      } else {
        log(`  [DRY RUN] Would update ${nullDeviceCount} NULL device values to "legacy"`);
      }
    } else {
      logStep(4, 'Skipping NULL device fill (none found)');
    }

    // ========================================================================
    // Step 5: Add device_key computed column
    // ========================================================================
    if (!deviceKeyExists) {
      logStep(5, 'Adding device_key computed column...');

      if (!dryRun) {
        try {
          await db.execute(`
            ALTER TABLE usage_records
            ADD COLUMN device_key TEXT
            GENERATED ALWAYS AS (COALESCE(device, 'unknown')) STORED
          `);
          results.deviceKeyAdded = true;
          log('  ✓ device_key column added (computed stored)', 'green');
        } catch (e) {
          if (e.message.includes('duplicate column')) {
            log('  ⚠ device_key column already exists', 'yellow');
          } else {
            throw e;
          }
        }
      } else {
        log('  [DRY RUN] Would add device_key computed column');
      }
    } else {
      logStep(5, 'Skipping device_key column (already exists)');
    }

    // ========================================================================
    // Step 6: Remove duplicates before creating unique index
    // ========================================================================
    if (duplicateCount > 0) {
      logStep(6, 'Removing duplicate records (keeping earliest)...');

      if (!dryRun) {
        // Delete duplicates, keeping the one with smallest id
        const dupResult = await db.execute(`
          DELETE FROM usage_records
          WHERE id NOT IN (
            SELECT MIN(id)
            FROM usage_records
            GROUP BY user_id, source, model, project, bucket_start, device
          )
        `);
        results.duplicatesRemoved = dupResult.rowsAffected || 0;
        log(`  ✓ Removed ${results.duplicatesRemoved} duplicate records`, 'green');
      } else {
        log(`  [DRY RUN] Would remove ${duplicateCount} duplicate records`);
      }
    } else {
      logStep(6, 'Skipping duplicate removal (none found)');
    }

    // ========================================================================
    // Step 7: Create unique index
    // ========================================================================
    if (!uniqueIndexExists) {
      logStep(7, 'Creating unique index for deduplication...');

      if (!dryRun) {
        try {
          await db.execute(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_unique
            ON usage_records(user_id, source, model, project, bucket_start, device_key)
          `);
          results.indexCreated = true;
          log('  ✓ Unique index idx_usage_unique created', 'green');
        } catch (e) {
          if (e.message.includes('already exists')) {
            log('  ⚠ Unique index already exists', 'yellow');
          } else {
            throw e;
          }
        }
      } else {
        log('  [DRY RUN] Would create unique index idx_usage_unique');
      }
    } else {
      logStep(7, 'Skipping unique index (already exists)');
    }

    // ========================================================================
    // Summary
    // ========================================================================
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    log('\n' + '─'.repeat(50), 'dim');
    log('Migration Summary', 'blue');
    log('─'.repeat(50), 'dim');

    if (dryRun) {
      log('  Mode: DRY RUN (no changes made)', 'yellow');
    } else {
      log(`  Backup created: ${results.backupCreated ? 'Yes' : 'No'}`, results.backupCreated ? 'green' : 'red');
      log(`  NULL devices filled: ${results.nullDevicesFilled}`, results.nullDevicesFilled > 0 ? 'green' : 'dim');
      log(`  device_key added: ${results.deviceKeyAdded ? 'Yes' : 'Already exists'}`, results.deviceKeyAdded ? 'green' : 'dim');
      log(`  Duplicates removed: ${results.duplicatesRemoved}`, results.duplicatesRemoved > 0 ? 'green' : 'dim');
      log(`  Unique index created: ${results.indexCreated ? 'Yes' : 'Already exists'}`, results.indexCreated ? 'green' : 'dim');
    }

    log(`  Time elapsed: ${elapsed}s`, 'dim');
    log('─'.repeat(50), 'dim');

    if (!dryRun) {
      log('\n✓ Migration completed successfully!', 'green');
    } else {
      log('\n✓ Dry run completed! Run without --dry-run to apply changes.', 'yellow');
    }

    return results;

  } catch (error) {
    log('\n✗ Migration failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-n');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
Token Visualizer - Deduplication Migration Script

Usage:
  node migrate-add-dedup.js          # Run migration
  node migrate-add-dedup.js --dry-run # Preview changes without modifying database
  node migrate-add-dedup.js --help    # Show this help message

This script:
  1. Checks current database state
  2. Creates a backup table (usage_records_backup_20260306)
  3. Adds device column if missing
  4. Fills NULL device values with "legacy"
  5. Adds device_key computed column
  6. Removes duplicate records (keeps earliest by id)
  7. Creates unique index for future deduplication

Environment variables required:
  - TURSO_DATABASE_URL (for Turso/LibSQL)
  - TURSO_AUTH_TOKEN (for Turso/LibSQL)
  - DB_PATH (for local SQLite, optional)
`);
  process.exit(0);
}

// Run migration
migrate({ dryRun });
