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
    { id: 1, username: "admin", email: "admin@example.com", password_hash: "hashedpassword", role: 1 },
    { id: 2, username: "user1", email: "user1@example.com", password_hash: "hashedpassword", role: 2 }
  ]);

  // Insert Items
  await knex("items").insert([
    { id: 1, user_id: 1, title: "Vintage Clock", description: "An old clock", min_price: 50.0, duration: 3, end_time: "2025-02-20 12:00:00", authenticated: false },
    { id: 2, user_id: 2, title: "Antique Vase", description: "A rare vase", min_price: 100.0, duration: 2, end_time: "2025-02-22 15:00:00", authenticated: true }
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
    { id: 3, item_id: 1, image_url: "https://i.imgur.com/daadjeF.jpeg" }
  ]);
};
