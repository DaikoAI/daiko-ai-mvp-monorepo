export type TokenAsset = {
  token: string;
  token_address: string;
  balance: string;
  price_usd: string;
  price_change_24h: string;
  value_usd: string;
  icon_url: string;
};

export type Portfolio = {
  wallet_address: string;
  total_value_usd: string;
  tokens: TokenAsset[];
  last_updated: Date;
  prices_age: number;
};
