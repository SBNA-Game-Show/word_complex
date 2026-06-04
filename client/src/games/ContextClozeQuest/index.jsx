import { useEffect, useState } from "react";
import { getFillInBlanks } from "../../services/api";

export const meta = {
  id: "context-cloze-quest",
  cardNumber: "03",
  cardArt: "art-night",
  title: "Context Cloze Quest",
  description: "Choose the best missing words from the context.",
};

export default function ContextClozeQuest() {
  const [gameData, setGameData] = useState(null);
  useEffect(() => {
    getFillInBlanks()
      .then((response) => {
        setGameData(response.data);
      })
      .catch(console.error);
  }, []);
  if (!gameData) {
  return <p>Loading...</p>;
}

return (
  <div style={{ padding: "20px" }}>
    <h1>Context Cloze Quest</h1>
    <p>{gameData.paragraph}</p>
  </div>
);
}
