import React, { useState, useEffect, useContext } from "react";
import "./Coin.css";
import { useParams } from "react-router-dom";
import { CoinContext } from "../../context/CoinContext";
import { UserContext } from "../../context/UserContext";
import LineChart from "../../components/LineChart/LineChart";

const Coin = () => {
  const { coinID } = useParams();
  const [coinData, setCoinData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { currency, apiKey } = useContext(CoinContext);
  const { currentUser, addToFavorites, removeFromFavorites, checkFavoriteStatus, isOffline } = useContext(UserContext);

  // Helper function for API calls
  const fetchData = async (url, errorMsg) => {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-cg-demo-api-key": apiKey,
      },
      cache: "force-cache" // Enable cache for offline usage
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`${errorMsg}: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Fetch both coin data and historical data
  const fetchCoinDetails = async () => {
    setError(isOffline ? "You are offline. Using cached data if available." : '');
    setLoading(true);
    
    try {
      const [coin, history] = await Promise.allSettled([
        fetchData(`https://api.coingecko.com/api/v3/coins/${coinID}`, "Error fetching coin data"),
        fetchData(
          `https://api.coingecko.com/api/v3/coins/${coinID}/market_chart?vs_currency=${currency.name}&days=10&interval=daily`,
          "Error fetching historical data"
        )
      ]);
      
      if (coin.status === 'fulfilled') setCoinData(coin.value);
      if (history.status === 'fulfilled') setHistoricalData(history.value);
      
      if (coin.status === 'rejected' || history.status === 'rejected') {
        throw new Error("Failed to load complete coin data");
      }
    } catch (err) {
      setError("Failed to load coin data. " + (isOffline ? "You are offline." : "Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (isOffline) {
      setError("You are offline. Can't update favorites.");
      return;
    }
    
    setToggleLoading(true);
    setError('');
    
    try {
      if (isFavorite) {
        await removeFromFavorites(coinID);
        setIsFavorite(false);
      } else {
        await addToFavorites(coinID);
        setIsFavorite(true);
      }
    } catch (error) {
      setError("Failed to update favorites: " + error.message);
    } finally {
      setToggleLoading(false);
    }
  };

  // Load coin data when component mounts or currency/coinID changes
  useEffect(() => {
    fetchCoinDetails();
  }, [currency, coinID]);

  // Check if coin is in user's favorites
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (currentUser) {
        try {
          const status = await checkFavoriteStatus(coinID);
          setIsFavorite(status);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      } else {
        setIsFavorite(false);
      }
    };
    
    checkIfFavorite();
  }, [currentUser, coinID]);

  if (loading) {
    return (
      <div className="spinner">
        <div className="spin"></div>
      </div>
    );
  }

  if (!coinData || !historicalData) {
    return (
      <div className="error-container">
        <p>{error || "Unable to load coin data. Please try again later."}</p>
      </div>
    );
  }

  return (
    <div className="coin">
      {error && <div className="error-message">{error}</div>}
      
      <div className="coin-name">
        <img src={coinData.image.large} alt={coinData.name} />
        <p>
          <b>
            {coinData.name} ({coinData.symbol.toUpperCase()})
          </b>
        </p>
        {currentUser && (
          <button 
            onClick={toggleFavorite} 
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            disabled={toggleLoading || isOffline}
          >
            {toggleLoading 
              ? 'Updating...' 
              : isFavorite 
                ? '★ Remove from Favorites' 
                : '☆ Add to Favorites'}
          </button>
        )}
      </div>
      
      <div className="coin-chart">
        <LineChart historicalData={historicalData} />
      </div>

      <div className="coin-info">
        {[
          ["Crypto Market Rank", coinData.market_cap_rank],
          ["Current Price", `${currency.symbol} ${coinData.market_data.current_price[currency.name].toLocaleString()}`],
          ["Market Cap", `${currency.symbol} ${coinData.market_data.market_cap[currency.name].toLocaleString()}`],
          ["24 Hour High", `${currency.symbol} ${coinData.market_data.high_24h[currency.name].toLocaleString()}`],
          ["24 Hour Low", `${currency.symbol} ${coinData.market_data.low_24h[currency.name].toLocaleString()}`]
        ].map(([label, value], index) => (
          <ul key={index}>
            <li>{label}</li>
            <li>{value}</li>
          </ul>
        ))}
      </div>
    </div>
  );
};

export default Coin;