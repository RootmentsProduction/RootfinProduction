import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.POSTGRES_DB_DEV || 'rootfin_dev',
  process.env.POSTGRES_USER_DEV || 'postgres',
  process.env.POSTGRES_PASSWORD_DEV || 'root',
  {
    host: process.env.POSTGRES_HOST_DEV || 'localhost',
    port: process.env.POSTGRES_PORT_DEV || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const email = 'officerootments@gmail.com';

try {
  await sequelize.authenticate();
  console.log('✅ Connected to PostgreSQL');

  const [results] = await sequelize.query(
    `SELECT id, username, email, power FROM users WHERE email = :email`,
    { replacements: { email } }
  );

  if (results.length === 0) {
    console.error(`❌ No user found with email: ${email}`);
    process.exit(1);
  }

  const user = results[0];
  console.log(`Found user: ${user.username} (${user.email}) — current power: ${user.power}`);

  const [updated] = await sequelize.query(
    `UPDATE users SET power = 'admin', "updatedAt" = NOW() WHERE email = :email`,
    { replacements: { email } }
  );

  console.log(`✅ Updated power to 'admin' for ${email}`);

  // Verify
  const [verify] = await sequelize.query(
    `SELECT id, username, email, power FROM users WHERE email = :email`,
    { replacements: { email } }
  );
  console.log(`✔ Verified: ${verify[0].username} power is now '${verify[0].power}'`);

} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await sequelize.close();
}
