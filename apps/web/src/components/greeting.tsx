export const Greeting: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 px-4">
      <h1 className="text-2xl font-bold">Welcome to AI Chat!</h1>
      <p className="text-muted-foreground">
        This is a chat interface where you can interact with an AI assistant. Feel free to ask any questions or start a
        conversation.
      </p>
    </div>
  );
};
