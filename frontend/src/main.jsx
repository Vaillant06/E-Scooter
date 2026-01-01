import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import SnowFall from 'react-snowfall';

import App from './App.jsx';

import "./styles/index.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SnowFall />
        <App />
    </BrowserRouter>
  </StrictMode>,
)