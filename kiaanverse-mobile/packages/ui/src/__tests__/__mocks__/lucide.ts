/**
 * Mock for lucide-react-native — returns empty React components for all icons.
 */
module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (typeof prop !== 'string') return undefined;
      // Return a named empty component for each icon
      const Component = () => null;
      Component.displayName = prop;
      return Component;
    },
  },
);
