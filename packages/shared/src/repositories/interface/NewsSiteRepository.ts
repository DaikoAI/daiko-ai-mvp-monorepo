import { NewsSiteInsert, NewsSiteSelect } from "../../db/schema/newsSites";
import { Repository } from "./Repository";

export interface NewsSiteRepository extends Repository<NewsSiteSelect, NewsSiteInsert> {
  findByUrl(url: string): Promise<NewsSiteSelect | null>;
  findByUserId(userId: string): Promise<NewsSiteSelect[]>;
  updateContent(siteId: string, content: string): Promise<void>;
  addUserToSite(siteId: string, userId: string): Promise<void>;
  removeUserFromSite(siteId: string, userId: string): Promise<void>;
}
