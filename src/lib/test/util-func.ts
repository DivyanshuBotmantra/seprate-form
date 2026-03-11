import type { botApiResponse } from "../mockBotData"; // or type from your API

export function getBotStatusPieData(apiResponse: any) {
  const aggregated = apiResponse.response_body.reduce(
    (acc: Record<string, { name: string; value: number }>, bot: any) => {
      const status = bot.bot_status || "UNKNOWN";
      if (!acc[status]) acc[status] = { name: status, value: 0 };
      acc[status].value += 1;
      return acc;
    },
    {}
  );

  return Object.values(aggregated);
}
