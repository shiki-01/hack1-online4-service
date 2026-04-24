import { initializeApp, getApps, type FirebaseApp, type FirebaseError } from 'firebase/app';
import {
	getAuth,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithRedirect,
	getRedirectResult,
	setPersistence,
	indexedDBLocalPersistence,
	browserLocalPersistence,
	signOut,
	onAuthStateChanged,
	type User
} from 'firebase/auth';
import {
	initializeFirestore,
	getFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
	memoryLocalCache,
	collection,
	doc,
	addDoc,
	updateDoc,
	deleteDoc,
	getDocs,
	getDoc,
	query,
	where,
	serverTimestamp,
	type Timestamp
} from 'firebase/firestore';

// Firebase設定 — .env.local に VITE_FIREBASE_* 変数を追加してください
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp;
if (!getApps().length) {
	app = initializeApp(firebaseConfig);
} else {
	app = getApps()[0];
}

export const auth = getAuth(app);

const firestoreOptions = {
	localCache:
		typeof window === 'undefined'
			? memoryLocalCache()
			: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
};

let dbInstance;
try {
	dbInstance = initializeFirestore(app, firestoreOptions);
} catch (error) {
	const message = error instanceof Error ? error.message : '';
	if (message.includes('initializeFirestore() has already been called')) {
		dbInstance = getFirestore(app);
	} else {
		throw error;
	}
}

export const db = dbInstance;

// --- Auth helpers ---
const googleProvider = new GoogleAuthProvider();
const REDIRECT_PENDING_KEY = 'googleAuthRedirectPending';

function markRedirectPending(): void {
	if (typeof window === 'undefined') return;
	sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
}

function clearRedirectPending(): void {
	if (typeof window === 'undefined') return;
	sessionStorage.removeItem(REDIRECT_PENDING_KEY);
}

function hasRedirectPending(): boolean {
	if (typeof window === 'undefined') return false;
	return sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1';
}

function isMobileDevice(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function isPopupBlockedError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const firebaseError = error as FirebaseError;
	return firebaseError.code === 'auth/popup-blocked';
}

function getFirebaseErrorCode(error: unknown): string {
	if (!error || typeof error !== 'object') return '';
	const firebaseError = error as FirebaseError;
	return firebaseError.code ?? '';
}

export function getFirebaseErrorMessage(error: unknown): string {
	const code = getFirebaseErrorCode(error);
	if (code === 'auth/redirect-no-result') {
		return 'ログイン復帰に失敗しました。スマホの内蔵ブラウザでは失敗しやすいため、Chrome/Safariで直接このURLを開いて再試行してください。';
	}
	if (code === 'permission-denied') {
		return 'Firestore の権限が不足しています。Firebase コンソールの Security Rules を確認してください。';
	}
	if (code === 'auth/unauthorized-domain') {
		return 'このドメインは Firebase Authentication で未許可です。Authentication の承認済みドメインを確認してください。';
	}
	if (code === 'auth/operation-not-supported-in-this-environment') {
		return 'このブラウザ環境では Google ログインが使えません。別ブラウザでお試しください。';
	}
	if (code === 'auth/popup-blocked') {
		return 'ポップアップがブロックされました。ブラウザ設定を確認するか、再度ログインしてください。';
	}
	if (code === 'auth/network-request-failed') {
		return 'ネットワーク接続に失敗しました。通信状況を確認して再試行してください。';
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return '処理に失敗しました。時間をおいて再試行してください。';
}

async function ensureAuthPersistence(): Promise<void> {
	if (typeof window === 'undefined') return;
	try {
		await setPersistence(auth, indexedDBLocalPersistence);
	} catch {
		await setPersistence(auth, browserLocalPersistence);
	}
}

export async function completeRedirectSignIn(): Promise<User | null> {
	if (typeof window === 'undefined') return null;
	await ensureAuthPersistence();
	const result = await getRedirectResult(auth);
	if (result?.user) {
		clearRedirectPending();
		return result.user;
	}
	if (hasRedirectPending()) {
		clearRedirectPending();
		const error = Object.assign(new Error('Redirect sign-in returned no user'), {
			code: 'auth/redirect-no-result'
		}) as FirebaseError;
		throw error;
	}
	return result?.user ?? null;
}

export async function signInWithGoogle(): Promise<User | null> {
	await ensureAuthPersistence();

	try {
		const result = await signInWithPopup(auth, googleProvider);
		clearRedirectPending();
		return result.user;
	} catch (error) {
		const code = getFirebaseErrorCode(error);
		const shouldFallbackToRedirect =
			isPopupBlockedError(error) ||
			code === 'auth/popup-closed-by-user' ||
			code === 'auth/operation-not-supported-in-this-environment' ||
			isMobileDevice();

		if (shouldFallbackToRedirect) {
			markRedirectPending();
			await signInWithRedirect(auth, googleProvider);
			return null;
		}
		throw error;
	}
}

export async function signOutUser(): Promise<void> {
	await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
	return onAuthStateChanged(auth, callback);
}

// --- Task型 ---
export interface Task {
	id?: string;
	userId: string;
	title: string;
	description: string;
	priority: 'low' | 'medium' | 'high';
	category: string;
	dueDate: Timestamp | null;
	status: 'pending' | 'in_progress' | 'completed' | 'archived';
	subtasks: { text: string; checked: boolean }[];
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
}

// --- Firestore CRUD ---
export async function createTask(
	task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
	const ref = await addDoc(collection(db, 'tasks'), {
		...task,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
	return ref.id;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
	const ref = doc(db, 'tasks', taskId);
	await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTask(taskId: string): Promise<void> {
	await deleteDoc(doc(db, 'tasks', taskId));
}

export async function getTask(taskId: string): Promise<Task | null> {
	const snap = await getDoc(doc(db, 'tasks', taskId));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() } as Task;
}

export async function getUserTasks(userId: string): Promise<Task[]> {
	const q = query(collection(db, 'tasks'), where('userId', '==', userId));
	const snap = await getDocs(q);
	return snap.docs
		.map((d) => ({ id: d.id, ...d.data() }) as Task)
		.sort((a, b) => {
			const aMs = a.createdAt?.toMillis() ?? 0;
			const bMs = b.createdAt?.toMillis() ?? 0;
			return bMs - aMs;
		});
}
