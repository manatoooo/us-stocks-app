"use client";

import { useEffect, useState } from "react";
import {
  computeTtm,
  formatShares,
  formatUsd,
  type Fundamentals,
} from "@/lib/edgar/companyfacts-types";

function fmtEps(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return `$${v.toFixed(2)}`;
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: Fundamentals | null }
  | { status: "error"; message: string };

export function FundamentalsView({ cik }: { cik: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let aborted = false;
    setState({ status: "loading" });
    fetch(`/api/fundamentals/${encodeURIComponent(cik)}`)
      .then(async (res) => {
        const json = await res.json();
        if (aborted) return;
        if (json.error) {
          setState({ status: "error", message: json.error.message });
        } else {
          setState({ status: "ready", data: json.data as Fundamentals | null });
        }
      })
      .catch((e: unknown) => {
        if (aborted) return;
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "unknown error",
        });
      });
    return () => {
      aborted = true;
    };
  }, [cik]);

  if (state.status === "loading") {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
        ファンダメンタルを取得中…（SEC EDGAR XBRL は1社あたり数MB のため初回は数秒かかります）
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        ファンダメンタルの取得に失敗しました: {state.message}
      </div>
    );
  }

  const fundamentals = state.data;
  if (!fundamentals) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
        SEC EDGAR XBRL からファンダメンタルを取得できませんでした（小型株・新規上場株などで未提供の場合があります）。
      </div>
    );
  }

  const revenueTtm = computeTtm(fundamentals.revenue);
  const netIncomeTtm = computeTtm(fundamentals.netIncome);
  const epsTtm =
    computeTtm(fundamentals.epsDiluted) ?? computeTtm(fundamentals.epsBasic);
  const opCfTtm = computeTtm(fundamentals.operatingCashFlow);
  const lastShares = fundamentals.sharesOutstanding[0]?.val ?? null;
  const lastAssets = fundamentals.assets[0]?.val ?? null;
  const lastLiabilities = fundamentals.liabilities[0]?.val ?? null;
  const lastCash = fundamentals.cashAndEquivalents[0]?.val ?? null;
  const lastEps =
    fundamentals.epsDiluted[0] ?? fundamentals.epsBasic[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            主要指標（TTM = 直近12ヶ月）
          </h3>
          <span className="text-xs text-slate-400">出典: SEC EDGAR XBRL</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Metric label="売上 (TTM)" value={formatUsd(revenueTtm)} />
          <Metric label="純利益 (TTM)" value={formatUsd(netIncomeTtm)} />
          <Metric label="EPS希薄化後 (TTM)" value={fmtEps(epsTtm)} />
          <Metric label="営業CF (TTM)" value={formatUsd(opCfTtm)} />
        </dl>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">直近B/S</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Metric label="総資産" value={formatUsd(lastAssets)} />
          <Metric label="総負債" value={formatUsd(lastLiabilities)} />
          <Metric label="現預金" value={formatUsd(lastCash)} />
          <Metric label="発行済株式数" value={formatShares(lastShares)} />
        </dl>
      </div>

      {fundamentals.epsDiluted.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            EPS推移（最新8期）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="px-2 py-1 font-medium">決算期末</th>
                  <th className="px-2 py-1 font-medium">FY/FP</th>
                  <th className="px-2 py-1 font-medium">Form</th>
                  <th className="px-2 py-1 text-right font-medium">EPS希薄化後</th>
                  <th className="px-2 py-1 text-right font-medium">EPS基本</th>
                </tr>
              </thead>
              <tbody>
                {fundamentals.epsDiluted.map((d, i) => {
                  const basic = fundamentals.epsBasic.find(
                    (b) => b.end === d.end,
                  );
                  return (
                    <tr key={`${d.end}_${i}`} className="border-t border-slate-100">
                      <td className="px-2 py-1 font-mono text-slate-700">{d.end}</td>
                      <td className="px-2 py-1 text-slate-600">
                        {d.fy ? `FY${d.fy}` : "—"} {d.fp ?? ""}
                      </td>
                      <td className="px-2 py-1 text-slate-600">{d.form ?? "—"}</td>
                      <td className="px-2 py-1 text-right font-mono text-slate-900">
                        {fmtEps(d.val)}
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-slate-700">
                        {fmtEps(basic?.val ?? null)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {lastEps && (
            <p className="mt-2 text-xs text-slate-400">
              最新値の対象期: {lastEps.end} / Form {lastEps.form ?? "—"}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400">
        SEC EDGAR の XBRL タグ（us-gaap:Revenues / NetIncomeLoss / EarningsPerShareDiluted 等）から自動算出。原文は各フィリングをご確認ください。
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-mono text-base font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
