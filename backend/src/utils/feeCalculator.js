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

module.exports = {
    calculatePostingFee
};