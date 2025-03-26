const updateExpiredAuctions = async () => {
  try {
    const expiredAuctions = await knex('items')
      .where('auction_status', 'Active')
      .where('end_time', '<=', knex.fn.now());

    for (const auction of expiredAuctions) {
      // Get highest bid if exists
      const highestBid = await knex('bids')
        .where('item_id', auction.id)
        .orderBy('bid_amount', 'desc')
        .first();

      // Update auction status
      await knex('items')
        .where('id', auction.id)
        .update({
          auction_status: highestBid ? 'Ended - Sold' : 'Ended - Unsold'
        });

      // Create notifications
      await knex('notifications').insert([
        {
          user_id: auction.user_id,
          auction_id: auction.id,
          type: 'ended', // Changed from 'auction_ended' to 'ended'
          message: `Your auction has ended with a final price of ${formatCurrency(highestBid?.bid_amount || auction.min_price)}`
        },
        {
          user_id: auction.user_id,
          auction_id: auction.id,
          type: 'posting_fee',
          message: `Your posting fee for this auction is ${formatCurrency(auction.posting_fee)}`
        }
      ]);

      // If there's a winner, notify them
      if (highestBid) {
        await knex('notifications').insert({
          user_id: highestBid.user_id,
          auction_id: auction.id,
          type: 'won',
          message: `You won the auction for "${auction.title}"`
        });
      }
    }
  } catch (error) {
    console.error('Error updating expired auctions:', error);
    throw error;
  }
};