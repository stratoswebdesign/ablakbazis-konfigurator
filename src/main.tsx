import { createRoot } from 'react-dom/client';
import { applyBrand, brand } from './config';
import { App } from './App';
import './styles/base.css';

// StrictMode nélkül: a drei <Html> címkék React 19 alatt a dupla mountolást nem bírják.
applyBrand(brand);
createRoot(document.getElementById('root')!).render(<App brand={brand} />);
