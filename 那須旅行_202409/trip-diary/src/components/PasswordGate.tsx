import { useEffect, useState, type FormEvent } from "react";
import * as CryptoJS from "crypto-js";
import type { TripData } from "../types/trip";

const SESSION_KEY = "trip-diary-password";

interface PasswordGateProps {
  onUnlock: (data: TripData) => void;
}

async function fetchCiphertext(): Promise<string> {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`データの取得に失敗しました (HTTP ${res.status})`);
  }
  const { ciphertext } = (await res.json()) as { ciphertext: string };
  return ciphertext;
}

function decrypt(ciphertext: string, password: string): TripData | null {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (!plaintext) {
      return null;
    }
    return JSON.parse(plaintext) as TripData;
  } catch {
    return null;
  }
}

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    fetchCiphertext()
      .then((ciphertext) => {
        const data = decrypt(ciphertext, stored);
        if (data) {
          onUnlock(data);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const ciphertext = await fetchCiphertext();
      const data = decrypt(ciphertext, password);
      if (!data) {
        setError("パスワードが違います");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, password);
      onUnlock(data);
    } catch {
      setError("データの取得に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-400 via-emerald-300 to-amber-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur"
      >
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-800">旅行のしおり</h1>
        <p className="mb-6 text-center text-sm text-slate-500">合言葉を入力してください</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoFocus
          className="mb-3 w-full rounded-lg border border-slate-300 px-4 py-2 text-center focus:border-sky-500 focus:outline-none"
        />
        {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="w-full rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {submitting ? "確認中..." : "開く"}
        </button>
      </form>
    </div>
  );
}
