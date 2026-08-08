import { useEffect, useRef } from "preact/hooks";
import { createChart, LineSeries, type Time } from "lightweight-charts";
import { CHART_THEME } from "./theme";

type Props = {
  values: number[];
  color?: string;
  height?: number;
};

export default function Sparkline({ values, color = CHART_THEME.primary, height = 40 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || values.length < 2) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { color: "transparent" }, textColor: "transparent", attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: {
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    series.setData(values.map((value, index) => ({ time: (index + 1) as Time, value })));
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [values, color]);

  if (values.length < 2) return null;

  return <div ref={containerRef} style={{ width: "100%", height: `${height}px` }} />;
}
