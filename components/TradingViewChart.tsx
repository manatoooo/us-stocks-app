"use client";

import { useEffect, useRef } from "react";

type Props = {
  ticker: string;
  exchange?: string;
  height?: number;
};

export function TradingViewChart({
  ticker,
  exchange = "NASDAQ",
  height = 420,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const widgetWrapper = document.createElement("div");
    widgetWrapper.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetWrapper);

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright text-xs text-slate-400 mt-2";
    copyright.innerHTML =
      '<a href="https://jp.tradingview.com/" rel="noopener nofollow" target="_blank"><span>TradingViewの提供</span></a>';
    containerRef.current.appendChild(copyright);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [[`${exchange}:${ticker}`, `${exchange}:${ticker}|1Y`]],
      chartOnly: false,
      width: "100%",
      height,
      locale: "ja",
      colorTheme: "light",
      autosize: false,
      showVolume: true,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
    });
    containerRef.current.appendChild(script);
  }, [ticker, exchange, height]);

  return (
    <div className="tradingview-widget-container w-full" ref={containerRef} />
  );
}
