"use client";

import { useEffect, useRef } from "react";

type Props = {
  height?: number;
};

// S&P 500 セクター別ヒートマップ（時価総額×当日騰落）
export function TradingViewHeatmap({ height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetWrapper = document.createElement("div");
    widgetWrapper.className = "tradingview-widget-container__widget";
    widgetWrapper.style.height = `${height}px`;
    widgetWrapper.style.width = "100%";
    container.appendChild(widgetWrapper);

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright text-xs text-slate-400 mt-2";
    copyright.innerHTML =
      '<a href="https://jp.tradingview.com/markets/stocks-usa/sectorandindustry-sector/" rel="noopener nofollow" target="_blank"><span>米国セクター市況（TradingView提供）</span></a>';
    container.appendChild(copyright);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "ja",
      symbolUrl: "",
      colorTheme: "light",
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height,
    });
    container.appendChild(script);
  }, [height]);

  return (
    <div className="tradingview-widget-container w-full" ref={containerRef} />
  );
}
