# Comprehensive Shadcn/UI Charts Documentation

## Overview

**Shadcn/ui Charts** is a comprehensive collection of ready-to-use chart components built on top of **Recharts** - a powerful React charting library based on D3.js[^1][^2]. This system provides beautiful, responsive, and accessible charts that integrate seamlessly with the Shadcn/ui design system[^1][^2][^3].

The chart components are designed with **composition** in mind, allowing developers to build custom charts using Recharts components while only bringing in custom Shadcn components when needed[^1][^2]. Importantly, these charts do not wrap Recharts, meaning you're not locked into an abstraction and can follow official Recharts upgrade paths[^1][^2].

## Installation

### CLI Installation (Recommended)

Install the chart component using the Shadcn CLI[^1][^2]:

```bash
# pnpm
pnpm dlx shadcn@latest add chart

# npm  
npx shadcn@latest add chart

# yarn
yarn dlx shadcn@latest add chart

# bun
bunx shadcn@latest add chart
```


### Manual Installation

If you prefer manual setup[^2]:

1. **Install dependencies:**
```bash
pnpm add recharts
```

2. **Create the chart component** at `components/ui/chart.tsx` with the complete component code (provided in the documentation)

### CSS Configuration

Add the required chart color variables to your `app/globals.css` file[^1][^2]:

```css
@layer base {
  :root {
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
  }
  
  .dark {
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
  }
}
```


## Core Components

### ChartContainer

The main wrapper component that provides theming and responsive behavior[^1][^2]:

```typescript
import { ChartContainer, ChartConfig } from "@/components/ui/chart"

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  {/* Your chart components */}
</ChartContainer>
```

**Key Props:**

- `config`: ChartConfig object defining labels, icons, and colors
- `className`: CSS classes (must include `min-h-[VALUE]` for responsiveness)


### ChartTooltip \& ChartTooltipContent

Custom tooltip components with built-in styling[^1][^2]:

```typescript
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

<ChartTooltip content={<ChartTooltipContent />} />
```

**ChartTooltipContent Props:**

- `indicator`: `"dot"` | `"line"` | `"dashed"` - Visual indicator style
- `hideLabel`: boolean - Hide tooltip label
- `hideIndicator`: boolean - Hide visual indicator
- `labelKey`: string - Custom key for tooltip label
- `nameKey`: string - Custom key for tooltip names


### ChartLegend \& ChartLegendContent

Legend components for chart data series[^1][^2]:

```typescript
import { ChartLegend, ChartLegendContent } from "@/components/ui/chart"

<ChartLegend content={<ChartLegendContent />} />
```

**ChartLegendContent Props:**

- `hideIcon`: boolean - Hide legend icons
- `nameKey`: string - Custom key for legend names
- `verticalAlign`: `"top"` | `"bottom"` - Legend position


## Chart Configuration

### ChartConfig Structure

The `ChartConfig` object defines labels, icons, and colors for your charts[^1][^2]:

```typescript
import { Monitor } from "lucide-react"
import { type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
  desktop: {
    label: "Desktop",
    icon: Monitor,
    color: "#2563eb",
    // OR use theme object for light/dark mode
    theme: {
      light: "#2563eb",
      dark: "#dc2626",
    },
  },
  mobile: {
    label: "Mobile", 
    color: "#60a5fa",
  },
} satisfies ChartConfig
```


### Data Structure

Chart data can be in any shape - use the `dataKey` prop to map your data[^1][^2]:

```typescript
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  // ...
]
```


## Chart Types

### Bar Charts

Bar charts support multiple variations including horizontal, stacked, and interactive modes[^4]:

```typescript
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <BarChart accessibilityLayer data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis
      dataKey="month"
      tickLine={false}
      tickMargin={10}
      axisLine={false}
      tickFormatter={(value) => value.slice(0, 3)}
    />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
  </BarChart>
</ChartContainer>
```

**Bar Chart Variants:**

- **Standard**: Basic vertical bars
- **Horizontal**: Rotated bar orientation
- **Multiple**: Multiple data series
- **Stacked**: Stacked bars with legend
- **Interactive**: User interaction capabilities
- **With Labels**: Data labels on bars
- **Custom Labels**: Formatted data labels
- **Mixed**: Combined with other chart types
- **Active**: Highlighted active segments
- **Negative**: Supporting negative values


### Area Charts

Area charts display data as filled areas, ideal for showing trends over time[^5]:

```typescript
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <AreaChart accessibilityLayer data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Area 
      dataKey="desktop" 
      type="natural"
      fill="var(--color-desktop)"
      stroke="var(--color-desktop)"
      stackId="a"
    />
    <Area 
      dataKey="mobile"
      type="natural" 
      fill="var(--color-mobile)"
      stroke="var(--color-mobile)"
      stackId="a"
    />
  </AreaChart>
</ChartContainer>
```

**Area Chart Variants:**

- **Basic**: Standard filled area
- **Interactive**: Interactive selection
- **Linear**: Linear interpolation
- **Step**: Step-based interpolation
- **Legend**: With legend component
- **Stacked**: Multiple stacked areas
- **Stacked Expanded**: Percentage-based stacking
- **Icons**: With icon indicators
- **Gradient**: Gradient fills
- **Axes**: Custom axis configuration


### Line Charts

Line charts connect data points with lines, perfect for showing trends:

```typescript
import { Line, LineChart, CartesianGrid, XAxis } from "recharts"

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <LineChart accessibilityLayer data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line 
      dataKey="desktop"
      type="monotone"
      stroke="var(--color-desktop)"
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ChartContainer>
```

**Line Chart Variants:**

- **Basic**: Standard line chart
- **Interactive**: Interactive selection
- **Linear**: Linear interpolation
- **Step**: Step interpolation
- **Multiple**: Multiple data series
- **With Dots**: Visible data points
- **Custom Dots**: Styled data points
- **Dot Colors**: Colored data points
- **With Labels**: Data labels
- **Custom Labels**: Formatted labels


### Pie Charts

Pie charts display data as circular segments:

```typescript
import { Pie, PieChart } from "recharts"

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <PieChart>
    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
    <Pie
      data={chartData}
      dataKey="value"
      nameKey="category"
      outerRadius={60}
      fill="var(--color-default)"
    />
  </PieChart>
</ChartContainer>
```

**Pie Chart Variants:**

- **Basic**: Standard pie chart
- **No Separator**: Without segment separators
- **With Labels**: Data labels on segments
- **Custom Labels**: Formatted labels
- **Label List**: External label list
- **With Legend**: Legend component
- **Donut**: Hollow center (donut chart)
- **Donut Active**: Interactive donut
- **Donut with Text**: Central text display
- **Stacked**: Multiple pie layers
- **Interactive**: User interaction


### Radar Charts

Radar charts display multivariate data on radial axes:

```typescript
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <RadarChart data={chartData}>
    <ChartTooltip content={<ChartTooltipContent />} />
    <PolarGrid />
    <PolarAngleAxis dataKey="category" />
    <PolarRadiusAxis />
    <Radar 
      dataKey="value"
      fill="var(--color-desktop)"
      fillOpacity={0.6}
    />
  </RadarChart>
</ChartContainer>
```

**Radar Chart Variants:**

- **Basic**: Standard radar chart
- **With Dots**: Visible data points
- **Lines Only**: Only connecting lines
- **Custom Labels**: Custom axis labels
- **Grid Custom**: Custom grid styling
- **Grid None**: No grid lines
- **Grid Circle**: Circular grid
- **Grid Circle No Lines**: Circular grid without radial lines
- **Grid Circle Filled**: Filled circular grid
- **Grid Filled**: Filled grid areas
- **Multiple**: Multiple data series
- **With Legend**: Legend component


### Radial Charts

Radial charts display data in circular/radial format:

```typescript
import { RadialBar, RadialBarChart } from "recharts"

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <RadialBarChart data={chartData}>
    <ChartTooltip content={<ChartTooltipContent />} />
    <RadialBar dataKey="value" fill="var(--color-desktop)" />
  </RadialBarChart>
</ChartContainer>
```

**Radial Chart Variants:**

- **Basic**: Standard radial bar
- **With Labels**: Data labels
- **With Grid**: Grid lines
- **With Text**: Central text
- **Custom Shape**: Custom bar shapes
- **Stacked**: Multiple radial layers


## Theming \& Colors

### CSS Variables (Recommended)

Define colors in your CSS file and reference them in chart config[^1][^2]:

```css
:root {
  --chart-primary: oklch(0.646 0.222 41.116);
  --chart-secondary: oklch(0.6 0.118 184.704);
}

.dark {
  --chart-primary: oklch(0.488 0.243 264.376);
  --chart-secondary: oklch(0.696 0.17 162.48);
}
```

```typescript
const chartConfig = {
  primary: {
    label: "Primary",
    color: "var(--chart-primary)",
  },
  secondary: {
    label: "Secondary", 
    color: "var(--chart-secondary)",
  },
} satisfies ChartConfig
```


### Direct Color Values

You can also use direct color values in any format[^1][^2]:

```typescript
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb", // hex
    // color: "hsl(220, 98%, 61%)", // hsl
    // color: "oklch(0.646 0.222 41.116)", // oklch
  },
} satisfies ChartConfig
```


### Using Colors

Reference colors using the format `var(--color-KEY)`[^1][^2]:

**In Components:**

```typescript
<Bar dataKey="desktop" fill="var(--color-desktop)" />
```

**In Chart Data:**

```typescript
const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
]
```

**In Tailwind Classes:**

```typescript
<div className="fill-[--color-desktop]" />
```


## Tooltips

### Tooltip Components

Charts include custom tooltip components with consistent styling[^1][^2]:

```typescript
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

<ChartTooltip content={<ChartTooltipContent />} />
```


### Tooltip Customization

Customize tooltip appearance and behavior[^1][^2]:

```typescript
<ChartTooltip 
  content={
    <ChartTooltipContent 
      indicator="dot"
      hideLabel={false}
      hideIndicator={false}
      labelKey="custom-label-key"
      nameKey="custom-name-key"
    />
  } 
/>
```

**Tooltip Features:**

- **Label**: Chart/data labels
- **Name**: Series names
- **Indicator**: Visual indicators (dot, line, dashed)
- **Value**: Data values
- **Custom Keys**: Custom label and name keys
- **Styling**: Consistent theme-based styling


### Tooltip Variants

The documentation showcases various tooltip styles:

- **Default**: Standard tooltip with all elements
- **Line Indicator**: Line-style indicators
- **No Indicator**: Hidden indicators
- **Custom Label**: Custom label formatting
- **Label Formatter**: Custom label formatting function
- **No Label**: Hidden labels
- **Formatter**: Custom value formatting
- **Icons**: Icon indicators
- **Advanced**: Advanced formatting with totals


## Legends

### Legend Components

Add legends to identify chart data series[^1][^2]:

```typescript
import { ChartLegend, ChartLegendContent } from "@/components/ui/chart"

<ChartLegend content={<ChartLegendContent />} />
```


### Legend Customization

Control legend appearance and behavior[^1][^2]:

```typescript
<ChartLegend 
  content={
    <ChartLegendContent 
      hideIcon={false}
      nameKey="custom-name-key"
    />
  }
/>
```


## Accessibility

### Accessibility Layer

Enable keyboard and screen reader support[^1][^2]:

```typescript
<BarChart accessibilityLayer data={chartData}>
  {/* chart components */}
</BarChart>
```

The `accessibilityLayer` prop adds:

- **Keyboard navigation**: Navigate chart elements with keyboard
- **Screen reader support**: Proper ARIA labels and descriptions
- **Focus management**: Proper focus indicators


## Advanced Features

### Interactive Charts

Many chart variants support interactivity:

- **Selection**: User can select data points/segments
- **Hover effects**: Visual feedback on hover
- **Filtering**: Interactive data filtering
- **Zooming**: Chart zoom capabilities
- **Real-time updates**: Dynamic data updates


### Responsive Design

Charts are responsive by default when using proper configuration[^1][^2]:

```typescript
<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <ResponsiveContainer>
    {/* chart components */}
  </ResponsiveContainer>
</ChartContainer>
```


### Performance Considerations

- Charts use **SVG rendering** for crisp display at any resolution[^3]
- **Lightweight dependencies** with minimal D3 submodules[^3]
- **Efficient re-rendering** through React optimization
- **Lazy loading** capabilities for large datasets


## Best Practices

### Data Structure

- Keep data in consistent format across charts
- Use meaningful key names for `dataKey` props
- Normalize data ranges for better visual representation
- Handle missing or null values appropriately


### Configuration

- Define comprehensive `ChartConfig` objects
- Use semantic color names in configuration
- Leverage CSS variables for consistent theming
- Include proper labels for accessibility


### Performance

- Set appropriate `min-h-[VALUE]` for responsive behavior[^1][^2]
- Use `accessibilityLayer` for better user experience[^1][^2]
- Optimize data processing before passing to charts
- Consider virtualization for very large datasets


### Styling

- Follow the design system color patterns
- Maintain consistent spacing and typography
- Test charts in both light and dark themes
- Ensure sufficient color contrast for accessibility

This comprehensive documentation covers all aspects of using Shadcn/ui Charts, from basic installation to advanced customization. The system provides a powerful, flexible, and accessible charting solution that integrates seamlessly with modern React applications while maintaining the high-quality design standards of the Shadcn/ui ecosystem[^1][^2][^3][^6][^7].

<div style="text-align: center">⁂</div>

[^1]: https://ui.shadcn.com/docs/components/chart

[^2]: https://v3.shadcn.com/docs/components/chart

[^3]: https://www.npmjs.com/package/recharts

[^4]: https://ui.shadcn.com/charts/bar

[^5]: https://ui.shadcn.com/charts/area

[^6]: https://ui.shadcn.com

[^7]: https://www.youtube.com/watch?v=VQZ1fqRyVFA

[^8]: https://ui.shadcn.com/charts/line

[^9]: https://ui.shadcn.com/charts/radar

[^10]: https://ui.shadcn.com/charts/pie

[^11]: https://ui.shadcn.com/charts/tooltip

[^12]: https://ui.shadcn.com/charts/radial

[^13]: https://github.com/oladetoungee/shadcn-charts-demo

[^14]: https://ui.shadcn.com/docs

[^15]: https://www.youtube.com/watch?v=FeNdnyD_ynM

[^16]: https://gist.github.com/cummings/319582031398b8a32080c51c6f3568ea

[^17]: https://ui.shadcn.com/docs/installation/manual

[^18]: https://www.youtube.com/watch?v=Ypez5_h2WCY

[^19]: https://app-generator.dev/docs/technologies/nextjs/shadcn-components.html

[^20]: https://ui.shadcn.com/docs/installation

[^21]: https://ui.shadcn.com/docs/components

[^22]: https://www.youtube.com/watch?v=PVSFGnuI_UA

[^23]: https://github.com/birobirobiro/awesome-shadcn-ui

[^24]: https://app.daily.dev/posts/react-charts-in-shadcn-ui-wlo52othp

[^25]: https://recharts.org

[^26]: https://github.com/nisabmohd/charts-react-shadcn/

[^27]: https://recharts.org/

