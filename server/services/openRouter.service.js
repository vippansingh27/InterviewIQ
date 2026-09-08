import axios from "axios";

export const askAi = async (messages) => {
    try {
        if (
            !messages ||
            !Array.isArray(messages) ||
            messages.length === 0
        ) {
            throw new Error("Messages array is empty.");
        }

        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("OPENROUTER_API_KEY is missing.");
        }

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: messages,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const content =
            response?.data?.choices?.[0]?.message?.content;

        if (!content || !content.trim()) {
            throw new Error("AI returned empty response.");
        }

        return content;

    } catch (error) {
        console.error("========== OPENROUTER ERROR ==========");
        console.error("STATUS:", error.response?.status);
        console.error("DATA:", error.response?.data);
        console.error("MESSAGE:", error.message);

        throw new Error(
            error.response?.data?.error?.message ||
            error.message ||
            "OpenRouter API Error"
        );
    }
};