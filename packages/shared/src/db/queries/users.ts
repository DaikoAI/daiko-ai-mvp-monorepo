import { eq } from "drizzle-orm";
import { db } from "../connection";
import { UserInsert, UserSelect, usersTable } from "../schema/users";

/**
 * ユーザーをIDで取得する
 */
export async function getUserById(id: UserSelect["id"]): Promise<UserSelect | undefined> {
  const results = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return results[0];
}

/**
 * 全ユーザーを取得する
 */
export async function getAllUsers(): Promise<UserSelect[]> {
  return db.select().from(usersTable);
}

/**
 * 新しいユーザーを作成する
 */
export async function createUser(data: UserInsert): Promise<void> {
  await db.insert(usersTable).values(data);
}

/**
 * ユーザーを更新する
 */
export async function updateUser(id: UserSelect["id"], data: Partial<Omit<UserSelect, "id">>): Promise<void> {
  await db.update(usersTable).set(data).where(eq(usersTable.id, id));
}

/**
 * ユーザーを削除する
 */
export async function deleteUser(id: UserSelect["id"]): Promise<void> {
  await db.delete(usersTable).where(eq(usersTable.id, id));
}
