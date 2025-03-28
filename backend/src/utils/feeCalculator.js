const knex = require('../db');

const calculatePostingFee = (salePrice, feeStructure) => {
    if (!salePrice || !feeStructure) {
        return 0;
    }

    const price = Number(salePrice);
    
    if (isNaN(price) || price < 0) {
        return 0;
    }

    if (price <= feeStructure.tier1Max) {
        return feeStructure.fixedFee;
    } else if (price <= feeStructure.tier2Max) {
        return (price * feeStructure.tier1Percentage) / 100;
    } else if (price <= feeStructure.tier3Max) {
        return (price * feeStructure.tier2Percentage) / 100;
    } else {
        return (price * feeStructure.tier3Percentage) / 100;
    }
};

const deductPostingFee = async (sellerId, auctionId, finalPrice) => {
    const trx = await knex.transaction();
    
    try {
        // Get fee structure
        const feeStructure = await trx('fee_structure')
            .where('active', true)
            .first();

        if (!feeStructure) {
            throw new Error('No active fee structure found');
        }

        // Calculate fee
        const postingFee = calculatePostingFee(finalPrice, feeStructure);

        // Get seller's current balance
        const seller = await trx('users')
            .where('id', sellerId)
            .first();

        if (!seller) {
            throw new Error('Seller not found');
        }

        // Update seller's balance
        await trx('users')
            .where('id', sellerId)
            .update({
                balance: knex.raw(`balance - ${postingFee}`)
            });

        // Record the fee transaction
        await trx('transactions').insert({
            user_id: sellerId,
            auction_id: auctionId,
            amount: postingFee,
            type: 'POSTING_FEE',
            created_at: knex.fn.now()
        });

        await trx.commit();
        return postingFee;

    } catch (error) {
        await trx.rollback();
        throw error;
    }
};

module.exports = {
    calculatePostingFee,
    deductPostingFee
};