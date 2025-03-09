const knex = require('../database/knex');
const { createBidWinNotification } = require('../routes/notifications');

// 检查已结束的竞标并处理结果
const processEndedAuctions = async () => {
  try {
    const now = new Date();
    
    // 查找已结束但尚未处理的竞标
    const endedAuctions = await knex('items')
      .where('end_time', '<', now.toISOString())
      .where('processed', false)
      .orWhereNull('processed');
      
    console.log(`Found ${endedAuctions.length} ended auctions to process`);
    
    for (const auction of endedAuctions) {
      // 找到最高出价者
      const highestBid = await knex('bids')
        .where('item_id', auction.id)
        .orderBy('bid_amount', 'desc')
        .first();
        
      if (highestBid) {
        // 创建竞标成功通知
        await createBidWinNotification(
          highestBid.user_id,
          auction.id,
          auction.title
        );
        
        console.log(`Created win notification for user ${highestBid.user_id} on item ${auction.id}`);
      }
      
      // 标记竞标为已处理
      await knex('items')
        .where('id', auction.id)
        .update({ processed: true });
    }
  } catch (error) {
    console.error('Error processing ended auctions:', error);
  }
};

// 启动定时任务
const startAuctionProcessingService = () => {
  // 在测试环境中不启用定时器
  if (process.env.NODE_ENV === 'test') {
    console.log('Auction processing service not started in test environment');
    return;
  }
  
  // 立即运行一次
  processEndedAuctions();
  
  // 设置定时任务，每分钟运行一次
  setInterval(processEndedAuctions, 60000);
  console.log('Auction processing service started');
};

module.exports = {
  processEndedAuctions,
  startAuctionProcessingService
}; 