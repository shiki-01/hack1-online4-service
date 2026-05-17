/**
 * アプリ内の静的ページルート一覧。
 * resolve() の引数や goto() の行き先を型安全にするために使用する。
 *
 * 動的ルート（/table/[id] など）はここに含まない。
 * 新しいページを追加したら、対応するエントリを追加すること。
 */
export type AppRoute =
	| '/'
	| '/clock'
	| '/stack'
	| '/pomodoro'
	| '/table'
	| '/settings'
	| '/settings/wifi'
	| '/settings/qr'
	| '/setup';

/**
 * 水平スライドナビゲーションで移動するルート。
 * +layout.svelte の modes 配列のエントリに対応する。
 */
export type HorizontalRoute = '/clock' | '/stack' | '/pomodoro';

/**
 * 垂直スワイプで開くルート。
 * +layout.svelte の verticalRoutes 配列のエントリに対応する。
 */
export type VerticalRoute = '/table';
