import { useEffect, useRef } from "preact/hooks";
import { createChart, HistogramSeries, type IChartApi, type Time } from "lightweight-charts";
import { CHART_THEME } from "./theme";

export type BarPoint = { time: Time; value: number; color?: string };

type Props = {
  data: BarPoint[];
  height?: number;
  timeLabelFormatter?: (time: Time) => string;
};

export default function BarChart({ data, height = 220, timeLabelFormatter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: CHART_THEME.textColor,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: CHART_THEME.gridColor },
      },
      rightPriceScale: { borderColor: CHART_THEME.borderColor },
      timeScale: {
        borderColor: CHART_THEME.borderColor,
        ...(timeLabelFormatter ? { tickMarkFormatter: timeLabelFormatter } : {}),
      },
      ...(timeLabelFormatter
        ? { localization: { timeFormatter: timeLabelFormatter } }
        : {}),
    });
    chartRef.current = chart;

    const series = chart.addSeries(HistogramSeries, {
      color: CHART_THEME.primary,
      base: 0,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    series.setData(data);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, timeLabelFormatter]);

  return <div ref={containerRef} style={{ width: "100%", height: `${height}px` }} />;
}
