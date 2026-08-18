import { Toaster } from "sonner";
import { Chat } from "@/components/chat/Chat";

function App() {
  return <>
        <Chat />
        <Toaster theme="dark" position="bottom-right" />
      </>;
}

export default App;