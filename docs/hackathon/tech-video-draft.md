# Technical Demo Video

公式の説明

> ## Technical Demo Video
>
> The technical demo video is a new addition to this year's hackathon. 
>
> While the pitch video is for explaining the why, the technical demo is about the how. Teams should avoid turning this into another pitch. It should be technical, direct, and specific to implementation to give reviewers a clear sense of the product's technical foundation and the problem-solving approach of the team.
>
> This 2-3 minute video allows teams to explain the design and implementation choices behind their product, particularly how it leverages Solana. You can show gameplay footage, interface walkthroughs, or architecture visuals if preferred. 
>
> In this video, teams should walk through the core features they built, explain their tech stack, and outline the decisions made in prioritizing specific components. Judges are particularly interested in the reasoning behind these decisions, especially with regard to Solana integration, on-chain logic, and overall architecture.

---

## Content

### Approach

Our development focused on testing 3 key things:

1. AIを使って期待する品質のSell提案が作れるか

- 定量データと自然言語によるmarket sentimentの組み合わせにより、より信頼性の高いSell提案が可能になった
- signal-detectionとpersonalized proposalの生成の2つにcomponent分割

2. UI/UXの最適化（1-Clickで運用できる、Cursorのように気軽にAIチャットで不足情報を補足できる）

- MVPでは開発の速度とコストを優先しPWAでネイティブアプリのようなUXを担保しつつ迅速にリリース
- userはproposalのaccept / declineをするだけで良いというsimpleかつ直感的なUXを実現

3. 開発・運用コストの削減

- Inngest, NeonDB, VercelのFluid Functionを使ってバッチ処理やAIによる提案生成などのworkflowを全てServerlessで実現することで、highly scalableかつ保守性の高いシステムを迅速に構築

### Backend System Overview

![Daiko Server System](../images/daiko-server-system.jpg)

（Non-technicalが理解できるように技術解説）

### AI System Overview

![Daiko AI System](../images/daiko-ai-system.jpg)

（Non-technicalが理解できるように技術解説）

### Operation Demo

（操作しながらStrategyを技術観点で解説）

---

### Scripts

#### Introduction (0:00-0:10)

Hi, I'm Asuma, co-founder of Daiko.
Today, I'll show you how our AI trading agent works, focusing on three key technical aspects.

- how we optimize UI/UX
- how we qualify sell signals
- how we built a cost-efficient backend

#### One-Click Trading UI (0:10-0:45)

First, our UI/UX. We simplified trading to a single tap.

Let me show you the actual demo left below.
As you can see, this proposal page is the core part of Daiko.

Proposals clearly show:

- The action, for example, 'Sell 50% of your SOL'
- The reasoning, explaining why this action is recommended
- The expected outcome, like potential profit or risk mitigation

Users connect their wallet during onboarding. After that, it's incredibly simple. You just tap 'Accept' or 'Decline'.
If you hit 'Accept', the trade executes instantly through your connected wallet.

We also added a contextual AI chat, like Cursor. Let's say you have a question about this proposal. You can type it in here. See? The AI understands your portfolio and chat history, providing a personalized answer to help you decide.

#### AI for Quality Sell Signals (0:45-1:25)

Next, our AI system. It has two parts:

1. Signal Detection AI: Scans social media, news, and onchain data.
2. Personalized Proposal AI: Tailors proposals to user portfolios and preferences.

We found LLMs misinterpret natural language alone. So, we combine social sentiment with technical analysis.

If our AI sees negative X discussions, it cross-checks against on-chain metrics and chart patterns.
This significantly boosts proposal accuracy.

#### Cost-Efficient Development (1:25-1:50)

Finally, our cost-efficient backend.

We built a serverless architecture using Inngest, NeonDB, and Vercel Functions. This allows highly-scalable batch processing and AI workloads without managing infrastructure.

Also, we created custom data scrapers instead of using expensive APIs, drastically cutting operational costs.

In result, we built scalable, and maintainable system rapidly.

#### Closing (1:50-2:00)

Daiko transforms crypto trading from complex analysis to simple decisions. Thank you.

---

## Findings

- 実際には自然言語の情報をそのままsignalとしてprocessすると、それが嘘の情報や別の意図であっても強い言葉や主張に推論は偏ってしまう

  - 例えば皮肉やネタとして価格に関するtweetがなされており、そのtweetのimpressionやlikeなどの定量指標により信頼できる情報だとAIが判断してしまうと間違ったsignalを生成してしまう

- 自然言語の情報は今までにない面白い情報ソースだが、今までの一般的なTAなど定量的なデータと組み合わせることで真価を発揮する
- MVPとしては全てをTypeScriptのみでかつServerlessで実装することにより、開発・運用コストを抑えつつ、highly scalableで保守性の高いシステムを迅速に構築できた
