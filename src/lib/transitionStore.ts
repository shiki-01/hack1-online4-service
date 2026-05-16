import { writable } from 'svelte/store';

/**
 * 現在進行中のページ遷移情報
 * beforeNavigate で from/to がセットされる
 */
export const pageTransition = writable<{ from: string; to: string } | null>(null);
