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

router.put('/user/:id/favorites', async (req, res) => {
  const { id } = req.params;
  const { auction_id, favorite } = req.body;

  try {
    const user = await knex('users').where({ id }).first();
    let favorite_list = JSON.parse(user.favorites || '[]');
    let exists = false
    for (let i = 0; i < favorite_list.length; i++) {
      if (favorite_list[i][0] === auction_id) {
        favorite_list[i][1] = favorite;
        exists = true;
        break;
      }
    }
    if (exists === false) {
    let new_favorite = [ auction_id, favorite ];
    favorite_list.push(new_favorite);
    }

    await knex('users')
      .where({ id })
      .update({favorites: favorite_list});

      res.status(200).json({ message: `auction ${auction_id} is saved in the wishlist` });
    
  } catch (error) {
    console.error('Error updating favorites:', error);
    res.status(500).json({ message: 'Failed to update favorites.' });
  }
});

router.get('/users/:id/favorites', async (req, res) => {
  const { id } = req.params;

  try {
    const favorite = await knex('users')
      .where({ id })
      .select('favorites');

    res.json(favorite);

  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites.' });
  }

});



router.get('/auctions/:id/favorite-bids', async (req, res) => {
  try {
    // Get ID(s) from URL
    const idParam = req.params.id;

    // Split by comma to support multiple IDs (e.g., '1,2,3')
    const idList = idParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    const queryBuilder = await knex('item_current_bids as icb')
      .select(
        'icb.item_id as id',
        'icb.title',
        'icb.description',
        'icb.min_price',
        'icb.end_time',
        'icb.authentication_status',
        'icb.auction_status',
        'icb.current_bid',
        knex.raw('GROUP_CONCAT(DISTINCT ii.image_url) as image_urls'),
        'u.username as seller_name'
      )
      .leftJoin('items as i', 'icb.item_id', 'i.id')
      .leftJoin('users as u', 'i.user_id', 'u.id')
      .leftJoin('item_images as ii', 'icb.item_id', 'ii.item_id')
      .where('icb.auction_status', 'Active')
      .where('icb.end_time', '>', knex.raw("datetime('now')"))
      .modify(query => {
        // If multiple IDs, use whereIn, otherwise single where
        if (idList.length === 1) {
          query.where('icb.item_id', idList[0]);
        } else if (idList.length > 1) {
          query.whereIn('icb.item_id', idList);
        }
      })
      .groupBy('icb.item_id');

    res.json(queryBuilder);

  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ message: 'Failed to fetch auctions.' });
  }
});

    
module.exports = router;

        
