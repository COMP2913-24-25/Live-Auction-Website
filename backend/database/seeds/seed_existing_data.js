exports.seed = async function (knex) {
  // Delete existing data in correct order (handling foreign key constraints)
  await knex("item_images").del();
  await knex("notifications").del();
  await knex("watchlist").del();
  await knex("user_payment_methods").del();
  await knex("payments").del();
  await knex("authentication_requests").del();
  await knex("expert_categories").del();
  await knex("bids").del();
  await knex("items").del();
  await knex("users").del();
  await knex("categories").del();

  // Insert Users
  await knex("users").insert([
    { id: 1, username: "manager", email: "mng@mng.com", password_hash: "$2b$10$4CXFyNVPJXQlxvjca/3Xl.Npx4HL9Y5TwAtm4GEHfOjCm1HPsGWNa", role: 3 },
    { id: 2, username: "expert1", email: "exp1@exp.com", password_hash: "$2b$10$CRaf10Kh/h6sZFuwDKjEreXC3vWY5oEmyXFFcBywGEREFLYFGn5EK", role: 2 },
    { id: 3, username: "expert2", email: "exp2@exp.com", password_hash: "$2b$10$CRaf10Kh/h6sZFuwDKjEreXC3vWY5oEmyXFFcBywGEREFLYFGn5EK", role: 2 },
    { id: 4, username: "dan", email: "dan@user.com", password_hash: "$2b$10$EmNhXfdLuzeNkNpFLnpUY.OOItvJdW1zvsDKlghRFVUjFY4lhg6wO", role: 1 },
    { id: 5, username: "zq", email: "zq@user.com", password_hash: "$2b$10$Xaszt5dbB9hmLG1jafYHGuhX5ARoaDuaTYiitkCQJImZklczIHubW", role: 1 },
    { id: 6, username: "stev", email: "stev@user.com", password_hash: "$2b$10$xnXEtNmJcssYJAPs7BoSNOGo4HdtwQBo/Lzz9AXsT5116Od8PnrL.", role: 1 },
    { id: 7, username: "hao", email: "hao@user.com", password_hash: "$2b$10$t0y1XTRtc2NfL11Xd.65eOQeZ3T9TsRqg2ICwIDHGVihmWbJiYnLW", role: 1 },
    { id: 8, username: "zhiwu", email: "zhiwu@user.com", password_hash: "$2b$10$GlIxw4Bn3QQcK8esjxcK2uH0YyiIW/mOHj7eMaEkNsFdxiHnj2nOy", role: 1 },
    { id: 9, username: "kim", email: "kim@user.com", password_hash: "$2b$10$RK0M4GXF7erh1UJR4ReMBeIhHuqhGcrcZ9183cc/Px/Iyls7yw.lC", role: 1 }
  ]);

  // Insert Categories
  await knex("categories").insert([
    { id: 1, name: "Art" },
    { id: 2, name: "Antiques" },
    { id: 3, name: "Jewelry" },
    { id: 4, name: "Clothing" },
    { id: 5, name: "Collectibles" },
    { id: 6, name: "Electronics" },
    { id: 7, name: "Home & Garden" },
    { id: 8, name: "Sports Equipment" },
    { id: 9, name: "Toys & Games" },
    { id: 10, name: "Vehicles" },
    { id: 11, name: "Books" },
    { id: 12, name: "Other" }
  ]);

  // Insert Expert Categories
  await knex("expert_categories").insert([
    { expert_id: 2, category_id: 2 },
    { expert_id: 2, category_id: 5 },
    { expert_id: 2, category_id: 6 },
    { expert_id: 3, category_id: 2 },
    { expert_id: 3, category_id: 5 },
    { expert_id: 3, category_id: 6 },
    { expert_id: 3, category_id: 11 }
  ]);

  // Insert Items
  await knex("items").insert([
    { id: 1, user_id: 4, title: "Vintage Clock", description: "An old clock", min_price: 50.0, category_id: 2, end_time: "2025-03-17 17:35:00", authentication_status: 'Approved', auction_status: 'Not Listed' },
    { id: 2, user_id: 4, title: "Antique Vase", description: "A rare vase", min_price: 100.0, category_id: 2, end_time: "2025-03-16 15:00:00", authentication_status: 'Pending', auction_status: 'Not Listed' },
    { id: 3, user_id: 4, title: "Rare Coin", description: "A valuable coin", min_price: 200.0, category_id: 5, end_time: "2025-03-20 18:00:00", authentication_status: 'Rejected', auction_status: 'Not Listed' },
    { id: 4, user_id: 4, title: "Vintage Camera", description: "An old camera", min_price: 150.0, category_id: 6, end_time: "2025-03-20 21:00:00", authentication_status: 'Pending', auction_status: 'Not Listed' },
    { id: 5, user_id: 6, title: "Rare Stamp", description: "A valuable stamp", min_price: 250.0, category_id: 5, end_time: "2025-03-21 00:00:00", authentication_status: 'Pending', auction_status: 'Not Listed' },
    { id: 6, user_id: 5, title: "Vintage Typewriter", description: "An old typewriter", min_price: 300.0, category_id: 6, end_time: "2025-03-21 03:00:00", authentication_status: 'Pending', auction_status: 'Not Listed' },
    { id: 7, user_id: 7, title: "Rare Book", description: "A valuable book", min_price: 350.0, category_id: 11, end_time: "2025-03-22 06:00:00", authentication_status: 'Not Requested', auction_status: 'Active' }
  ]);

  // Insert Bids
  await knex("bids").insert([
    { id: 1, user_id: 6, item_id: 1, bid_amount: 55.0 },
    { id: 2, user_id: 5, item_id: 2, bid_amount: 110.0 }
  ]);

  // Insert Authentication Requests
  await knex("authentication_requests").insert([
    { id: 1, user_id: 4, item_id: 1, status: "Approved", expert_id: 2, second_opinion_requested: false, new_expert_id: null, comments: "Looks good!", decision_timestamp: "2025-02-25 12:00:00" },
    { id: 2, user_id: 4, item_id: 2, status: "Pending", expert_id: 2, second_opinion_requested: true, new_expert_id: null, comments: "Looks good!", decision_timestamp: "2025-02-25 12:00:00" },
    { id: 3, user_id: 4, item_id: 3, status: "Rejected", expert_id: 3, second_opinion_requested: false, new_expert_id: null, comments: "Not authentic", decision_timestamp: "2025-02-25 12:00:00" },
    { id: 4, user_id: 4, item_id: 4, status: "Pending", expert_id: 3, second_opinion_requested: false, new_expert_id: null, comments: "", decision_timestamp: "2025-02-25 12:00:00" },
    { id: 5, user_id: 6, item_id: 5, status: "Pending", expert_id: null, second_opinion_requested: false, new_expert_id: null, comments: "Looks good!", decision_timestamp: "2025-02-25 12:00:00" },
    { id: 6, user_id: 5, item_id: 6, status: "Pending", expert_id: null, second_opinion_requested: false, new_expert_id: null, comments: "Looks good!", decision_timestamp: "2025-02-25 12:00:00" },
    { id: 7, user_id: 4, item_id: 7, status: "Approved", expert_id: 2, second_opinion_requested: true, new_expert_id: 3, comments: "Looks good!", decision_timestamp: "2025-02-25 12:00:00" }
  ]);

  // Insert Payments
  await knex("payments").insert([
    { id: 1, user_id: 2, item_id: 1, amount: 55.0, status: "Completed" }
  ]);

  // Insert Payments
  await knex("user_payment_methods").insert([
    {
      id: 1,
      user_id: 2,
      payment_provider: "Stripe",
      tokenized_card_id: "tok_visa_test1",
      last4: "4242",
      card_type: "Visa",
      exp_month: 12,
      exp_year: 2025,
      cvv: "123"
    },
    {
      id: 2,
      user_id: 4,
      payment_provider: "Stripe",
      tokenized_card_id: "tok_mastercard_test1",
      last4: "5678",
      card_type: "MasterCard",
      exp_month: 10,
      exp_year: 2024,
      cvv: "456"
    }
  ]);

  // Insert Watchlist
  await knex("watchlist").insert([
    { id: 1, user_id: 4, item_id: 2 }
  ]);

  // Update notifications with correct types for both users and experts
  await knex("notifications").insert([
    // User notifications
    {
      id: 1,
      user_id: 6,
      auction_id: 1,
      type: 'outbid',
      message: 'You have been outbid on Vintage Clock',
      read: false,
      created_at: new Date()
    },
    {
      id: 2,
      user_id: 6,
      auction_id: 1,
      type: 'ended',
      message: 'Your auction has ended with a final price of £55.00',
      read: false,
      created_at: new Date()
    },
    {
      id: 3,
      user_id: 4,
      auction_id: 1,
      type: 'won',
      message: 'You have won the bid',
      read: false,
      created_at: new Date()
    },
    // Expert notifications
    {
      id: 4,
      user_id: 2,
      auction_id: 2,
      type: 'review_request',
      message: 'New authentication request for "Antique Vase"',
      read: false,
      created_at: new Date()
    },
    {
      id: 5,
      user_id: 2,
      auction_id: 4,
      type: 'review_reminder',
      message: 'Reminder: Authentication pending for "Vintage Camera"',
      read: false,
      created_at: new Date()
    },
    {
      id: 6,
      user_id: 3,
      auction_id: 3,
      type: 'review_completed',
      message: 'Authentication completed for "Rare Coin"',
      read: false,
      created_at: new Date()
    }
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

  // Insert Expert Availability
  await knex("expert_availability").insert([
    { expert_id: 2, date: "2025-03-26", start_time: "09:00", end_time: "20:00", unavailable: false },
    { expert_id: 2, date: "2025-03-27", start_time: "09:00", end_time: "20:00", unavailable: false },
    { expert_id: 2, date: "2025-03-28", start_time: "09:00", end_time: "20:00", unavailable: false },
    { expert_id: 3, date: "2025-03-26", start_time: "09:00", end_time: "20:00", unavailable: false },
    { expert_id: 3, date: "2025-03-27", start_time: "09:00", end_time: "20:00", unavailable: false },
    { expert_id: 3, date: "2025-03-28", start_time: "09:00", end_time: "20:00", unavailable: false }
  ]);
};
