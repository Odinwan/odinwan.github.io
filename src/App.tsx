import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import { trackView, watchDownloads } from './analytics';
import Chooser from './variants/Chooser';
import Shell from './variants/Shell';
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
  const { lang } = useLanguage();

  // Statistics: one view per design and language, and every CV download.
  useEffect(() => { trackView(variant, lang); }, [variant, lang]);
  const where = useRef({ variant, lang });
  where.current = { variant, lang };
  useEffect(() => watchDownloads(() => where.current), []);
  if (!variant) return <Chooser />;

  const View = views[variant];
  return (
    <Shell variant={variant}>
      <Suspense fallback={null}>
        <View key={variant} />
      </Suspense>
    </Shell>
  );
};

export default App;
