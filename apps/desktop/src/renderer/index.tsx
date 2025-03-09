import { createRoot } from 'react-dom/client';
import './App.global.css';
import { RecoilRoot, useRecoilValue } from 'recoil';
import App from './App';

import { Titlebar } from './components/general/Titlebar';
import { ErrorBoundary } from './components/general/ErrorBoundary';
import { themeState } from './state/settingStates';
import { ApplicationTheme } from '@/common/models/types';
import { useEffect } from 'react';

const main = document.createElement('main');
document.body.appendChild(main);
const root = createRoot(main);

function Root() {
  const theme = useRecoilValue(themeState);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme === ApplicationTheme.Light ? 'light' : 'dark');
  }, [theme]);

  return (
    <>
      <header id="titlebar">
        <Titlebar />
      </header>
      <div id="root">
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </div>
    </>
  );
}

root.render(
  <RecoilRoot>
    <Root />
  </RecoilRoot>,
);
