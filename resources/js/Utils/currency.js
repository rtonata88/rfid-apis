export const formatCurrency = (amount) => {
    return 'N$' + new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
};

export const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
};