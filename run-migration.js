const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    console.log('Connecting to Supabase database...');
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync('./migrations/0000_nasty_doctor_spectrum.sql', 'utf8');
    
    console.log('Running migration...');
    await sql(migrationSQL);
    
    console.log('✓ Migration completed successfully!');
    console.log('Database tables created:');
    console.log('  - transactions');
    console.log('  - dex_prices');
    console.log('  - wallets');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();