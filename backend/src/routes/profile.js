const express = require("express");
const knex = require("../db");
const router = express.Router();

//stores the user's profile information from profile settings based on the user id 
// (gonna be used in profile.jsx in profile settings)
router.put('/:id', async (req, res) => {
  const { id } = req.params; // id of user
  const { formData, user, changes } = req.body;

  try {
    for (let change of changes) {
    await knex('users')
      .where({ id : id})
      .update({ [change]: formData[change] });
    }

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
    const profile = await knex('users').where({ id : id }).first();
    console.log("got profile info", profile);
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

    const profile = await knex('users').where({ id: id }).first();
    let favorites = [];

    if (profile && profile.favorites) {
      favorites = JSON.parse(profile.favorites);
    }

    if (!favorites.includes(auction_id) && favorites_boolean) {
      favorites.push(auction_id);
    } else if (favorites.includes(auction_id) && !favorites_boolean) {
      favorites = favorites.filter(fav => fav !== auction_id);
    }

    console.log("updated profile favorites", favorites);

    await knex('users')
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


// get the list of user's favorite auction info based on the user id 
// (gonna be used in profile.jsx for wishlist and the format fro AuctionList
router.get('/formatted-favorites/:id', async (req, res) => {
  try {
    // Get ID(s) from URL
    const { id } = req.params;

    const profile = await knex('users').where({ id: id }).first();

    if (
      !profile ||
      !profile.favorites ||
      profile.favorites === 'null' ||
      profile.favorites === '""'
    ) {
      return res.json([]);
    }

    const favorites = JSON.parse(profile.favorites);
    let favoriteAuctions = [];


    let itemObj = null;
    let imgURLs = [];
    itemObj_with_images = null;
    for (let fav_id of favorites) {
    itemObj = await knew('items').where({id : fav_id}).first();
    imgURLs = await knew('item_images').where({item_id : fav_id}).select("image_url"); // as arrays
    itemObj_with_images = {...itemObj, imgURLs : imgURLs}
    favoriteAuctions.push(itemObj_with_images);    
    }

    res.json(favoriteAuctions);

  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ message: 'Failed to fetch auctions.' });
  }
});


    
module.exports = router;

        
