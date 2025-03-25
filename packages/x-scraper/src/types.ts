export interface XAccount {
  id: string
  lastContent?: Tweet[]
  userIds?: string[]
}

export interface Tweet {
  time: string
  data: string
}

export interface ChangeLog {
  timestamp: string
  xid: string
  content: Tweet[]
}

export interface NotificationLog {
  timestamp: string
  accountId: string
  notifiedUsers: string[]
  message: string
}

export interface AppConfig {
  port: number
  openAiApiKey: string
  checkIntervalMinutes: number
  nodeEnv: string
  firebaseDatabaseUrl: string
}

export interface CryptoAnalysis {
  isCryptoRelated: boolean
  analysisResult: string
}
