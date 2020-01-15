import money from 'money-math';

export const formatMoney = (amount: string | number): string => {
    const sanitized = sanitizeMoney(amount);
    return `${isMoneyNegative(sanitized) ? '-' : ''}$${money.format(
        'USD',
        sanitized.replace('-', '')
    )}`;
};

export const isMoneyNegative = (amount: string): boolean => {
    return money.isNegative(amount);
};

export const isMoneyPositive = (amount: string): boolean => {
    return money.isPositive(amount);
};

export const sanitizeMoney = (amount: string | number): string => {
    if (typeof amount === 'number') {
        return money.floatToAmount(amount);
    }
    return money.floatToAmount(parseFloat(amount));
};

export const addMoney = (amount: string, amount2: string): string => {
    return money.add(amount, amount2);
};

export const subMoney = (amount: string, amount2: string): string => {
    return money.subtract(amount, amount2);
};

export const multiplyMoney = (amount: string, amount2: string): string => {
    return money.mul(amount, amount2);
};

export const moneyAsFloat = (amount: string | number): number => {
    return parseFloat(sanitizeMoney(amount));
};
