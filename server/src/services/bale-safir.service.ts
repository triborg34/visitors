import { randomUUID } from 'node:crypto';
import { isValidIranianMobile, toInternationalMobile } from '../utils/persian';

const SAFIR_SEND_URL = 'https://safir.bale.ai/api/v3/send_message';

export async function sendBaleSafirMessage(input: {
  apiAccessKey: string;
  botId: string;
  phoneNumber: string;
  text: string;
}): Promise<{ messageId: string | null; error: string | null }> {
  if (!/^\d+$/.test(input.botId) || Number(input.botId) <= 0) {
    return { messageId: null, error: 'شناسهٔ بات سفیر معتبر نیست.' };
  }
  if (!isValidIranianMobile(input.phoneNumber)) {
    return { messageId: null, error: 'شمارهٔ موبایل گیرنده معتبر نیست.' };
  }

  try {
    const response = await fetch(SAFIR_SEND_URL, {
      method: 'POST',
      headers: {
        'api-access-key': input.apiAccessKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: randomUUID(),
        bot_id: Number(input.botId),
        phone_number: toInternationalMobile(input.phoneNumber),
        message_data: { message: { text: input.text } },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const result = (await response.json().catch(() => ({}))) as {
      message_id?: string | number;
      error_data?: null | string | { message?: string; description?: string };
    };
    if (response.ok && result.message_id && (result.error_data === null || result.error_data === undefined)) {
      return { messageId: String(result.message_id), error: null };
    }

    const error = typeof result.error_data === 'string'
      ? result.error_data
      : result.error_data?.message ?? result.error_data?.description ?? `ارسال سفیر موفق نبود (HTTP ${response.status}).`;
    return { messageId: null, error };
  } catch (cause) {
    const error = cause instanceof Error && cause.name === 'TimeoutError'
      ? 'مهلت پاسخ‌گویی سفیر به پایان رسید.'
      : cause instanceof Error
        ? cause.message
        : 'خطای ارتباط با سفیر.';
    return { messageId: null, error };
  }
}
