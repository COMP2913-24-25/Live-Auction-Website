const express = require("express");
const knex = require("../db");
const router = express.Router();

router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { formData, user } = req.body;
  const { name, value } = formData;

  try {
    const columnExists = await knex.schema.hasColumn('users', name);

    if (!columnExists) {
      await knex.schema.alterTable('users', function (table) {
        table.string(name); // Default to string type (you can customize if needed)
      });
      console.log(`Added column ${name}`);
    }

    await knex('users')
      .where({ id })
      .update({ [name]: value });

    res.status(200).json({ message: `${user.username} profile info updated` });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

module.exports = router;
