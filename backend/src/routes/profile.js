const express = require("express");
const knex = require("../db");
const router = express.Router();

//stores the user's profile information from profile settings based on the user id 
// (gonna be used in profile.jsx in profile settings)
router.put('/:id', async (req, res) => {
  const { id } = req.params; // id of user
  const { formData, user } = req.body;
  const { name, value } = formData;

  try {
    await knex('profiles')
      .where({ id : id})
      .update({ [name]: value });

    res.status(200).json({ message: `${user.username} profile info updated` });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

// get the user's profile information based on the user id
// (gonna be used in profile.jsx in profile settings)

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await knex('profiles').where({ id : id }).first();
    res.json(profile); // this is an object

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
});



// stores the user's favorite auctions based on the user id 
// (gonna be used in AuctionDetails.jsx)
router.put('/favorites/:id', async (req, res) => {
  const { id } = req.params;
  const { auction_id , favorites_boolean } = req.body;

  try {

    const profile = await knex('profiles').where({ id: id }).first();
    let favorites = [];

    if (profile && profile.favorites) {
      favorites = JSON.parse(profile.favorites);
    }

    // 2. Add or delete the item
    if (!favorites.includes(auction_id) && favorites_boolean) {
      favorites.push(auction_id);
    } else if (favorites.includes(auction_id) && !favorites_boolean) {
      favorites = favorites.filter(fav => fav !== auction_id);
    }

    // 3. Update the table
    await knex('profiles')
      .where({ id: id })
      .update({
        favorites: JSON.stringify(favorites)
      });

      res.status(200).json({ message: `auction ${auction_id} is saved in the wishlist` });
    
  } catch (error) {
    console.error('Error updating favorites:', error);
    res.status(500).json({ message: 'Failed to update favorites.' });
  }
});


// get the list of user's favorite auction info based on the user id (gonna be used in profile.jsx for wishlist)
router.get('/favorites/:id', async (req, res) => {
  try {
    // Get ID(s) from URL
    const id = req.params;

    const profile = await knex('profile').where({ id: id }).first();
    const favorites = JSON.parse(profile.favorites);
    let favoriteAuctions = [];

    for (let fav_id of favorites) {
    favoriteAuctions.push((await knew(`/api/auction/${fav_id}`)).data);
    }

    res.json(favoriteAuctions);

  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ message: 'Failed to fetch auctions.' });
  }
});

    
module.exports = router;

        
