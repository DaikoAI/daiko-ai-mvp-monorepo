## Important Rules

- なるべくcontextなどは使わず、globalな状態はServer ComponentでDBにいれるようなものに極力留める
- `use client`も極力使わない、userがclient sideでinteractする部分やどうしてもreact側でstateを持たなければならない場合以外は使わない。
- もしuse clientを使う場合は、stateが影響したり、userがinteractする部分のみを別componentに切り出す。
- `useContext`を用いてglobal変数を扱う場合は、provider以下の子コンポーネントが最小限になる様に考えてproviderを配置して
- `pnpm lint` & `pnpm format`を実行し生成したファイルに問題がないかを都度確認して
- `shadcn/ui`のコンポーネントを使用する時、utils関数は`@/lib/utils`ではなく`@/utils/index.ts`に配置することに注意してください
- web siteの言語は基本的に英語を表示してください
- dataはmockであってもまず`type`か`interface`を定義してから後からapi fetchする場合でもreplaceがしやすいように実装して下さい
- use Tailwind v4
- サイト内で使用する文言はdescriptiveになり過ぎないように、なるべく短い単語で簡潔にuserが分かりやすいようなword choiceを必ず心がけて下さい！
- Keep `page.tsx` as Server Component as much as possible
- html構造はなるべくsimpleなものにして下さい。安易にdivを重ねてstyleを当てるのではなく、semanticなhtmlを心がけて下さい

## React Components

Create components using named exports with `React.FC` as shown below:

```tsx
export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};
```

## Next page Components

`src/app/**/page.tsx` should be structured as follows:

- Use NextPage type and export as default
- params should be typed as Promise and awaited

```tsx
import { NextPage } from "next";
import { redirect } from "next/navigation";

type HomePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const HomePage: NextPage<HomePageProps> = async ({ params }) => {
  const { id } = await params;
  return (
    <div>
      <h1>Home</h1>
    </div>
  );
};

export default HomePage;
```

## Dir Structure

```zsh
src
├── app/
│   ├── page.tsx # entry point
│   ├── layout.tsx # layout
│   ├── (path)/
│       └── page.tsx # entry point
│       └── components # local components under the same path
│            └── (component).tsx # component
└── components/ # global components
└── utils/ # utility functions
└── hooks/ # hooks
    └── (hook).ts # extension should be .ts
└── lib/ # libraries
└── constants/ # constants
└── types/ # types
```

## Error Handling and Validation:

- Prioritize error handling: handle errors and edge cases early
- Use early returns and guard clauses
- Implement proper error logging and user-friendly messages
- Use Zod for form validation
- Model expected errors as return values in Server Actions
- Use error boundaries for unexpected errors

## Naming Conventions:

- Use lowercase with dashes for directories (e.g., components/auth-wizard)
- Favor named exports for components

## TypeScript Usage:

- Use TypeScript for all code; prefer interfaces over types
- Avoid enums; use maps instead
- Use functional components with TypeScript interfaces

## Code Style and Structure:

- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Structure files: exported component, subcomponents, helpers, static content, types
