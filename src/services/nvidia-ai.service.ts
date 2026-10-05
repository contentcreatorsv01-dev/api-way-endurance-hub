import axios, { AxiosInstance } from "axios";

export type CoachType = "maya" | "luca";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  coach: CoachType;
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
}

export interface ChatResponse {
  response: string;
  coach: CoachType;
  timestamp: string;
  tokensUsed?: number;
}

const UNIFIED_COACH_PROMPT = `Você é um(a) coach profissional de corrida especializado(a) em assessoria completa para corredores de todos os níveis.

ESPECIALIDADES: Iniciantes (Couch to 5K, base aeróbica), Intermediários (pace, resistência, 5K-21K), Avançados (periodização, VO2max, pacing), Tópicos gerais (técnica, nutrição, lesões, equipamentos).

ESTILO: Linguagem clara e técnica quando necessário. Tom encorajador e empático. Baseado em ciência. Use emojis moderadamente. Exemplos práticos.

SEGURANÇA: SEMPRE priorize saúde. Recomende médico em dores persistentes, sintomas cardiovasculares ou lesões. NUNCA dê diagnósticos. Incentive progressão gradual (regra dos 10%).

IMPORTANTE: Responda SEMPRE em PORTUGUÊS BRASILEIRO.`;

const COACH_PERSONALITIES = {
  maya: {
    name: "Maya",
    systemPrompt: `${UNIFIED_COACH_PROMPT}\n\nIDENTIDADE: Você é a MAYA, coach de corrida mulher. Use pronomes femininos ao falar de si.`,
  },
  luca: {
    name: "Luca",
    systemPrompt: `${UNIFIED_COACH_PROMPT}\n\nIDENTIDADE: Você é o LUCA, coach de corrida homem. Use pronomes masculinos ao falar de si.`,
  },
};

class NvidiaAIService {
  private client: AxiosInstance;
  private apiKey: string;
  private model: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY ?? "";
    this.model = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-8b-instruct";
    this.enabled = process.env.AI_COACH_ENABLED === "true";

    if (!this.apiKey && this.enabled) {
      console.warn("⚠️  NVIDIA_API_KEY not set. AI coaches disabled.");
      this.enabled = false;
    }

    this.client = axios.create({
      baseURL: process.env.NVIDIA_API_URL ?? "https://integrate.api.nvidia.com/v1",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      timeout: 9000, // 9s — Vercel Hobby has 10s max execution time
    });
  }

  isEnabled(): boolean { return this.enabled; }

  private buildMessages(coach: CoachType, userMessage: string, history?: ChatMessage[]): ChatMessage[] {
    const messages: ChatMessage[] = [{ role: "system", content: COACH_PERSONALITIES[coach].systemPrompt }];
    if (history?.length) messages.push(...history.filter((m) => m.role !== "system"));
    messages.push({ role: "user", content: userMessage });
    return messages;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.enabled) throw new Error("AI Coach not enabled. Configure NVIDIA_API_KEY.");
    const messages = this.buildMessages(request.coach, request.message, request.conversationHistory);
    const response = await this.client.post("/chat/completions", {
      model: this.model, messages, temperature: 0.7, top_p: 0.9, max_tokens: 512, stream: false,
    });
    const aiResponse = response.data.choices[0]?.message?.content ?? "Desculpe, não consegui processar.";
    return { response: aiResponse, coach: request.coach, timestamp: new Date().toISOString(), tokensUsed: response.data.usage?.total_tokens };
  }

  getGreeting(coach: CoachType): string {
    return coach === "maya"
      ? "👋 Oi! Eu sou a Maya, sua coach de corrida! Como posso te ajudar hoje? 🏃‍♀️"
      : "👋 Olá! Sou o Luca, seu coach de corrida! Como posso te ajudar hoje? 🏃‍♂️";
  }

  getCoachInfo(coach: CoachType) {
    return { name: COACH_PERSONALITIES[coach].name, type: coach, greeting: this.getGreeting(coach) };
  }
}

export const nvidiaAIService = new NvidiaAIService();
export default nvidiaAIService;
