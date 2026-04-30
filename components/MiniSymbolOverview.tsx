"use client";

import { useEffect, useRef } from "react";

type Props = {
  ticker: string;
  exchange?: string;
  height?: number;
};

export function MiniSymbolOverview({
  ticker,
  exchange = "NASDAQ",
  height = 220,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetWrapper = document.createElement("div");
    widgetWrapper.className = "tradingview-widget-container__widget";
    container.appendChild(widgetWrapper);

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright text-[10px] text-slate-400 mt-1";
    copyright.innerHTML =
      '<a href="https://jp.tradingview.com/" rel="noopener nofollow" target="_blank"><span>TradingView提供</span></a>';
    container.appendChild(copyright);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: `${exchange}:${ticker}`,
      width: "100%",
      height,
      locale: "ja",
      dateRange: "12M",
      colorTheme: "light",
      isTransparent: false,
      autosize: false,
      largeChartUrl: "",
      chartOnly: false,
    });
    container.appendChild(script);
  }, [ticker, exchange, height]);

  return (
    <div className="tradingview-widget-container w-full" ref={containerRef} />
  );
}
