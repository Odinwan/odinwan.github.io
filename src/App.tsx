import React, { Suspense, lazy } from 'react';
import Chooser from './variants/Chooser';
import { VariantId, useVariant } from './variants/variants';

const views: Record<VariantId, React.LazyExoticComponent<React.ComponentType>> = {
  classic: lazy(() => import('./variants/classic/Classic')),
  reels: lazy(() => import('@components/Reels/Reels')),
  terminal: lazy(() => import('./variants/terminal/Terminal')),
  chat: lazy(() => import('./variants/chat/Chat')),
  tale: lazy(() => import('./variants/scene/Scene')),
};

const App: React.FC = () => {
  const { variant } = useVariant();
  if (!variant) return <Chooser />;

  const View = views[variant];
  return (
    <Suspense fallback={null}>
      <View key={variant} />
    </Suspense>
  );
};

export default App;
