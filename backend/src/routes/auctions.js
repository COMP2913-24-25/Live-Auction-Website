// 获取单个拍卖详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await knex('items').where('id', id).first();
    
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    // 获取最高出价者信息
    const highestBid = await knex('bids')
      .where('item_id', id)
      .orderBy('bid_amount', 'desc')
      .first();
      
    if (highestBid) {
      auction.highest_bidder_id = highestBid.user_id;
    }
    
    // ... 其他代码保持不变
    
    res.json(auction);
  } catch (error) {
    console.error('Error getting auction details:', error);
    res.status(500).json({ error: 'Server error' });
  }
}); 