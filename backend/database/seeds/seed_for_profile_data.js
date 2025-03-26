exports.seed = async function (knex) {
 // Clear existing profiles
 await knex('profiles').del();

 // Get all users
 const users = await knex('users').select('id', 'username', 'email');

 const profiles = users.map(user => ({
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
