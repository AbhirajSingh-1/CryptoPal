import { createContext, useEffect, useState } from "react";

export const CoinContext = createContext();

const CoinContextProvider = ({ children }) => {
  const [allCoin, setAllCoin] = useState([]);
  const [currency, setCurrency] = useState({
    name: "usd",
    symbol: "$"
  });

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_COINGECKO_API_KEY;

  const fetchAllCoin = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.name}`, 
        {
          method: 'GET',
          headers: {
            accept: 'application/json', 
            'x-cg-demo-api-key': apiKey
          }
        }
      );
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setAllCoin(data);
    } catch (err) {
      console.error("Failed to fetch coins:", err);
    }
  };
  
  useEffect(() => {
    fetchAllCoin();
  }, [currency]);
  
  return (
    <CoinContext.Provider value={{ allCoin, currency, setCurrency, apiKey }}>
      {children}
    </CoinContext.Provider>
  );
};

export default CoinContextProvider;