import { useState } from 'react';
import Categories from './Categories';
import Offers from './Offers';

type Tab = 'categories' | 'offers';

export default function App() {
  const [tab, setTab] = useState<Tab>('categories');

  return (
    <div className="page">
      <header className="header">
        <h1>Platinum Card Offers</h1>
      </header>

      <nav className="tabs">
        <button
          className={tab === 'categories' ? 'tab active' : 'tab'}
          onClick={() => setTab('categories')}
        >
          Categories
        </button>
        <button
          className={tab === 'offers' ? 'tab active' : 'tab'}
          onClick={() => setTab('offers')}
        >
          Offers
        </button>
      </nav>

      {tab === 'categories' ? <Categories /> : <Offers />}
    </div>
  );
}
