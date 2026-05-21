# OMS Dashboard Plugin Examples

The core dashboard can be extended with plugins to add widgets, panels, or statistics, and by hiding existing core dashboard items to create the effect of replacement.

## Plugin Structure

Panel and statistic plugin components receive the context prop of it's parent level. Widgets are top-level and do not require a parent context.

Each exported object must include a `Component` property and may include an array to hide core dashboard items by context.

The `dashboard` property in the `Plugins` type interface defines how plugins can extend the dashboard at three levels:

- **widget**: Each object provides:
  - `Component`: The React component to render as a dashboard widget.
  - `hiddenWidgets?`: (optional) Array of context strings specifying core widgets to hide.

- **panel**: Each object provides:
  - `Component`: The React component to render as a dashboard panel. Receives a `widgetContext` prop.
  - `hiddenPanels?`: (optional) Array of context strings specifying core panels to hide.

- **statistic**: Each object provides:
  - `Component`: The React component to render as a dashboard statistic. Receives a `panelContext` prop.
  - `hiddenStats?`: (optional) Array of context strings specifying core statistics to hide.

## Rendering Plugin Components

Create a component that receives the relevant parent context prop. The component will only render if the defined context string (eg 'replenishment-inbound-shipments') matches the context prop, ensuring the plugin appears in the correct place in the dashboard hierarchy.

When creating nested items, export just the higher-level component (eg a panel) through the plugin interface. Child components (eg statistics) can be defined inline or imported to the parent. The order of components within the parent component determines their order in the plugin, which will always appear after core items.

```typescript
export const Component = ({ panelContext }: { panelContext: string }) => {

  if (panelContext !== 'replenishment-inbound-shipments') {
    return null;
  }

  return (
    <ThemeProviderProxy>
      <QueryClientProviderProxy>
        <StatisticsPanel panelContext={panelContext} />
      </QueryClientProviderProxy>
    </ThemeProviderProxy>
  );
};

```

### Hiding Core Items

To hide core dashboard items, provide the relevant context strings in the `hiddenWidgets`, `hiddenPanels`, or `hiddenStats` static property arrays. The dashboard will filter out core items matching these contexts.

Items can only be hidden if they match the type of the plugin item (eg a panel plugin can only hide core panels).

```typescript
export const hiddenStats = ['core-stat-context-to-hide'];
```
