let landingSearchTerm = '';

let cartUpdateTransactions = false;

export const getMyVariable = () => landingSearchTerm;
export const setMyVariable = (newValue) => (landingSearchTerm = newValue);
export const getCart = () => cartUpdateTransactions;
export const setNewCart = (newValue) => (cartUpdateTransactions = newValue);