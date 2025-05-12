import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { fetchSignal } from "../utils/db";
import { proposalGeneratorState } from "../utils/state";

export const signalValidationNode = async (
  state: typeof proposalGeneratorState.State,
  options: LangGraphRunnableConfig,
) => {
  const signalId = options.configurable?.signalId;
  if (!signalId) {
    throw new Error("signal_id is missing in config");
  }

  console.log(`[Signal Validation] Validating signal: ${signalId}`);

  // データベースからシグナルデータを取得
  const signal = await fetchSignal(signalId);

  if (!signal) {
    console.error(`[Signal Validation] Signal not found: ${signalId}`);
    throw new Error(`Signal not found: ${signalId}`);
  }

  // ここでシグナルの有効性チェックを行う (例: タイムスタンプ、関連データなど)
  // 例: 一定時間以上経過したシグナルは無効とする
  const signalAge = Date.now() - new Date(signal.createdAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24時間
  if (signalAge > maxAge) {
    console.warn(`[Signal Validation] Signal is too old: ${signalId}`);
    // 必要に応じてエラーをスローするか、特定の状態遷移を行う
    throw new Error(`Signal is too old: ${signalId}`);
  }

  console.log(`[Signal Validation] Signal validated successfully: ${signalId}`);

  // stateにシグナルデータを格納
  return {
    signal,
  };
};
