import type { Locale } from './languageStore';

export interface Strings {
	// settings
	settings: string;
	taskJson: string;
	langFiles: string;
	close: string;
	apply: string;
	save: string;
	arrayRequired: string;
	urgent: string;
	normal: string;
	relaxed: string;
	language: string;
	noLangFile: string;
	langFileLoaded: string;
	// deadline labels
	dueNone: string;
	overdue: string;
	today: string;
	tomorrow: string;
	daysLater: (n: number) => string;
	// pomodoro / clock
	work: string;
	breakPhase: string;
	workTime: string;
	restTime: string;
	loopCount: string;
	// task detail
	noDescription: string;
	list: string;
	tasks: string;
	// date / calendar
	weekdays: string[];
	formatArcDate: (date: Date) => string;
}

const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DE_MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const ES_MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const FR_MONTHS = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];

const translations: Record<Locale, Strings> = {
	ja: {
		settings: '設定',
		taskJson: 'タスク JSON',
		langFiles: '言語ファイル',
		close: '閉じる',
		apply: '適用',
		save: '保存',
		arrayRequired: '配列が必要です',
		urgent: '緊急',
		normal: '普通',
		relaxed: '余裕',
		language: '言語',
		noLangFile: 'ファイル未登録',
		langFileLoaded: '読み込み済み',
		dueNone: '期限なし',
		overdue: '期限切れ',
		today: '今日',
		tomorrow: '明日',
		daysLater: (n) => `${n}日後`,
		work: '作業中',
		breakPhase: '休憩中',
		workTime: '作業時間(分)',
		restTime: '休憩時間(分)',
		loopCount: 'ループ回数',
		noDescription: '説明なし',
		list: '一覧',
		tasks: 'Task',
		weekdays: ['日','月','火','水','木','金','土'],
		formatArcDate: (d) => {
			const wd = ['日','月','火','水','木','金','土'][d.getDay()];
			return `${d.getMonth() + 1}月${d.getDate()}日 (${wd})`;
		},
	},
	en: {
		settings: 'Settings',
		taskJson: 'Task JSON',
		langFiles: 'Language Files',
		close: 'Close',
		apply: 'Apply',
		save: 'Save',
		arrayRequired: 'Array required',
		urgent: 'Urgent',
		normal: 'Normal',
		relaxed: 'Relaxed',
		language: 'Language',
		noLangFile: 'No file for this language yet',
		langFileLoaded: 'Loaded',
		dueNone: 'No deadline',
		overdue: 'Overdue',
		today: 'Today',
		tomorrow: 'Tomorrow',
		daysLater: (n) => `In ${n} day${n === 1 ? '' : 's'}`,
		work: 'Working',
		breakPhase: 'Break',
		workTime: 'Work time (min)',
		restTime: 'Break time (min)',
		loopCount: 'Loop count',
		noDescription: 'No description',
		list: 'List',
		tasks: 'Tasks',
		weekdays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
		formatArcDate: (d) => {
			const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
			return `${EN_MONTHS[d.getMonth()]} ${d.getDate()} (${wd})`;
		},
	},
	'zh-Hans': {
		settings: '设置',
		taskJson: '任务 JSON',
		langFiles: '语言文件',
		close: '关闭',
		apply: '应用',
		save: '保存',
		arrayRequired: '需要数组',
		urgent: '紧急',
		normal: '普通',
		relaxed: '充裕',
		language: '语言',
		noLangFile: '尚未添加此语言的文件',
		langFileLoaded: '已加载',
		dueNone: '无期限',
		overdue: '已过期',
		today: '今天',
		tomorrow: '明天',
		daysLater: (n) => `${n}天后`,
		work: '工作中',
		breakPhase: '休息中',
		workTime: '工作时间(分)',
		restTime: '休息时间(分)',
		loopCount: '循环次数',
		noDescription: '无描述',
		list: '列表',
		tasks: '任务',
		weekdays: ['日','一','二','三','四','五','六'],
		formatArcDate: (d) => {
			const wd = ['日','一','二','三','四','五','六'][d.getDay()];
			return `${d.getMonth() + 1}月${d.getDate()}日 (周${wd})`;
		},
	},
	'zh-Hant': {
		settings: '設置',
		taskJson: '任務 JSON',
		langFiles: '語言文件',
		close: '關閉',
		apply: '套用',
		save: '儲存',
		arrayRequired: '需要陣列',
		urgent: '緊急',
		normal: '普通',
		relaxed: '充裕',
		language: '語言',
		noLangFile: '尚未新增此語言的檔案',
		langFileLoaded: '已載入',
		dueNone: '無期限',
		overdue: '已逾期',
		today: '今天',
		tomorrow: '明天',
		daysLater: (n) => `${n}天後`,
		work: '工作中',
		breakPhase: '休息中',
		workTime: '工作時間(分)',
		restTime: '休息時間(分)',
		loopCount: '循環次數',
		noDescription: '無描述',
		list: '清單',
		tasks: '任務',
		weekdays: ['日','一','二','三','四','五','六'],
		formatArcDate: (d) => {
			const wd = ['日','一','二','三','四','五','六'][d.getDay()];
			return `${d.getMonth() + 1}月${d.getDate()}日 (週${wd})`;
		},
	},
	de: {
		settings: 'Einstellungen',
		taskJson: 'Aufgaben JSON',
		langFiles: 'Sprachdateien',
		close: 'Schließen',
		apply: 'Anwenden',
		save: 'Speichern',
		arrayRequired: 'Array erforderlich',
		urgent: 'Dringend',
		normal: 'Normal',
		relaxed: 'Entspannt',
		language: 'Sprache',
		noLangFile: 'Noch keine Datei für diese Sprache',
		langFileLoaded: 'Geladen',
		dueNone: 'Keine Frist',
		overdue: 'Überfällig',
		today: 'Heute',
		tomorrow: 'Morgen',
		daysLater: (n) => `In ${n} Tag${n === 1 ? '' : 'en'}`,
		work: 'Arbeitsphase',
		breakPhase: 'Pause',
		workTime: 'Arbeitszeit (Min)',
		restTime: 'Pausenzeit (Min)',
		loopCount: 'Schleifen',
		noDescription: 'Keine Beschreibung',
		list: 'Liste',
		tasks: 'Aufgaben',
		weekdays: ['So','Mo','Di','Mi','Do','Fr','Sa'],
		formatArcDate: (d) => {
			const wd = ['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()];
			return `${d.getDate()}. ${DE_MONTHS[d.getMonth()]} (${wd})`;
		},
	},
	es: {
		settings: 'Configuración',
		taskJson: 'Tareas JSON',
		langFiles: 'Archivos de idioma',
		close: 'Cerrar',
		apply: 'Aplicar',
		save: 'Guardar',
		arrayRequired: 'Se requiere array',
		urgent: 'Urgente',
		normal: 'Normal',
		relaxed: 'Relajado',
		language: 'Idioma',
		noLangFile: 'Sin archivo para este idioma aún',
		langFileLoaded: 'Cargado',
		dueNone: 'Sin fecha límite',
		overdue: 'Vencido',
		today: 'Hoy',
		tomorrow: 'Mañana',
		daysLater: (n) => `En ${n} día${n === 1 ? '' : 's'}`,
		work: 'Trabajando',
		breakPhase: 'Descanso',
		workTime: 'Trabajo (min)',
		restTime: 'Descanso (min)',
		loopCount: 'Repeticiones',
		noDescription: 'Sin descripción',
		list: 'Lista',
		tasks: 'Tareas',
		weekdays: ['Do','Lu','Ma','Mi','Ju','Vi','Sa'],
		formatArcDate: (d) => {
			const wd = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'][d.getDay()];
			return `${d.getDate()} ${ES_MONTHS[d.getMonth()]} (${wd})`;
		},
	},
	fr: {
		settings: 'Paramètres',
		taskJson: 'Tâches JSON',
		langFiles: 'Fichiers de langue',
		close: 'Fermer',
		apply: 'Appliquer',
		save: 'Enregistrer',
		arrayRequired: 'Tableau requis',
		urgent: 'Urgent',
		normal: 'Normal',
		relaxed: 'Détendu',
		language: 'Langue',
		noLangFile: 'Pas encore de fichier pour cette langue',
		langFileLoaded: 'Chargé',
		dueNone: 'Pas de date limite',
		overdue: 'En retard',
		today: "Aujourd'hui",
		tomorrow: 'Demain',
		daysLater: (n) => `Dans ${n} jour${n === 1 ? '' : 's'}`,
		work: 'En travail',
		breakPhase: 'Pause',
		workTime: 'Travail (min)',
		restTime: 'Pause (min)',
		loopCount: 'Boucles',
		noDescription: 'Sans description',
		list: 'Liste',
		tasks: 'Tâches',
		weekdays: ['Di','Lu','Ma','Me','Je','Ve','Sa'],
		formatArcDate: (d) => {
			const wd = ['Di','Lu','Ma','Me','Je','Ve','Sa'][d.getDay()];
			return `${d.getDate()} ${FR_MONTHS[d.getMonth()]} (${wd})`;
		},
	},
};

export function t(locale: Locale): Strings {
	return translations[locale] ?? translations.ja;
}
