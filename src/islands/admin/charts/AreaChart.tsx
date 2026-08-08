import { useEffect, useRef } from "preact/hooks";
import {
  createChart,
  AreaSeries,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { CHART_THEME } from "./theme";

export type SeriesPoint = { time: Time; value: number };

type Props = {
  data: SeriesPoint[];
  compareData?: SeriesPoint[];
  height?: number;
  timeLabelFormatter?: (time: Time) => string;
};

export default function AreaChart({ data, compareData, height = 260, timeLabelFormatter }: Props) {
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
      crosshair: { mode: CrosshairMode.Magnet },
      ...(timeLabelFormatter
        ? { localization: { timeFormatter: timeLabelFormatter } }
        : {}),
    });
    chartRef.current = chart;

    const mainSeries = chart.addSeries(AreaSeries, {
      lineColor: CHART_THEME.primary,
      topColor: CHART_THEME.primaryFill,
      bottomColor: CHART_THEME.primaryFillSoft,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    mainSeries.setData(data);

    if (compareData?.length) {
      const compareSeries = chart.addSeries(AreaSeries, {
        lineColor: CHART_THEME.secondary,
        topColor: CHART_THEME.secondaryFillSoft,
        bottomColor: "rgba(113,113,122,0)",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      compareSeries.setData(compareData);
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, compareData, timeLabelFormatter]);

  return <div ref={containerRef} style={{ width: "100%", height: `${height}px` }} />;
}
