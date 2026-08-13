import { env } from '../config/env.js';

const discordTimeoutMs = 3000;

export async function sendDiscordMessage(content) {
  if (!env.discordWebhookUrl) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), discordTimeoutMs);

  try {
    const response = await fetch(env.discordWebhookUrl, {
      body: JSON.stringify({ content }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('Discord notification failed:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Discord notification failed:', error.message);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
