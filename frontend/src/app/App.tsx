import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { Providers } from './providers';

export const App: React.FC = () => {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;
