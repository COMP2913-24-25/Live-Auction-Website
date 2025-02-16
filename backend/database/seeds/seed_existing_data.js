exports.seed = async function (knex) {
  // Delete existing data to prevent duplication
  await knex("item_images").del();
  await knex("notifications").del();
  await knex("watchlist").del();
  await knex("payments").del();
  await knex("authentication_requests").del();
  await knex("bids").del();
  await knex("items").del();
  await knex("users").del();

  // Insert Users
  await knex("users").insert([
    { id: 1, username: "user1", email: "user1@example.com", password_hash: "hashedpassword", role: 1 },
    { id: 2, username: "expert1", email: "expert1@example.com", password_hash: "hashedpassword", role: 2 },
    { id: 3, username: "manager", email: "manager@example.com", password_hash: "hashedpassword", role: 3 },
    { id: 4, username: "user2", email: "user2@example.com", password_hash: "hashedpassword", role: 1 },
    { id: 5, username: "expert2", email: "expert2@example.com", password_hash: "hashedpassword", role: 2 }
  ]);

  // Insert Items
  await knex("items").insert([
    { id: 1, user_id: 1, title: "Vintage Clock", description: "An old clock", min_price: 50.0, duration: 3, end_time: "2025-02-20 12:00:00", authenticated: false },
    { id: 2, user_id: 4, title: "Antique Vase", description: "A rare vase", min_price: 100.0, duration: 2, end_time: "2025-02-22 15:00:00", authenticated: true },
    { id: 3, user_id: 1, title: "Rare Coin", description: "A valuable coin", min_price: 200.0, duration: 1, end_time: "2025-02-23 18:00:00", authenticated: false },
    { id: 4, user_id: 4, title: "Vintage Camera", description: "An old camera", min_price: 150.0, duration: 4, end_time: "2025-02-24 21:00:00", authenticated: true },
    { id: 5, user_id: 1, title: "Rare Stamp", description: "A valuable stamp", min_price: 250.0, duration: 5, end_time: "2025-02-25 00:00:00", authenticated: false },
    { id: 6, user_id: 4, title: "Vintage Typewriter", description: "An old typewriter", min_price: 300.0, duration: 5, end_time: "2025-02-26 03:00:00", authenticated: true },
    { id: 7, user_id: 1, title: "Rare Book", description: "A valuable book", min_price: 350.0, duration: 5, end_time: "2025-02-27 06:00:00", authenticated: false }
  ]);

  // Insert Bids
  await knex("bids").insert([
    { id: 1, user_id: 2, item_id: 1, bid_amount: 55.0 },
    { id: 2, user_id: 1, item_id: 2, bid_amount: 110.0 }
  ]);

  // Insert Authentication Requests
  await knex("authentication_requests").insert([
    { id: 1, user_id: 2, item_id: 1, status: "Pending", expert_id: 1 }
  ]);

  // Insert Payments
  await knex("payments").insert([
    { id: 1, user_id: 2, item_id: 1, amount: 55.0, status: "Completed" }
  ]);

  // Insert Watchlist
  await knex("watchlist").insert([
    { id: 1, user_id: 1, item_id: 2 }
  ]);

  // Insert Notifications
  await knex("notifications").insert([
    { id: 1, user_id: 1, message: "Your item has a new bid!", read: false }
  ]);

  // Insert Item Images
  await knex("item_images").insert([
    { id: 1, item_id: 1, image_url: "https://i.imgur.com/ZXIK1MS.jpeg" },
    { id: 2, item_id: 2, image_url: "https://i.imgur.com/skksYdg.jpeg" },
    { id: 3, item_id: 1, image_url: "https://i.imgur.com/daadjeF.jpeg" },
    { id: 4, item_id: 3, image_url: "https://i.imgur.com/mlQEjl8.jpeg" },
    { id: 5, item_id: 3, image_url: "https://i.imgur.com/lUQig7M.jpeg" },
    { id: 6, item_id: 4, image_url: "https://i.imgur.com/SapGyvm.jpeg" },
    { id: 7, item_id: 4, image_url: "https://i.imgur.com/yP5Q3IV.jpeg" },
    { id: 8, item_id: 4, image_url: "https://i.imgur.com/lOy8kxH.jpeg" },
    { id: 9, item_id: 5, image_url: "https://i.imgur.com/VAaNH6x.jpeg" },
    { id: 10, item_id: 6, image_url: "https://i.imgur.com/HZu0UlW.jpeg" },
    { id: 11, item_id: 6, image_url: "https://i.imgur.com/Q2oRb6E.jpeg" },
    { id: 12, item_id: 7, image_url: "https://i.imgur.com/1Xo53am.jpeg" },
    { id: 13, item_id: 7, image_url: "https://i.imgur.com/3gBPkYp.jpeg" },
    { id: 14, item_id: 7, image_url: "https://i.imgur.com/r9IRuHY.jpeg" },
    { id: 15, item_id: 7, image_url: "https://i.imgur.com/CUEk71d.jpeg" }
  ]);
};
