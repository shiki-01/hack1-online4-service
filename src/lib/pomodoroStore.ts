import { writable, derived, get } from 'svelte/store';

export type PomodoroPhase = 'idle' | 'work' | 'break';

export const pomodoroPhase = writable<PomodoroPhase>('idle');
export const pomodoroRemaining = writable<number>(0);
export const pomodoroLoop = writable<{ current: number; total: number }>({ current: 1, total: 10 });
export const isPaused = writable<boolean>(false);

export const pomodoroTimeDisplay = derived(pomodoroRemaining, ($r) =>
	`${String(Math.floor($r / 3600)).padStart(2, '0')}:${String(Math.floor(($r % 3600) / 60)).padStart(2, '0')}:${String($r % 60).padStart(2, '0')}`
);

export const pomodoroColor = derived(
	pomodoroPhase,
	($p) => ($p === 'work' ? '#e68938' : '#50c2fb')
);

// モジュールレベルで保持 → ページ遷移しても動き続ける
let _workMinutes = 25;
let _restMinutes = 5;
let _intervalId: ReturnType<typeof setInterval> | undefined;
let _paused = false;

function tick() {
	if (_paused) return;
	pomodoroRemaining.update((r) => {
		const next = r - 1;
		if (next > 0) return next;

		// インターバル終了
		const phase = get(pomodoroPhase);
		const loop = get(pomodoroLoop);

		if (phase === 'work') {
			if (loop.current >= loop.total) {
				// 全ループ完了
				clearInterval(_intervalId);
				_intervalId = undefined;
				pomodoroPhase.set('idle');
				return 0;
			}
			// 休憩へ
			pomodoroPhase.set('break');
			return _restMinutes * 60;
		} else {
			// 次の作業へ
			pomodoroLoop.update((l) => ({ ...l, current: l.current + 1 }));
			pomodoroPhase.set('work');
			return _workMinutes * 60;
		}
	});
}

export function startTimer(workMinutes: number, restMinutes: number, loopCount: number) {
	_workMinutes = workMinutes;
	_restMinutes = restMinutes;
	_paused = false;
	isPaused.set(false);

	clearInterval(_intervalId);
	pomodoroPhase.set('work');
	pomodoroRemaining.set(workMinutes * 60);
	pomodoroLoop.set({ current: 1, total: loopCount });

	if (typeof window !== 'undefined') {
		_intervalId = setInterval(tick, 1000);
	}
}

export function stopTimer() {
	clearInterval(_intervalId);
	_intervalId = undefined;
	_paused = false;
	isPaused.set(false);
	pomodoroPhase.set('idle');
	pomodoroRemaining.set(0);
}

export function togglePause() {
	_paused = !_paused;
	isPaused.set(_paused);
}

export function skipInterval() {
	const phase = get(pomodoroPhase);
	const loop = get(pomodoroLoop);

	if (phase === 'work') {
		if (loop.current >= loop.total) {
			stopTimer();
		} else {
			pomodoroPhase.set('break');
			pomodoroRemaining.set(_restMinutes * 60);
		}
	} else {
		pomodoroLoop.update((l) => ({ ...l, current: l.current + 1 }));
		pomodoroPhase.set('work');
		pomodoroRemaining.set(_workMinutes * 60);
	}
}
