exports.up = async function (knex) {
  await knex.schema.createTable('profiles', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
    table.string('username').notNullable();
    table.string('email').notNullable();
    table.string('phone').nullable();
    table.string('gender').nullable();
    table.string('expertise').nullable();
    table.text('favorites').nullable(); // Will store JSON.stringify([...])
  });

  // Insert profiles for existing users
  const users = await knex('users').select('id', 'username', 'email');
  const profiles = users.map((user) => ({
    user_id: user.id,
    username: user.username,
    email: user.email,
    phone: null,
    gender: null,
    expertise: null,
    favorites: null,
  }));

  if (profiles.length > 0) {
    await knex('profiles').insert(profiles);
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('profiles');
};

