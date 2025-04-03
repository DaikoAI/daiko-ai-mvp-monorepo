import { XAccountInsert, XAccountSelect } from "../../db/schema/xAccounts";
import { Repository } from "./Repository";

export interface XAccountRepository extends Repository<XAccountSelect, XAccountInsert> {
  findByUserId(userId: string): Promise<XAccountSelect[]>;
  updateLastTweetId(accountId: string, tweetId: string): Promise<void>;
  addUser(accountId: string, userId: string): Promise<void>;
  removeUser(accountId: string, userId: string): Promise<void>;
}
