import { ProposalRepository } from "@daiko-ai/shared";
import { PostgresProposalRepository } from "./PostgresProposalRepository";

/**
 * リポジトリインスタンスのファクトリ関数
 */
export const createRepositories = () => {
  const proposalRepository: ProposalRepository = new PostgresProposalRepository();

  return {
    proposalRepository,
  };
};
